import { create } from 'zustand'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
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

interface ChatDraft {
  messages: ChatMessage[]
  isComplete: boolean
  currentPhase: string
  sessionSummary: string | null
  mode: InputMode
  date: string
  pendingTodos: { text: string; status: string; due_date?: string }[]
  aiContext?: string
  language: string
  useFallback: boolean
}

interface ChatState {
  messages: ChatMessage[]
  isComplete: boolean
  isAiThinking: boolean
  sessionSummary: string | null
  currentPhase: string
  mode: InputMode
  hasDraft: boolean

  // Actions
  checkForDraft: () => Promise<boolean>
  resumeDraft: () => Promise<void>
  initChat: (params: InitChatParams) => Promise<void>
  addUserMessage: (text: string) => Promise<void>
  reset: () => void
  getFullText: () => string
  setMode: (mode: InputMode) => void
  saveDraft: () => void
  clearDraft: () => void
}

// Internal state not exposed to consumers
let _pendingTodos: { text: string; status: string; due_date?: string }[] = []
let _aiContext: string | undefined
let _language = 'en'
let _useFallback = false

// Draft storage helpers
const DRAFT_KEY = '@miriel/chat_draft'

function saveDraftToStorage(draft: ChatDraft): void {
  const json = JSON.stringify(draft)
  if (Platform.OS === 'web') {
    try { localStorage.setItem(DRAFT_KEY, json) } catch {}
  } else {
    AsyncStorage.setItem(DRAFT_KEY, json).catch(() => {})
  }
}

async function loadDraftFromStorage(): Promise<ChatDraft | null> {
  let raw: string | null
  try {
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(DRAFT_KEY)
    } else {
      raw = await AsyncStorage.getItem(DRAFT_KEY)
    }
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const draft = JSON.parse(raw) as ChatDraft
    const today = new Date().toISOString().split('T')[0]
    if (draft.date !== today) {
      clearDraftFromStorage()
      return null
    }
    if (!draft.messages || draft.messages.length <= 1) return null
    return draft
  } catch {
    return null
  }
}

function clearDraftFromStorage(): void {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  } else {
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {})
  }
}

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
  hasDraft: false,

  checkForDraft: async () => {
    const draft = await loadDraftFromStorage()
    if (draft && !draft.isComplete) {
      set({ hasDraft: true })
      return true
    }
    set({ hasDraft: false })
    return false
  },

  resumeDraft: async () => {
    const draft = await loadDraftFromStorage()
    if (!draft) {
      set({ hasDraft: false })
      return
    }
    _pendingTodos = draft.pendingTodos || []
    _aiContext = draft.aiContext
    _language = draft.language || 'en'
    _useFallback = draft.useFallback || false
    set({
      messages: draft.messages,
      isComplete: draft.isComplete,
      currentPhase: draft.currentPhase,
      sessionSummary: draft.sessionSummary,
      mode: draft.mode,
      isAiThinking: false,
      hasDraft: false,
    })
  },

  initChat: async (params: InitChatParams) => {
    _pendingTodos = params.pendingTodos
    _aiContext = params.aiContext
    _language = params.language
    _useFallback = false

    set({ messages: [], isComplete: false, isAiThinking: true, sessionSummary: null, currentPhase: 'plan', hasDraft: false })

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
    } catch (err) {
      // AI unavailable — fall back to static questions
      console.error('[chatStore] initChat failed:', err)
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
      // Auto-save draft after each exchange (after state is committed)
      if (!response.is_complete) {
        get().saveDraft()
      }
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

  saveDraft: () => {
    const state = get()
    if (state.messages.length <= 1 || state.isComplete) return
    const draft: ChatDraft = {
      messages: state.messages.filter((m) => m.id !== 'thinking'),
      isComplete: state.isComplete,
      currentPhase: state.currentPhase,
      sessionSummary: state.sessionSummary,
      mode: state.mode,
      date: new Date().toISOString().split('T')[0],
      pendingTodos: _pendingTodos,
      aiContext: _aiContext,
      language: _language,
      useFallback: _useFallback,
    }
    saveDraftToStorage(draft)
  },

  clearDraft: () => {
    clearDraftFromStorage()
    set({ hasDraft: false })
  },

  reset: () => {
    _pendingTodos = []
    _aiContext = undefined
    _language = 'en'
    _useFallback = false
    clearDraftFromStorage()
    set({
      messages: [],
      isComplete: false,
      isAiThinking: false,
      sessionSummary: null,
      currentPhase: 'plan',
      mode: 'chat',
      hasDraft: false,
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
