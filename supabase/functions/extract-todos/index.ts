import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { text, entry_id, ai_context } = await req.json()
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract todos (AI or mock)
    let result: TodoExtractionResult
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    const systemMessage = ai_context
      ? `${TODO_PROMPT}\n\n--- 사용자 정보 ---\n${ai_context}`
      : TODO_PROMPT

    if (!apiKey) {
      result = mockTodoExtraction(text)
    } else {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: text },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        })

        const aiResult = await response.json()
        const content = aiResult.choices?.[0]?.message?.content
        result = content ? JSON.parse(content) : mockTodoExtraction(text)
      } catch {
        result = mockTodoExtraction(text)
      }
    }

    if (result.todos.length === 0) {
      return new Response(JSON.stringify({ todos: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert todos into DB
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ todos: data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
