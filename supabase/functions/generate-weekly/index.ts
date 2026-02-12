import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI } from '../_shared/ai.ts'
import { getCorsHeaders, jsonResponse, appendAiContext } from '../_shared/cors.ts'

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
Output: {"sentences":[{"text":"Aurora 프로젝트가 본격적으로 진행되며 주요 기능 3개가 완성되었다.","entry_ids":["id-1","id-3"]},{"text":"김대리와의 협업이 효율적으로 이루어져 예상보다 빠르게 마감했다.","entry_ids":["id-2","id-5"]}]}`

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

    const { week_start, ai_context } = await req.json()

    const start = week_start
      ? new Date(week_start + 'T00:00:00')
      : getMonday(new Date())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    const startStr = formatDate(start)
    const endStr = formatDate(end)

    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('id, raw_text')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (fetchError) {
      return jsonResponse({ error: fetchError.message }, corsHeaders, 500)
    }

    if (!entries || entries.length === 0) {
      return jsonResponse({ error: '해당 주간에 기록이 없습니다.' }, corsHeaders, 400)
    }

    let result: { sentences: SummarySentence[] }

    const formatted = entries
      .map((e: { id: string; raw_text: string }) => `[ID: ${e.id}]\n${e.raw_text}`)
      .join('\n\n---\n\n')

    if (formatted.length > 20000) {
      return jsonResponse({ error: 'text exceeds maximum length of 20000 characters' }, corsHeaders, 400)
    }

    const systemMessage = appendAiContext(WEEKLY_SUMMARY_PROMPT, ai_context)
    const content = await callAI(systemMessage, formatted, { temperature: 0.5 })

    if (content) {
      result = JSON.parse(content)
      const validIds = new Set(entries.map(e => e.id))
      result.sentences = result.sentences.map(s => ({
        ...s,
        entry_ids: s.entry_ids.filter(id => validIds.has(id))
      })).filter(s => s.entry_ids.length > 0 || s.text.trim().length > 0)
    } else {
      result = mockWeeklySummary(entries)
    }

    const entryLinks = Array.from(
      new Set(result.sentences.flatMap((s) => s.entry_ids))
    )

    const summaryText = result.sentences.map((s) => s.text).join('\n')

    await supabase
      .from('summaries')
      .delete()
      .eq('period', 'weekly')
      .eq('period_start', startStr)

    const { data: summary, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        period: 'weekly',
        period_start: startStr,
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
