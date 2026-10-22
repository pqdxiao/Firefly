-- 2026-10-22 一次性迁移：visit_days 增加真实 IP 与经纬度（为后续访客地图准备），并重置数据
-- 注意：重复执行会因列已存在而报错，属预期，忽略即可
ALTER TABLE visit_days ADD COLUMN ip TEXT;
ALTER TABLE visit_days ADD COLUMN latitude TEXT;
ALTER TABLE visit_days ADD COLUMN longitude TEXT;

-- 换盐 + 起始基数：清空历史（旧 vid 基于旧盐已无意义），总访客从 10000 起计
DELETE FROM visit_days;
DELETE FROM first_seen;
DELETE FROM counters;
INSERT INTO counters (key, value) VALUES ('total_uv', 10000);
