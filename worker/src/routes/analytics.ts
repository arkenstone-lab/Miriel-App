import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { trackEvent } from '../lib/analytics';

const analytics = new Hono<{ Bindings: Env; Variables: Variables }>();

// Admin auth via ANALYTICS_SECRET — query param or header
function requireSecret(c: any): boolean {
  const secret = c.env.ANALYTICS_SECRET;
  if (!secret) return false;
  const provided = c.req.query('secret') || c.req.header('X-Analytics-Secret');
  return provided === secret;
}

// POST /analytics/track — client-side event collection (authenticated users only)
// Only allows 'app_open' to prevent abuse of the public-facing track endpoint
analytics.post('/track', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { event, properties } = await c.req.json();

  if (event !== 'app_open') {
    return c.json({ error: 'only app_open event is allowed' }, 400);
  }

  c.executionCtx.waitUntil(trackEvent(c.env.DB, userId, event, properties));
  return c.json({ success: true });
});

// GET /analytics/overview — total users, activation rate, DAU/WAU/MAU
analytics.get('/overview', async (c) => {
  if (!requireSecret(c)) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;
  const today = new Date().toISOString().split('T')[0];

  // Calculate date boundaries for DAU/WAU/MAU
  const todayDate = new Date(today + 'T00:00:00Z');
  const day7 = new Date(todayDate);
  day7.setDate(day7.getDate() - 7);
  const day30 = new Date(todayDate);
  day30.setDate(day30.getDate() - 30);

  const day7Str = day7.toISOString().split('T')[0];
  const day30Str = day30.toISOString().split('T')[0];

  const [totalUsers, activatedUsers, dau, wau, mau] = await Promise.all([
    // Total registered users
    db.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>(),
    // Activated = users who created at least 1 entry
    db.prepare('SELECT COUNT(DISTINCT user_id) as cnt FROM entries').first<{ cnt: number }>(),
    // DAU = distinct users with any event today
    db.prepare(
      "SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE created_at >= ?",
    ).bind(today + ' 00:00:00').first<{ cnt: number }>(),
    // WAU = distinct users with any event in last 7 days
    db.prepare(
      "SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE created_at >= ?",
    ).bind(day7Str + ' 00:00:00').first<{ cnt: number }>(),
    // MAU = distinct users with any event in last 30 days
    db.prepare(
      "SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE created_at >= ?",
    ).bind(day30Str + ' 00:00:00').first<{ cnt: number }>(),
  ]);

  const total = totalUsers?.cnt || 0;
  const activated = activatedUsers?.cnt || 0;

  return c.json({
    total_users: total,
    activated_users: activated,
    activation_rate: total > 0 ? Math.round((activated / total) * 100) : 0,
    dau: dau?.cnt || 0,
    wau: wau?.cnt || 0,
    mau: mau?.cnt || 0,
    date: today,
  });
});

// GET /analytics/dau?days=30 — DAU/WAU time series
analytics.get('/dau', async (c) => {
  if (!requireSecret(c)) return c.json({ error: 'unauthorized' }, 401);

  const days = Math.min(parseInt(c.req.query('days') || '30', 10), 90);
  const db = c.env.DB;

  // Daily active users for each day in the range
  const { results } = await db.prepare(`
    SELECT
      substr(created_at, 1, 10) as date,
      COUNT(DISTINCT user_id) as dau
    FROM analytics_events
    WHERE created_at >= date('now', '-' || ? || ' days')
    GROUP BY substr(created_at, 1, 10)
    ORDER BY date ASC
  `).bind(days).all<{ date: string; dau: number }>();

  // Compute 7-day rolling WAU for each date
  const dauMap = new Map<string, number>();
  for (const r of results) {
    dauMap.set(r.date, r.dau);
  }

  const series = results.map((r) => {
    // WAU = distinct users in [date-6, date] — approximate from daily counts (sum, not distinct)
    // For exact WAU, we'd need a heavier query; this gives a reasonable proxy
    let wauSum = 0;
    const d = new Date(r.date + 'T00:00:00Z');
    for (let i = 0; i < 7; i++) {
      const key = d.toISOString().split('T')[0];
      wauSum += dauMap.get(key) || 0;
      d.setDate(d.getDate() - 1);
    }
    return { date: r.date, dau: r.dau, wau_approx: wauSum };
  });

  return c.json({ days, series });
});

// GET /analytics/retention — cohort-based D1/D7/D30 retention
analytics.get('/retention', async (c) => {
  if (!requireSecret(c)) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;

  // Cohorts = users grouped by signup week
  // For each cohort, check if they had any event on D1, D7, D30 after signup
  const { results: cohorts } = await db.prepare(`
    SELECT
      substr(u.created_at, 1, 10) as signup_date,
      u.id as user_id,
      u.created_at
    FROM users u
    ORDER BY u.created_at ASC
  `).all<{ signup_date: string; user_id: string; created_at: string }>();

  if (!cohorts || cohorts.length === 0) {
    return c.json({ cohorts: [] });
  }

  // Group users by signup week (Monday-based)
  const weekCohorts = new Map<string, { users: string[]; signupDates: Map<string, string> }>();
  for (const u of cohorts) {
    const d = new Date(u.signup_date + 'T00:00:00Z');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const weekKey = d.toISOString().split('T')[0];
    if (!weekCohorts.has(weekKey)) {
      weekCohorts.set(weekKey, { users: [], signupDates: new Map() });
    }
    const cohort = weekCohorts.get(weekKey)!;
    cohort.users.push(u.user_id);
    cohort.signupDates.set(u.user_id, u.signup_date);
  }

  // For each cohort, calculate D1/D7/D30 retention
  const result = [];
  for (const [weekStart, cohort] of weekCohorts) {
    const size = cohort.users.length;
    if (size === 0) continue;

    // Check retention for each user at D1, D7, D30
    let d1Count = 0;
    let d7Count = 0;
    let d30Count = 0;

    for (const userId of cohort.users) {
      const signupDate = cohort.signupDates.get(userId)!;
      const signup = new Date(signupDate + 'T00:00:00Z');

      const d1Start = new Date(signup);
      d1Start.setDate(d1Start.getDate() + 1);
      const d1End = new Date(d1Start);
      d1End.setDate(d1End.getDate() + 1);

      const d7Start = new Date(signup);
      d7Start.setDate(d7Start.getDate() + 7);
      const d7End = new Date(d7Start);
      d7End.setDate(d7End.getDate() + 1);

      const d30Start = new Date(signup);
      d30Start.setDate(d30Start.getDate() + 30);
      const d30End = new Date(d30Start);
      d30End.setDate(d30End.getDate() + 1);

      const fmt = (d: Date) => d.toISOString().replace('T', ' ').replace('Z', '').split('.')[0];

      const [r1, r7, r30] = await Promise.all([
        db.prepare('SELECT 1 FROM analytics_events WHERE user_id = ? AND created_at >= ? AND created_at < ? LIMIT 1')
          .bind(userId, fmt(d1Start), fmt(d1End)).first(),
        db.prepare('SELECT 1 FROM analytics_events WHERE user_id = ? AND created_at >= ? AND created_at < ? LIMIT 1')
          .bind(userId, fmt(d7Start), fmt(d7End)).first(),
        db.prepare('SELECT 1 FROM analytics_events WHERE user_id = ? AND created_at >= ? AND created_at < ? LIMIT 1')
          .bind(userId, fmt(d30Start), fmt(d30End)).first(),
      ]);

      if (r1) d1Count++;
      if (r7) d7Count++;
      if (r30) d30Count++;
    }

    result.push({
      week: weekStart,
      cohort_size: size,
      d1: d1Count,
      d7: d7Count,
      d30: d30Count,
      d1_rate: Math.round((d1Count / size) * 100),
      d7_rate: Math.round((d7Count / size) * 100),
      d30_rate: Math.round((d30Count / size) * 100),
    });
  }

  return c.json({ cohorts: result });
});

// GET /analytics/funnel — signup→activation→retention→power user funnel + feature usage
analytics.get('/funnel', async (c) => {
  if (!requireSecret(c)) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;

  const [
    totalUsers,
    activatedUsers,
    retainedUsers,
    powerUsers,
    entryCreators,
    summaryViewers,
    summaryGenerators,
    weeklyGenerators,
    monthlyGenerators,
    chatUsers,
    tagUsers,
    todoCompleters,
  ] = await Promise.all([
    // Total signups
    db.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>(),
    // Activated = created at least 1 entry
    db.prepare('SELECT COUNT(DISTINCT user_id) as cnt FROM entries').first<{ cnt: number }>(),
    // Retained = had events in at least 2 different weeks
    db.prepare(`
      SELECT COUNT(*) as cnt FROM (
        SELECT user_id FROM analytics_events
        GROUP BY user_id
        HAVING COUNT(DISTINCT substr(created_at, 1, 10)) >= 3
      )
    `).first<{ cnt: number }>(),
    // Power users = 10+ events in last 7 days
    db.prepare(`
      SELECT COUNT(*) as cnt FROM (
        SELECT user_id FROM analytics_events
        WHERE created_at >= date('now', '-7 days')
        GROUP BY user_id
        HAVING COUNT(*) >= 10
      )
    `).first<{ cnt: number }>(),
    // Feature: entry creators
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'entry_created'").first<{ cnt: number }>(),
    // Feature: summary viewers
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'summary_viewed'").first<{ cnt: number }>(),
    // Feature: summary generators
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'summary_generated'").first<{ cnt: number }>(),
    // Feature: weekly review generators
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'weekly_generated'").first<{ cnt: number }>(),
    // Feature: monthly review generators
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'monthly_generated'").first<{ cnt: number }>(),
    // Feature: chat users
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'chat_message'").first<{ cnt: number }>(),
    // Feature: tagging users
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'tagging'").first<{ cnt: number }>(),
    // Feature: todo completers
    db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM analytics_events WHERE event = 'todo_completed'").first<{ cnt: number }>(),
  ]);

  return c.json({
    funnel: {
      signup: totalUsers?.cnt || 0,
      activated: activatedUsers?.cnt || 0,
      retained: retainedUsers?.cnt || 0,
      power_users: powerUsers?.cnt || 0,
    },
    features: {
      entry_created: entryCreators?.cnt || 0,
      summary_viewed: summaryViewers?.cnt || 0,
      summary_generated: summaryGenerators?.cnt || 0,
      weekly_generated: weeklyGenerators?.cnt || 0,
      monthly_generated: monthlyGenerators?.cnt || 0,
      chat_message: chatUsers?.cnt || 0,
      tagging: tagUsers?.cnt || 0,
      todo_completed: todoCompleters?.cnt || 0,
    },
  });
});

export { analytics as analyticsRoutes };
