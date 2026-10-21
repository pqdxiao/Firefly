import type { VisitorStatsConfig } from "../types/visitorStatsConfig";

// 页脚访问统计：每日访客数 / 累计访客数 + 访客来源地理位置
// 数据来源：Cloudflare 边缘请求自带的地理信息（request.cf，免费，无需第三方 GeoIP）
// 存储方案：Cloudflare D1（binding: DB，见 wrangler.jsonc）
// 建表语句：scripts/visitor-stats.sql
export const visitorStatsConfig: VisitorStatsConfig = {
	// 未绑定 D1 时接口返回未配置，前端组件自动隐藏，不影响页面
	enable: true,
	// 访客哈希盐值：SHA-256(IP + UA + salt)，不存原始 IP。
	// 建议改成一段随机字符串（如 `openssl rand -hex 16` 的输出），防止哈希被彩虹表反推；
	// 更换盐值后所有统计从零开始。留空则退化为使用站点域名作盐。
	salt: "",
	// 按 UTC+8 切分“今日”
	utcOffsetHours: 8,
};
