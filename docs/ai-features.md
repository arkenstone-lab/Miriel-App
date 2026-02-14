# AI Features

> Last updated: 2026-02-15

## Overview

Miriel's AI pipeline automatically performs **tagging → todo extraction → summary generation** when users save entries.
All AI calls are routed through Cloudflare Worker routes → OpenAI GPT-4o API.

### AI Provider

The Worker contains inline `callOpenAI()` with retry logic (3x + exponential backoff), CORS whitelist, and prompt injection sanitization.

| Provider | Model | Env Variable |
|----------|-------|-------------|
| OpenAI | GPT-4o | `OPENAI_API_KEY` (wrangler secret) |

### AI Personalization

All AI routes accept an optional `ai_context` string in the request body.
The client builds this string using `buildAiContext()` from `user_ai_preferences` table + persona (nickname/occupation/interests), and includes it in the request body.
The Worker sanitizes `ai_context` (prompt injection filtering, length limit) before appending to the system prompt as non-authoritative hints.

---

## Feature Status

| # | Feature | Status | Worker Route | Notes |
|---|---------|--------|-------------|-------|
| 1 | Auto-tagging | Implemented | `POST /ai/tagging` | Project/person/issue extraction |
| 2 | Todo extraction | Merged into summary | `POST /ai/generate-summary` | Now extracted as part of daily summary (standalone `POST /ai/extract-todos` still available) |
| 3 | Daily summary + todos | Implemented | `POST /ai/generate-summary` | 2-3 sentences + evidence Entry IDs + todo extraction, daily 3x limit per entry |
| 4 | Weekly review | Implemented | `POST /ai/generate-weekly` | 3-5 key points + evidence Entry IDs |
| 5 | Monthly review | Implemented | `POST /ai/generate-monthly` | 5-7 key points + evidence Entry IDs |
| 6 | Conversational check-in | Implemented | `POST /ai/chat` | AI dynamic questions (3 phases: Plan→Detail→Reflection) |
| 7 | Sentiment analysis | Not implemented | — | Type defined in schema.ts only |
| 8 | AI output schema | Implemented | — | ProcessedEntry type + normalization |
| 9 | AI personalization | Implemented | All (ai_context) | user_ai_preferences + buildAiContext |

---

## Worker AI Routes Detail

### Architecture Pattern

All AI routes are in `worker/src/routes/ai.ts` with shared utilities:
- **`worker/src/lib/openai.ts`**: `callOpenAI()` — GPT-4o API call with 3x retry + exponential backoff + 15s timeout
- **`worker/src/lib/ai-sanitize.ts`**: `sanitizeAiContext()` — Prompt injection filtering + length limit
- **Inline prompts**: Structured English prompts (Task / Output Schema / Rules / Examples) in `ai.ts`

### 1. `POST /ai/tagging` — Auto-tagging

- **File**: `worker/src/routes/ai.ts`
- **Input**: `{ text: string, ai_context?: string }`
- **Output**: `{ tags: string[] }`
- **Temperature**: 0.3
- **Fallback**: Regex-based mock tagging when AI unavailable
- **Called**: After entry save (`app/entries/new.tsx`)

### 2. `POST /ai/extract-todos` — Todo Extraction (Standalone)

- **File**: `worker/src/routes/ai.ts`
- **Input**: `{ text: string, entry_id?: string, ai_context?: string }`
- **Output**: `{ todos: Array<{ text, due_hint }> }`
- **Temperature**: 0.3
- **Fallback**: Korean pattern regex matching
- **Note**: Still available as a standalone endpoint, but **no longer called during entry save flow**. Todo extraction is now handled by `generate-summary` (see below).
- **DB**: Inserts extracted todos into `todos` table (D1)

### 3. `POST /ai/generate-summary` — Daily Summary + Todo Extraction

- **File**: `worker/src/routes/ai.ts`
- **Input**: `{ date?: string, ai_context?: string }` (date: YYYY-MM-DD, defaults to today)
- **Output**: `{ summary: Summary, sentences: SummarySentence[], todos?: Array<{ text, due_hint }>, gen_count: number, max_count: number }`
- **Temperature**: 0.5
- **Evidence links**: Each sentence includes `entry_ids[]` → displayed via EvidenceChip component
- **Todo extraction**: `SUMMARY_PROMPT` includes todo extraction rules; todos are parsed from AI response and inserted into `todos` table
- **Daily limit**: Max 3 summary generations per entry per day (tracked via `entries.summary_gen_count`). Returns 429 when limit reached.
- **DB**: Fetches entries from D1, deletes existing summary + AI-extracted todos, inserts new ones, increments `summary_gen_count`
- **Called**: Auto-generated on entry save (fire-and-forget) + manual "Regenerate Summary" button in entry detail

### 4. `POST /ai/generate-weekly` — Weekly Review

- **File**: `worker/src/routes/ai.ts`
- **Input**: `{ week_start?: string, ai_context?: string }` (YYYY-MM-DD, defaults to current Monday)
- **Output**: `{ summary: Summary, sentences: SummarySentence[] }`
- **Temperature**: 0.5
- **Called**: Summary tab → Weekly mode → "Generate" button

### 5. `POST /ai/generate-monthly` — Monthly Review

- **File**: `worker/src/routes/ai.ts`
- **Input**: `{ month_start: string, month_end: string, ai_context? }` (YYYY-MM-DD)
- **Output**: `{ summary: Summary, sentences: SummarySentence[] }`
- **Temperature**: 0.5
- **Period**: Based on user's `monthlyReviewDay` setting (e.g., day 15 → 1/15~2/14)
- **Called**: Summary tab → Monthly mode → "Generate" button

### 6. `POST /ai/chat` — AI Conversational Check-in

- **File**: `worker/src/routes/ai.ts`
- **Input**: `{ messages: {role,content}[], pending_todos, language, ai_context? }`
- **Output**: `{ message, is_complete, phase, session_summary? }`
- **3-phase conversation**: Plan (1-2 turns) → Detail (2-3 turns) → Reflection (1-2 turns)
- **Temperature**: 0.7
- **Multi-turn**: Client sends full history (stateless server)
- **Fallback**: Auto-switches to static check-in questions on AI failure
- **Called**: Entry creation screen (chat mode) — every turn

---

## Client-side AI Logic

### Conversational Entry Creation (Chat Mode)

- **Files**: `src/stores/chatStore.ts`, `src/features/entry/chatApi.ts`
- **Behavior**: AI generates context-aware dynamic questions based on todos, preferences
- **3 phases**: Plan → Detail → Reflection (wraps up after 5-7 exchanges)
- **Phase markers**: Saved as `[Plan]\n...\n\n[Detail]\n...\n\n[Reflection]\n...` in raw_text
- **Fallback**: Uses static questions from `src/lib/constants.ts` when AI unavailable
- **Draft persistence**: Auto-saves conversation to localStorage/AsyncStorage, resumes on return

### AI Output Schema

- **File**: `src/features/entry/schema.ts`
- **Type**: `ProcessedEntry` (metadata, sentiment, suggested_todos, tags)
- **Helpers**: `normalizeProcessedEntry()`, `processedEntryToTags()`
- **Purpose**: Standardize Worker responses into consistent data structure

---

## Entry Save AI Pipeline

```
User saves entry
  ├─ 1. POST /entries (create entry)
  ├─ 2. POST /ai/tagging (await)
  │    └─ PUT /entries/:id with result tags
  └─ 3. POST /ai/generate-summary (parallel, non-blocking)
       └─ Single AI call generates summary + extracts todos
       └─ Inserts summary + todos into D1
       └─ React Query cache invalidation (summaries + todos)

Entry detail — "Regenerate Summary" button
  └─ POST /ai/generate-summary (same route, checks daily 3x limit)
       └─ Returns 429 if summary_gen_count >= 3 per entry

Summary generation (manual trigger)
  ├─ Weekly: POST /ai/generate-weekly → summaries + sentences_data
  └─ Monthly: POST /ai/generate-monthly → summaries + sentences_data
```

---

## Evidence Link System

All summaries must be traceable back to the original entries:

1. AI generates evidence `entry_ids` alongside each summary sentence
2. Stored in `summaries.sentences_data` JSON TEXT column
3. `SummaryDetailView` → `EvidenceChip` component renders clickable evidence links
4. Clicking navigates to the referenced entry detail screen

---

## Fallback Strategy

| Scenario | Behavior |
|----------|----------|
| No AI API key | Regex-based mock results returned |
| Worker AI route error | Empty results returned, error toast displayed |
| Summary requested for day with no entries | "No entries found" message |
| Chat AI initialization failure | Auto-switch to static check-in questions |
| Chat AI response failure (mid-conversation) | Generic follow-up message displayed |

---

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Wrangler secret | OpenAI GPT-4o API key (required for AI features) |
| `INVITE_CODES` | Wrangler secret | Comma-separated invite codes for signup gating (optional; if unset, open registration) |
| `EXPO_PUBLIC_API_URL` | `.env` | Worker URL (e.g., `https://miriel-api.<account>.workers.dev`) |

---

## Related File Index

| Category | File Paths |
|----------|-----------|
| Worker AI routes | `worker/src/routes/ai.ts` |
| Worker AI utilities | `worker/src/lib/openai.ts`, `worker/src/lib/ai-sanitize.ts` |
| Worker Auth routes | `worker/src/routes/auth.ts`, `worker/src/routes/email-verification.ts` |
| Worker Email | `worker/src/lib/email.ts` |
| Client API | `src/features/{entry,summary,todo,ai-preferences}/api.ts`, `src/features/entry/chatApi.ts` |
| Client API wrapper | `src/lib/api.ts` |
| React Query hooks | `src/features/{entry,summary,todo,ai-preferences}/hooks.ts` |
| AI schema | `src/features/entry/schema.ts` |
| Chat state | `src/stores/chatStore.ts` |
| Check-in questions | `src/lib/constants.ts` |
| AI personalization context | `src/features/ai-preferences/context.ts` |
| AI personalization types | `src/features/ai-preferences/types.ts` |
| Entry creation UI | `app/entries/new.tsx` |
| Evidence link UI | `src/components/EvidenceChip.tsx`, `src/components/SummaryDetailView.tsx` |
| Monthly review date picker | `src/components/ui/MonthDayPickerModal.tsx` |
