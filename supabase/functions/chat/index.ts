import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAIMultiTurn, type ChatMessage } from '../_shared/ai.ts'
import { getCorsHeaders, jsonResponse, appendAiContext } from '../_shared/cors.ts'

const MAX_MESSAGES = 20
const MAX_EXCHANGES = 10

// Chat system prompt loaded from Supabase Edge Function secrets
// Dynamically builds prompt with time-of-day context, pending todos, and language preference
function buildSystemPrompt(
  timeOfDay: string,
  pendingTodos: { text: string; status: string; due_date?: string }[],
  language: string,
): string {
  const basePrompt = Deno.env.get('CHAT_SYSTEM_PROMPT') ?? ''
  const lang = language === 'ko' ? 'Korean' : 'English'
  const todoSection =
    pendingTodos.length > 0
      ? `\n\nUser's pending to-dos:\n${pendingTodos.map((t) => `- ${t.text}${t.due_date ? ` (due: ${t.due_date})` : ''}`).join('\n')}`
      : ''

  return basePrompt
    .replace('{{TIME_CONTEXT}}', timeOfDay === 'morning'
      ? 'Focus on what they want to accomplish today.'
      : 'Ask what they worked on or what happened today.')
    .replace('{{MAX_EXCHANGES}}', String(MAX_EXCHANGES))
    .replace('{{LANGUAGE}}', lang)
    + todoSection
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
