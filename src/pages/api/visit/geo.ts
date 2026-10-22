import type { APIRoute } from "astro";
import { getDb, jsonResponse } from "@/utils/visitor-stats";

// 访客地图数据：按城市聚合的到访坐标点，供侧边栏「站点统计 → 访客地图」渲染。
// 只返回城市粒度聚合（城市 + 坐标 + 人数），绝不包含 IP 或任何可识别个人的信息。

export const prerender = false;

interface CityRow {
	city: string | null;
	region: string | null;
	country: string | null;
	latitude: string | null;
	longitude: string | null;
	n: number;
}

export const GET: APIRoute = async () => {
	const db = await getDb();
	// 本地 dev 未开 adapter / 线上未绑定 D1：返回未配置，前端显示「暂无足迹」
	if (!db) return jsonResponse({ ok: false, reason: "unconfigured" });
	try {
		const res = await db
			.prepare(
				"SELECT city, region, country, latitude, longitude, COUNT(*) AS n FROM visit_days WHERE latitude IS NOT NULL AND longitude IS NOT NULL GROUP BY city, region, country, latitude, longitude ORDER BY n DESC LIMIT 300",
			)
			.all<CityRow>();
		const display = new Intl.DisplayNames(["zh-CN"], { type: "region" });
		const points = (res.results ?? []).map((row) => {
			let country = row.country ?? "";
			try {
				if (row.country) country = display.of(row.country) || row.country;
			} catch {
				// 国家码无法识别时保留原值
			}
			return {
				name: [row.city, row.region]
					.filter((v, i, arr) => v && arr.indexOf(v) === i)
					.join(" · "),
				country,
				lat: Number(row.latitude),
				lng: Number(row.longitude),
				n: row.n,
			};
		});
		return jsonResponse({ ok: true, points });
	} catch {
		return jsonResponse({ ok: false }, 500);
	}
};
