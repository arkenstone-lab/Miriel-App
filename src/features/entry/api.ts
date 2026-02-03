import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { Entry, CreateEntryInput, UpdateEntryInput } from './types'

export async function fetchEntries(date?: string): Promise<Entry[]> {
  let query = supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (date) {
    query = query.eq('date', date)
  }

  const { data, error } = await query

  if (error) throw new AppError('ENTRY_001', error)
  return data as Entry[]
}

export async function fetchEntry(id: string): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new AppError('ENTRY_002', error)
  return data as Entry
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AppError('ENTRY_003')

  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      raw_text: input.raw_text,
      date: input.date || new Date().toISOString().split('T')[0],
      tags: input.tags || [],
    })
    .select()
    .single()

  if (error) throw new AppError('ENTRY_004', error)
  return data as Entry
}

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<Entry> {
  const updates: Record<string, unknown> = {}
  if (input.raw_text !== undefined) updates.raw_text = input.raw_text
  if (input.tags !== undefined) updates.tags = input.tags
  if (input.date !== undefined) updates.date = input.date

  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new AppError('ENTRY_005', error)
  return data as Entry
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) throw new AppError('ENTRY_006', error)
}

export async function requestTagging(text: string): Promise<{ tags: string[] }> {
  const { data, error } = await supabase.functions.invoke('tagging', {
    body: { text },
  })

  if (error) throw new AppError('ENTRY_007', error)
  return data as { tags: string[] }
}
