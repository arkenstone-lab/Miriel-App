import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken } from '../lib/auth';
import { generateId, now, parseJsonField } from '../lib/db';
import { authMiddleware } from '../middleware/auth';
import {
  sendEmail,
  buildResetPasswordEmailHtml,
  getResetPasswordSubject,
} from '../lib/email';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

async function issueTokens(
  db: D1Database,
  jwtSecret: string,
  userId: string,
  email: string,
) {
  const accessToken = await generateToken({ sub: userId, email }, jwtSecret, ACCESS_TOKEN_EXPIRY);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db
    .prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(generateId(), userId, refreshToken, expiresAt, now())
    .run();

  return { access_token: accessToken, refresh_token: refreshToken, expires_in: ACCESS_TOKEN_EXPIRY };
}

// POST /auth/signup
auth.post('/signup', async (c) => {
  const { username, email, password, phone, verification_token, user_metadata, invite_code } = await c.req.json();

  if (!username || !email || !password) {
    return c.json({ error: 'username, email, and password are required' }, 400);
  }

  // Validate invite code (if INVITE_CODES is configured)
  const inviteCodes = c.env.INVITE_CODES;
  if (inviteCodes) {
    const validCodes = inviteCodes.split(',').map((code) => code.trim().toLowerCase());
    if (!invite_code || !validCodes.includes(invite_code.trim().toLowerCase())) {
      return c.json({ error: 'invalid_invite_code' }, 403);
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
    return c.json({ error: 'invalid_username_format' }, 400);
  }

  // Validate email token
  if (verification_token) {
    const record = await c.env.DB
      .prepare('SELECT id FROM email_verifications WHERE email = ? AND verification_token = ? AND verified = 1 AND expires_at > ?')
      .bind(normalizedEmail, verification_token, new Date().toISOString())
      .first();

    if (!record) {
      return c.json({ error: 'invalid_verification_token' }, 400);
    }
  }

  // Check duplicates
  const existingEmail = await c.env.DB
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first();
  if (existingEmail) {
    return c.json({ error: 'email_already_registered' }, 409);
  }

  const existingUsername = await c.env.DB
    .prepare('SELECT id FROM users WHERE username = ?')
    .bind(normalizedUsername)
    .first();
  if (existingUsername) {
    return c.json({ error: 'username_already_taken' }, 409);
  }

  const userId = generateId();
  const passwordHash = await hashPassword(password);
  const metadata = JSON.stringify(user_metadata || {});

  await c.env.DB
    .prepare('INSERT INTO users (id, email, username, password_hash, phone, user_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(userId, normalizedEmail, normalizedUsername, passwordHash, phone || null, metadata, now())
    .run();

  const tokens = await issueTokens(c.env.DB, c.env.JWT_SECRET, userId, normalizedEmail);

  return c.json({
    user: { id: userId, email: normalizedEmail, username: normalizedUsername, user_metadata: user_metadata || {} },
    ...tokens,
  }, 201);
});

// POST /auth/login
auth.post('/login', async (c) => {
  const { login, password } = await c.req.json();

  if (!login || !password) {
    return c.json({ error: 'login and password are required' }, 400);
  }

  const isEmail = login.includes('@');
  const normalizedLogin = login.trim().toLowerCase();

  const user = await c.env.DB
    .prepare(
      isEmail
        ? 'SELECT id, email, username, password_hash, user_metadata FROM users WHERE email = ?'
        : 'SELECT id, email, username, password_hash, user_metadata FROM users WHERE username = ?',
    )
    .bind(normalizedLogin)
    .first<{ id: string; email: string; username: string; password_hash: string; user_metadata: string }>();

  if (!user) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  const tokens = await issueTokens(c.env.DB, c.env.JWT_SECRET, user.id, user.email);

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      user_metadata: parseJsonField(user.user_metadata) || {},
    },
    ...tokens,
  });
});

// POST /auth/refresh
auth.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json();

  if (!refresh_token) {
    return c.json({ error: 'refresh_token is required' }, 400);
  }

  const record = await c.env.DB
    .prepare('SELECT id, user_id, expires_at FROM refresh_tokens WHERE token = ?')
    .bind(refresh_token)
    .first<{ id: string; user_id: string; expires_at: string }>();

  if (!record || new Date(record.expires_at) < new Date()) {
    return c.json({ error: 'invalid_refresh_token' }, 401);
  }

  // Delete old refresh token (rotation)
  await c.env.DB.prepare('DELETE FROM refresh_tokens WHERE id = ?').bind(record.id).run();

  const user = await c.env.DB
    .prepare('SELECT id, email, username, user_metadata FROM users WHERE id = ?')
    .bind(record.user_id)
    .first<{ id: string; email: string; username: string; user_metadata: string }>();

  if (!user) {
    return c.json({ error: 'user_not_found' }, 401);
  }

  const tokens = await issueTokens(c.env.DB, c.env.JWT_SECRET, user.id, user.email);

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      user_metadata: parseJsonField(user.user_metadata) || {},
    },
    ...tokens,
  });
});

// GET /auth/me
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = await c.env.DB
    .prepare('SELECT id, email, username, phone, user_metadata, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first<{ id: string; email: string; username: string; phone: string | null; user_metadata: string; created_at: string }>();

  if (!user) {
    return c.json({ error: 'user_not_found' }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    user_metadata: parseJsonField(user.user_metadata) || {},
    created_at: user.created_at,
  });
});

// PUT /auth/user
auth.put('/user', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const user = await c.env.DB
    .prepare('SELECT user_metadata, email, phone FROM users WHERE id = ?')
    .bind(userId)
    .first<{ user_metadata: string; email: string; phone: string | null }>();

  if (!user) {
    return c.json({ error: 'user_not_found' }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  // Merge user_metadata
  if (body.data) {
    const existing = (parseJsonField(user.user_metadata) as Record<string, unknown>) || {};
    const merged = { ...existing, ...body.data };
    updates.push('user_metadata = ?');
    values.push(JSON.stringify(merged));
  }

  if (body.email) {
    updates.push('email = ?');
    values.push(body.email.trim().toLowerCase());
  }

  if (body.phone !== undefined) {
    updates.push('phone = ?');
    values.push(body.phone || null);
  }

  if (updates.length === 0) {
    return c.json({ error: 'nothing to update' }, 400);
  }

  values.push(userId);
  await c.env.DB
    .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  // Return updated user
  const updated = await c.env.DB
    .prepare('SELECT id, email, username, phone, user_metadata FROM users WHERE id = ?')
    .bind(userId)
    .first<{ id: string; email: string; username: string; phone: string | null; user_metadata: string }>();

  return c.json({
    id: updated!.id,
    email: updated!.email,
    username: updated!.username,
    phone: updated!.phone,
    user_metadata: parseJsonField(updated!.user_metadata) || {},
  });
});

// POST /auth/change-password
auth.post('/change-password', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { current_password, new_password } = await c.req.json();

  if (!current_password || !new_password) {
    return c.json({ error: 'current_password and new_password are required' }, 400);
  }

  if (new_password.length < 6) {
    return c.json({ error: 'password_too_short' }, 400);
  }

  const user = await c.env.DB
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(userId)
    .first<{ password_hash: string }>();

  if (!user) {
    return c.json({ error: 'user_not_found' }, 404);
  }

  const valid = await verifyPassword(current_password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'incorrect_current_password' }, 401);
  }

  const newHash = await hashPassword(new_password);
  await c.env.DB
    .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(newHash, userId)
    .run();

  return c.json({ success: true });
});

// POST /auth/reset-password-request
auth.post('/reset-password-request', async (c) => {
  const { login, lang } = await c.req.json();

  if (!login) {
    return c.json({ error: 'login is required' }, 400);
  }

  const emailLang: 'ko' | 'en' = lang === 'ko' ? 'ko' : 'en';
  const isEmail = login.includes('@');
  const normalizedLogin = login.trim().toLowerCase();

  const user = await c.env.DB
    .prepare(
      isEmail
        ? 'SELECT id, email FROM users WHERE email = ?'
        : 'SELECT id, email FROM users WHERE username = ?',
    )
    .bind(normalizedLogin)
    .first<{ id: string; email: string }>();

  if (!user) {
    // Don't reveal whether user exists
    return c.json({ sent: true });
  }

  // Generate reset token (JWT with 30 min expiry)
  const resetToken = await generateToken(
    { sub: user.id, purpose: 'reset' },
    c.env.JWT_SECRET,
    1800,
  );

  // Mask email for response
  const [localPart, domain] = user.email.split('@');
  const maskedEmail = localPart.slice(0, 2) + '***@' + domain;

  if (!c.env.RESEND_API_KEY) {
    return c.json({ sent: true, masked_email: maskedEmail, dev_token: resetToken });
  }

  const resetLink = `${c.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:8081'}/reset-password?token=${resetToken}`;
  const html = buildResetPasswordEmailHtml(emailLang, resetLink);
  const subject = getResetPasswordSubject(emailLang);

  await sendEmail(c.env.RESEND_API_KEY, user.email, subject, html);

  return c.json({ sent: true, masked_email: maskedEmail });
});

// POST /auth/reset-password
auth.post('/reset-password', async (c) => {
  const { token, new_password } = await c.req.json();

  if (!token || !new_password) {
    return c.json({ error: 'token and new_password are required' }, 400);
  }

  if (new_password.length < 6) {
    return c.json({ error: 'password_too_short' }, 400);
  }

  const { verifyToken } = await import('../lib/auth');
  const payload = await verifyToken(token, c.env.JWT_SECRET);

  if (!payload || payload.purpose !== 'reset' || !payload.sub) {
    return c.json({ error: 'invalid_or_expired_token' }, 400);
  }

  const newHash = await hashPassword(new_password);
  await c.env.DB
    .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(newHash, payload.sub as string)
    .run();

  // Invalidate all refresh tokens
  await c.env.DB
    .prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
    .bind(payload.sub as string)
    .run();

  return c.json({ success: true });
});

// POST /auth/logout
auth.post('/logout', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { refresh_token } = await c.req.json().catch(() => ({ refresh_token: null }));

  if (refresh_token) {
    await c.env.DB.prepare('DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?').bind(refresh_token, userId).run();
  } else {
    // Delete all refresh tokens for this user
    await c.env.DB.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').bind(userId).run();
  }

  return c.json({ success: true });
});

export { auth as authRoutes };
