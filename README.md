# Miriel

**AI-powered journal that turns your daily notes into evidence-backed reflections.**

Write for 3 minutes a day. Miriel organizes, summarizes, and connects your records — so every insight links back to what you actually wrote.

## Why Miriel?

| Problem | Solution |
|---------|----------|
| Writing feels like a chore — logs don't stick | Chatbot-guided check-in: answer 3 questions, done in 3 minutes |
| Notes pile up but never get reviewed | AI generates daily/weekly/monthly summaries automatically |
| "What should I reflect on?" | Every summary sentence links to the original entry |

## Key Features

- **Conversational Check-in** — AI-guided 3-phase dialogue (Plan → Detail → Reflection) adapts questions to your context
- **Auto-tagging** — Projects, people, and issues extracted from your entries
- **Evidence-linked Summaries** — Daily, weekly, and monthly reviews where every insight traces back to your words
- **Smart To-dos** — Action items auto-extracted from entries with source linking
- **Streak & Gamification** — Levels, XP, badges, and streak tracking to build a journaling habit
- **AI Personalization** — Customize summary style, focus areas, and instructions to match your workflow
- **Data Ownership** — Export all your data as JSON, delete your account permanently at any time
- **Cross-platform** — Single codebase for Web (PC), iOS, and Android

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo (React Native) + Expo Router + TypeScript |
| Styling | NativeWind (Tailwind CSS for RN) + Dark mode |
| i18n | i18next — Korean / English, auto-detect system locale |
| State | React Query (server) + Zustand (client) |
| Backend | Cloudflare Workers (Hono.js) |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (avatars) |
| Auth | Custom JWT (bcryptjs + cloudflare-worker-jwt) + email verification |
| AI | OpenAI GPT-4o |
| Notifications | expo-notifications (native) + Web Notification API |

## Architecture

```
app/                          # Expo Router (file-based routing)
├── (setup)/                  # First-time device setup (language → theme → welcome)
├── (auth)/                   # Login, signup, find-id, find-password, verify-email
├── (onboarding)/             # Post-login onboarding (growth cycle → preferences → notifications)
├── (tabs)/                   # Main app — 5 tabs
│   ├── index.tsx             # Dashboard (streak, level, recent summary)
│   ├── timeline.tsx          # Entry list by date
│   ├── summary.tsx           # Daily / Weekly / Monthly summaries
│   ├── todos.tsx             # AI-extracted to-dos
│   └── profile.tsx           # User profile + gamification + account management
├── entries/                  # Entry detail + create/edit
├── settings.tsx              # Language, theme, notifications, legal
└── edit-profile.tsx          # Avatar + persona editor

src/
├── components/               # 22 UI components (layout, dashboard, primitives)
├── features/                 # 5 domain modules (entry, summary, todo, gamification, ai-preferences)
├── stores/                   # 3 Zustand stores (auth, settings, chat)
├── i18n/                     # 12 namespaces × 2 languages
└── lib/                      # API client, notifications, error handling

worker/                        # Cloudflare Worker (Hono.js)
├── migrations/               # D1 schema migrations
└── src/
    ├── routes/               # ~25 API routes
    │   ├── auth.ts           # Signup, login, refresh, password reset, export, delete
    │   ├── entries.ts        # Entry CRUD
    │   ├── summaries.ts      # Summary queries
    │   ├── todos.ts          # Todo CRUD
    │   ├── ai.ts             # AI endpoints (chat, tagging, summary, weekly, monthly)
    │   ├── storage.ts        # Avatar upload/serve (R2)
    │   └── seed.ts           # Demo data seeder
    ├── lib/                  # Auth (JWT/bcrypt), OpenAI, email (Resend)
    └── middleware/           # JWT auth, CORS
```

## Responsive Design

| Environment | Navigation | Layout |
|-------------|-----------|--------|
| Desktop (1024px+) | Sidebar | Master-Detail 2-panel |
| Mobile (~1023px) | Bottom tabs + FAB | Single panel (full screen) |

## Getting Started

### Prerequisites
- Node.js 18+
- Wrangler CLI (`npm i -g wrangler`)
- Cloudflare account
- OpenAI API key

### 1. Install dependencies
```bash
npm install
cd worker && npm install
```

### 2. Environment variables

**Client** — create `.env` in the project root:
```
EXPO_PUBLIC_API_URL=https://your-worker.workers.dev
```

**Worker** — create `worker/.dev.vars` for local development:
```
JWT_SECRET=<your-secret>
OPENAI_API_KEY=<your-openai-key>
CORS_ORIGINS=http://localhost:8081
```

For production, set secrets via Wrangler:
```bash
cd worker
npx wrangler secret put JWT_SECRET
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put RESEND_API_KEY    # optional, for email
npx wrangler secret put INVITE_CODES      # optional, comma-separated
```

### 3. Database setup
```bash
cd worker
npx wrangler d1 migrations apply miriel-db
```

### 4. Run
```bash
# Client
npx expo start        # Platform selection menu
npx expo start --web  # Web directly

# Worker (local)
cd worker && npx wrangler dev
```

## License

Copyright (c) 2026 Arkenstone Lab. All rights reserved.

See [LICENSE](LICENSE) for details.
