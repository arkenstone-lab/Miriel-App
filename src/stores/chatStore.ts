import { create } from 'zustand'
import i18n from '@/i18n'
import { getCheckinQuestions } from '@/lib/constants'

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
}

type InputMode = 'chat' | 'quick'

interface ChatState {
  messages: ChatMessage[]
  questions: string[]
  currentQuestionIndex: number
  isComplete: boolean
  mode: InputMode
  addUserMessage: (text: string) => void
  reset: () => void
  getFullText: () => string
  setMode: (mode: InputMode) => void
}

function createInitialState() {
  const questions = getCheckinQuestions()
  return {
    messages: [
      {
        id: 'q-0',
        role: 'assistant' as const,
        text: questions[0],
      },
    ],
    questions,
    currentQuestionIndex: 0,
    isComplete: false,
    mode: 'chat' as InputMode,
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  ...createInitialState(),

  addUserMessage: (text: string) => {
    const state = get()
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    }

    const nextIndex = state.currentQuestionIndex + 1
    const hasNext = nextIndex < state.questions.length

    if (hasNext) {
      const botMsg: ChatMessage = {
        id: `q-${nextIndex}`,
        role: 'assistant',
        text: state.questions[nextIndex],
      }
      set({
        messages: [...state.messages, userMsg, botMsg],
        currentQuestionIndex: nextIndex,
      })
    } else {
      const doneMsg: ChatMessage = {
        id: 'done',
        role: 'assistant',
        text: i18n.t('entry:create.chatCompletion'),
      }
      set({
        messages: [...state.messages, userMsg, doneMsg],
        isComplete: true,
      })
    }
  },

  reset: () => set(createInitialState()),

  getFullText: () => {
    return get()
      .messages.filter((m) => m.role === 'user')
      .map((m) => m.text)
      .join('\n\n')
  },

  setMode: (mode: InputMode) => set({ mode }),
}))
