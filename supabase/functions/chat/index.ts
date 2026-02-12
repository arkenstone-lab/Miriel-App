import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAIMultiTurn, type ChatMessage } from '../_shared/ai.ts'
import { getCorsHeaders, jsonResponse, appendAiContext } from '../_shared/cors.ts'

const MAX_MESSAGES = 20
const MAX_EXCHANGES = 10

function buildSystemPrompt(
  timeOfDay: string,
  pendingTodos: { text: string; status: string; due_date?: string }[],
  language: string,
): string {
  const lang = language === 'ko' ? 'Korean' : 'English'
  const todoSection =
    pendingTodos.length > 0
      ? `\n\nUser's pending to-dos:\n${pendingTodos.map((t) => `- ${t.text}${t.due_date ? ` (due: ${t.due_date})` : ''}`).join('\n')}`
      : ''

  return `You are Miriel, a friendly personal journal assistant. You help users reflect on their day through a warm, brief conversation.

## Conversation Structure
Guide the conversation through 3 phases:
1. **Plan** (1-2 exchanges): Ask about goals/plans. ${timeOfDay === 'morning' ? 'Focus on what they want to accomplish today.' : 'Ask what they worked on or what happened today.'}
2. **Detail** (2-3 exchanges): Dig into specifics — what went well, challenges, key moments.
3. **Reflection** (1-2 exchanges): Help them find meaning — lessons learned, feelings, what to carry forward.

## Rules
- Ask ONE question at a time. Keep responses to 1-3 sentences.
- Be a supportive friend, not a manager. Never feel like surveillance.
- Naturally reference their pending to-dos when relevant (ask about progress, blockers) — don't force it.
- After 5-7 exchanges total, start wrapping up. Maximum ${MAX_EXCHANGES} exchanges.
- When ending, give brief encouragement.
- Respond in ${lang}.
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
}`
}

function getFallbackResponse(
  messageCount: number,
  language: string,
): { message: string; is_complete: boolean; phase: string; session_summary?: string } {
  if (messageCount >= MAX_EXCHANGES * 2) {
    return {
      message: language === 'ko' ? '오늘 이야기 고마워요! 기록을 저장해볼까요?' : "Thanks for sharing today! Ready to save your entry?",
      is_complete: true,
      phase: 'reflection',
      session_summary: language === 'ko' ? '오늘의 대화를 기록했습니다.' : "Today's conversation has been recorded.",
    }
  }
  return {
    message: language === 'ko' ? '더 자세히 말씀해주세요!' : 'Tell me more!',
    is_complete: false,
    phase: messageCount < 4 ? 'plan' : messageCount < 10 ? 'detail' : 'reflection',
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, time_of_day, pending_todos, language, ai_context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: 'messages array is required' }, corsHeaders, 400)
    }

    if (messages.length > MAX_MESSAGES) {
      return jsonResponse({ error: `messages exceeds maximum of ${MAX_MESSAGES}` }, corsHeaders, 400)
    }

    const timeOfDay = time_of_day || (new Date().getHours() < 14 ? 'morning' : 'evening')
    const todos = Array.isArray(pending_todos) ? pending_todos.slice(0, 10) : []
    const lang = language || 'en'

    let systemPrompt = buildSystemPrompt(timeOfDay, todos, lang)
    systemPrompt = appendAiContext(systemPrompt, ai_context)

    // Convert client messages to AI format
    let aiMessages: ChatMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      content: m.content,
    }))

    // Gemini requires at least one message — seed for initial call
    if (aiMessages.length === 0) {
      aiMessages = [{ role: 'user', content: timeOfDay === 'morning'
        ? (lang === 'ko' ? '좋은 아침이야! 오늘 기록을 시작할게.' : 'Good morning! I want to start my journal.')
        : (lang === 'ko' ? '안녕! 오늘 있었던 일을 기록할게.' : "Hi! I'd like to journal about my day.")
      }]
    }

    const content = await callAIMultiTurn(systemPrompt, aiMessages, {
      temperature: 0.7,
    })

    const parsed = JSON.parse(content)
    return jsonResponse({
      message: parsed.message || '',
      is_complete: !!parsed.is_complete,
      phase: parsed.phase || 'plan',
      ...(parsed.session_summary ? { session_summary: parsed.session_summary } : {}),
    }, corsHeaders)
  } catch (error) {
    console.error('[chat] Error:', error)
    const corsH = getCorsHeaders(req)
    return jsonResponse({ error: error.message || String(error) }, corsH, 500)
  }
})
