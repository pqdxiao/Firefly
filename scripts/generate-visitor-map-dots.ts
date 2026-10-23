// 生成访客地图的点阵世界地图数据 public/visitor-map-dots.json
// 数据源：world-atlas land-110m（Natural Earth 1:110m 陆地轮廓，TopoJSON）
// 陆地判定用 d3-geo 的球面 geoContains——手写平面射线法在这种跨越 ±180 经线、
// 上千顶点的多边形上会出现整行误判（横跨大洋的条纹假点）
// 运行：pnpm visitor-map （产物已提交，仅当想改点阵密度/范围时才需重跑）
import fs from "node:fs";
import path from "node:path";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";

// 与 src/components/widget/SiteStats.astro 里的投影参数保持一致：
// x = lng + 180, y = LAT_MAX - lat，viewBox 为 0 0 360 (LAT_MAX - LAT_MIN)
const LAT_MIN = -56; // 排除南极洲
const LAT_MAX = 85;
const LNG_MIN = -180;
const LNG_MAX = 180;
const STEP = 2; // 点阵间距（度），越小点越密、文件越大
// 采样点在格子中心基础上加微小偏移，避免与数据顶点坐标对齐
const JITTER_LNG = 0.1237;
const JITTER_LAT = 0.0719;

// 产物为扁平数组 [lng0, lat0, lng1, lat1, ...]（SiteStats.astro 的渲染按此格式读取）
const dots: number[] = [];
const topo = JSON.parse(
	fs.readFileSync(
		path.join(process.cwd(), "node_modules", "world-atlas", "land-110m.json"),
		"utf-8",
	),
) as { objects: { land: unknown } };
const land = feature(topo as never, topo.objects.land as never) as never;

let latRows = 0;
for (let lat = LAT_MIN; lat < LAT_MAX; lat += STEP) {
	const ca = lat + STEP / 2 + JITTER_LAT;
	for (let lng = LNG_MIN; lng < LNG_MAX; lng += STEP) {
		const cl = lng + STEP / 2 + JITTER_LNG;
		if (geoContains(land, [cl, ca])) {
			dots.push(Math.round(cl * 10) / 10, Math.round(ca * 10) / 10);
		}
	}
	latRows++;
	if (latRows % 20 === 0) {
		console.log(`... ${latRows} 行采样完成，当前 ${dots.length / 2} 点`);
	}
}

const outPath = path.join(process.cwd(), "public", "visitor-map-dots.json");
const payload = JSON.stringify({
	step: STEP,
	latMax: LAT_MAX,
	dots,
});
fs.writeFileSync(outPath, payload);
console.log(
	`visitor-map-dots.json: ${dots.length / 2} dots, ${(payload.length / 1024).toFixed(1)} KB -> ${outPath}`,
);
