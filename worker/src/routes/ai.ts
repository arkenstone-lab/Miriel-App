import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { callOpenAI } from '../lib/openai';
import { sanitizeAiContext } from '../lib/ai-sanitize';
import { generateId, now, parseJsonFields, stringifyJsonField } from '../lib/db';

const ai = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── PROMPTS ───

const TAGGING_PROMPT = `You are a structured data extraction assistant for a personal journal app.

## Task
Extract explicit entities from the user's journal entry. Only extract items that are clearly mentioned — do NOT guess or infer.

## Output Schema
Respond with JSON only:
{
  "projects": ["string"],
  "people": ["string"],
  "issues": ["string"]
}

## Rules
- **Projects**: Named initiatives, products, clients, or workstreams. Look for capitalized names, quoted terms, or phrases preceded by "프로젝트"/"project".
- **People**: Real names or referenced colleagues/contacts. Exclude pronouns (나/우리/I/we/they).
- **Issues**: Problems, risks, bugs, or blockers. Phrase as short noun phrases (e.g., "로그인 오류", "deployment delay").
- Each array: unique items only, trimmed, max 10 items.
- If nothing found for a category, return an empty array.
- Respond in the same language as the input text.

## Examples
Input: "오늘 프로젝트 Aurora 회의에서 김대리와 로그인 버그에 대해 논의했다"
Output: {"projects":["Aurora"],"people":["김대리"],"issues":["로그인 버그"]}

Input: "Had a call with Sarah about the API migration delay"
Output: {"projects":["API migration"],"people":["Sarah"],"issues":["API migration delay"]}`;

const TODO_PROMPT = `You are a task extraction assistant for a personal journal app.

## Task
Extract actionable to-do items from the user's journal entry.

## Output Schema
Respond with JSON only:
{
  "todos": [
    { "text": "Actionable task as a verb phrase", "due_hint": "deadline hint or empty string" }
  ]
}

## Rules
- Extract only clear action items — phrases like "해야 한다", "할 예정", "하기로 했다", "need to", "should", "will do", "plan to".
- Exclude tasks that are clearly already completed ("했다", "완료", "finished", "done").
- Phrase each todo as an actionable verb phrase (e.g., "Send draft to Minji", "API 문서 마감하기").
- If a deadline is mentioned, put it in due_hint (e.g., "내일", "Friday", "다음주 수요일"). Otherwise empty string.
- Maximum 5 todos per entry.
- Remove duplicates.
- Respond in the same language as the input text.

## Example
Input: "내일까지 보고서 초안을 완성해야 한다. 김대리에게 리뷰 요청할 것. 어제 발표 준비는 끝냈다."
Output: {"todos":[{"text":"보고서 초안 완성하기","due_hint":"내일"},{"text":"김대리에게 리뷰 요청하기","due_hint":""}]}`;

const SUMMARY_PROMPT = `You are a personal journal summarizer. Create a concise daily summary and extract actionable to-do items from the user's entries.

## Task
1. Summarize the day's journal entries into 2-3 sentences. Each sentence MUST cite the Entry IDs it is based on.
2. Extract actionable to-do items mentioned in the entries.

## Output Schema
Respond with JSON only:
{
  "sentences": [
    { "text": "Summary sentence (max 160 chars)", "entry_ids": ["id1"] }
  ],
  "todos": [
    { "text": "Actionable task as a verb phrase", "due_hint": "deadline hint or empty string" }
  ]
}

## Summary Rules
- Write 2-3 sentences maximum.
- Each sentence must be grounded in specific entries — cite 1-3 Entry IDs per sentence.
- You may ONLY cite IDs that appear in the input (format: [ID: xxx]). Never invent IDs.
- Keep sentences concise (max 160 characters each) for mobile display.
- If entries are repetitive, deduplicate and combine.
- Focus on what was accomplished, key decisions, and notable events.
- Tone: neutral, factual, supportive — like a helpful assistant, not a manager.

## Todo Rules
- Extract only clear action items — phrases like "해야 한다", "할 예정", "하기로 했다", "need to", "should", "will do", "plan to".
- Exclude tasks that are clearly already completed ("했다", "완료", "finished", "done").
- Phrase each todo as an actionable verb phrase (e.g., "Send draft to Minji", "API 문서 마감하기").
- If a deadline is mentioned, put it in due_hint (e.g., "내일", "Friday"). Otherwise empty string.
- Maximum 5 todos. If no actionable items found, return empty array.

## Language
- Respond in the same language as the majority of the input entries.

## Example
Input entries about meetings and bug fixes →
Output: {"sentences":[{"text":"프로젝트 Aurora 관련 회의에서 로그인 버그 원인을 파악하고 수정 방향을 결정했다.","entry_ids":["abc-123"]},{"text":"오후에는 API 문서 작성과 코드 리뷰를 진행했다.","entry_ids":["def-456","ghi-789"]}],"todos":[{"text":"로그인 버그 수정 PR 올리기","due_hint":"내일"},{"text":"API 문서 최종 리뷰 요청하기","due_hint":""}]}`;

const WEEKLY_SUMMARY_PROMPT = `You are a personal journal retrospective assistant. Create a meaningful weekly review grounded in the user's entries.

## Task
Review the week's journal entries and identify 3-5 key points. Each point must cite the Entry IDs it is based on.

## Output Schema
Respond with JSON only:
{
  "sentences": [
    { "text": "Retrospective point (max 200 chars)", "entry_ids": ["id1", "id2"] }
  ]
}

## Rules
- Write 3-5 retrospective points.
- Each point should capture: what happened + why it matters.
- You may ONLY cite IDs from the provided entries (format: [ID: xxx]). Never invent IDs.
- Each point must cite 1-3 most representative Entry IDs.
- Keep each point concise (max 200 characters) for mobile display.
- Respond in the same language as the majority of the input entries.
- Cover different aspects of the week — avoid repeating the same theme.
- Tone: reflective, encouraging — help the user see their progress.
- If there are patterns (e.g., recurring blockers, consistent progress), highlight them.

## Example
Input: A week of project work and meetings →
Output: {"sentences":[{"text":"Aurora 프로젝트가 본격적으로 진행되며 주요 기능 3개가 완성되었다.","entry_ids":["id-1","id-3"]},{"text":"김대리와의 협업이 효율적으로 이루어져 예상보다 빠르게 마감했다.","entry_ids":["id-2","id-5"]}]}`;

const MONTHLY_SUMMARY_PROMPT = `You are a personal journal retrospective assistant. Create a meaningful monthly review grounded in the user's entries.

## Task
Review the month's journal entries and identify 5-7 key points. Each point must cite the Entry IDs it is based on.

## Output Schema
Respond with JSON only:
{
  "sentences": [
    { "text": "Retrospective point (max 250 chars)", "entry_ids": ["id1", "id2"] }
  ]
}

## Rules
- Write 5-7 retrospective points.
- Each point should capture: what happened + why it matters + what it means for future growth.
- You may ONLY cite IDs from the provided entries (format: [ID: xxx]). Never invent IDs.
- Each point must cite 1-3 most representative Entry IDs.
- Keep each point concise (max 250 characters) for mobile display.
- Respond in the same language as the majority of the input entries.
- Cover different aspects of the month — accomplishments, patterns, challenges, growth areas.
- Highlight recurring themes, progress on goals, and notable trends across the month.
- Tone: reflective, encouraging, big-picture — help the user see their monthly trajectory.
- If there are clear wins, celebrate them. If there are recurring challenges, suggest awareness.

## Example
Input: A month of project work, learning, and team collaboration →
Output: {"sentences":[{"text":"Aurora 프로젝트 MVP가 완성되어 팀 전체가 한 단계 도약했다.","entry_ids":["id-1","id-8","id-15"]},{"text":"매주 꾸준히 기술 블로그를 읽는 습관이 정착되어 3개 새로운 패턴을 실무에 적용했다.","entry_ids":["id-5","id-12"]}]}`;

const MAX_MESSAGES = 20;
const MAX_EXCHANGES = 10;

// ─── MOCK FUNCTIONS ───

function mockTagging(text: string): string[] {
  const tags: string[] = [];
  const projectPatterns = /프로젝트\s*[:\s]?\s*(\S+)/g;
  const personPatterns = /([가-힣]{2,4})\s*(님|씨|대리|과장|팀장|부장|사원|매니저)/g;
  const issuePatterns = /(버그|이슈|오류|에러|장애|문제|지연)/g;

  let match;
  while ((match = projectPatterns.exec(text)) !== null) tags.push(`프로젝트:${match[1]}`);
  while ((match = personPatterns.exec(text)) !== null) tags.push(`사람:${match[1]}`);
  while ((match = issuePatterns.exec(text)) !== null) {
    if (!tags.includes(`이슈:${match[1]}`)) tags.push(`이슈:${match[1]}`);
  }
  return tags;
}

function mockTodoExtraction(text: string): { text: string; due_hint: string }[] {
  const todos: { text: string; due_hint: string }[] = [];
  const patterns = [/(.{2,30}(?:해야|할 예정|하기로|할 것|필요))/g, /(?:내일|다음주|이번 주).{2,30}/g];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const todoText = match[0].trim();
      if (todoText.length >= 4 && !todos.some((t) => t.text === todoText)) {
        todos.push({ text: todoText, due_hint: '' });
      }
    }
  }
  return todos.slice(0, 5);
}

interface SummarySentence {
  text: string;
  entry_ids: string[];
}

function mockSummary(entries: { id: string; raw_text: string }[]): SummarySentence[] {
  return entries.slice(0, 3).map((e) => ({
    text: e.raw_text.length > 80 ? e.raw_text.slice(0, 80) + '...' : e.raw_text,
    entry_ids: [e.id],
  }));
}

function mockWeeklySummary(entries: { id: string; raw_text: string }[]): SummarySentence[] {
  return entries.slice(0, 5).map((e) => ({
    text: e.raw_text.length > 60 ? e.raw_text.slice(0, 60) + '...' : e.raw_text,
    entry_ids: [e.id],
  }));
}

function mockMonthlySummary(entries: { id: string; raw_text: string }[]): SummarySentence[] {
  return entries.slice(0, 7).map((e) => ({
    text: e.raw_text.length > 60 ? e.raw_text.slice(0, 60) + '...' : e.raw_text,
    entry_ids: [e.id],
  }));
}

function formatTags(result: { projects: string[]; people: string[]; issues: string[] }): string[] {
  const tags: string[] = [];
  result.projects.forEach((p) => tags.push(`프로젝트:${p}`));
  result.people.forEach((p) => tags.push(`사람:${p}`));
  result.issues.forEach((i) => tags.push(`이슈:${i}`));
  return tags;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function validateEntryIds(sentences: SummarySentence[], validIds: Set<string>): SummarySentence[] {
  return sentences
    .map((s) => ({ ...s, entry_ids: s.entry_ids.filter((id) => validIds.has(id)) }))
    .filter((s) => s.entry_ids.length > 0 || s.text.trim().length > 0);
}

// Helper: generate summary and save to DB
async function generateAndSaveSummary(
  db: D1Database,
  apiKey: string | undefined,
  userId: string,
  period: 'daily' | 'weekly' | 'monthly',
  periodStart: string,
  entries: { id: string; raw_text: string }[],
  systemPrompt: string,
  mockFn: (entries: { id: string; raw_text: string }[]) => SummarySentence[],
  aiContext: string | undefined,
  maxTextLength: number,
  options?: { extractTodos?: boolean },
): Promise<{ summary: unknown; sentences: SummarySentence[]; todos?: { text: string; due_hint: string }[] }> {
  let sentences: SummarySentence[];
  let extractedTodos: { text: string; due_hint: string }[] = [];

  if (!apiKey) {
    sentences = mockFn(entries);
    if (options?.extractTodos) {
      const allText = entries.map((e) => e.raw_text).join('\n');
      extractedTodos = mockTodoExtraction(allText);
    }
  } else {
    const formatted = entries.map((e) => `[ID: ${e.id}]\n${e.raw_text}`).join('\n\n---\n\n');

    if (formatted.length > maxTextLength) {
      throw new Error(`text exceeds maximum length of ${maxTextLength} characters`);
    }

    let fullPrompt = systemPrompt;
    if (aiContext) fullPrompt += aiContext;

    const content = await callOpenAI(apiKey, [
      { role: 'system', content: fullPrompt },
      { role: 'user', content: formatted },
    ], { temperature: 0.5 });

    if (content) {
      const parsed = JSON.parse(content);
      const validIds = new Set(entries.map((e) => e.id));
      sentences = validateEntryIds(parsed.sentences, validIds);
      if (options?.extractTodos && Array.isArray(parsed.todos)) {
        extractedTodos = parsed.todos.slice(0, 5);
      }
    } else {
      sentences = mockFn(entries);
    }
  }

  const entryLinks = Array.from(new Set(sentences.flatMap((s) => s.entry_ids)));
  const summaryText = sentences.map((s) => s.text).join('\n');

  // Delete existing summary for this period
  await db
    .prepare('DELETE FROM summaries WHERE user_id = ? AND period = ? AND period_start = ?')
    .bind(userId, period, periodStart)
    .run();

  const id = generateId();
  await db
    .prepare(
      'INSERT INTO summaries (id, user_id, period, period_start, text, entry_links, sentences_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id, userId, period, periodStart, summaryText,
      JSON.stringify(entryLinks), JSON.stringify(sentences), now(),
    )
    .run();

  // Insert extracted todos (daily summary only)
  if (options?.extractTodos && extractedTodos.length > 0) {
    // Delete existing AI-extracted todos for these entries
    const entryIdList = entries.map((e) => e.id);
    for (const eid of entryIdList) {
      await db.prepare('DELETE FROM todos WHERE source_entry_id = ? AND user_id = ?').bind(eid, userId).run();
    }

    for (const t of extractedTodos) {
      const todoId = generateId();
      const sourceEntryId = entryIdList[0] || null;
      await db
        .prepare('INSERT INTO todos (id, user_id, text, source_entry_id, status, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(todoId, userId, t.text, sourceEntryId, 'pending', null, now())
        .run();
    }
  }

  const summary = await db.prepare('SELECT * FROM summaries WHERE id = ?').bind(id).first();

  return {
    summary: summary ? parseJsonFields(summary as Record<string, unknown>, ['entry_links', 'sentences_data']) : null,
    sentences,
    ...(options?.extractTodos ? { todos: extractedTodos } : {}),
  };
}

// ─── ROUTES ───

// POST /ai/chat (no auth required — stateless)
ai.post('/chat', async (c) => {
  const { messages, time_of_day, pending_todos, language, ai_context } = await c.req.json();

  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: 'messages array is required' }, 400);
  }
  if (messages.length > MAX_MESSAGES) {
    return c.json({ error: `messages exceeds maximum of ${MAX_MESSAGES}` }, 400);
  }

  const timeOfDay = time_of_day || (new Date().getHours() < 14 ? 'morning' : 'evening');
  const todos = Array.isArray(pending_todos) ? pending_todos.slice(0, 10) : [];
  const lang = language || 'en';

  const langLabel = lang === 'ko' ? 'Korean' : 'English';
  const todoSection =
    todos.length > 0
      ? `\n\nUser's pending to-dos:\n${todos.map((t: { text: string; due_date?: string }) => `- ${t.text}${t.due_date ? ` (due: ${t.due_date})` : ''}`).join('\n')}`
      : '';

  let systemPrompt = `You are Miriel, a friendly personal journal assistant. You help users reflect on their day through a warm, brief conversation.

## Your Role
- You proactively guide the user through a brief daily reflection.
- You reference their pending to-dos and context to suggest what to reflect on — the user shouldn't have to figure out where to start.
- Your goal is NOT diary-writing. It's helping the user see what they accomplished, what they learned, and what to carry forward.

## Conversation Structure
Guide the conversation through 3 phases:
1. **Plan** (1-2 exchanges): Help the user decide what to reflect on. If they have pending to-dos, reference 1-2 relevant ones and ask how they went. If no to-dos, ask what they spent most of their time on today.
2. **Detail** (2-3 exchanges): Dig into specifics — what went well, challenges, key moments.
3. **Reflection** (1-2 exchanges): Help them find meaning — lessons learned, feelings, what to carry forward.

## Rules
- Ask ONE question at a time. Keep responses to 1-3 sentences.
- Be a supportive friend, not a manager. Never feel like surveillance.
- Proactively reference their pending to-dos when relevant — they show what the user intended to do. Use them to suggest what to reflect on, not just as side mentions.
- After 5-7 exchanges total, start wrapping up. Maximum ${MAX_EXCHANGES} exchanges.
- When ending, give brief encouragement.
- Respond in ${langLabel}.
- IMPORTANT: Always respond with valid JSON only.${todoSection}

## Output Format (JSON)
{
  "message": "Your conversational response",
  "is_complete": false,
  "phase": "plan" | "detail" | "reflection"
}

When ending the conversation (is_complete: true), add a session_summary field:
{
  "message": "Closing encouragement message",
  "is_complete": true,
  "phase": "reflection",
  "session_summary": "Brief 1-2 sentence summary of what the user shared"
}`;

  const sanitized = sanitizeAiContext(ai_context);
  if (sanitized) systemPrompt += sanitized;

  const apiKey = c.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (messages.length >= MAX_EXCHANGES * 2) {
      return c.json({
        message: lang === 'ko' ? '오늘 이야기 고마워요! 기록을 저장해볼까요?' : "Thanks for sharing today! Ready to save your entry?",
        is_complete: true,
        phase: 'reflection',
        session_summary: lang === 'ko' ? '오늘의 대화를 기록했습니다.' : "Today's conversation has been recorded.",
      });
    }
    return c.json({
      message: lang === 'ko' ? '더 자세히 말씀해주세요!' : 'Tell me more!',
      is_complete: false,
      phase: messages.length < 4 ? 'plan' : messages.length < 10 ? 'detail' : 'reflection',
    });
  }

  const aiMessages: { role: string; content: string }[] = [{ role: 'system', content: systemPrompt }];

  if (messages.length === 0) {
    aiMessages.push({
      role: 'user',
      content: lang === 'ko'
        ? '안녕! 오늘 하루 회고 시작해줘.'
        : "Hi! Help me review my day.",
    });
  } else {
    for (const m of messages) {
      aiMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }
  }

  const content = await callOpenAI(apiKey, aiMessages, { temperature: 0.7 });

  if (!content) {
    return c.json({
      message: lang === 'ko' ? '더 자세히 말씀해주세요!' : 'Tell me more!',
      is_complete: false,
      phase: messages.length < 4 ? 'plan' : messages.length < 10 ? 'detail' : 'reflection',
    });
  }

  const parsed = JSON.parse(content);
  return c.json({
    message: parsed.message || '',
    is_complete: !!parsed.is_complete,
    phase: parsed.phase || 'plan',
    ...(parsed.session_summary ? { session_summary: parsed.session_summary } : {}),
  });
});

// POST /ai/tagging [Protected]
ai.post('/tagging', authMiddleware, async (c) => {
  const { text, ai_context } = await c.req.json();
  if (!text) return c.json({ error: 'text is required' }, 400);
  if (text.length > 20000) return c.json({ error: 'text exceeds maximum length' }, 400);

  const apiKey = c.env.OPENAI_API_KEY;
  if (!apiKey) {
    return c.json({ tags: mockTagging(text) });
  }

  let systemMessage = TAGGING_PROMPT;
  const sanitized = sanitizeAiContext(ai_context);
  if (sanitized) systemMessage += sanitized;

  const content = await callOpenAI(apiKey, [
    { role: 'system', content: systemMessage },
    { role: 'user', content: text },
  ]);

  if (!content) {
    return c.json({ tags: mockTagging(text) });
  }

  const parsed = JSON.parse(content);
  return c.json({ tags: formatTags(parsed) });
});

// POST /ai/extract-todos [Protected]
ai.post('/extract-todos', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { text, entry_id, ai_context } = await c.req.json();
  if (!text) return c.json({ error: 'text is required' }, 400);
  if (text.length > 20000) return c.json({ error: 'text exceeds maximum length' }, 400);

  let systemMessage = TODO_PROMPT;
  const sanitized = sanitizeAiContext(ai_context);
  if (sanitized) systemMessage += sanitized;

  let todoItems: { text: string; due_hint: string }[];
  const apiKey = c.env.OPENAI_API_KEY;

  if (!apiKey) {
    todoItems = mockTodoExtraction(text);
  } else {
    const content = await callOpenAI(apiKey, [
      { role: 'system', content: systemMessage },
      { role: 'user', content: text },
    ]);
    todoItems = content ? JSON.parse(content).todos : mockTodoExtraction(text);
  }

  if (todoItems.length === 0) {
    return c.json({ todos: [] });
  }

  // Insert todos into D1
  const insertedTodos = [];
  for (const t of todoItems) {
    const id = generateId();
    const timestamp = now();
    await c.env.DB
      .prepare('INSERT INTO todos (id, user_id, text, source_entry_id, status, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, userId, t.text, entry_id || null, 'pending', null, timestamp)
      .run();
    insertedTodos.push({ id, user_id: userId, text: t.text, source_entry_id: entry_id || null, status: 'pending', due_date: null, created_at: timestamp });
  }

  return c.json({ todos: insertedTodos }, 201);
});

// POST /ai/generate-summary [Protected]
ai.post('/generate-summary', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { date, ai_context } = await c.req.json();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { results: entries } = await c.env.DB
    .prepare('SELECT id, raw_text, summary_gen_count FROM entries WHERE user_id = ? AND date = ? ORDER BY created_at ASC')
    .bind(userId, targetDate)
    .all<{ id: string; raw_text: string; summary_gen_count: number }>();

  if (!entries || entries.length === 0) {
    return c.json({ error: 'no entries for this date' }, 400);
  }

  // Daily limit: max 3 summary generations per entry per day
  const totalGenCount = entries.reduce((sum, e) => sum + (e.summary_gen_count || 0), 0);
  const maxCount = entries.length * 3;
  if (totalGenCount >= maxCount) {
    return c.json({
      error: 'daily_summary_limit_reached',
      message: 'Summary generation limit reached (3 per day)',
      gen_count: totalGenCount,
      max_count: maxCount,
    }, 429);
  }

  const sanitized = sanitizeAiContext(ai_context);
  const result = await generateAndSaveSummary(
    c.env.DB, c.env.OPENAI_API_KEY, userId, 'daily', targetDate,
    entries, SUMMARY_PROMPT, mockSummary, sanitized, 20000,
    { extractTodos: true },
  );

  // Increment summary_gen_count for all entries on this date
  for (const entry of entries) {
    await c.env.DB
      .prepare('UPDATE entries SET summary_gen_count = summary_gen_count + 1 WHERE id = ?')
      .bind(entry.id)
      .run();
  }

  return c.json({ ...result, gen_count: totalGenCount + 1, max_count: maxCount }, 201);
});

// POST /ai/generate-weekly [Protected]
ai.post('/generate-weekly', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { week_start, ai_context } = await c.req.json();

  const start = week_start ? new Date(week_start + 'T00:00:00') : getMonday(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const { results: entries } = await c.env.DB
    .prepare('SELECT id, raw_text FROM entries WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, created_at ASC')
    .bind(userId, startStr, endStr)
    .all<{ id: string; raw_text: string }>();

  if (!entries || entries.length === 0) {
    return c.json({ error: 'no entries for this week' }, 400);
  }

  const sanitized = sanitizeAiContext(ai_context);
  const result = await generateAndSaveSummary(
    c.env.DB, c.env.OPENAI_API_KEY, userId, 'weekly', startStr,
    entries, WEEKLY_SUMMARY_PROMPT, mockWeeklySummary, sanitized, 20000,
  );

  return c.json(result, 201);
});

// POST /ai/generate-monthly [Protected]
ai.post('/generate-monthly', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { month_start, month_end, ai_context } = await c.req.json();

  if (!month_start || !month_end) {
    return c.json({ error: 'month_start and month_end are required' }, 400);
  }

  const { results: entries } = await c.env.DB
    .prepare('SELECT id, raw_text FROM entries WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, created_at ASC')
    .bind(userId, month_start, month_end)
    .all<{ id: string; raw_text: string }>();

  if (!entries || entries.length === 0) {
    return c.json({ error: 'no entries for this period' }, 400);
  }

  const sanitized = sanitizeAiContext(ai_context);
  const result = await generateAndSaveSummary(
    c.env.DB, c.env.OPENAI_API_KEY, userId, 'monthly', month_start,
    entries, MONTHLY_SUMMARY_PROMPT, mockMonthlySummary, sanitized, 40000,
  );

  return c.json(result, 201);
});

export { ai as aiRoutes };
