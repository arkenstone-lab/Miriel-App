import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { trackEvent } from '../lib/analytics';

const todos = new Hono<{ Bindings: Env; Variables: Variables }>();
todos.use('*', authMiddleware);

interface TodoRow {
  id: string;
  user_id: string;
  text: string;
  source_entry_id: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
}

// GET /todos?status=pending|done
todos.get('/', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');

  let stmt;
  if (status) {
    stmt = c.env.DB
      .prepare('SELECT * FROM todos WHERE user_id = ? AND status = ? ORDER BY created_at DESC')
      .bind(userId, status);
  } else {
    stmt = c.env.DB
      .prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId);
  }

  const { results } = await stmt.all<TodoRow>();
  return c.json(results);
});

// GET /todos/by-entry/:entryId
todos.get('/by-entry/:entryId', async (c) => {
  const userId = c.get('userId');
  const entryId = c.req.param('entryId');

  const { results } = await c.env.DB
    .prepare('SELECT * FROM todos WHERE source_entry_id = ? AND user_id = ? ORDER BY created_at DESC')
    .bind(entryId, userId)
    .all<TodoRow>();

  return c.json(results);
});

// PUT /todos/:id
todos.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await c.env.DB
    .prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first();

  if (!existing) {
    return c.json({ error: 'not_found' }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.text !== undefined) {
    updates.push('text = ?');
    values.push(body.text);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    values.push(body.status);
  }
  if (body.due_date !== undefined) {
    updates.push('due_date = ?');
    values.push(body.due_date);
  }

  if (updates.length === 0) {
    return c.json({ error: 'nothing to update' }, 400);
  }

  values.push(id);
  values.push(userId);

  await c.env.DB
    .prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run();

  const row = await c.env.DB
    .prepare('SELECT * FROM todos WHERE id = ?')
    .bind(id)
    .first<TodoRow>();

  // Track todo completion (non-blocking, only when status changes to done)
  if (body.status === 'done') {
    c.executionCtx.waitUntil(trackEvent(c.env.DB, userId, 'todo_completed'));
  }

  return c.json(row);
});

// DELETE /todos/:id
todos.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const result = await c.env.DB
    .prepare('DELETE FROM todos WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'not_found' }, 404);
  }

  return c.json({ success: true });
});

export { todos as todosRoutes };
