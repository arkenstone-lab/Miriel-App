import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { generateId, now } from '../lib/db';
import {
  sendEmail,
  buildVerificationEmailHtml,
  getVerificationSubject,
  buildFindIdEmailHtml,
  getFindIdSubject,
} from '../lib/email';

const emailVerification = new Hono<{ Bindings: Env; Variables: Variables }>();

function generateCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, '0');
}

// POST /auth/send-verification-code
emailVerification.post('/send-verification-code', async (c) => {
  const { email, lang } = await c.req.json();

  if (!email || typeof email !== 'string') {
    return c.json({ error: 'email_required' }, 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailLang: 'ko' | 'en' = lang === 'ko' ? 'ko' : 'en';

  const clientIp =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('cf-connecting-ip') ||
    'unknown';

  // Check if email is already registered
  const existingUser = await c.env.DB
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first();
  if (existingUser) {
    return c.json({ error: 'email_already_registered' }, 409);
  }

  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // Rate limit: max 3 codes per email in 10 minutes
  const emailCount = await c.env.DB
    .prepare('SELECT COUNT(*) as cnt FROM email_verifications WHERE email = ? AND created_at > ?')
    .bind(normalizedEmail, tenMinAgo)
    .first<{ cnt: number }>();

  if ((emailCount?.cnt ?? 0) >= 3) {
    return c.json({ error: 'rate_limit' }, 429);
  }

  // Rate limit: max 10 codes per IP in 10 minutes
  if (clientIp !== 'unknown') {
    const ipCount = await c.env.DB
      .prepare('SELECT COUNT(*) as cnt FROM email_verifications WHERE ip_address = ? AND created_at > ?')
      .bind(clientIp, tenMinAgo)
      .first<{ cnt: number }>();

    if ((ipCount?.cnt ?? 0) >= 10) {
      return c.json({ error: 'rate_limit' }, 429);
    }
  }

  // Cleanup expired records
  await c.env.DB
    .prepare('DELETE FROM email_verifications WHERE email = ? AND expires_at < ?')
    .bind(normalizedEmail, new Date().toISOString())
    .run();

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await c.env.DB
    .prepare('INSERT INTO email_verifications (id, email, code, ip_address, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(generateId(), normalizedEmail, code, clientIp, expiresAt, now())
    .run();

  if (!c.env.RESEND_API_KEY) {
    return c.json({ sent: true, dev_code: code });
  }

  const html = buildVerificationEmailHtml(emailLang, code);
  const subject = getVerificationSubject(emailLang, code);
  const sent = await sendEmail(c.env.RESEND_API_KEY, normalizedEmail, subject, html);

  if (!sent) {
    return c.json({ error: 'email_send_failed' }, 500);
  }

  return c.json({ sent: true });
});

// POST /auth/verify-email-code
emailVerification.post('/verify-email-code', async (c) => {
  const { email, code } = await c.req.json();

  if (!email || !code) {
    return c.json({ error: 'email_and_code_required' }, 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();
  const nowStr = new Date().toISOString();

  // Find matching non-expired, non-verified record
  const record = await c.env.DB
    .prepare(
      'SELECT id FROM email_verifications WHERE email = ? AND code = ? AND verified = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
    )
    .bind(normalizedEmail, normalizedCode, nowStr)
    .first<{ id: string }>();

  if (!record) {
    // Check if expired
    const expired = await c.env.DB
      .prepare(
        'SELECT id FROM email_verifications WHERE email = ? AND code = ? AND verified = 0 AND expires_at <= ? LIMIT 1',
      )
      .bind(normalizedEmail, normalizedCode, nowStr)
      .first();

    if (expired) {
      return c.json({ error: 'expired' }, 400);
    }
    return c.json({ error: 'invalid_code' }, 400);
  }

  const verificationToken = crypto.randomUUID();
  await c.env.DB
    .prepare('UPDATE email_verifications SET verified = 1, verification_token = ? WHERE id = ?')
    .bind(verificationToken, record.id)
    .run();

  return c.json({ verified: true, verification_token: verificationToken });
});

// POST /auth/validate-email-token
emailVerification.post('/validate-email-token', async (c) => {
  const { email, verification_token } = await c.req.json();

  if (!email || !verification_token) {
    return c.json({ valid: false }, 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const record = await c.env.DB
    .prepare(
      'SELECT id FROM email_verifications WHERE email = ? AND verification_token = ? AND verified = 1 AND expires_at > ? LIMIT 1',
    )
    .bind(normalizedEmail, verification_token, new Date().toISOString())
    .first();

  return c.json({ valid: !!record });
});

// POST /auth/send-find-id-email
emailVerification.post('/send-find-id-email', async (c) => {
  const { email, lang } = await c.req.json();

  if (!email || typeof email !== 'string') {
    return c.json({ error: 'email is required' }, 400);
  }

  const emailLang: 'ko' | 'en' = lang === 'ko' ? 'ko' : 'en';
  const normalizedEmail = email.trim().toLowerCase();

  const user = await c.env.DB
    .prepare('SELECT username FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first<{ username: string }>();

  if (!user) {
    return c.json({ error: 'not_found' }, 404);
  }

  if (!c.env.RESEND_API_KEY) {
    return c.json({ username: user.username, fallback: true });
  }

  const html = buildFindIdEmailHtml(emailLang, user.username);
  const subject = getFindIdSubject(emailLang);
  const sent = await sendEmail(c.env.RESEND_API_KEY, normalizedEmail, subject, html);

  if (!sent) {
    return c.json({ error: 'email_send_failed' }, 500);
  }

  return c.json({ sent: true });
});

export { emailVerification as emailVerificationRoutes };
