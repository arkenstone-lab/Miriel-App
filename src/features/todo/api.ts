import { apiFetch } from '@/lib/api'
import { AppError } from '@/lib/errors'
import type { Todo } from './types'

export async function fetchTodos(status?: string): Promise<Todo[]> {
  try {
    const query = status ? `?status=${status}` : ''
    return await apiFetch<Todo[]>(`/todos${query}`)
  } catch (error) {
    throw new AppError('TODO_001', error)
  }
}

export async function fetchTodosByEntry(entryId: string): Promise<Todo[]> {
  try {
    return await apiFetch<Todo[]>(`/todos/by-entry/${entryId}`)
  } catch (error) {
    throw new AppError('TODO_002', error)
  }
}

export async function updateTodo(
  id: string,
  updates: { status?: string; text?: string }
): Promise<Todo> {
  try {
    return await apiFetch<Todo>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  } catch (error) {
    throw new AppError('TODO_003', error)
  }
}

export async function deleteTodo(id: string): Promise<void> {
  try {
    await apiFetch(`/todos/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new AppError('TODO_004', error)
  }
}

export async function extractTodos(
  text: string,
  entryId?: string,
  aiContext?: string
): Promise<{ todos: Todo[] }> {
  try {
    const body: Record<string, unknown> = { text, entry_id: entryId }
    if (aiContext) body.ai_context = aiContext

    return await apiFetch<{ todos: Todo[] }>('/ai/extract-todos', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new AppError('TODO_005', error)
  }
}
