import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAiPreferences, upsertAiPreferences } from './api'
import type { UpsertAiPreferencesInput } from './types'

export function useAiPreferences() {
  return useQuery({
    queryKey: ['ai-preferences'],
    queryFn: fetchAiPreferences,
  })
}

export function useUpsertAiPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpsertAiPreferencesInput) => upsertAiPreferences(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-preferences'] })
    },
  })
}
