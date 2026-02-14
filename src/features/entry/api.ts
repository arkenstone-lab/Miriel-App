import { apiFetch } from '@/lib/api'
import { AppError } from '@/lib/errors'
import type { Entry, CreateEntryInput, UpdateEntryInput } from './types'

export async function fetchEntries(date?: string): Promise<Entry[]> {
  try {
    const query = date ? `?date=${date}` : ''
    return await apiFetch<Entry[]>(`/entries${query}`)
  } catch (error) {
    throw new AppError('ENTRY_001', error)
  }
}

export async function fetchEntry(id: string): Promise<Entry> {
  try {
    return await apiFetch<Entry>(`/entries/${id}`)
  } catch (error) {
    throw new AppError('ENTRY_002', error)
  }
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  if (input.raw_text.length > 20000) throw new AppError('ENTRY_008')

  try {
    return await apiFetch<Entry>('/entries', {
      method: 'POST',
      body: JSON.stringify({
        raw_text: input.raw_text,
        date: input.date || new Date().toISOString().split('T')[0],
        tags: input.tags || [],
      }),
    })
  } catch (error) {
    throw new AppError('ENTRY_004', error)
  }
}

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<Entry> {
  try {
    return await apiFetch<Entry>(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  } catch (error) {
    throw new AppError('ENTRY_005', error)
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    await apiFetch(`/entries/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new AppError('ENTRY_006', error)
  }
}

export async function requestTagging(text: string, aiContext?: string): Promise<{ tags: string[] }> {
  if (text.length > 20000) throw new AppError('ENTRY_008')

  try {
    const body: Record<string, unknown> = { text }
    if (aiContext) body.ai_context = aiContext

    return await apiFetch<{ tags: string[] }>('/ai/tagging', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new AppError('ENTRY_007', error)
  }
}
