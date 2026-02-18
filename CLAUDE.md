# Miriel — AI Journal

## Overview
- **One-liner**: AI-powered journal that creates evidence-linked reflections from your daily notes
- **Goal**: Investor demo MVP (D-Day: 2026-02-19) — polished, working demo product
- **Demo flow**: "Record (3min) → Auto-organize → Daily summary → Weekly review → Dashboard" in 3-5min
- **Core direction**: Duolingo-style retention-first product

## Target Users
- Busy knowledge workers who keep daily work logs
- Goal: 3min daily recording + 10min weekly review

---

## MVP Scope

### Must Have (all implemented)
1. Quick text input (web-first)
2. Conversational journaling (AI check-in chatbot, 3-phase: Plan→Detail→Reflection)
3. Auto-tagging (date/project/people/issue)
4. Daily summary with evidence links (auto-generated on entry save)
5. Weekly review (3-5 key points + evidence links, 1/week limit)
6. Monthly review (5-7 key points + evidence links)
7. Evidence linking (click summary sentence → original entry)
8. Todo extraction (merged into summary generation, single AI call)
9. Retention system (streaks + gamification: levels/badges/XP)
10. Responsive UI (PC desktop + mobile)
11. Notifications (native push via expo-notifications + web polling)
12. Dashboard (stats, streaks, recent activity, quick record)

### Won't Do
- Social/sharing/follow
- Decision logs, emotion/mental health diagnosis
- Calendar/Slack integration
- Background activity auto-collection

### Later (post-demo)
- Native mobile app + voice input
- External integrations (calendar, Slack, Notion)
- Leaderboard / social streaks
- **Offline mode (local-first architecture)**: SQLite local DB as source of truth with background server sync. Current architecture is server-first + rollback pattern. AI features still require server; offline = text save only + static question fallback.

---

## Tech Stack
- **Framework**: Expo (React Native) + Expo Router + TypeScript
- **Styling**: NativeWind (Tailwind CSS for RN), dark mode (`darkMode: 'class'`)
- **i18n**: i18next + react-i18next + expo-localization (ko/en, auto-detect system locale)
- **State**: React Query (server) + Zustand (client: auth, chat, settings)
- **Backend**: Cloudflare Worker (Hono.js, ~25 routes) — `worker/` directory
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: Custom JWT (bcryptjs + Web Crypto HMAC-SHA256) — access 1h + refresh 30d rotation
- **Storage**: Cloudflare R2 (avatar images)
- **AI**: OpenAI GPT-4o — inline callOpenAI in Worker (3x retry + security hardening)
- **Email**: Resend API (verification codes, password reset, find-id)
- **Deploy**: EAS Build (iOS/Android) + Expo Web (PC) + Cloudflare Workers (API)

---

## Deployment

### Web (Cloudflare Pages)
- **Live**: https://miriel.app
- **Repo**: `arkenstone-lab/miriel-live` → Cloudflare Pages auto-deploy
- **Script**: `scripts/deploy.sh` (expo export → dist/ → force push to miriel-live)
- **Caution**: `EXPO_PUBLIC_API_URL` is bundled at build time. Verify `.env` has `https://api.miriel.app` before building.

### API (Cloudflare Workers)
- **Live**: https://api.miriel.app
- **Deploy**: `cd worker && npx wrangler deploy`
- **Secrets** (wrangler secret): `JWT_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `INVITE_CODES`, `ANALYTICS_SECRET`
- **D1**: `miriel-db` (APAC) / **R2**: `miriel-avatars`

### Local Dev
- `.env`: `EXPO_PUBLIC_API_URL=http://localhost:8787`
- Worker: `cd worker && npx wrangler dev`

---

## Data Model (D1 / SQLite)

```typescript
interface User {
  id: string;                // TEXT PK (crypto.randomUUID)
  email: string;             // UNIQUE
  username: string;          // UNIQUE, 3-20 chars, alphanumeric + underscore, stored lowercase
  password_hash: string;     // bcryptjs 8 rounds
  phone?: string;
  user_metadata: string;     // JSON TEXT (nickname, gender, occupation, interests, avatar, onboarding, notifications, etc.)
  created_at: string;
}

interface Entry {
  id: string;
  user_id: string;
  date: string;              // YYYY-MM-DD
  raw_text: string;          // May contain phase markers: [Plan]/[Detail]/[Reflection]
  tags: string;              // JSON array TEXT
  summary_gen_count: number; // Summary regen count (3/day limit)
  created_at: string;
  updated_at: string;
}

interface Summary {
  id: string;
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  text: string;
  entry_links: string;       // JSON array TEXT (Entry IDs)
  sentences_data: string;    // JSON array TEXT ([{ text, entry_ids }])
  created_at: string;
}

interface Todo {
  id: string;
  user_id: string;
  text: string;
  source_entry_id?: string;
  status: 'pending' | 'done';
  due_date?: string;
  created_at: string;
}

interface UserAiPreferences {
  id: string;
  user_id: string;           // UNIQUE
  summary_style: string;
  focus_areas: string;       // JSON array TEXT
  custom_instructions: string;
  share_persona: number;     // 0/1 (SQLite boolean)
  created_at: string;
  updated_at: string;
}

interface RefreshToken {
  id: string;
  user_id: string;           // CASCADE DELETE
  token: string;             // UNIQUE
  expires_at: string;
  created_at: string;
}

interface EmailVerification {
  id: string;
  email: string;
  code: string;              // 6-digit
  verification_token?: string;
  verified: number;          // 0/1
  ip_address?: string;
  expires_at: string;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  identifier: string;       // email or username (for rate limiting)
  ip: string;               // client IP address
  created_at: string;       // DEFAULT datetime('now')
}
```

---

## Screen Structure

### Tab Screens (bottom tab navigation)
1. **Dashboard (Home)** — streaks, level/badges, recent summaries, quick record
2. **Record** — AI chatbot check-in (3 phases) + text input
3. **Timeline** — entry list by date + daily/weekly/monthly summary access
4. **Todo List** — AI-extracted todos + completion + source entry links
5. **Profile** — user info, achievements, account management (username/email/password/export/delete), AI personalization

### Detail/Modal Screens
- **Entry Detail** — view/edit entry, regenerate summary (3/day limit)
- **Summary Detail** — summary text with per-sentence evidence chips
- **Settings** — language, theme, notifications, support, legal (account + AI personalization moved to Profile)
- **Edit Profile** — avatar upload/delete, persona fields
- **Onboarding** — 3-step interactive setup (growth cycle → weekly review config → notifications)
- **First-time Setup** — language → theme → welcome (pre-login, device-level)

---

## AI Routes

> All prompts are inline in `worker/src/routes/ai.ts` (3637d4c pattern). Do not extract to shared modules.

| Route | Purpose |
|-------|---------|
| `POST /ai/tagging` | Extract project/people/issue tags |
| `POST /ai/extract-todos` | Extract todos (standalone; now integrated into generate-summary) |
| `POST /ai/generate-summary` | Daily summary + todo extraction in single call (3/day limit) |
| `POST /ai/generate-weekly` | Weekly review (3-5 points + entry_ids) |
| `POST /ai/generate-monthly` | Monthly review (5-7 points + entry_ids) |
| `POST /ai/chat` | 3-phase conversational check-in (Plan→Detail→Reflection) |

Auth routes: `worker/src/routes/auth.ts` (signup, login, refresh, me, update, change-password, reset, export, delete-account), email verification: `worker/src/routes/email-verification.ts`

Analytics routes: `worker/src/routes/analytics.ts` — see `docs/analytics.md` for full documentation.

| Route | Purpose |
|-------|---------|
| `POST /analytics/track` | Client-side `app_open` event collection (authMiddleware) |
| `GET /analytics/overview` | Total users, activation rate, DAU/WAU/MAU (ANALYTICS_SECRET) |
| `GET /analytics/dau` | DAU/WAU time series (ANALYTICS_SECRET) |
| `GET /analytics/retention` | Cohort-based D1/D7/D30 retention (ANALYTICS_SECRET) |
| `GET /analytics/funnel` | Signup→activation→retention→power user funnel + feature usage (ANALYTICS_SECRET) |

---

## Coding Conventions

- Components: `PascalCase`, functional + hooks
- Files: feature-based folders (`/features/entry`, `/features/summary`)
- API: Cloudflare Worker Hono.js routes (`worker/src/routes/`)
- State: React Query (server) + Zustand (client)
- Styling: NativeWind (`className`, Tailwind syntax)
- Navigation: Expo Router (file-based, `/app` directory)
- Error handling: `AppError(code)` — auth screens use inline text (`getErrorMessage()`), others use `showErrorAlert()`. Catalog: `docs/error-codes.md`
- i18n: All UI strings in `src/i18n/locales/{ko,en}/` JSON. Use `useTranslation()` in components. No hardcoding.
- **Git: All commit messages, PR titles, branch names in English.** Korean allowed only in code comments and i18n strings.
- **Comments required**: When modifying or adding code, always leave comments explaining the *why* and context of the change. Write "why"-focused comments so other developers or AI agents can immediately understand intent. Example: `// Alert.alert callbacks are broken on web — use ConfirmModal instead`

---

## Developer Docs (`docs/`)

| Document | When to Reference |
|----------|-------------------|
| [`architecture.md`](docs/architecture.md) | Project structure, routing, state management |
| [`dark-mode.md`](docs/dark-mode.md) | `dark:` variant color mappings |
| [`i18n.md`](docs/i18n.md) | Translation keys, namespaces, `t()` usage |
| [`data-model.md`](docs/data-model.md) | DB schema, types, API, React Query hooks |
| [`components.md`](docs/components.md) | UI primitives, new component rules |
| [`analytics.md`](docs/analytics.md) | Analytics API, retention metrics, event tracking |
| [`settings-and-privacy.md`](docs/settings-and-privacy.md) | settingsStore, settings screen |
| [`gamification.md`](docs/gamification.md) | Streak/XP/level/badge system |
| [`ai-features.md`](docs/ai-features.md) | AI pipeline, prompts, fallback strategies |
| [`error-codes.md`](docs/error-codes.md) | Error code catalog, CS guide |
| [`cloudflare-migration.md`](docs/cloudflare-migration.md) | Supabase→Cloudflare transition details |

---

## Critical Design Decisions

These decisions have architectural implications. Violating them will cause bugs or regressions.

| Decision | Why It Matters |
|----------|---------------|
| **AI routes use inline callOpenAI (3637d4c pattern)** | Do NOT extract prompts to shared modules or separate files. Each route is self-contained with its own prompt + security handling. |
| **bcryptjs limited to 8 rounds** | Workers free tier has 10ms CPU limit. Higher rounds will timeout. Increase only after upgrading to Paid tier ($5/mo, 50ms). |
| **Weekly review day: 0=Mon..6=Sun convention** | Differs from JS `getDay()` (0=Sun). Conversion for expo-notifications: `(day + 2) % 7 \|\| 7`. Wrong conversion = wrong notification day. |
| **Todo extraction merged into generate-summary** | Single AI call returns both summary + todos. Do NOT call extract-todos separately on entry save. |
| **Daily summary auto-generated (fire-and-forget)** | Triggered on entry save. Failure is silent. React Query cache invalidation handles UI refresh. |
| **Summary regen capped at 3/day** | `entries.summary_gen_count` tracks this. Server returns 429 when exceeded. Client must pass through 429 directly (not wrap in AppError). |
| **Setup vs Onboarding are separate flows** | Setup = pre-login, device-level (AsyncStorage). Onboarding = post-login, account-level (user_metadata). Mixing them causes routing loops. |
| **user_metadata vs AsyncStorage** | Account data (onboarding/persona/privacy/notifications) → user_metadata. Device settings (theme/language/hasCompletedSetup) → AsyncStorage. Wrong storage = data leaks between accounts or lost on device switch. |
| **Batch save for user_metadata** | Multiple simultaneous field updates cause last-write-wins data loss. Always use batch pattern (savePersona, saveNotificationSettings). |
| **Offline mode deferred** | Current architecture is server-first. Do not build local-first patterns yet — it requires full API/hook layer rewrite. |
| **Invite code system** | `INVITE_CODES` wrangler secret (comma-separated). Empty = open signup. `/health` returns `invite_required` flag for client UI. |
| **Chat route is stateless** | Client sends full message history each turn (max 20 messages). Server does not persist conversation state. |
| **Alert.alert → ConfirmModal for destructive actions** | `Alert.alert` callbacks are broken on web. Use `ConfirmModal` (`src/components/ui/ConfirmModal.tsx`) for delete confirmations and similar actions. |
| **ConfirmModal uses inline styles (not NativeWind)** | RN Modal renders outside NativeWind context, so `dark:` classes don't work. Use `useColorScheme()` + conditional inline styles. |
| **useDeleteEntry uses removeQueries (not invalidate)** | `invalidateQueries` returns stale cache before refetch completes → `useTodayEntry` returns deleted entry → autoEdit redirect bug. Use `removeQueries` for immediate cache removal. |
| **Chat AI language: use `i18n.language`** | `settingsStore.language` is initially null → falls back to 'en' → Korean input gets English responses. `i18n.language` always returns the correct locale. |
| **Chat message limit handled client-side** | Server returns 400 when exceeding MAX_MESSAGES(20). Client must auto-complete conversation when limit is reached to prevent infinite "tell me more" loop. |
| **After entry deletion, use `router.replace` (not `router.back`)** | `router.back()` navigates to the deleted entry URL → 404. Use `router.replace('/(tabs)/timeline')` for safe navigation. |
| **React Query staleTime: 5min + cache: 'no-store'** | `staleTime: 5min` prevents redundant refetches on tab switches. `cache: 'no-store'` on `apiFetch`/`apiPublicFetch` + `Cache-Control: no-store` on Worker prevents browser HTTP caching stale data on production. Mutations still trigger immediate refetch via `invalidateQueries`. |
| **Smart entry navigation (useTodayEntry)** | Dashboard QuickActions, FAB, Timeline header, SidebarNav all check `useTodayEntry()`. If today's entry exists → navigate to `/entries/{id}` (view), icon changes to `eye`. If not → `/entries/new` (create), icon is `pencil`/`plus`. Prevents confusing chat UI flash + leave modal. |
| **Login rate limiting (login_attempts)** | Max 5 failed logins per identifier (email/username) per 15 minutes → returns 429 `too_many_login_attempts`. Cleared on successful login. Prevents brute force attacks. |
| **Password validation: 8+ chars, uppercase, number** | Enforced in signup + change-password. `validatePassword()` in auth.ts. Existing accounts not retroactively validated (legacy passwords still work for login). |
| **Account deletion requires text confirmation** | `DELETE /auth/account` cascading hard-deletes all user data (entries, summaries, todos, tokens, preferences, login_attempts, R2 avatars). Client requires exact text match: "삭제합니다" (ko) / "DELETE" (en). |
| **Data export: user-friendly schema only** | `GET /auth/export` returns JSON with no internal IDs (no UUIDs, no source_entry_id). Fields mapped to user-facing names (raw_text→content, period_start→date). Prevents DB schema reverse-engineering. |
| **Signup ToS/Privacy consent** | Signup form requires mandatory checkbox agreeing to Terms of Service + Privacy Policy. Includes pre-consent for future cookies/analytics and promotional emails (opt-out available). |
| **Account + AI Personalization in Profile, not Settings** | Settings = app preferences (language/theme/notifications). Profile = account management + AI personalization. This separation prevents settings overload and aligns with user mental model. |

---

## Gotchas & Pitfalls

### Dark Mode
- `dark:` classes don't work in React Navigation style objects → use `useColorScheme()` + JS conditional styles
- New components must always include `dark:` variants for `bg-white`, `text-gray-*`, `border-gray-*`
- FontAwesome icon `color` ignores NativeWind → pass conditional color via `useColorScheme()`
- MasterDetailLayout detail pane needs explicit `bg-gray-50 dark:bg-gray-950`

### Expo / React Native
- AsyncStorage + Expo Web: `window is not defined` → only use as storage when `Platform.OS !== 'web'`
- NativeWind v4: `babel.config.js` requires `jsxImportSource: 'nativewind'`
- expo-notifications: not supported on web → all functions need `Platform.OS === 'web'` early return
- expo-notifications has no MONTHLY trigger → use DATE trigger, reschedule on each alarm
- expo-image-picker on web: `asset.uri` is data URI/blob URL → use `asset.mimeType` for content type, `fetch(uri).blob()` for upload
- Chat multiline TextInput ignores `onSubmitEditing` → use `onKeyPress` on web for Enter detection
- Tab bar text clipping → `tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 4 }`

### Auth & Routing
- Routing guard needs both `initialized` (auth) AND `settingsReady` (settings) to be true
- `hasCompletedSetup` check takes highest priority in routing guard
- Logout from modal screen: must `router.dismiss()` BEFORE `signOut()` or modal blocks navigation
- `tryRefresh()` has 3 outcomes: `'success'` / `'invalid'` (→ force logout) / `'network_error'` (→ keep tokens, no logout)
- On network error during `initialize()`: decode JWT payload locally for userId to maintain login state

### API & Data
- `apiPublicFetch` throws on 4xx/5xx → error codes accessed via `(error as any)?.body?.error` in catch
- 429 responses must be thrown directly (not wrapped in AppError) — client checks `err.status === 429`
- D1 JSON fields: stored as TEXT with `JSON.stringify`, parsed with `parseJsonFields()` utility
- `userDataLoaded` flag must be true before routing decisions (prevents onboarding flash)
- Username stored lowercase → always `username.toLowerCase()` on insert
- Signup flow order: send-verification-code → validate-email-token → POST /auth/signup
- R2 avatar: `{userId}/avatar.{ext}` path with `?t=timestamp` cache busting

### i18n
- Module-level `i18n.t()` requires `import '@/i18n'` loaded first (done in `app/_layout.tsx` top import)
- `useTranslation()` for React components only; stores/utils use `i18n.t()` directly

### Error Handling
- Auth screens: `getErrorMessage()` + inline red text. Other screens: `showErrorAlert()` Alert.
- Adding a new error code requires 3 simultaneous updates: `errors.json` (ko+en) + `error-codes.md` + `throw new AppError('CODE')`
- `AppError` uses `i18n.t()` in constructor → only accurate after i18n init

### Misc
- Optimistic updates pattern: `onMutate` (modify cache) → `onError` (rollback snapshot) → `onSettled` (invalidate)
- Chat draft key is per-user: `@miriel/chat_draft_{userId}` — valid current date only
- Logo assets: `icon.png` (2048px) for app icon, `logo-128.png` (128px) for display. Assets use relative path `../../assets/images/`
- Never use PowerShell for UTF-8 file edits (breaks Korean/emoji, converts LF→CRLF)

---

## Remaining Tasks
- [ ] EAS Build (iOS TestFlight + Android APK)
- [ ] Expo Web build (PC)
- [ ] Demo video recording
