-- 页脚访问统计表结构（每日访客 / 累计访客 / 来访地）
-- 初始化：
--   本地:  npx wrangler d1 execute blog-stats --local  --file=scripts/visitor-stats.sql
--   线上:  npx wrangler d1 execute blog-stats --remote --file=scripts/visitor-stats.sql

-- 计数器（uv:YYYY-MM-DD 每日访客数；total_uv 累计去重访客数）
CREATE TABLE IF NOT EXISTS counters (
	key TEXT PRIMARY KEY,
	value INTEGER NOT NULL DEFAULT 0
);

-- 每日去重访客：一行 = 某访客某天首次到访，同时保留来源地理信息用于回溯
CREATE TABLE IF NOT EXISTS visit_days (
	day TEXT NOT NULL,
	vid TEXT NOT NULL,
	country TEXT,
	region TEXT,
	city TEXT,
	ts INTEGER NOT NULL,
	PRIMARY KEY (day, vid)
);
CREATE INDEX IF NOT EXISTS idx_visit_days_day ON visit_days (day);

-- 全站去重访客：vid 首次出现的日期，保证 total_uv 是人数而非人次
CREATE TABLE IF NOT EXISTS first_seen (
	vid TEXT PRIMARY KEY,
	day TEXT NOT NULL
);

INSERT OR IGNORE INTO counters (key, value) VALUES ('total_uv', 0);
