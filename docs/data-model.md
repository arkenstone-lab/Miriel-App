# Data Model & API Reference

## Database Tables (Supabase PostgreSQL)

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, FK → auth.users, cascade delete |
| `username` | text | Unique, 3-20 chars `[a-zA-Z0-9_]`, stored lowercase |
| `phone` | text | Optional phone number |
| `created_at` | timestamptz | Auto |

**RLS Policies:**
- SELECT: anyone can read (needed for username lookup)
- INSERT: `auth.uid() = id` (users can only insert their own profile)
- UPDATE: `auth.uid() = id` (users can only update their own profile)

**RPC Functions (SECURITY DEFINER):**
- `get_email_by_username(p_username)` → `text` — Login: resolve username to email
- `get_username_by_email(p_email)` → `text` — Find ID: resolve email to username
- `is_username_available(p_username)` → `boolean` — Sign Up: check uniqueness

### `entries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `user_id` | uuid | FK → auth.users, cascade delete |
| `date` | date | Entry date (YYYY-MM-DD), defaults to today |
| `raw_text` | text | User's journal entry text |
| `tags` | text[] | AI-extracted tags (e.g. `["project:A", "person:Kim"]`) |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto (trigger) |

### `summaries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `period` | text | `'daily'`, `'weekly'`, or `'monthly'` |
| `period_start` | date | Start date of the period |
| `text` | text | Full summary text |
| `entry_links` | uuid[] | Referenced entry IDs |
| `sentences_data` | jsonb | Per-sentence breakdown: `[{ text, entry_ids }]` |
| `created_at` | timestamptz | Auto |

### `todos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `text` | text | Todo content |
| `source_entry_id` | uuid | FK → entries (nullable, set null on delete) |
| `status` | text | `'pending'` or `'done'` |
| `due_date` | date | Optional due date |
| `created_at` | timestamptz | Auto |

### `user_ai_preferences`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users, UNIQUE, cascade delete |
| `summary_style` | text | Summary style preference (e.g. "concise", "detailed") |
| `focus_areas` | text[] | Focus area tags |
| `custom_instructions` | text | Custom AI instructions (max 500 chars) |
| `share_persona` | boolean | Whether to share nickname/occupation/interests with AI (default true) |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto (trigger) |

All tables have RLS enabled. Users can only access their own rows.

## Migrations

Located in `supabase/migrations/`:

1. `001_initial_schema.sql` — Creates entries, summaries, todos tables + RLS + indexes
2. `002_add_sentences_data.sql` — Adds `sentences_data` JSONB column to summaries
3. `003_profiles_username.sql` — Creates profiles table + RLS + 3 SECURITY DEFINER RPC functions
4. `004_user_ai_preferences.sql` — Creates user_ai_preferences table + RLS + updated_at trigger
5. `005_security_hardening.sql` — Security policies
6. `006_monthly_review.sql` — Monthly review feature

## TypeScript Interfaces

Defined in `src/features/<name>/types.ts`. These mirror the database columns:

- `Entry`, `CreateEntryInput`, `UpdateEntryInput` — `features/entry/types.ts`
- `Summary`, `SummarySentence` — `features/summary/types.ts`
- `Todo` — `features/todo/types.ts`
- `StreakData`, `LevelInfo`, `EarnedBadge`, `GamificationStats` — `features/gamification/types.ts`
- `UserAiPreferences`, `UpsertAiPreferencesInput` — `features/ai-preferences/types.ts`

## API Layer

Each feature has an `api.ts` with functions that call Supabase:

### Entry API (`features/entry/api.ts`)

| Function | Method | Description |
|----------|--------|-------------|
| `fetchEntries(date?)` | `SELECT` | List entries, optionally filtered by date |
| `fetchEntry(id)` | `SELECT` | Single entry by ID |
| `createEntry(input)` | `INSERT` | Create new entry |
| `updateEntry(id, input)` | `UPDATE` | Update entry text/tags/date |
| `deleteEntry(id)` | `DELETE` | Delete entry |
| `requestTagging(text, aiContext?)` | Edge Function `tagging` | AI tag extraction |

### Chat API (`features/entry/chatApi.ts`)

| Function | Method | Description |
|----------|--------|-------------|
| `chatWithAI(params)` | Edge Function `chat` | AI multi-turn conversation for journaling |

### Summary API (`features/summary/api.ts`)

| Function | Method | Description |
|----------|--------|-------------|
| `fetchSummaries(period, date?)` | `SELECT` | List summaries by period type |
| `generateSummary(date?, aiContext?)` | Edge Function `generate-summary` | Generate daily summary via AI |
| `generateWeeklySummary(weekStart?, aiContext?)` | Edge Function `generate-weekly` | Generate weekly review via AI |
| `generateMonthlySummary(monthStart, monthEnd, aiContext?)` | Edge Function `generate-monthly` | Generate monthly review via AI |

### Todo API (`features/todo/api.ts`)

| Function | Method | Description |
|----------|--------|-------------|
| `fetchTodos(status?)` | `SELECT` | List todos, optionally filtered |
| `fetchTodosByEntry(entryId)` | `SELECT` | Todos linked to a specific entry |
| `updateTodo(id, updates)` | `UPDATE` | Toggle status, edit text |
| `deleteTodo(id)` | `DELETE` | Delete todo |
| `extractTodos(text, entryId?, aiContext?)` | Edge Function `extract-todos` | AI todo extraction |

### AI Preferences API (`features/ai-preferences/api.ts`)

| Function | Method | Description |
|----------|--------|-------------|
| `fetchAiPreferences()` | `SELECT` | Get current user's AI preferences (null if none) |
| `upsertAiPreferences(input)` | `UPSERT` | Create or update AI preferences |

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
useGenerateSummary()
useGenerateWeeklySummary()
useGenerateMonthlySummary()
useUpdateTodo()
useUpsertAiPreferences()
useDeleteTodo()
```

## Supabase Edge Functions

Located in `supabase/functions/`. Each runs on Deno runtime with inline OpenAI GPT-4o calls:

| Function | Input | Output |
|----------|-------|--------|
| `tagging` | `{ text, ai_context? }` | `{ tags: string[] }` |
| `extract-todos` | `{ text, entry_id?, ai_context? }` | `{ todos: Todo[] }` |
| `generate-summary` | `{ date?, ai_context? }` | `{ summary, sentences }` |
| `generate-weekly` | `{ week_start?, ai_context? }` | `{ summary, sentences }` |
| `generate-monthly` | `{ month_start, month_end, ai_context? }` | `{ summary, sentences }` |
| `chat` | `{ messages[], time_of_day, pending_todos, language, ai_context? }` | `{ message, is_complete, phase, session_summary? }` |

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
