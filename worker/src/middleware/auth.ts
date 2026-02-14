import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types';
import { verifyToken } from '../lib/auth';

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token, c.env.JWT_SECRET);

  if (!payload || !payload.sub) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('userId', payload.sub as string);
  c.set('userEmail', (payload.email as string) || '');

  await next();
});
