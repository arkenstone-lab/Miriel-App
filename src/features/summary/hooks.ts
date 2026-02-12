import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSummaries, generateSummary, generateWeeklySummary, generateMonthlySummary } from './api'

export function useSummaries(period: 'daily' | 'weekly' | 'monthly' = 'daily', date?: string) {
  return useQuery({
    queryKey: ['summaries', period, date],
    queryFn: () => fetchSummaries(period, date),
  })
}

export function useGenerateSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params?: { date?: string; aiContext?: string }) =>
      generateSummary(params?.date, params?.aiContext),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
  })
}

export function useGenerateWeeklySummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params?: { weekStart?: string; aiContext?: string }) =>
      generateWeeklySummary(params?.weekStart, params?.aiContext),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
  })
}

export function useGenerateMonthlySummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { monthStart: string; monthEnd: string; aiContext?: string }) =>
      generateMonthlySummary(params.monthStart, params.monthEnd, params.aiContext),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
  })
}
