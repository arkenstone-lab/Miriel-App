import { apiFetch } from '@/lib/api'
import { AppError } from '@/lib/errors'
import type { UserAiPreferences, UpsertAiPreferencesInput } from './types'

export async function fetchAiPreferences(): Promise<UserAiPreferences | null> {
  try {
    return await apiFetch<UserAiPreferences | null>('/ai-preferences')
  } catch (error) {
    throw new AppError('AIPREF_001', error)
  }
}

export async function upsertAiPreferences(
  input: UpsertAiPreferencesInput
): Promise<UserAiPreferences> {
  try {
    return await apiFetch<UserAiPreferences>('/ai-preferences', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  } catch (error) {
    throw new AppError('AIPREF_002', error)
  }
}
