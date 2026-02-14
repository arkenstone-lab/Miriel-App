# AI Features

> Last updated: 2026-02-14

## Overview

Miriel's AI pipeline automatically performs **tagging → todo extraction → summary generation** when users save entries.
All AI calls are routed through Supabase Edge Functions (Deno) → OpenAI GPT-4o API.

### AI Provider

Each Edge Function contains its own inline `callOpenAI()` with retry logic (3x + exponential backoff), CORS whitelist, and prompt injection sanitization.

| Provider | Model | Env Variable |
|----------|-------|-------------|
| OpenAI | GPT-4o | `OPENAI_API_KEY` |

### AI Personalization

All Edge Functions accept an optional `ai_context` string in the request body.
The client builds this string using `buildAiContext()` from `user_ai_preferences` table + persona (nickname/occupation/interests), and includes it in the request body.
Edge Functions sanitize `ai_context` (prompt injection filtering, length limit) before appending to the system prompt as non-authoritative hints.

---

## Feature Status

| # | Feature | Status | Edge Function | Notes |
|---|---------|--------|---------------|-------|
| 1 | Auto-tagging | Implemented | `tagging` | Project/person/issue extraction |
| 2 | Todo extraction | Implemented | `extract-todos` | Action item detection |
| 3 | Daily summary | Implemented | `generate-summary` | 2-3 sentences + evidence Entry IDs |
| 4 | Weekly review | Implemented | `generate-weekly` | 3-5 key points + evidence Entry IDs |
| 5 | Monthly review | Implemented | `generate-monthly` | 5-7 key points + evidence Entry IDs |
| 6 | Conversational check-in | Implemented | `chat` | AI dynamic questions (3 phases: Plan→Detail→Reflection) |
| 7 | Sentiment analysis | Not implemented | — | Type defined in schema.ts only |
| 8 | AI output schema | Implemented | — | ProcessedEntry type + normalization |
| 9 | AI personalization | Implemented | All (ai_context) | user_ai_preferences + buildAiContext |

---

## Edge Functions Detail

### Architecture Pattern

Each Edge Function is self-contained with:
- **Inline `callOpenAI()`**: GPT-4o API call with 3x retry + exponential backoff + 15s timeout
- **Inline `getCorsHeaders(req)`**: Origin whitelist (localhost:8081, localhost:19006, miriel.app)
- **Inline prompt**: Structured English prompt (Task / Output Schema / Rules / Examples)
- **Inline `ai_context` sanitization**: Prompt injection filtering + length limit

### 1. `tagging` — Auto-tagging

- **Path**: `supabase/functions/tagging/index.ts`
- **Input**: `{ text: string, ai_context?: string }`
- **Output**: `{ tags: string[] }`
- **Temperature**: 0.3
- **Fallback**: Regex-based mock tagging when AI unavailable
- **Called**: After entry save (`app/entries/new.tsx`)

### 2. `extract-todos` — Todo Extraction

- **Path**: `supabase/functions/extract-todos/index.ts`
- **Input**: `{ text: string, entry_id?: string, ai_context?: string }`
- **Output**: `{ todos: Array<{ text, due_hint }> }`
- **Temperature**: 0.3
- **Fallback**: Korean pattern regex matching
- **Called**: After entry save (parallel with tagging)

### 3. `generate-summary` — Daily Summary

- **Path**: `supabase/functions/generate-summary/index.ts`
- **Input**: `{ date?: string, ai_context?: string }` (date: YYYY-MM-DD, defaults to today)
- **Output**: `{ summary: Summary, sentences: SummarySentence[] }`
- **Temperature**: 0.5
- **Evidence links**: Each sentence includes `entry_ids[]` → displayed via EvidenceChip component
- **Called**: Auto-generated on entry save (fire-and-forget)

### 4. `generate-weekly` — Weekly Review

- **Path**: `supabase/functions/generate-weekly/index.ts`
- **Input**: `{ week_start?: string, ai_context?: string }` (YYYY-MM-DD, defaults to current Monday)
- **Output**: `{ summary: Summary, sentences: SummarySentence[] }`
- **Temperature**: 0.5
- **Called**: Summary tab → Weekly mode → "Generate" button

### 5. `generate-monthly` — Monthly Review

- **Path**: `supabase/functions/generate-monthly/index.ts`
- **Input**: `{ month_start: string, month_end: string, ai_context?: string }` (YYYY-MM-DD)
- **Output**: `{ summary: Summary, sentences: SummarySentence[] }`
- **Temperature**: 0.5
- **Period**: Based on user's `monthlyReviewDay` setting (e.g., day 15 → 1/15~2/14)
- **Called**: Summary tab → Monthly mode → "Generate" button

### 6. `chat` — AI Conversational Check-in

- **Path**: `supabase/functions/chat/index.ts`
- **Input**: `{ messages: {role,content}[], time_of_day, pending_todos, language, ai_context? }`
- **Output**: `{ message, is_complete, phase, session_summary? }`
- **3-phase conversation**: Plan (1-2 turns) → Detail (2-3 turns) → Reflection (1-2 turns)
- **Temperature**: 0.7
- **Multi-turn**: Uses inline `callOpenAIMultiTurn()`, client sends full history (stateless server)
- **Fallback**: Auto-switches to static check-in questions on AI failure
- **Called**: Entry creation screen (chat mode) — every turn

---

## Client-side AI Logic

### Conversational Entry Creation (Chat Mode)

- **Files**: `src/stores/chatStore.ts`, `src/features/entry/chatApi.ts`
- **Behavior**: AI generates context-aware dynamic questions based on todos, preferences, time of day
- **3 phases**: Plan → Detail → Reflection (wraps up after 5-7 exchanges)
- **Phase markers**: Saved as `[Plan]\n...\n\n[Detail]\n...\n\n[Reflection]\n...` in raw_text
- **Fallback**: Uses static questions from `src/lib/constants.ts` when AI unavailable

### AI Output Schema

- **File**: `src/features/entry/schema.ts`
- **Type**: `ProcessedEntry` (metadata, sentiment, suggested_todos, tags)
- **Helpers**: `normalizeProcessedEntry()`, `processedEntryToTags()`
- **Purpose**: Standardize Edge Function responses into consistent data structure

---

## Entry Save AI Pipeline

```
User saves entry
  ├─ 1. INSERT into entries table
  ├─ 2. tagging Edge Function call (await)
  │    └─ Update entry with result tags
  ├─ 3. extract-todos Edge Function call (parallel, non-blocking)
  │    └─ INSERT results into todos table
  └─ 4. generate-summary Edge Function call (parallel, non-blocking)
       └─ Auto-generate daily summary → React Query cache invalidation

Summary generation (manual trigger)
  ├─ Weekly: generate-weekly → summaries + sentences_data
  └─ Monthly: generate-monthly → summaries + sentences_data
```

---

## Evidence Link System

All summaries must be traceable back to the original entries:

1. AI generates evidence `entry_ids` alongside each summary sentence
2. Stored in `summaries.sentences_data` JSONB column
3. `SummaryDetailView` → `EvidenceChip` component renders clickable evidence links
4. Clicking navigates to the referenced entry detail screen

---

## Fallback Strategy

| Scenario | Behavior |
|----------|----------|
| No AI API key | Regex-based mock results returned |
| Edge Function error | Empty results returned, error toast displayed |
| Summary requested for day with no entries | "No entries found" message |
| Chat AI initialization failure | Auto-switch to static check-in questions |
| Chat AI response failure (mid-conversation) | Generic follow-up message displayed |

---

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Supabase Edge Function secrets | OpenAI GPT-4o API key (required for AI features) |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Supabase anon key |

---

## Related File Index

| Category | File Paths |
|----------|-----------|
| Edge Functions (AI) | `supabase/functions/{tagging,extract-todos,generate-summary,generate-weekly,generate-monthly,chat}/index.ts` |
| Edge Functions (Auth) | `supabase/functions/{send-verification-code,verify-email-code,validate-email-token,send-find-id-email}/index.ts` |
| Client API | `src/features/{entry,summary,todo,ai-preferences}/api.ts`, `src/features/entry/chatApi.ts` |
| React Query hooks | `src/features/{entry,summary,todo,ai-preferences}/hooks.ts` |
| AI schema | `src/features/entry/schema.ts` |
| Chat state | `src/stores/chatStore.ts` |
| Check-in questions | `src/lib/constants.ts` |
| AI personalization context | `src/features/ai-preferences/context.ts` |
| AI personalization types | `src/features/ai-preferences/types.ts` |
| Entry creation UI | `app/entries/new.tsx` |
| Evidence link UI | `src/components/EvidenceChip.tsx`, `src/components/SummaryDetailView.tsx` |
| Monthly review date picker | `src/components/ui/MonthDayPickerModal.tsx` |
