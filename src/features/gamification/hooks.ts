import { useMemo } from 'react'
import { useEntries } from '@/features/entry/hooks'
import { useTodos } from '@/features/todo/hooks'
import { useSummaries } from '@/features/summary/hooks'
import { calculateGamificationStats } from './calculations'
import type { GamificationStats } from './types'

export function useGamificationStats(): {
  data: GamificationStats | null
  isLoading: boolean
} {
  const { data: entries, isLoading: entriesLoading } = useEntries()
  const { data: todos, isLoading: todosLoading } = useTodos()
  const { data: dailySummaries, isLoading: dailyLoading } = useSummaries('daily')
  const { data: weeklySummaries, isLoading: weeklyLoading } = useSummaries('weekly')

  const isLoading = entriesLoading || todosLoading || dailyLoading || weeklyLoading

  const data = useMemo(() => {
    if (!entries) return null

    const allSummaries = [
      ...(dailySummaries || []),
      ...(weeklySummaries || []),
    ]

    return calculateGamificationStats(entries, todos || [], allSummaries)
  }, [entries, todos, dailySummaries, weeklySummaries])

  return { data, isLoading }
}
