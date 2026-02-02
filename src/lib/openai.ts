import OpenAI from 'openai'

const TAGGING_PROMPT = `다음 기록에서 프로젝트명, 사람 이름, 주요 이슈를 추출해주세요.
JSON 형식으로만 응답하세요: { "projects": [], "people": [], "issues": [] }
각 항목은 문자열 배열입니다. 해당 항목이 없으면 빈 배열로 남겨주세요.`

interface TaggingResult {
  projects: string[]
  people: string[]
  issues: string[]
}

function formatTags(result: TaggingResult): string[] {
  const tags: string[] = []
  result.projects.forEach((p) => tags.push(`프로젝트:${p}`))
  result.people.forEach((p) => tags.push(`사람:${p}`))
  result.issues.forEach((i) => tags.push(`이슈:${i}`))
  return tags
}

function mockTagging(text: string): string[] {
  const tags: string[] = []

  // Simple keyword extraction for demo
  const projectPatterns = /프로젝트\s*[:\s]?\s*(\S+)/g
  const personPatterns = /([가-힣]{2,4})\s*(님|씨|대리|과장|팀장|부장|사원|매니저)/g
  const issuePatterns = /(버그|이슈|오류|에러|장애|문제|지연)/g

  let match
  while ((match = projectPatterns.exec(text)) !== null) {
    tags.push(`프로젝트:${match[1]}`)
  }
  while ((match = personPatterns.exec(text)) !== null) {
    tags.push(`사람:${match[1]}`)
  }
  while ((match = issuePatterns.exec(text)) !== null) {
    if (!tags.includes(`이슈:${match[1]}`)) {
      tags.push(`이슈:${match[1]}`)
    }
  }

  return tags
}

// --- Daily Summary ---

const SUMMARY_PROMPT = `다음은 오늘 하루의 기록들입니다. 각 기록에는 ID가 붙어 있습니다.
3문장 이내로 하루를 요약하고, 각 문장이 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.

JSON 형식으로만 응답하세요:
{
  "sentences": [
    { "text": "요약 문장", "entry_ids": ["id1"] }
  ]
}
`

export interface SummarySentence {
  text: string
  entry_ids: string[]
}

interface SummaryResult {
  sentences: SummarySentence[]
}

function mockSummary(entries: { id: string; raw_text: string }[]): SummaryResult {
  if (entries.length === 0) {
    return { sentences: [] }
  }

  const sentences: SummarySentence[] = entries.slice(0, 3).map((entry) => ({
    text: entry.raw_text.length > 80
      ? entry.raw_text.slice(0, 80) + '...'
      : entry.raw_text,
    entry_ids: [entry.id],
  }))

  return { sentences }
}

export async function generateDailySummary(
  entries: { id: string; raw_text: string }[]
): Promise<SummaryResult> {
  if (entries.length === 0) return { sentences: [] }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return mockSummary(entries)

  const formatted = entries
    .map((e) => `[ID: ${e.id}]\n${e.raw_text}`)
    .join('\n\n---\n\n')

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        { role: 'user', content: formatted },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return mockSummary(entries)

    return JSON.parse(content) as SummaryResult
  } catch {
    return mockSummary(entries)
  }
}

// --- Weekly Summary ---

const WEEKLY_SUMMARY_PROMPT = `다음은 한 주간의 기록들입니다. 각 기록에는 ID가 붙어 있습니다.
핵심 3~5개 포인트로 한 주를 회고해주세요.
각 포인트가 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.

JSON 형식으로만 응답하세요:
{
  "sentences": [
    { "text": "회고 포인트", "entry_ids": ["id1", "id2"] }
  ]
}
`

function mockWeeklySummary(entries: { id: string; raw_text: string }[]): SummaryResult {
  if (entries.length === 0) return { sentences: [] }

  const sentences: SummarySentence[] = entries.slice(0, 5).map((entry) => ({
    text: entry.raw_text.length > 60
      ? entry.raw_text.slice(0, 60) + '...'
      : entry.raw_text,
    entry_ids: [entry.id],
  }))

  return { sentences }
}

export async function generateWeeklySummary(
  entries: { id: string; raw_text: string }[]
): Promise<SummaryResult> {
  if (entries.length === 0) return { sentences: [] }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return mockWeeklySummary(entries)

  const formatted = entries
    .map((e) => `[ID: ${e.id}]\n${e.raw_text}`)
    .join('\n\n---\n\n')

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: WEEKLY_SUMMARY_PROMPT },
        { role: 'user', content: formatted },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return mockWeeklySummary(entries)

    return JSON.parse(content) as SummaryResult
  } catch {
    return mockWeeklySummary(entries)
  }
}

// --- Todo Extraction ---

const TODO_PROMPT = `다음 기록에서 해야 할 일(action item)을 추출해주세요.
- "~해야 한다", "~할 예정", "~하기로 했다" 등의 표현에서 추출
- 이미 완료된 일은 제외
- JSON 형식으로만 응답하세요: { "todos": [{ "text": "할 일 내용", "due_hint": "마감 힌트 (있으면 빈 문자열)" }] }`

interface TodoExtractionResult {
  todos: { text: string; due_hint: string }[]
}

function mockTodoExtraction(text: string): TodoExtractionResult {
  const todos: { text: string; due_hint: string }[] = []
  const patterns = [
    /(.{2,30}(?:해야|할 예정|하기로|할 것|필요))/g,
    /(?:내일|다음주|이번 주).{2,30}/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const todoText = match[0].trim()
      if (todoText.length >= 4 && !todos.some((t) => t.text === todoText)) {
        todos.push({ text: todoText, due_hint: '' })
      }
    }
  }

  return { todos: todos.slice(0, 5) }
}

export async function extractTodos(
  text: string
): Promise<TodoExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return mockTodoExtraction(text)

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TODO_PROMPT },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return mockTodoExtraction(text)

    return JSON.parse(content) as TodoExtractionResult
  } catch {
    return mockTodoExtraction(text)
  }
}

// --- Tagging ---

export async function extractTags(text: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return mockTagging(text)
  }

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TAGGING_PROMPT },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return mockTagging(text)

    const result: TaggingResult = JSON.parse(content)
    return formatTags(result)
  } catch {
    return mockTagging(text)
  }
}
