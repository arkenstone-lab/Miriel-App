import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Variables } from './types';
import { authRoutes } from './routes/auth';
import { emailVerificationRoutes } from './routes/email-verification';
import { entriesRoutes } from './routes/entries';
import { todosRoutes } from './routes/todos';
import { summariesRoutes } from './routes/summaries';
import { aiRoutes } from './routes/ai';
import { aiPreferencesRoutes } from './routes/ai-preferences';
import { storageRoutes } from './routes/storage';
import { seedRoutes } from './routes/seed';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware
app.use('*', async (c, next) => {
  const origins = c.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) || [];
  const origin = c.req.header('Origin') || '';
  const allowOrigin = origins.includes(origin) ? origin : origins[0] || '*';

  return cors({
    origin: allowOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next);
});

// Prevent browser HTTP caching for all API responses (except storage which has its own Cache-Control).
// Without this, browsers use heuristic caching on production domains, causing stale data after mutations.
app.use('*', async (c, next) => {
  await next();
  if (!c.req.path.startsWith('/storage')) {
    c.header('Cache-Control', 'no-store');
  }
});

// Health check + config
app.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  invite_required: !!c.env.INVITE_CODES,
}));

// Mount routes
app.route('/auth', authRoutes);
app.route('/auth', emailVerificationRoutes);
app.route('/entries', entriesRoutes);
app.route('/todos', todosRoutes);
app.route('/summaries', summariesRoutes);
app.route('/ai', aiRoutes);
app.route('/ai-preferences', aiPreferencesRoutes);
app.route('/storage', storageRoutes);
app.route('/', seedRoutes);

export default app;
