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
- **Cross-platform** — Single codebase for Web (PC), iOS, and Android

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo (React Native) + Expo Router + TypeScript |
| Styling | NativeWind (Tailwind CSS for RN) + Dark mode |
| i18n | i18next — Korean / English, auto-detect system locale |
| State | React Query (server) + Zustand (client) |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Username-based login + email verification |
| AI | Gemini 2.0 Flash (primary) / OpenAI GPT-4o (fallback) |
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
│   └── profile.tsx           # User profile + gamification stats
├── entries/                  # Entry detail + create/edit
├── settings.tsx              # Account, notifications, AI preferences
└── edit-profile.tsx          # Avatar + persona editor

src/
├── components/               # 22 UI components (layout, dashboard, primitives)
├── features/                 # 5 domain modules (entry, summary, todo, gamification, ai-preferences)
├── stores/                   # 3 Zustand stores (auth, settings, chat)
├── i18n/                     # 12 namespaces × 2 languages
└── lib/                      # Supabase client, notifications, error handling

supabase/
├── migrations/               # 4 SQL migrations with RLS policies
└── functions/                # 6 Edge Functions + shared AI abstraction
    ├── chat/                 # Multi-turn AI dialogue for entry creation
    ├── tagging/              # Auto-tag extraction
    ├── extract-todos/        # Action item extraction
    ├── generate-summary/     # Daily summary
    ├── generate-weekly/      # Weekly review
    └── generate-monthly/     # Monthly review
```

## Responsive Design

| Environment | Navigation | Layout |
|-------------|-----------|--------|
| Desktop (1024px+) | Sidebar | Master-Detail 2-panel |
| Mobile (~1023px) | Bottom tabs + FAB | Single panel (full screen) |

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project ([supabase.com](https://supabase.com))
- Gemini API key or OpenAI API key

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Create `.env` in the project root:
```
EXPO_PUBLIC_SUPABASE_URL=<your Supabase project URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

Set Edge Function secrets in Supabase Dashboard:
```
OPENAI_API_KEY=<your OpenAI API key>
```

### 3. Database setup
Run migrations in order via Supabase SQL Editor:
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_sentences_data.sql
supabase/migrations/003_profiles_username.sql
supabase/migrations/004_user_ai_preferences.sql
```

### 4. Run
```bash
npx expo start        # Platform selection menu
npx expo start --web  # Web directly
```

## License

Copyright (c) 2026 Arkenstone Lab. All rights reserved.

See [LICENSE](LICENSE) for details.
