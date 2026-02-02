import type { Summary } from './types'
import type { SummarySentence } from '@/lib/openai'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchSummaries(
  period: 'daily' | 'weekly' = 'daily',
  date?: string
): Promise<Summary[]> {
  const params = new URLSearchParams({ period })
  if (date) params.set('date', date)
  const res = await fetch(`/api/summaries?${params}`)
  return handleResponse<Summary[]>(res)
}

export async function generateSummary(
  date?: string
): Promise<{ summary: Summary; sentences: SummarySentence[] }> {
  const res = await fetch('/api/summaries/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  })
  return handleResponse<{ summary: Summary; sentences: SummarySentence[] }>(res)
}

export async function generateWeeklySummary(
  weekStart?: string
): Promise<{ summary: Summary; sentences: SummarySentence[] }> {
  const res = await fetch('/api/summaries/generate-weekly', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ week_start: weekStart }),
  })
  return handleResponse<{ summary: Summary; sentences: SummarySentence[] }>(res)
}
