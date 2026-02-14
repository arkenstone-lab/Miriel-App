# Architecture Overview

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (React Native) | 54 |
| Router | Expo Router (file-based) | 6 |
| Language | TypeScript | 5.9 |
| Styling | NativeWind (Tailwind for RN) | 4.1 |
| CSS Engine | Tailwind CSS | 3.4 |
| Backend | Supabase (PostgreSQL + Edge Functions) | 2.93 |
| Auth | Supabase Auth (username/password via profiles table) | - |
| AI | Gemini 2.0 Flash (default) / OpenAI GPT-4o (via Edge Functions) | - |
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
│   ├── settings.tsx        # Settings modal screen
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
│   ├── lib/                # Utilities (supabase client, constants, errors, notifications, webNotifications, avatar)
│   └── stores/             # Zustand stores (authStore, chatStore, settingsStore)
│
├── supabase/
│   ├── functions/          # Edge Functions (Deno runtime)
│   │   ├── _shared/        # Shared modules (ai.ts, cors.ts, prompts.ts, prompts.example.ts)
│   │   ├── tagging/        # AI tag extraction
│   │   ├── extract-todos/  # AI todo extraction
│   │   ├── generate-summary/   # AI daily summary
│   │   ├── generate-weekly/    # AI weekly review
│   │   ├── generate-monthly/   # AI monthly review
│   │   └── chat/               # AI conversational check-in
│   └── migrations/         # SQL schema files
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
├── api.ts        # Supabase queries and Edge Function calls
├── hooks.ts      # React Query hooks wrapping api.ts
├── schema.ts     # (optional) AI output normalization (entry only)
└── constants.ts  # (optional) Static data (gamification only)
```

**Data flow:**
```
Component → useQuery hook (hooks.ts) → API function (api.ts) → Supabase Client → PostgreSQL / Edge Function
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
│   └── profile           → User profile, achievements, settings entry
├── entries/new           → New entry (chat or quick mode)
├── entries/[id]          → Entry detail (edit, delete)
├── edit-profile          → Profile editing (avatar, persona)
└── settings              → Settings modal
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
| `authStore` | Session, user object, signIn(username)/signUp/signOut | Supabase session (auto) |
| `chatStore` | Chat mode messages, question index, input mode | In-memory only |
| `settingsStore` | Theme, language, privacy, username, phone, notifications, account management | AsyncStorage (device) + user_metadata + profiles table |

React Query handles all server state (entries, summaries, todos, gamification stats). Query keys follow the pattern `['resource', id?]`.

## Auth Flow

1. `_layout.tsx` calls `authStore.initialize()` on mount
2. Supabase session is restored from storage
3. Routing guard: setup not complete → setup, no user → login, user + !onboarding → onboarding, user + auth group → tabs
4. `onAuthStateChange` listener keeps state in sync
5. **Login**: username → RPC lookup → `signInWithPassword({ email, password })`
6. **Sign Up** (email confirmation OFF): username check → `auth.signUp` → profile insert → auto-route to onboarding
7. **Sign Up** (email confirmation ON): same as above but no session → redirect to verify-email → profile created on first login via `loadUserData`
8. **Find ID**: email → RPC lookup → show username
9. **Find Password**: username/email → resolve email → `resetPasswordForEmail(email)`

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase-project-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Stored in `.env` (gitignored). The `EXPO_PUBLIC_` prefix makes them available in client code.
