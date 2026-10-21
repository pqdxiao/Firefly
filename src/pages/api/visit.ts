import type { APIRoute } from "astro";
import { siteConfig, visitorStatsConfig } from "@/config";

// 访问统计 API：运行在 Cloudflare Worker 上，数据写入 D1（binding: DB）
//   POST /api/visit/  记录一次访问并返回统计（同访客同日自动去重）
//   GET  /api/visit/  仅查询统计，不记录（同会话重复进入时前端改用 GET）
// 隐私：只存 SHA-256(IP + UA + 盐) 的哈希与国家/省/市，不存原始 IP。

export const prerender = false;

/** D1 最小结构类型，避免为类型检查引入 @cloudflare/workers-types 依赖 */
interface D1Meta {
	changes?: number;
}
interface D1Statement {
	bind(...values: (string | number | null)[]): D1Statement;
	run(): Promise<{ meta?: D1Meta }>;
	first<T>(column: string): Promise<T | null>;
}
interface D1Database {
	prepare(query: string): D1Statement;
	batch(statements: D1Statement[]): Promise<{ meta?: D1Meta }[]>;
}

/** Cloudflare 边缘自带的请求地理信息 */
interface CfGeo {
	country?: string; // ISO 3166 国家码，如 "CN"
	region?: string; // 省/州，如 "Zhejiang"
	city?: string; // 城市，如 "Hangzhou"
}

interface RuntimeEnv {
	cf?: CfGeo;
}

/**
 * 取 D1 binding。Astro v6+ 移除了 locals.runtime.env，
 * 需从 "cloudflare:workers" 模块取 env；该模块只在 Cloudflare 运行时存在，
 * 非 CF 环境（本地无 adapter dev、其他平台部署）导入失败时返回 undefined。
 * 动态 specifier + @vite-ignore 避免 Vite 在非 CF 构建下静态解析报错。
 */
async function getDb(): Promise<D1Database | undefined> {
	try {
		const moduleSpecifier = "cloudflare:workers";
		const { env } = (await import(/* @vite-ignore */ moduleSpecifier)) as {
			env: { DB?: D1Database };
		};
		return env.DB;
	} catch {
		return undefined;
	}
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}

/** “今日”按配置时区切分（默认 UTC+8），返回 YYYY-MM-DD */
function currentDay(): string {
	const offsetMs = (visitorStatsConfig.utcOffsetHours ?? 8) * 3_600_000;
	return new Date(Date.now() + offsetMs).toISOString().slice(0, 10);
}

/** 访客唯一标识：SHA-256(IP + UA + 盐) 截断为 24 位十六进制 */
async function visitorHash(request: Request): Promise<string> {
	const ip =
		request.headers.get("cf-connecting-ip") ??
		request.headers.get("x-real-ip") ??
		"unknown";
	const ua = request.headers.get("user-agent") ?? "";
	const salt = visitorStatsConfig.salt || siteConfig.site_url;
	const data = new TextEncoder().encode(`${ip}|${ua}|${salt}`);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest).slice(0, 12))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function getGeo(request: Request, locals: unknown): CfGeo {
	// request.cf 是 workerd 原生属性，adapter 转发时通常保留；
	// 再兜底 locals.runtime.cf 与 cf-ipcountry 头，读取全程 try/catch 防御各版本 adapter 差异
	let cf: CfGeo | undefined;
	try {
		cf = (request as Request & { cf?: CfGeo }).cf;
	} catch {
		/* ignore */
	}
	if (!cf) {
		try {
			cf = (locals as RuntimeEnv | undefined)?.cf;
		} catch {
			/* ignore */
		}
	}
	return {
		country: cf?.country ?? request.headers.get("cf-ipcountry") ?? undefined,
		region: cf?.region,
		city: cf?.city,
	};
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
		const vid = await visitorHash(request);
		const geo = getGeo(request, locals);

		// 去重写入：visit_days 主键 (day, vid) 保证同人同日只记一次；
		// first_seen 保证 total_uv 是全站去重人数而不是人次
		const [dayRes, seenRes] = await db.batch([
			db
				.prepare(
					"INSERT OR IGNORE INTO visit_days (day, vid, country, region, city, ts) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
				)
				.bind(
					day,
					vid,
					geo.country ?? null,
					geo.region ?? null,
					geo.city ?? null,
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
