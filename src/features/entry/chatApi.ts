import { apiPublicFetch } from '@/lib/api'
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
  try {
    return await apiPublicFetch<ChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  } catch (error) {
    throw new AppError('CHAT_001', error)
  }
}
