import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTodos, fetchTodosByEntry, updateTodo, deleteTodo } from './api'
import type { Todo } from './types'

export function useTodos(status?: string) {
  return useQuery({
    queryKey: ['todos', status],
    queryFn: () => fetchTodos(status),
  })
}

export function useTodosByEntry(entryId: string) {
  return useQuery({
    queryKey: ['todos', 'entry', entryId],
    queryFn: () => fetchTodosByEntry(entryId),
    enabled: !!entryId,
  })
}

// Helper: optimistically update a todo in all relevant query caches
function optimisticTodoUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  todoId: string,
  updater: (todo: Todo) => Todo,
) {
  const snapshots: { key: readonly unknown[]; data: unknown }[] = []

  queryClient.getQueriesData<Todo[]>({ queryKey: ['todos'] }).forEach(([key, data]) => {
    if (!Array.isArray(data)) return
    snapshots.push({ key, data })
    queryClient.setQueryData(key, data.map((t) => (t.id === todoId ? updater(t) : t)))
  })

  return snapshots
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status?: string; text?: string } }) =>
      updateTodo(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const snapshots = optimisticTodoUpdate(queryClient, id, (todo) => ({
        ...todo,
        ...(updates.status ? { status: updates.status as Todo['status'] } : {}),
        ...(updates.text ? { text: updates.text } : {}),
      }))
      return { snapshots }
    },
    onError: (_err, _vars, context) => {
      context?.snapshots?.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const snapshots: { key: readonly unknown[]; data: unknown }[] = []
      queryClient.getQueriesData<Todo[]>({ queryKey: ['todos'] }).forEach(([key, data]) => {
        if (!Array.isArray(data)) return
        snapshots.push({ key, data })
        queryClient.setQueryData(key, data.filter((t) => t.id !== id))
      })
      return { snapshots }
    },
    onError: (_err, _id, context) => {
      context?.snapshots?.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
