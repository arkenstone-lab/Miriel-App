# Architecture Overview

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (React Native) | 54 |
| Router | Expo Router (file-based) | 6 |
| Language | TypeScript | 5.9 |
| Styling | NativeWind (Tailwind for RN) | 4.1 |
| CSS Engine | Tailwind CSS | 3.4 |
| Backend | Cloudflare Worker (Hono.js, ~25 routes) | - |
| Database | Cloudflare D1 (SQLite) | - |
| Auth | Custom JWT (bcryptjs + Web Crypto HMAC-SHA256) | - |
| Storage | Cloudflare R2 (avatar images) | - |
| AI | OpenAI GPT-4o (via Worker inline callOpenAI) | - |
| Email | Resend API (verification, password reset, find ID) | - |
| Server State | TanStack React Query | 5 |
| Client State | Zustand | 5 |
| i18n | i18next + react-i18next + expo-localization | 25/16/17 |

## Directory Structure

```
miriel/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (setup)/            # First-time setup (language, theme, welcome)
│   ├── (auth)/             # Auth group (login, signup, find-id, find-password, verify-email)
│   ├── (onboarding)/       # Onboarding (growth cycle, weekly review, notifications, persona, complete)
│   ├── (tabs)/             # Tab navigator (home, timeline, summary, todos, profile)
│   ├── entries/            # Entry screens (new, [id])
│   ├── edit-profile.tsx    # Profile editing modal
│   ├── settings.tsx        # Settings modal (language, theme, notifications, support, legal)
│   ├── _layout.tsx         # Root layout (auth guard, providers, color scheme)
│   └── +not-found.tsx      # 404 screen
│
├── src/
│   ├── components/
│   │   ├── ui/             # Primitives: Button, Card, Badge, EmptyState, LoadingState, EditModal, SegmentedControl, TimePickerModal, DayPickerModal, MonthDayPickerModal, ErrorDisplay
│   │   ├── layout/         # AppShell, SidebarNav, MasterDetailLayout
│   │   ├── dashboard/      # Dashboard-specific: StreakCard, LevelProgressCard, etc.
│   │   ├── PrivacyNotice.tsx
│   │   ├── EntryCard.tsx
│   │   ├── EntryDetail.tsx
│   │   ├── EvidenceChip.tsx
│   │   ├── SummaryDetailView.tsx
│   │   └── TodoItem.tsx
│   │
│   ├── features/           # Feature modules (each has types, api, hooks)
│   │   ├── entry/          # types.ts, api.ts, hooks.ts, schema.ts, chatApi.ts
│   │   ├── summary/        # types.ts, api.ts, hooks.ts
│   │   ├── todo/           # types.ts, api.ts, hooks.ts
│   │   ├── gamification/   # types.ts, constants.ts, calculations.ts, hooks.ts
│   │   └── ai-preferences/ # types.ts, api.ts, hooks.ts, context.ts
│   │
│   ├── hooks/              # Shared hooks (useResponsiveLayout)
│   ├── i18n/               # i18next config + locale JSON files
│   │   ├── index.ts
│   │   └── locales/{ko,en}/ # 14 namespace files per language
│   ├── lib/                # Utilities (api client, constants, errors, notifications, webNotifications, avatar)
│   └── stores/             # Zustand stores (authStore, chatStore, settingsStore)
│
├── worker/                 # Cloudflare Worker (Hono.js)
│   ├── package.json
│   ├── wrangler.toml       # D1 binding (DB), R2 binding (AVATARS), vars
│   ├── tsconfig.json
│   ├── migrations/
│   │   ├── 0001_schema.sql # All tables (users, entries, summaries, todos, etc.)
│   │   ├── 0002_entry_gen_count.sql # summary_gen_count column
│   │   └── 0003_login_attempts.sql  # Login rate limiting table
│   └── src/
│       ├── index.ts        # Hono app skeleton, CORS middleware, route mounting
│       ├── types.ts        # Env bindings (D1, R2, vars)
│       ├── lib/
│       │   ├── auth.ts     # JWT + bcrypt (hashPassword, verifyPassword, generateToken, verifyToken)
│       │   ├── db.ts       # D1 helpers (generateId, now, parseJsonFields, stringifyJsonFields)
│       │   ├── openai.ts   # callOpenAI (3x retry, 15s timeout, json_object format)
│       │   ├── ai-sanitize.ts  # ai_context sanitization (prompt injection filter)
│       │   └── email.ts    # Resend API wrapper (verification, password reset, find ID)
│       ├── middleware/
│       │   ├── auth.ts     # JWT verification middleware (Bearer → c.set('userId'))
│       │   └── cors.ts     # CORS origin whitelist
│       └── routes/
│           ├── auth.ts             # signup, login, me, update, change-password, reset, export, delete-account
│           ├── email-verification.ts # send-code, verify-code, validate-token, find-id
│           ├── entries.ts          # CRUD
│           ├── todos.ts            # CRUD
│           ├── summaries.ts        # list
│           ├── ai.ts               # chat, tagging, extract-todos, generate-summary/weekly/monthly
│           ├── ai-preferences.ts   # get, upsert
│           ├── storage.ts          # avatar upload/delete/serve (R2)
│           └── seed.ts             # Demo data seeder
│
├── docs/                   # Developer documentation
├── tailwind.config.ts      # NativeWind config (darkMode: 'class')
├── babel.config.js         # Babel + NativeWind preset
├── global.css              # Tailwind directives
└── CLAUDE.md               # Project spec + coding conventions (dev only, gitignored)
```

## Feature Module Pattern

Each feature in `src/features/<name>/` follows the same structure:

```
features/<name>/
├── types.ts      # TypeScript interfaces (Entry, Summary, Todo, etc.)
├── api.ts        # API calls via apiFetch (Worker routes)
├── hooks.ts      # React Query hooks wrapping api.ts
├── schema.ts     # (optional) AI output normalization (entry only)
└── constants.ts  # (optional) Static data (gamification only)
```

**Data flow:**
```
Component → useQuery hook (hooks.ts) → API function (api.ts) → apiFetch (src/lib/api.ts) → Cloudflare Worker → D1 / OpenAI
```

## Routing Architecture

Expo Router uses file-based routing. The navigation structure:

```
Root Stack (_layout.tsx)
├── (setup) group         → First-time setup (language, theme, welcome)
├── (auth) group          → login, signup, find-id, find-password, verify-email
├── (onboarding) group    → Growth cycle, weekly review setup, notifications, persona, complete
├── (tabs) group          → Bottom tab navigator
│   ├── index             → Dashboard (home)
│   ├── timeline          → Entry list with date grouping
│   ├── summary           → Daily/Weekly/Monthly summaries (SegmentedControl toggle)
│   ├── todos             → Todo list with filters
│   └── profile           → User profile, achievements, account mgmt, AI personalization
├── entries/new           → New entry (chat or quick mode)
├── entries/[id]          → Entry detail (edit, delete)
├── edit-profile          → Profile editing (avatar, persona)
└── settings              → Settings modal (language, theme, notifications, support, legal)
```

## Responsive Layout System

The app is cross-platform (Web + iOS + Android) with a single codebase.

- **Desktop (>= 1024px):** Sidebar nav + content area. Tabs hidden. MasterDetailLayout for list screens.
- **Mobile (< 1024px):** Bottom tab navigation. No sidebar. Full-screen views.

Key hook: `useResponsiveLayout()` returns `{ isDesktop, isMobile, width }`.

Layout components:
- `AppShell` — Wraps content with sidebar on desktop, passthrough on mobile
- `SidebarNav` — Desktop-only left sidebar with navigation + settings gear
- `MasterDetailLayout` — Desktop-only split view (list on left, detail on right)

## State Management

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `authStore` | User object, JWT tokens, signIn/signUp/signOut | AsyncStorage (access + refresh tokens) |
| `chatStore` | Chat mode messages, phase tracking, input mode, draft persistence | In-memory + localStorage/AsyncStorage (per-user drafts: `@miriel/chat_draft_{userId}`) |
| `settingsStore` | Theme, language, privacy, notifications, account management | AsyncStorage (device) + users.user_metadata (account) |

React Query handles all server state (entries, summaries, todos, gamification stats). Query keys follow the pattern `['resource', id?]`.

**Cache strategy:** `staleTime: 5min` (global default) prevents redundant refetches on tab switches. `cache: 'no-store'` on client fetch + `Cache-Control: no-store` on Worker responses ensures fresh data from server when React Query decides to refetch. Mutations bypass staleTime via `invalidateQueries`.

## Auth Flow

1. `_layout.tsx` calls `authStore.initialize()` on mount
2. Stored JWT tokens are restored from AsyncStorage/localStorage
3. `GET /auth/me` validates the access token and loads user data. On network error, JWT is decoded locally as fallback to keep user logged in
4. Routing guard: setup not complete → setup, no user → login (modals dismissed first), user + !onboarding → onboarding, user + auth group → tabs
5. **Login**: username/email → `POST /auth/login` → JWT tokens stored
6. **Sign Up**: email verification code → validate-email-token → `POST /auth/signup` → JWT tokens stored → onboarding
7. **Token Refresh**: 401 response → `tryRefresh()` → success (new tokens + retry) / invalid (force sign out) / network_error (keep tokens, don't sign out)
8. **Find ID**: email → `POST /auth/send-find-id-email` → email sent with username
9. **Find Password**: username/email → `POST /auth/reset-password-request` → email with reset link

## Environment Variables

### Client (.env)
```
EXPO_PUBLIC_API_URL=https://miriel-api.<account>.workers.dev
```

### Worker (wrangler secrets)
```
JWT_SECRET=<secret-key>
OPENAI_API_KEY=<openai-api-key>
RESEND_API_KEY=<resend-api-key>
INVITE_CODES=<comma-separated-codes>  # optional; if unset, open registration
```

### Worker (wrangler.toml vars)
```
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,https://miriel.app
```
