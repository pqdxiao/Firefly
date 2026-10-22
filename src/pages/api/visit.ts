import type { APIRoute } from "astro";
import { siteConfig, visitorStatsConfig } from "@/config";
import {
	type D1Database,
	type D1Statement,
	getDb,
	getGeo,
	jsonResponse,
} from "@/utils/visitor-stats";

// 访问统计 API：运行在 Cloudflare Worker 上，数据写入 D1（binding: DB）
//   POST /api/visit/  记录一次访问并返回统计（同访客同日自动去重）
//   GET  /api/visit/  仅查询统计，不记录（同会话重复进入时前端改用 GET）
// 隐私：访客身份只存 SHA-256(IP + UA + 盐) 的哈希；真实 IP 与位置仅落库供站长自查，
//       接口响应一律不返回 IP。访客地图聚合数据见 /api/visit/geo/。

export const prerender = false;

/** “今日”按配置时区切分（默认 UTC+8），返回 YYYY-MM-DD */
function currentDay(): string {
	const offsetMs = (visitorStatsConfig.utcOffsetHours ?? 8) * 3_600_000;
	return new Date(Date.now() + offsetMs).toISOString().slice(0, 10);
}

/** 访客唯一标识：SHA-256(IP + UA + 盐) 截断为 24 位十六进制 */
async function visitorHash(ip: string, ua: string): Promise<string> {
	const salt = visitorStatsConfig.salt || siteConfig.site_url;
	const data = new TextEncoder().encode(`${ip}|${ua}|${salt}`);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest).slice(0, 12))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function readStats(db: D1Database, day: string) {
	const today =
		(await db
			.prepare("SELECT value FROM counters WHERE key = ?1")
			.bind(`uv:${day}`)
			.first<number>("value")) ?? 0;
	const total =
		(await db
			.prepare("SELECT value FROM counters WHERE key = 'total_uv'")
			.first<number>("value")) ?? 0;
	return { today, total };
}

function counterIncrement(db: D1Database, key: string): D1Statement {
	return db
		.prepare(
			"INSERT INTO counters (key, value) VALUES (?1, 1) ON CONFLICT(key) DO UPDATE SET value = value + 1",
		)
		.bind(key);
}

export const GET: APIRoute = async () => {
	const db = await getDb();
	// 本地 dev 未开 adapter / 线上未绑定 D1：返回未配置，前端组件静默隐藏
	if (!db) return jsonResponse({ ok: false, reason: "unconfigured" });
	try {
		return jsonResponse({
			ok: true,
			...(await readStats(db, currentDay())),
		});
	} catch {
		return jsonResponse({ ok: false }, 500);
	}
};

export const POST: APIRoute = async ({ request, locals }) => {
	const db = await getDb();
	if (!db) return jsonResponse({ ok: false, reason: "unconfigured" });
	try {
		const day = currentDay();
		const ip =
			request.headers.get("cf-connecting-ip") ??
			request.headers.get("x-real-ip") ??
			"unknown";
		const vid = await visitorHash(ip, request.headers.get("user-agent") ?? "");
		const geo = getGeo(request, locals);

		// 去重写入：visit_days 主键 (day, vid) 保证同人同日只记一次（记录首次到访的 IP 与位置）；
		// first_seen 保证 total_uv 是全站去重人数而不是人次。
		// IP 仅落库供站长自查，公开接口（GET/POST 响应）一律不返回
		const [dayRes, seenRes] = await db.batch([
			db
				.prepare(
					"INSERT OR IGNORE INTO visit_days (day, vid, ip, country, region, city, latitude, longitude, ts) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
				)
				.bind(
					day,
					vid,
					ip,
					geo.country ?? null,
					geo.region ?? null,
					geo.city ?? null,
					geo.latitude ?? null,
					geo.longitude ?? null,
					Date.now(),
				),
			db
				.prepare("INSERT OR IGNORE INTO first_seen (vid, day) VALUES (?1, ?2)")
				.bind(vid, day),
		]);

		const increments: D1Statement[] = [];
		if ((dayRes.meta?.changes ?? 0) > 0) {
			increments.push(counterIncrement(db, `uv:${day}`));
		}
		if ((seenRes.meta?.changes ?? 0) > 0) {
			increments.push(counterIncrement(db, "total_uv"));
		}
		if (increments.length > 0) {
			await db.batch(increments);
		}

		return jsonResponse({
			ok: true,
			...(await readStats(db, day)),
			geo,
		});
	} catch {
		return jsonResponse({ ok: false }, 500);
	}
};
