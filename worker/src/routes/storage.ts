import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const storage = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /storage/avatar [Protected]
storage.post('/avatar', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const contentType = c.req.header('Content-Type') || '';

  let body: ArrayBuffer;
  let ext = 'jpg';
  let mime = 'image/jpeg';

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return c.json({ error: 'file is required' }, 400);
    if (file.size > 2 * 1024 * 1024) return c.json({ error: 'file_too_large' }, 400);

    body = await file.arrayBuffer();
    mime = file.type || 'image/jpeg';
    ext = mime.split('/')[1] || 'jpg';
  } else {
    // Expect JSON with base64
    const json = await c.req.json();
    if (!json.base64 || !json.contentType) {
      return c.json({ error: 'base64 and contentType are required' }, 400);
    }
    const binary = atob(json.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    body = bytes.buffer as ArrayBuffer;
    mime = json.contentType;
    ext = mime.split('/')[1] || 'jpg';

    if (body.byteLength > 2 * 1024 * 1024) {
      return c.json({ error: 'file_too_large' }, 400);
    }
  }

  const key = `${userId}/avatar.${ext}`;

  await c.env.AVATARS.put(key, body, {
    httpMetadata: { contentType: mime },
  });

  // Delete old avatar with different extension
  const list = await c.env.AVATARS.list({ prefix: `${userId}/avatar.` });
  for (const obj of list.objects) {
    if (obj.key !== key) {
      await c.env.AVATARS.delete(obj.key);
    }
  }

  return c.json({ key, url: `/storage/avatar/${userId}` });
});

// DELETE /storage/avatar [Protected]
storage.delete('/avatar', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const list = await c.env.AVATARS.list({ prefix: `${userId}/avatar.` });
  for (const obj of list.objects) {
    await c.env.AVATARS.delete(obj.key);
  }

  return c.json({ success: true });
});

// GET /storage/avatar/:userId [Public]
storage.get('/avatar/:userId', async (c) => {
  const userId = c.req.param('userId');

  const list = await c.env.AVATARS.list({ prefix: `${userId}/avatar.` });
  if (list.objects.length === 0) {
    return c.json({ error: 'not_found' }, 404);
  }

  const obj = await c.env.AVATARS.get(list.objects[0].key);
  if (!obj) {
    return c.json({ error: 'not_found' }, 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=3600');

  return new Response(obj.body, { headers });
});

export { storage as storageRoutes };
