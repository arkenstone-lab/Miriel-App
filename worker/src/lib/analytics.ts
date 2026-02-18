import { generateId, now } from './db';

// Non-blocking event tracker — failures are silently ignored so analytics
// never interfere with core app functionality. Callers should wrap with
// c.executionCtx.waitUntil() for fire-and-forget background execution.
export async function trackEvent(
  db: D1Database,
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    await db
      .prepare('INSERT INTO analytics_events (id, user_id, event, properties, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(generateId(), userId, event, JSON.stringify(properties || {}), now())
      .run();
  } catch {
    // Silent failure — analytics must never block or break core features
  }
}
