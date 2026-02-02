import { createClient } from '@/lib/supabase/server'
import { extractTodos } from '@/lib/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text, entry_id } = await request.json()

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const result = await extractTodos(text)

  if (result.todos.length === 0) {
    return NextResponse.json({ todos: [] })
  }

  const todosToInsert = result.todos.map((t) => ({
    user_id: user.id,
    text: t.text,
    source_entry_id: entry_id || null,
    status: 'pending' as const,
    due_date: null,
  }))

  const { data, error } = await supabase
    .from('todos')
    .insert(todosToInsert)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ todos: data }, { status: 201 })
}
