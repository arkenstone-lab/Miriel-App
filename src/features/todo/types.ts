export interface Todo {
  id: string
  user_id: string
  text: string
  source_entry_id: string | null
  status: 'pending' | 'done'
  due_date: string | null
  created_at: string
}
