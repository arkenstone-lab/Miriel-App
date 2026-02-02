import { supabase } from './supabase'
import {
  generateDemoEntries,
  generateDemoSummaries,
  generateDemoTodos,
} from './demoData'

export async function clearDemoData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete in dependency order: todos → summaries → entries
  await supabase.from('todos').delete().eq('user_id', user.id)
  await supabase.from('summaries').delete().eq('user_id', user.id)
  await supabase.from('entries').delete().eq('user_id', user.id)
}

export async function seedDemoData(): Promise<{
  entries: number
  summaries: number
  todos: number
}> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Clear existing data (idempotent)
  await clearDemoData()

  // 2. Insert entries and get back IDs
  const demoEntries = generateDemoEntries(user.id)
  const { data: insertedEntries, error: entryErr } = await supabase
    .from('entries')
    .insert(demoEntries)
    .select('id')

  if (entryErr || !insertedEntries) {
    throw new Error(`Failed to insert entries: ${entryErr?.message}`)
  }

  const entryIds = insertedEntries.map((e) => e.id)

  // 3. Generate and insert summaries with real entry IDs
  const demoSummaries = generateDemoSummaries(user.id, entryIds)
  const { data: insertedSummaries, error: summaryErr } = await supabase
    .from('summaries')
    .insert(demoSummaries)
    .select('id')

  if (summaryErr) {
    throw new Error(`Failed to insert summaries: ${summaryErr.message}`)
  }

  // 4. Generate and insert todos with real entry IDs
  const demoTodos = generateDemoTodos(user.id, entryIds)
  const { data: insertedTodos, error: todoErr } = await supabase
    .from('todos')
    .insert(demoTodos)
    .select('id')

  if (todoErr) {
    throw new Error(`Failed to insert todos: ${todoErr.message}`)
  }

  return {
    entries: entryIds.length,
    summaries: insertedSummaries?.length ?? 0,
    todos: insertedTodos?.length ?? 0,
  }
}
