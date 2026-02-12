import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'

interface ChatRequestMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PendingTodo {
  text: string
  status: string
  due_date?: string
}

interface ChatParams {
  messages: ChatRequestMessage[]
  time_of_day: 'morning' | 'evening'
  pending_todos: PendingTodo[]
  language: string
  ai_context?: string
}

export interface ChatResponse {
  message: string
  is_complete: boolean
  phase: 'plan' | 'detail' | 'reflection'
  session_summary?: string
}

export async function chatWithAI(params: ChatParams): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: params,
  })

  if (error) throw new AppError('CHAT_001', error)
  return data as ChatResponse
}
