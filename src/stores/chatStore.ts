import { create } from 'zustand'
import i18n from '@/i18n'
import { getCheckinQuestions } from '@/lib/constants'
import { chatWithAI, type ChatResponse } from '@/features/entry/chatApi'

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
  phase?: string
}

type InputMode = 'chat' | 'quick'

interface InitChatParams {
  pendingTodos: { text: string; status: string; due_date?: string }[]
  aiContext?: string
  language: string
}

interface ChatState {
  messages: ChatMessage[]
  isComplete: boolean
  isAiThinking: boolean
  sessionSummary: string | null
  currentPhase: string
  mode: InputMode

  // Actions
  initChat: (params: InitChatParams) => Promise<void>
  addUserMessage: (text: string) => Promise<void>
  reset: () => void
  getFullText: () => string
  setMode: (mode: InputMode) => void
}

// Internal state not exposed to consumers
let _pendingTodos: { text: string; status: string; due_date?: string }[] = []
let _aiContext: string | undefined
let _language = 'en'
let _useFallback = false

function getTimeOfDay(): 'morning' | 'evening' {
  return new Date().getHours() < 14 ? 'morning' : 'evening'
}

function buildApiMessages(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter((m) => m.id !== 'thinking')
    .map((m) => ({
      role: m.role,
      content: m.text,
    }))
}

/** Fallback: use static questions when AI is unavailable */
function initFallbackChat(): Partial<ChatState> {
  _useFallback = true
  const questions = getCheckinQuestions()
  return {
    messages: [{ id: 'q-0', role: 'assistant', text: questions[0] }],
    isComplete: false,
    isAiThinking: false,
    sessionSummary: null,
    currentPhase: 'plan',
  }
}

function handleFallbackMessage(state: ChatState, userMsg: ChatMessage): Partial<ChatState> {
  const questions = getCheckinQuestions()
  const userMessages = state.messages.filter((m) => m.role === 'user')
  const nextIndex = userMessages.length // includes the new one we're adding
  const hasNext = nextIndex < questions.length

  if (hasNext) {
    return {
      messages: [
        ...state.messages,
        userMsg,
        { id: `q-${nextIndex}`, role: 'assistant', text: questions[nextIndex] },
      ],
    }
  }
  return {
    messages: [
      ...state.messages,
      userMsg,
      { id: 'done', role: 'assistant', text: i18n.t('entry:create.chatCompletion') },
    ],
    isComplete: true,
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isComplete: false,
  isAiThinking: false,
  sessionSummary: null,
  currentPhase: 'plan',
  mode: 'chat' as InputMode,

  initChat: async (params: InitChatParams) => {
    _pendingTodos = params.pendingTodos
    _aiContext = params.aiContext
    _language = params.language
    _useFallback = false

    set({ messages: [], isComplete: false, isAiThinking: true, sessionSummary: null, currentPhase: 'plan' })

    try {
      // Send empty user message to get first AI question
      const response: ChatResponse = await chatWithAI({
        messages: [],
        time_of_day: getTimeOfDay(),
        pending_todos: _pendingTodos,
        language: _language,
        ai_context: _aiContext,
      })

      set({
        messages: [{ id: 'a-0', role: 'assistant', text: response.message, phase: response.phase }],
        currentPhase: response.phase,
        isAiThinking: false,
      })
    } catch {
      // AI unavailable — fall back to static questions
      set(initFallbackChat())
    }
  },

  addUserMessage: async (text: string) => {
    const state = get()
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    }

    // Fallback mode — use static questions
    if (_useFallback) {
      set(handleFallbackMessage(state, userMsg))
      return
    }

    // Add user message + thinking indicator
    set({
      messages: [...state.messages, userMsg, { id: 'thinking', role: 'assistant', text: '...' }],
      isAiThinking: true,
    })

    try {
      const apiMessages = buildApiMessages([...state.messages, userMsg])
      const response: ChatResponse = await chatWithAI({
        messages: apiMessages,
        time_of_day: getTimeOfDay(),
        pending_todos: _pendingTodos,
        language: _language,
        ai_context: _aiContext,
      })

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: response.message,
        phase: response.phase,
      }

      // Remove thinking indicator, add real response
      set((s) => ({
        messages: [...s.messages.filter((m) => m.id !== 'thinking'), aiMsg],
        isComplete: response.is_complete,
        isAiThinking: false,
        currentPhase: response.phase,
        sessionSummary: response.session_summary || s.sessionSummary,
      }))
    } catch {
      // AI failed mid-conversation — add generic follow-up
      const fallbackMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: i18n.t('entry:create.chatFallback'),
      }
      set((s) => ({
        messages: [...s.messages.filter((m) => m.id !== 'thinking'), fallbackMsg],
        isAiThinking: false,
      }))
    }
  },

  reset: () => {
    _pendingTodos = []
    _aiContext = undefined
    _language = 'en'
    _useFallback = false
    set({
      messages: [],
      isComplete: false,
      isAiThinking: false,
      sessionSummary: null,
      currentPhase: 'plan',
      mode: 'chat',
    })
  },

  getFullText: () => {
    const messages = get().messages.filter((m) => m.role === 'user')
    if (_useFallback) {
      return messages.map((m) => m.text).join('\n\n')
    }

    // Group by phase with markers
    const phases: Record<string, string[]> = {}
    const allMessages = get().messages
    let currentPhase = 'plan'

    for (const msg of allMessages) {
      if (msg.phase) currentPhase = msg.phase
      if (msg.role === 'user') {
        if (!phases[currentPhase]) phases[currentPhase] = []
        phases[currentPhase].push(msg.text)
      }
    }

    const parts: string[] = []
    for (const [phase, texts] of Object.entries(phases)) {
      parts.push(`[${phase.charAt(0).toUpperCase() + phase.slice(1)}]\n${texts.join('\n')}`)
    }
    return parts.join('\n\n')
  },

  setMode: (mode: InputMode) => set({ mode }),
}))
