-- 봇 제외 집계용 뷰 — 클릭 집계는 clicks 원본이 아니라 이 뷰 기준 (CLAUDE.md 관례)
CREATE VIEW clicks_human AS
  SELECT * FROM clicks
  WHERE user_agent IS NULL
     OR user_agent !~* '(bot|crawler|spider|preview|facebookexternalhit|slurp)';
