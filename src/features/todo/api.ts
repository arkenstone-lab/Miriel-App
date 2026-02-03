import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { Todo } from './types'

export async function fetchTodos(status?: string): Promise<Todo[]> {
  let query = supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw new AppError('TODO_001', error)
  return data as Todo[]
}

export async function fetchTodosByEntry(entryId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('source_entry_id', entryId)
    .order('created_at', { ascending: false })

  if (error) throw new AppError('TODO_002', error)
  return data as Todo[]
}

export async function updateTodo(
  id: string,
  updates: { status?: string; text?: string }
): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new AppError('TODO_003', error)
  return data as Todo
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) throw new AppError('TODO_004', error)
}

export async function extractTodos(
  text: string,
  entryId?: string
): Promise<{ todos: Todo[] }> {
  const { data, error } = await supabase.functions.invoke('extract-todos', {
    body: { text, entry_id: entryId },
  })

  if (error) throw new AppError('TODO_005', error)
  return data as { todos: Todo[] }
}
