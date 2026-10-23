// 生成访客地图的点阵世界地图数据 public/visitor-map-dots.json
// 数据源：world-atlas land-110m（Natural Earth 1:110m 陆地轮廓，TopoJSON）
// 运行：pnpm visitor-map （产物已提交，仅当想改点阵密度/范围时才需重跑）
import fs from "node:fs";
import path from "node:path";
import { feature } from "topojson-client";

type Ring = [number, number][]; // [lng, lat]
type Poly = Ring[];

// 与 src/components/widget/SiteStats.astro 里的投影参数保持一致：
// x = lng + 180, y = LAT_MAX - lat，viewBox 为 0 0 360 (LAT_MAX - LAT_MIN)
const LAT_MIN = -56; // 排除南极洲
const LAT_MAX = 85;
const LNG_MIN = -180;
const LNG_MAX = 180;
const STEP = 2; // 点阵间距（度），越小点越密、文件越大

interface GeoJsonGeometry {
	type: string;
	coordinates: unknown;
}

function extractPolygons(land: unknown): Poly[] {
	// feature() 视输入可能是 FeatureCollection / Feature / Geometry
	const fc = land as { features?: { geometry?: GeoJsonGeometry }[] };
	if (Array.isArray(fc.features)) {
		const out: Poly[] = [];
		for (const f of fc.features) {
			out.push(...extractPolygons(f));
		}
		return out;
	}
	const geo = land as { geometry?: GeoJsonGeometry };
	const geometry = geo.geometry ?? (land as GeoJsonGeometry);
	if (geometry.type === "Polygon") return [geometry.coordinates as Poly];
	if (geometry.type === "MultiPolygon") return geometry.coordinates as Poly[];
	throw new Error(`Unexpected land geometry type: ${geometry.type}`);
}

function bbox(poly: Poly): [number, number, number, number] {
	let minX = 180;
	let minY = 90;
	let maxX = -180;
	let maxY = -90;
	for (const [x, y] of poly[0]) {
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}
	return [minX, minY, maxX, maxY];
}

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		const crosses = yi > lat !== yj > lat;
		if (crosses && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

function pointInPolygon(lng: number, lat: number, poly: Poly): boolean {
	// 首环为外环，其余为洞
	if (!pointInRing(lng, lat, poly[0])) return false;
	for (let i = 1; i < poly.length; i++) {
		if (pointInRing(lng, lat, poly[i])) return false;
	}
	return true;
}

const topoPath = path.join(
	process.cwd(),
	"node_modules",
	"world-atlas",
	"land-110m.json",
);
const topo = JSON.parse(fs.readFileSync(topoPath, "utf-8")) as {
	objects: { land: unknown };
};
// topojson-client 的类型对动态解析的 JSON 不友好，这里统一走 unknown 收窄
const land = feature(topo as never, topo.objects.land as never) as unknown;
const polygons = extractPolygons(land);
const boxes = polygons.map(bbox);

// 产物为扁平数组 [lng0, lat0, lng1, lat1, ...]（SiteStats.astro 的渲染按此格式读取）
const dots: number[] = [];
for (let lat = LAT_MIN; lat < LAT_MAX; lat += STEP) {
	for (let lng = LNG_MIN; lng < LNG_MAX; lng += STEP) {
		// 取格子中心做陆地判定
		const cl = lng + STEP / 2;
		const ca = lat + STEP / 2;
		for (let p = 0; p < polygons.length; p++) {
			const [minX, minY, maxX, maxY] = boxes[p];
			if (cl < minX || cl > maxX || ca < minY || ca > maxY) continue;
			if (pointInPolygon(cl, ca, polygons[p])) {
				dots.push(Math.round(cl * 10) / 10, Math.round(ca * 10) / 10);
				break;
			}
		}
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
