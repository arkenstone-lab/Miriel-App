-- Analytics events table for retention/traction tracking (DAU/WAU/MAU, cohort retention, funnel)
-- No FK on user_id — orphan events are kept for aggregate metrics after account deletion
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event TEXT NOT NULL,
  properties TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ae_user_created ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ae_event_created ON analytics_events(event, created_at);
CREATE INDEX IF NOT EXISTS idx_ae_created ON analytics_events(created_at);
