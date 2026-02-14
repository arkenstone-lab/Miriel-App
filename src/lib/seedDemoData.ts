import { apiFetch } from './api'

export async function clearDemoData(): Promise<void> {
  // The seed endpoint clears existing data first
}

export async function seedDemoData(): Promise<{
  entries: number
  summaries: number
  todos: number
}> {
  return await apiFetch<{
    entries: number
    summaries: number
    todos: number
  }>('/seed-demo-data', { method: 'POST' })
}
