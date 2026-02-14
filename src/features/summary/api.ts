import { apiFetch } from '@/lib/api'
import { AppError } from '@/lib/errors'
import type { Summary, SummarySentence } from './types'

export async function fetchSummaries(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  date?: string
): Promise<Summary[]> {
  try {
    let query = `?period=${period}`
    if (date) query += `&date=${date}`
    return await apiFetch<Summary[]>(`/summaries${query}`)
  } catch (error) {
    throw new AppError('SUMMARY_001', error)
  }
}

export interface GenerateSummaryResult {
  summary: Summary
  sentences: SummarySentence[]
  todos?: { text: string; due_hint: string }[]
  gen_count?: number
  max_count?: number
}

export async function generateSummary(
  date?: string,
  aiContext?: string
): Promise<GenerateSummaryResult> {
  try {
    const body: Record<string, unknown> = { date }
    if (aiContext) body.ai_context = aiContext

    return await apiFetch<GenerateSummaryResult>('/ai/generate-summary', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    // Re-throw 429 errors with status/body preserved for limit detection
    if ((error as any)?.status === 429) throw error
    throw new AppError('SUMMARY_002', error)
  }
}

export async function generateWeeklySummary(
  weekStart?: string,
  aiContext?: string
): Promise<{ summary: Summary; sentences: SummarySentence[] }> {
  try {
    const body: Record<string, unknown> = { week_start: weekStart }
    if (aiContext) body.ai_context = aiContext

    return await apiFetch<{ summary: Summary; sentences: SummarySentence[] }>('/ai/generate-weekly', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new AppError('SUMMARY_003', error)
  }
}

export async function generateMonthlySummary(
  monthStart: string,
  monthEnd: string,
  aiContext?: string
): Promise<{ summary: Summary; sentences: SummarySentence[] }> {
  try {
    const body: Record<string, unknown> = { month_start: monthStart, month_end: monthEnd }
    if (aiContext) body.ai_context = aiContext

    return await apiFetch<{ summary: Summary; sentences: SummarySentence[] }>('/ai/generate-monthly', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new AppError('SUMMARY_004', error)
  }
}
