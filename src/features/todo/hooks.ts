import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTodos, fetchTodosByEntry, updateTodo, deleteTodo } from './api'

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

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status?: string; text?: string } }) =>
      updateTodo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
