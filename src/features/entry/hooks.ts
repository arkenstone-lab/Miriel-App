import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEntries, fetchEntry, createEntry, updateEntry, deleteEntry } from './api'
import type { CreateEntryInput, UpdateEntryInput } from './types'
import { getLocalToday } from '@/lib/date'

export function useEntries(date?: string) {
  return useQuery({
    queryKey: ['entries', date],
    queryFn: () => fetchEntries(date),
  })
}

export function useTodayEntry() {
  const today = getLocalToday()
  return useQuery({
    queryKey: ['entries', today],
    queryFn: () => fetchEntries(today),
    select: (entries) => entries[0] ?? null,
  })
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: ['entries', id],
    queryFn: () => fetchEntry(id),
    enabled: !!id,
  })
}

export function useCreateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEntryInput) => createEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEntryInput }) =>
      updateEntry(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.setQueryData(['entries', data.id], data)
    },
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      // Remove all entries caches immediately (not just invalidate) to prevent
      // useTodayEntry from returning stale deleted entry before refetch completes
      queryClient.removeQueries({ queryKey: ['entries'] })
      // Remove summary caches — server cascade-deletes connected daily summary
      queryClient.removeQueries({ queryKey: ['summaries'] })
    },
  })
}
