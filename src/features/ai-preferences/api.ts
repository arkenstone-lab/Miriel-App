import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { UserAiPreferences, UpsertAiPreferencesInput } from './types'

export async function fetchAiPreferences(): Promise<UserAiPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_ai_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new AppError('AIPREF_001', error)
  return data as UserAiPreferences | null
}

export async function upsertAiPreferences(
  input: UpsertAiPreferencesInput
): Promise<UserAiPreferences> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AppError('ENTRY_003')

  const { data, error } = await supabase
    .from('user_ai_preferences')
    .upsert(
      { user_id: user.id, ...input },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw new AppError('AIPREF_002', error)
  return data as UserAiPreferences
}
