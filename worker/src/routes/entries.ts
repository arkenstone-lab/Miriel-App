import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId, now, parseJsonFields, stringifyJsonField } from '../lib/db';

const entries = new Hono<{ Bindings: Env; Variables: Variables }>();
entries.use('*', authMiddleware);

interface EntryRow {
  id: string;
  user_id: string;
  date: string;
  raw_text: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

function formatEntry(row: EntryRow) {
  return parseJsonFields(row, ['tags']);
}

// GET /entries?date=YYYY-MM-DD
entries.get('/', async (c) => {
  const userId = c.get('userId');
  const date = c.req.query('date');

  let stmt;
  if (date) {
    stmt = c.env.DB
      .prepare('SELECT * FROM entries WHERE user_id = ? AND date = ? ORDER BY date DESC, created_at DESC')
      .bind(userId, date);
  } else {
    stmt = c.env.DB
      .prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY date DESC, created_at DESC')
      .bind(userId);
  }

  const { results } = await stmt.all<EntryRow>();
  return c.json(results.map(formatEntry));
});

// GET /entries/:id
entries.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const row = await c.env.DB
    .prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<EntryRow>();

  if (!row) {
    return c.json({ error: 'not_found' }, 404);
  }

  return c.json(formatEntry(row));
});

// POST /entries
entries.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  // Validate entry text (required, max 100K chars to prevent DB bloat / OpenAI token overflow)
  if (!body.raw_text?.trim()) {
    return c.json({ error: 'entry_text_required' }, 400);
  }
  if (body.raw_text.length > 100_000) {
    return c.json({ error: 'entry_text_too_long' }, 400);
  }

  const id = generateId();
  const date = body.date || new Date().toISOString().split('T')[0];
  const tags = stringifyJsonField(body.tags || []);
  const timestamp = now();

  await c.env.DB
    .prepare('INSERT INTO entries (id, user_id, date, raw_text, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, userId, date, body.raw_text, tags, timestamp, timestamp)
    .run();

  const row = await c.env.DB
    .prepare('SELECT * FROM entries WHERE id = ?')
    .bind(id)
    .first<EntryRow>();

  return c.json(formatEntry(row!), 201);
});

// PUT /entries/:id
entries.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await c.env.DB
    .prepare('SELECT id FROM entries WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first();

  if (!existing) {
    return c.json({ error: 'not_found' }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.raw_text !== undefined) {
    if (body.raw_text.length > 100_000) {
      return c.json({ error: 'entry_text_too_long' }, 400);
    }
    updates.push('raw_text = ?');
    values.push(body.raw_text);
  }
  if (body.tags !== undefined) {
    updates.push('tags = ?');
    values.push(stringifyJsonField(body.tags));
  }
  if (body.date !== undefined) {
    updates.push('date = ?');
    values.push(body.date);
  }
  updates.push('updated_at = ?');
  values.push(now());

  values.push(id);
  values.push(userId);

  await c.env.DB
    .prepare(`UPDATE entries SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run();

  const row = await c.env.DB
    .prepare('SELECT * FROM entries WHERE id = ?')
    .bind(id)
    .first<EntryRow>();

  return c.json(formatEntry(row!));
});

// DELETE /entries/:id
entries.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const result = await c.env.DB
    .prepare('DELETE FROM entries WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'not_found' }, 404);
  }

  return c.json({ success: true });
});

export { entries as entriesRoutes };
