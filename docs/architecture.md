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
| Auth | Supabase Auth (email/password) | - |
| AI | OpenAI GPT-4o (via Edge Functions) | - |
| Server State | TanStack React Query | 5 |
| Client State | Zustand | 5 |
| i18n | i18next + react-i18next + expo-localization | 25/16/17 |

## Directory Structure

```
C:\Work\demo\
├── app/                    # Expo Router pages (file-based routing)
│   ├── (auth)/             # Auth group (login, signup)
│   ├── (tabs)/             # Tab navigator (home, timeline, summary, weekly, todos)
│   ├── entries/            # Entry screens (new, [id])
│   ├── settings.tsx        # Settings modal screen
│   ├── _layout.tsx         # Root layout (auth guard, providers, color scheme)
│   └── +not-found.tsx      # 404 screen
│
├── src/
│   ├── components/
│   │   ├── ui/             # Primitives: Button, Card, Badge, EmptyState, LoadingState
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
│   │   ├── entry/          # types.ts, api.ts, hooks.ts, schema.ts
│   │   ├── summary/        # types.ts, api.ts, hooks.ts
│   │   ├── todo/           # types.ts, api.ts, hooks.ts
│   │   └── gamification/   # types.ts, constants.ts, calculations.ts, hooks.ts
│   │
│   ├── hooks/              # Shared hooks (useResponsiveLayout)
│   ├── i18n/               # i18next config + locale JSON files
│   │   ├── index.ts
│   │   └── locales/{ko,en}/ # 10 namespace files per language
│   ├── lib/                # Utilities (supabase client, constants)
│   └── stores/             # Zustand stores (authStore, chatStore, settingsStore)
│
├── supabase/
│   ├── functions/          # Edge Functions (Deno runtime)
│   │   ├── tagging/        # AI tag extraction
│   │   ├── extract-todos/  # AI todo extraction
│   │   ├── generate-summary/  # AI daily summary
│   │   └── generate-weekly/   # AI weekly review
│   └── migrations/         # SQL schema files
│
├── tailwind.config.ts      # NativeWind config (darkMode: 'class')
├── babel.config.js         # Babel + NativeWind preset
├── global.css              # Tailwind directives
└── CLAUDE.md               # Project spec + coding conventions
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
├── (auth) group          → login, signup (hidden when authenticated)
├── (tabs) group          → bottom tab navigator
│   ├── index             → Dashboard (home)
│   ├── timeline          → Entry list with date grouping
│   ├── summary           → Daily summaries
│   ├── weekly            → Weekly reviews
│   └── todos             → Todo list with filters
├── entries/new           → New entry modal (chat or quick mode)
├── entries/[id]          → Entry detail (edit, delete)
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
| `authStore` | Session, user object, signIn/signUp/signOut | Supabase session (auto) |
| `chatStore` | Chat mode messages, question index, input mode | In-memory only |
| `settingsStore` | Theme, language, privacy notice state | AsyncStorage |

React Query handles all server state (entries, summaries, todos, gamification stats). Query keys follow the pattern `['resource', id?]`.

## Auth Flow

1. `_layout.tsx` calls `authStore.initialize()` on mount
2. Supabase session is restored from storage
3. Auth guard redirects: no user → login, user + auth group → tabs
4. `onAuthStateChange` listener keeps state in sync

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase-project-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Stored in `.env` (gitignored). The `EXPO_PUBLIC_` prefix makes them available in client code.
