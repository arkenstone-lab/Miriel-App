# Supabase → Cloudflare Migration

## Background

Supabase Edge Function에서 반복적으로 발생하는 getUser 401 인증 이슈와, 대규모 서비스 시 Cloudflare 무료 티어의 이점을 고려하여 전체 백엔드를 Cloudflare로 이전.

**결정**: Auth 전체 재구현 + 데이터 새로 시작 (데모 데이터 시딩 활용)

## Architecture Changes

| Component | Before (Supabase) | After (Cloudflare) |
|-----------|-------------------|-------------------|
| Database | PostgreSQL | D1 (SQLite) |
| Auth | Supabase Auth | Custom JWT (bcryptjs + Web Crypto API) |
| Functions | 10 Edge Functions (Deno) | Single Worker (Hono.js, ~25 routes) |
| Storage | Supabase Storage | R2 |
| Client SDK | @supabase/supabase-js | Custom fetch wrapper (src/lib/api.ts) |

## Worker Structure

```
worker/
├── package.json
├── wrangler.toml
├── tsconfig.json
├── migrations/
│   └── 0001_schema.sql
└── src/
    ├── index.ts              — Hono app, route mounting
    ├── types.ts              — Env bindings (D1, R2, JWT_SECRET, etc.)
    ├── lib/
    │   ├── auth.ts           — JWT (Web Crypto HMAC-SHA256) + bcrypt
    │   ├── db.ts             — D1 helpers (generateId, parseJsonFields)
    │   ├── openai.ts         — callOpenAI (3x retry, gpt-4o)
    │   ├── ai-sanitize.ts    — Prompt injection filter
    │   └── email.ts          — Resend API email templates
    ├── middleware/
    │   └── auth.ts           — Bearer token verification middleware
    └── routes/
        ├── auth.ts           — signup, login, refresh, me, update, password
        ├── email-verification.ts — verification codes, find-id
        ├── entries.ts        — CRUD
        ├── todos.ts          — CRUD
        ├── summaries.ts      — List
        ├── ai.ts             — chat, tagging, extract-todos, summaries
        ├── ai-preferences.ts — get, upsert
        ├── storage.ts        — avatar upload/delete/serve (R2)
        └── seed.ts           — Demo data seeder
```

## D1 Schema

7 tables (users, entries, summaries, todos, user_ai_preferences, refresh_tokens, email_verifications).

Key differences from PostgreSQL:
- UUID → TEXT PRIMARY KEY (crypto.randomUUID())
- text[] / JSONB → TEXT (JSON strings)
- timestamptz → TEXT (ISO 8601)
- boolean → INTEGER (0/1)
- No RLS — auth enforced at application level via JWT middleware

## Auth System

### Token Strategy
- **Access token**: JWT (Web Crypto HMAC-SHA256), 1 hour expiry
- **Refresh token**: 32 random bytes (base64url), 30 days, stored in D1
- **Rotation**: Each refresh issues new access + refresh token pair
- **Password reset**: JWT with purpose:'reset', 30 min expiry

### Password Hashing
- bcryptjs with 8 rounds (stays within Workers 10ms CPU limit on free tier)
- Paid tier ($5/mo) extends to 50ms, allowing 10+ rounds if needed

### Endpoints
- `POST /auth/signup` — email verification → account creation → token issuance
- `POST /auth/login` — username or email → bcrypt verify → tokens
- `POST /auth/refresh` — refresh token rotation
- `GET /auth/me` — current user info (protected)
- `PUT /auth/user` — update user_metadata, email, phone (protected)
- `POST /auth/change-password` — verify current → update (protected)
- `POST /auth/reset-password-request` — send reset email
- `POST /auth/reset-password` — verify reset JWT → update password
- `POST /auth/logout` — delete refresh tokens (protected)

### Email Verification
- 6-digit code, 10 min expiry
- Rate limit: 3/email/10min + 10/IP/10min
- verification_token for server-side signup validation

## Client Migration

### New: src/lib/api.ts
- Token storage: AsyncStorage (native) / localStorage (web)
- Memory cache for tokens (avoids async storage reads on every request)
- `apiFetch<T>(path, options)` — authenticated fetch with auto 401→refresh→retry
- `apiPublicFetch<T>(path, options)` — unauthenticated fetch
- Refresh lock prevents concurrent refresh races

### Removed
- `src/lib/supabase.ts` — deleted
- `@supabase/supabase-js` — uninstalled
- `react-native-url-polyfill` — uninstalled
- `supabase` CLI — uninstalled

### .env Change
```diff
- EXPO_PUBLIC_SUPABASE_URL=...
- EXPO_PUBLIC_SUPABASE_ANON_KEY=...
+ EXPO_PUBLIC_API_URL=https://miriel-api.<account>.workers.dev
```

## Deployment

```bash
cd worker
npx wrangler d1 create miriel-db
npx wrangler r2 bucket create miriel-avatars
npx wrangler d1 migrations apply miriel-db
npx wrangler deploy
npx wrangler secret put JWT_SECRET
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put RESEND_API_KEY
```

## Known Limitations & Risks

| Risk | Mitigation |
|------|-----------|
| bcrypt CPU limit (10ms free) | 8 rounds; switch to PBKDF2 (Web Crypto) if exceeded |
| D1 eventual consistency | RETURNING clause + optimistic update; personal journal = session consistency sufficient |
| No onAuthStateChange | authStore.initialize() + explicit state management |
| Workers 10ms CPU free tier | Paid tier ($5/mo) for 50ms if needed for AI routes |
