import { supabase } from '@/lib/supabase'
import type { Summary, SummarySentence } from './types'

export async function fetchSummaries(
  period: 'daily' | 'weekly' = 'daily',
  date?: string
): Promise<Summary[]> {
  let query = supabase
    .from('summaries')
    .select('*')
    .eq('period', period)
    .order('period_start', { ascending: false })

  if (date) {
    query = query.eq('period_start', date)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data as Summary[]
}

export async function generateSummary(
  date?: string
): Promise<{ summary: Summary; sentences: SummarySentence[] }> {
  const { data, error } = await supabase.functions.invoke('generate-summary', {
    body: { date },
  })

  if (error) throw new Error(error.message)
  return data as { summary: Summary; sentences: SummarySentence[] }
}

export async function generateWeeklySummary(
  weekStart?: string
): Promise<{ summary: Summary; sentences: SummarySentence[] }> {
  const { data, error } = await supabase.functions.invoke('generate-weekly', {
    body: { week_start: weekStart },
  })

  if (error) throw new Error(error.message)
  return data as { summary: Summary; sentences: SummarySentence[] }
}
