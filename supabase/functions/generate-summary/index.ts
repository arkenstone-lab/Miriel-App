import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUMMARY_PROMPT = `다음은 오늘 하루의 기록들입니다. 각 기록에는 ID가 붙어 있습니다.
3문장 이내로 하루를 요약하고, 각 문장이 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.

JSON 형식으로만 응답하세요:
{
  "sentences": [
    { "text": "요약 문장", "entry_ids": ["id1"] }
  ]
}`

interface SummarySentence {
  text: string
  entry_ids: string[]
}

function mockSummary(entries: { id: string; raw_text: string }[]): { sentences: SummarySentence[] } {
  if (entries.length === 0) return { sentences: [] }
  const sentences = entries.slice(0, 3).map((entry) => ({
    text: entry.raw_text.length > 80 ? entry.raw_text.slice(0, 80) + '...' : entry.raw_text,
    entry_ids: [entry.id],
  }))
  return { sentences }
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

    const { date } = await req.json()
    const targetDate = date || new Date().toISOString().split('T')[0]

    // Fetch entries for the date
    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('id, raw_text')
      .eq('date', targetDate)
      .order('created_at', { ascending: true })

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ error: '해당 날짜에 기록이 없습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate summary (AI or mock)
    let result: { sentences: SummarySentence[] }
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    if (!apiKey) {
      result = mockSummary(entries)
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
              { role: 'system', content: SUMMARY_PROMPT },
              { role: 'user', content: formatted },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5,
          }),
        })

        const aiResult = await response.json()
        const content = aiResult.choices?.[0]?.message?.content
        result = content ? JSON.parse(content) : mockSummary(entries)
      } catch {
        result = mockSummary(entries)
      }
    }

    // Collect all referenced entry IDs
    const entryLinks = Array.from(
      new Set(result.sentences.flatMap((s) => s.entry_ids))
    )

    const summaryText = result.sentences.map((s) => s.text).join('\n')

    // Delete existing summary for this date
    await supabase
      .from('summaries')
      .delete()
      .eq('period', 'daily')
      .eq('period_start', targetDate)

    // Insert new summary
    const { data: summary, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        period: 'daily',
        period_start: targetDate,
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
