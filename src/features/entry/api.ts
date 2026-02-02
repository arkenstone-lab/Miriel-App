import type { Entry, CreateEntryInput, UpdateEntryInput } from './types'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchEntries(date?: string): Promise<Entry[]> {
  const params = date ? `?date=${date}` : ''
  const res = await fetch(`/api/entries${params}`)
  return handleResponse<Entry[]>(res)
}

export async function fetchEntry(id: string): Promise<Entry> {
  const res = await fetch(`/api/entries/${id}`)
  return handleResponse<Entry>(res)
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  const res = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<Entry>(res)
}

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<Entry> {
  const res = await fetch(`/api/entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<Entry>(res)
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Delete failed')
  }
}

export async function requestTagging(text: string): Promise<{ tags: string[] }> {
  const res = await fetch('/api/tagging', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return handleResponse<{ tags: string[] }>(res)
}
