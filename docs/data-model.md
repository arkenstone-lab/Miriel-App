# Data Model & API Reference

## Database Tables (Cloudflare D1 / SQLite)

All IDs are TEXT (crypto.randomUUID). Timestamps are TEXT (ISO datetime). Arrays/objects are JSON TEXT.

### `users` (auth.users + profiles merged)

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK (crypto.randomUUID) |
| `email` | TEXT | NOT NULL, UNIQUE |
| `username` | TEXT | NOT NULL, UNIQUE, stored lowercase |
| `password_hash` | TEXT | NOT NULL, bcryptjs 8 rounds |
| `phone` | TEXT | Optional |
| `user_metadata` | TEXT | JSON (nickname, gender, occupation, interests, avatar, onboarding, notifications, etc.) |
| `created_at` | TEXT | DEFAULT datetime('now') |

### `entries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → users |
| `date` | TEXT | Entry date (YYYY-MM-DD) |
| `raw_text` | TEXT | User's journal entry text |
| `tags` | TEXT | JSON array (e.g. `["project:A", "person:Kim"]`) |
| `summary_gen_count` | INTEGER | Summary generation count per entry (daily 3x limit), DEFAULT 0 |
| `created_at` | TEXT | DEFAULT datetime('now') |
| `updated_at` | TEXT | DEFAULT datetime('now') |

### `summaries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → users |
| `period` | TEXT | `'daily'`, `'weekly'`, or `'monthly'` |
| `period_start` | TEXT | Start date (YYYY-MM-DD) |
| `text` | TEXT | Full summary text |
| `entry_links` | TEXT | JSON array of entry IDs |
| `sentences_data` | TEXT | JSON array: `[{ text, entry_ids }]` |
| `created_at` | TEXT | DEFAULT datetime('now') |

### `todos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → users |
| `text` | TEXT | Todo content |
| `source_entry_id` | TEXT | Optional FK → entries |
| `status` | TEXT | `'pending'` or `'done'` |
| `due_date` | TEXT | Optional (YYYY-MM-DD) |
| `created_at` | TEXT | DEFAULT datetime('now') |

### `user_ai_preferences`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → users, UNIQUE |
| `summary_style` | TEXT | Summary style preference |
| `focus_areas` | TEXT | JSON array of focus tags |
| `custom_instructions` | TEXT | Custom AI instructions (max 500 chars) |
| `share_persona` | INTEGER | 0 or 1 (SQLite boolean), default 1 |
| `created_at` | TEXT | DEFAULT datetime('now') |
| `updated_at` | TEXT | DEFAULT datetime('now') |

### `refresh_tokens`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → users, CASCADE DELETE |
| `token` | TEXT | NOT NULL, UNIQUE |
| `expires_at` | TEXT | ISO datetime (30 days) |
| `created_at` | TEXT | DEFAULT datetime('now') |

### `email_verifications`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK |
| `email` | TEXT | Target email address |
| `code` | TEXT | 6-digit verification code |
| `verification_token` | TEXT | Issued on verification success |
| `verified` | INTEGER | 0 or 1 |
| `ip_address` | TEXT | For rate limiting |
| `expires_at` | TEXT | Code expiry (10 min) |
| `created_at` | TEXT | DEFAULT datetime('now') |

### Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_entries_user_date ON entries(user_id, date);
CREATE INDEX idx_summaries_user_period ON summaries(user_id, period, period_start);
CREATE INDEX idx_todos_user ON todos(user_id);
CREATE INDEX idx_todos_entry ON todos(source_entry_id);
CREATE INDEX idx_rt_token ON refresh_tokens(token);
CREATE INDEX idx_rt_user ON refresh_tokens(user_id);
CREATE INDEX idx_ev_email ON email_verifications(email);
CREATE INDEX idx_ev_ip ON email_verifications(ip_address);
```

## Migrations

| File | Description |
|------|-------------|
| `worker/migrations/0001_schema.sql` | Creates all tables (users, entries, summaries, todos, etc.) and indexes |
| `worker/migrations/0002_entry_gen_count.sql` | Adds `summary_gen_count INTEGER DEFAULT 0` column to entries table |

Apply: `npx wrangler d1 migrations apply miriel-db`

## TypeScript Interfaces

Defined in `src/features/<name>/types.ts`. These mirror the database columns:

- `Entry`, `CreateEntryInput`, `UpdateEntryInput` — `features/entry/types.ts`
- `Summary`, `SummarySentence` — `features/summary/types.ts`
- `Todo` — `features/todo/types.ts`
- `StreakData`, `LevelInfo`, `EarnedBadge`, `GamificationStats` — `features/gamification/types.ts`
- `UserAiPreferences`, `UpsertAiPreferencesInput` — `features/ai-preferences/types.ts`

## API Layer

Each feature has an `api.ts` with functions that call the Worker via `apiFetch()`:

### Entry API (`features/entry/api.ts`)

| Function | Worker Route | Description |
|----------|-------------|-------------|
| `fetchEntries(date?)` | `GET /entries?date=` | List entries, optionally filtered by date |
| `fetchEntry(id)` | `GET /entries/:id` | Single entry by ID |
| `createEntry(input)` | `POST /entries` | Create new entry |
| `updateEntry(id, input)` | `PUT /entries/:id` | Update entry text/tags/date |
| `deleteEntry(id)` | `DELETE /entries/:id` | Delete entry |
| `requestTagging(text, aiContext?)` | `POST /ai/tagging` | AI tag extraction |

### Chat API (`features/entry/chatApi.ts`)

| Function | Worker Route | Description |
|----------|-------------|-------------|
| `chatWithAI(params)` | `POST /ai/chat` | AI multi-turn conversation for journaling |

### Summary API (`features/summary/api.ts`)

| Function | Worker Route | Description |
|----------|-------------|-------------|
| `fetchSummaries(period, date?)` | `GET /summaries?period=&date=` | List summaries by period type |
| `generateSummary(date?, aiContext?)` | `POST /ai/generate-summary` | Generate daily summary + extract todos via AI. Returns `GenerateSummaryResult` with `todos`, `gen_count`, `max_count`. 429 on daily limit. |
| `generateWeeklySummary(weekStart?, aiContext?)` | `POST /ai/generate-weekly` | Generate weekly review via AI |
| `generateMonthlySummary(monthStart, monthEnd, aiContext?)` | `POST /ai/generate-monthly` | Generate monthly review via AI |

### Todo API (`features/todo/api.ts`)

| Function | Worker Route | Description |
|----------|-------------|-------------|
| `fetchTodos(status?)` | `GET /todos?status=` | List todos, optionally filtered |
| `fetchTodosByEntry(entryId)` | `GET /todos/by-entry/:entryId` | Todos linked to a specific entry |
| `updateTodo(id, updates)` | `PUT /todos/:id` | Toggle status, edit text |
| `deleteTodo(id)` | `DELETE /todos/:id` | Delete todo |
| `extractTodos(text, entryId?, aiContext?)` | `POST /ai/extract-todos` | AI todo extraction (standalone; entry save now uses `generateSummary` instead) |

### AI Preferences API (`features/ai-preferences/api.ts`)

| Function | Worker Route | Description |
|----------|-------------|-------------|
| `fetchAiPreferences()` | `GET /ai-preferences` | Get current user's AI preferences |
| `upsertAiPreferences(input)` | `PUT /ai-preferences` | Create or update AI preferences |

## React Query Hooks

Defined in `features/<name>/hooks.ts`. Each wraps an API function:

```tsx
// Queries
useEntries(date?)          // queryKey: ['entries', date]
useEntry(id)               // queryKey: ['entries', id]
useSummaries(period, date?) // queryKey: ['summaries', period, date]
useTodos(status?)          // queryKey: ['todos', status]
useTodosByEntry(entryId)   // queryKey: ['todos', 'entry', entryId]
useGamificationStats()     // queryKey: ['gamification']
useAiPreferences()         // queryKey: ['ai-preferences']

// Mutations (all invalidate relevant queries on success)
useCreateEntry()
useUpdateEntry()
useDeleteEntry()
useGenerateSummary()       // also invalidates ['todos'] (summary now extracts todos)
useGenerateWeeklySummary()
useGenerateMonthlySummary()
useUpdateTodo()            // optimistic update: instant UI → rollback on error
useDeleteTodo()            // optimistic update: instant UI → rollback on error
useUpsertAiPreferences()
```

## Worker Routes Summary

All AI routes are in `worker/src/routes/ai.ts`:

| Route | Input | Output |
|-------|-------|--------|
| `POST /ai/tagging` | `{ text, ai_context? }` | `{ tags: string[] }` |
| `POST /ai/extract-todos` | `{ text, entry_id?, ai_context? }` | `{ todos: Todo[] }` (standalone; entry save uses generate-summary instead) |
| `POST /ai/generate-summary` | `{ date?, ai_context? }` | `{ summary, sentences, todos?, gen_count, max_count }` (429 on daily limit) |
| `POST /ai/generate-weekly` | `{ week_start?, ai_context? }` | `{ summary, sentences }` |
| `POST /ai/generate-monthly` | `{ month_start, month_end, ai_context? }` | `{ summary, sentences }` |
| `POST /ai/chat` | `{ messages[], pending_todos, language, ai_context? }` | `{ message, is_complete, phase, session_summary? }` |

## ProcessedEntry Schema

`src/features/entry/schema.ts` defines the standardized AI output format:

```typescript
interface ProcessedEntry {
  entry_id: string
  metadata: { projects: string[], people: string[], issues: string[] }
  sentiment?: 'positive' | 'neutral' | 'negative'
  suggested_todos: { text: string, due_hint?: string }[]
  tags: string[]
  processed_at: string
}
```

Helper functions:
- `normalizeProcessedEntry(entryId, raw)` — Validates/defaults partial AI responses
- `processedEntryToTags(processed)` — Converts structured metadata to flat `"prefix:value"` tag strings
