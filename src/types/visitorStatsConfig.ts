// 页脚访问统计配置类型（每日/累计访客数 + 访客来源）
export type VisitorStatsConfig = {
	// 是否启用；仅在 Cloudflare Workers 部署（CF_WORKERS=1）且已绑定 D1 时生效，
	// 未配置时接口返回未配置，前端组件自动隐藏
	enable?: boolean; // 默认 true
	salt?: string; // 参与访客哈希的盐值，建议填一段随机字符串；更换后统计清零
	utcOffsetHours?: number; // “今日”按 UTC 偏移小时数切分，默认 8（中国时区）
};
