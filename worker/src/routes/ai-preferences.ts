import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId, now, parseJsonFields, stringifyJsonField } from '../lib/db';

const aiPreferences = new Hono<{ Bindings: Env; Variables: Variables }>();
aiPreferences.use('*', authMiddleware);

interface AiPrefRow {
  id: string;
  user_id: string;
  summary_style: string;
  focus_areas: string;
  custom_instructions: string;
  share_persona: number;
  created_at: string;
  updated_at: string;
}

function formatPref(row: AiPrefRow) {
  const parsed = parseJsonFields(row, ['focus_areas']);
  return { ...parsed, share_persona: !!row.share_persona };
}

// GET /ai-preferences
aiPreferences.get('/', async (c) => {
  const userId = c.get('userId');

  const row = await c.env.DB
    .prepare('SELECT * FROM user_ai_preferences WHERE user_id = ?')
    .bind(userId)
    .first<AiPrefRow>();

  if (!row) {
    return c.json(null);
  }

  return c.json(formatPref(row));
});

// PUT /ai-preferences
aiPreferences.put('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const timestamp = now();

  const existing = await c.env.DB
    .prepare('SELECT id FROM user_ai_preferences WHERE user_id = ?')
    .bind(userId)
    .first<{ id: string }>();

  if (existing) {
    await c.env.DB
      .prepare(
        'UPDATE user_ai_preferences SET summary_style = ?, focus_areas = ?, custom_instructions = ?, share_persona = ?, updated_at = ? WHERE user_id = ?',
      )
      .bind(
        body.summary_style ?? '',
        stringifyJsonField(body.focus_areas ?? []),
        body.custom_instructions ?? '',
        body.share_persona ? 1 : 0,
        timestamp,
        userId,
      )
      .run();
  } else {
    await c.env.DB
      .prepare(
        'INSERT INTO user_ai_preferences (id, user_id, summary_style, focus_areas, custom_instructions, share_persona, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        generateId(),
        userId,
        body.summary_style ?? '',
        stringifyJsonField(body.focus_areas ?? []),
        body.custom_instructions ?? '',
        body.share_persona ? 1 : 0,
        timestamp,
        timestamp,
      )
      .run();
  }

  const row = await c.env.DB
    .prepare('SELECT * FROM user_ai_preferences WHERE user_id = ?')
    .bind(userId)
    .first<AiPrefRow>();

  return c.json(formatPref(row!));
});

export { aiPreferences as aiPreferencesRoutes };
