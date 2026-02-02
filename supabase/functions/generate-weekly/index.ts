import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEEKLY_SUMMARY_PROMPT = `다음은 한 주간의 기록들입니다. 각 기록에는 ID가 붙어 있습니다.
핵심 3~5개 포인트로 한 주를 회고해주세요.
각 포인트가 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.

JSON 형식으로만 응답하세요:
{
  "sentences": [
    { "text": "회고 포인트", "entry_ids": ["id1", "id2"] }
  ]
}`

interface SummarySentence {
  text: string
  entry_ids: string[]
}

function mockWeeklySummary(entries: { id: string; raw_text: string }[]): { sentences: SummarySentence[] } {
  if (entries.length === 0) return { sentences: [] }
  const sentences = entries.slice(0, 5).map((entry) => ({
    text: entry.raw_text.length > 60 ? entry.raw_text.slice(0, 60) + '...' : entry.raw_text,
    entry_ids: [entry.id],
  }))
  return { sentences }
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
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

    const { week_start } = await req.json()

    const start = week_start
      ? new Date(week_start + 'T00:00:00')
      : getMonday(new Date())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    const startStr = formatDate(start)
    const endStr = formatDate(end)

    // Fetch entries for the week
    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('id, raw_text')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ error: '해당 주간에 기록이 없습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate weekly summary (AI or mock)
    let result: { sentences: SummarySentence[] }
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    if (!apiKey) {
      result = mockWeeklySummary(entries)
    } else {
      const formatted = entries
        .map((e: { id: string; raw_text: string }) => `[ID: ${e.id}]\n${e.raw_text}`)
        .join('\n\n---\n\n')

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
              { role: 'system', content: WEEKLY_SUMMARY_PROMPT },
              { role: 'user', content: formatted },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5,
          }),
        })

        const aiResult = await response.json()
        const content = aiResult.choices?.[0]?.message?.content
        result = content ? JSON.parse(content) : mockWeeklySummary(entries)
      } catch {
        result = mockWeeklySummary(entries)
      }
    }

    const entryLinks = Array.from(
      new Set(result.sentences.flatMap((s) => s.entry_ids))
    )

    const summaryText = result.sentences.map((s) => s.text).join('\n')

    // Delete existing weekly summary for this week
    await supabase
      .from('summaries')
      .delete()
      .eq('period', 'weekly')
      .eq('period_start', startStr)

    // Insert new summary
    const { data: summary, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        period: 'weekly',
        period_start: startStr,
        text: summaryText,
        entry_links: entryLinks,
      })
      .select()
      .single()

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ summary, sentences: result.sentences }), {
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
