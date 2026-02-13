import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI } from '../_shared/ai.ts'
import { getCorsHeaders, jsonResponse, appendAiContext } from '../_shared/cors.ts'

// Prompt loaded from Supabase Edge Function secrets
const MONTHLY_SUMMARY_PROMPT = Deno.env.get('MONTHLY_SUMMARY_PROMPT') ?? ''

interface SummarySentence {
  text: string
  entry_ids: string[]
}

function mockMonthlySummary(entries: { id: string; raw_text: string }[]): { sentences: SummarySentence[] } {
  if (entries.length === 0) return { sentences: [] }
  const sentences = entries.slice(0, 7).map((entry) => ({
    text: entry.raw_text.length > 60 ? entry.raw_text.slice(0, 60) + '...' : entry.raw_text,
    entry_ids: [entry.id],
  }))
  return { sentences }
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

    const { month_start, month_end, ai_context } = await req.json()

    if (!month_start || !month_end) {
      return jsonResponse({ error: 'month_start and month_end are required' }, corsHeaders, 400)
    }

    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('id, raw_text')
      .gte('date', month_start)
      .lte('date', month_end)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (fetchError) {
      return jsonResponse({ error: fetchError.message }, corsHeaders, 500)
    }

    if (!entries || entries.length === 0) {
      return jsonResponse({ error: '해당 기간에 기록이 없습니다.' }, corsHeaders, 400)
    }

    let result: { sentences: SummarySentence[] }

    const formatted = entries
      .map((e: { id: string; raw_text: string }) => `[ID: ${e.id}]\n${e.raw_text}`)
      .join('\n\n---\n\n')

    if (formatted.length > 40000) {
      return jsonResponse({ error: 'text exceeds maximum length of 40000 characters' }, corsHeaders, 400)
    }

    const systemMessage = appendAiContext(MONTHLY_SUMMARY_PROMPT, ai_context)
    const content = await callAI(systemMessage, formatted, { temperature: 0.5 })

    if (content) {
      result = JSON.parse(content)
      const validIds = new Set(entries.map(e => e.id))
      result.sentences = result.sentences.map(s => ({
        ...s,
        entry_ids: s.entry_ids.filter(id => validIds.has(id))
      })).filter(s => s.entry_ids.length > 0 || s.text.trim().length > 0)
    } else {
      result = mockMonthlySummary(entries)
    }

    const entryLinks = Array.from(
      new Set(result.sentences.flatMap((s) => s.entry_ids))
    )

    const summaryText = result.sentences.map((s) => s.text).join('\n')

    // Delete existing monthly summary for this period
    await supabase
      .from('summaries')
      .delete()
      .eq('period', 'monthly')
      .eq('period_start', month_start)

    const { data: summary, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        period: 'monthly',
        period_start: month_start,
        text: summaryText,
        entry_links: entryLinks,
        sentences_data: result.sentences,
      })
      .select()
      .single()

    if (insertError) {
      return jsonResponse({ error: insertError.message }, corsHeaders, 500)
    }

    return jsonResponse({ summary, sentences: result.sentences }, corsHeaders, 201)
  } catch (error) {
    return jsonResponse({ error: error.message }, corsHeaders, 500)
  }
})
