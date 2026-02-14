import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { parseJsonFields } from '../lib/db';

const summaries = new Hono<{ Bindings: Env; Variables: Variables }>();
summaries.use('*', authMiddleware);

interface SummaryRow {
  id: string;
  user_id: string;
  period: string;
  period_start: string;
  text: string;
  entry_links: string;
  sentences_data: string;
  created_at: string;
}

function formatSummary(row: SummaryRow) {
  return parseJsonFields(row, ['entry_links', 'sentences_data']);
}

// GET /summaries?period=daily|weekly|monthly&date=YYYY-MM-DD
summaries.get('/', async (c) => {
  const userId = c.get('userId');
  const period = c.req.query('period');
  const date = c.req.query('date');

  let query = 'SELECT * FROM summaries WHERE user_id = ?';
  const params: unknown[] = [userId];

  if (period) {
    query += ' AND period = ?';
    params.push(period);
  }
  if (date) {
    query += ' AND period_start = ?';
    params.push(date);
  }

  query += ' ORDER BY period_start DESC';

  const { results } = await c.env.DB.prepare(query).bind(...params).all<SummaryRow>();
  return c.json(results.map(formatSummary));
});

export { summaries as summariesRoutes };
