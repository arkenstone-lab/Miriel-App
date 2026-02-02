import type { Todo } from './types'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchTodos(status?: string): Promise<Todo[]> {
  const params = status ? `?status=${status}` : ''
  const res = await fetch(`/api/todos${params}`)
  return handleResponse<Todo[]>(res)
}

export async function updateTodo(
  id: string,
  updates: { status?: string; text?: string }
): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return handleResponse<Todo>(res)
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Delete failed')
  }
}
