import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSummaries, generateSummary, generateWeeklySummary } from './api'

export function useSummaries(period: 'daily' | 'weekly' = 'daily', date?: string) {
  return useQuery({
    queryKey: ['summaries', period, date],
    queryFn: () => fetchSummaries(period, date),
  })
}

export function useGenerateSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (date?: string) => generateSummary(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
  })
}

export function useGenerateWeeklySummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (weekStart?: string) => generateWeeklySummary(weekStart),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
  })
}
