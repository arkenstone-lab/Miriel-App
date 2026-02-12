import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI } from '../_shared/ai.ts'
import { getCorsHeaders, jsonResponse, appendAiContext } from '../_shared/cors.ts'

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
Output: {"todos":[{"text":"보고서 초안 완성하기","due_hint":"내일"},{"text":"김대리에게 리뷰 요청하기","due_hint":""}]}`

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401)
    }

    const { text, entry_id, ai_context } = await req.json()
    if (!text) {
      return jsonResponse({ error: 'text is required' }, corsHeaders, 400)
    }

    if (text.length > 20000) {
      return jsonResponse({ error: 'text exceeds maximum length of 20000 characters' }, corsHeaders, 400)
    }

    const systemMessage = appendAiContext(TODO_PROMPT, ai_context)

    let result: TodoExtractionResult
    const content = await callAI(systemMessage, text)
    result = content ? JSON.parse(content) : mockTodoExtraction(text)

    if (result.todos.length === 0) {
      return jsonResponse({ todos: [] }, corsHeaders)
    }

    const todosToInsert = result.todos.map((t) => ({
      user_id: user.id,
      text: t.text,
      source_entry_id: entry_id || null,
      status: 'pending' as const,
      due_date: null,
    }))

    const { data, error } = await supabase
      .from('todos')
      .insert(todosToInsert)
      .select()

    if (error) {
      return jsonResponse({ error: error.message }, corsHeaders, 500)
    }

    return jsonResponse({ todos: data }, corsHeaders, 201)
  } catch (error) {
    return jsonResponse({ error: error.message }, corsHeaders, 500)
  }
})
