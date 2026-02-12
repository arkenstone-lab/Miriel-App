import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useTranslation } from 'react-i18next'
import { showErrorAlert } from '@/lib/errors'
import { useChatStore, type ChatMessage } from '@/stores/chatStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCreateEntry, useUpdateEntry, useTodayEntry } from '@/features/entry/hooks'
import { requestTagging } from '@/features/entry/api'
import { extractTodos } from '@/features/todo/api'
import { useTodos } from '@/features/todo/hooks'
import { generateSummary } from '@/features/summary/api'
import { useAiPreferences } from '@/features/ai-preferences/hooks'
import { buildAiContext } from '@/features/ai-preferences/context'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/LoadingState'

const TYPING_SPEED = 18 // ms per character

function ThinkingDots() {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <View className="mb-3 max-w-[80%] self-start">
      <View className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
        <Animated.Text
          style={{ opacity }}
          className="text-base leading-6 text-gray-400 dark:text-gray-500"
        >
          •••
        </Animated.Text>
      </View>
    </View>
  )
}

function TypingBubble({ text, onComplete }: { text: string; onComplete: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    indexRef.current = 0
    setDisplayed('')
    const timer = setInterval(() => {
      indexRef.current += 1
      if (indexRef.current >= text.length) {
        setDisplayed(text)
        clearInterval(timer)
        onComplete()
      } else {
        setDisplayed(text.slice(0, indexRef.current))
      }
    }, TYPING_SPEED)
    return () => clearInterval(timer)
  }, [text])

  return (
    <View className="mb-3 max-w-[80%] self-start">
      <View className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
        <Text className="text-base leading-6 text-gray-900 dark:text-gray-100">
          {displayed}
          {displayed.length < text.length && (
            <Text className="text-gray-400 dark:text-gray-500">▌</Text>
          )}
        </Text>
      </View>
    </View>
  )
}

function MessageBubble({
  message,
  animate,
  onAnimationComplete,
}: {
  message: ChatMessage
  animate?: boolean
  onAnimationComplete?: () => void
}) {
  const isUser = message.role === 'user'

  if (message.id === 'thinking') {
    return <ThinkingDots />
  }

  if (!isUser && animate && onAnimationComplete) {
    return <TypingBubble text={message.text} onComplete={onAnimationComplete} />
  }

  return (
    <View className={`mb-3 max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-cyan-600' : 'bg-gray-100 dark:bg-gray-800'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {message.text}
        </Text>
      </View>
    </View>
  )
}

export default function NewEntryScreen() {
  const [input, setInput] = useState('')
  const [quickText, setQuickText] = useState('')
  const [saveFeedback, setSaveFeedback] = useState<{
    tags: number
    todos: number
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const {
    messages,
    isComplete,
    isAiThinking,
    addUserMessage,
    getFullText,
    reset,
    initChat,
    mode,
    setMode,
  } = useChatStore()
  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  const queryClient = useQueryClient()
  const { data: todayEntry, isLoading: checkingToday } = useTodayEntry()
  const { data: aiPrefs } = useAiPreferences()
  const { data: pendingTodosData } = useTodos('pending')
  const { nickname, occupation, interests, language } = useSettingsStore()
  const router = useRouter()
  const flatListRef = useRef<FlatList>(null)
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const prevMessageCountRef = useRef(0)
  const { t } = useTranslation('entry')
  const { t: tCommon } = useTranslation('common')

  // Track when a new AI message arrives → trigger typing animation
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const latest = messages[messages.length - 1]
      if (latest && latest.role === 'assistant' && latest.id !== 'thinking') {
        setAnimatingId(latest.id)
      }
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  const handleAnimationComplete = useCallback(() => {
    setAnimatingId(null)
  }, [])

  // Redirect to edit if today's entry already exists
  useEffect(() => {
    if (!checkingToday && todayEntry) {
      router.replace(`/entries/${todayEntry.id}?autoEdit=true` as any)
    }
  }, [checkingToday, todayEntry])

  // Initialize AI chat on mount
  useEffect(() => {
    reset()
    const aiContext = buildAiContext(aiPrefs, { nickname, occupation, interests })
    const todos = (pendingTodosData || []).map((t) => ({
      text: t.text,
      status: t.status,
      due_date: t.due_date || undefined,
    }))
    initChat({
      pendingTodos: todos,
      aiContext,
      language: language || 'en',
    })
  }, [])

  const isBusy = isAiThinking || animatingId !== null

  const handleSend = async () => {
    if (!input.trim() || isBusy) return
    const text = input.trim()
    setInput('')
    await addUserMessage(text)
  }

  const handleChatKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !(e as any).shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSave = async () => {
    const fullText = mode === 'quick' ? quickText : getFullText()
    if (!fullText.trim()) return

    setIsSaving(true)
    try {
      const entry = await createEntry.mutateAsync({ raw_text: fullText })

      // Build AI context from preferences + persona
      const aiContext = buildAiContext(aiPrefs, { nickname, occupation, interests })

      // Auto-tag + auto-extract todos + auto-summary
      let tagCount = 0
      let todoCount = 0

      try {
        const tagResult = await requestTagging(fullText, aiContext)
        if (tagResult.tags.length > 0) {
          await updateEntry.mutateAsync({
            id: entry.id,
            input: { tags: tagResult.tags },
          })
          tagCount = tagResult.tags.length
        }
      } catch {
        // Tagging failed silently
      }

      // Todos + daily summary — fire in parallel, non-blocking
      const todoPromise = extractTodos(fullText, entry.id, aiContext)
        .then((result) => { todoCount = result.todos?.length || 0 })
        .catch(() => {})

      const today = new Date().toISOString().split('T')[0]
      const summaryPromise = generateSummary(today, aiContext)
        .then(() => { queryClient.invalidateQueries({ queryKey: ['summaries'] }) })
        .catch(() => {})

      await Promise.all([todoPromise, summaryPromise])

      setSaveFeedback({ tags: tagCount, todos: todoCount })
      setIsSaving(false)

      // Show feedback briefly then navigate back
      setTimeout(() => {
        reset()
        setSaveFeedback(null)
        router.back()
      }, 2000)
    } catch (error: unknown) {
      setIsSaving(false)
      showErrorAlert(t('create.saveFailed'), error)
    }
  }

  // Show loading while checking for today's entry
  if (checkingToday) return <LoadingState />

  // Save success feedback screen
  if (saveFeedback) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-950 justify-center items-center px-8">
        <View className="bg-green-50 dark:bg-green-900/30 rounded-full w-16 h-16 items-center justify-center mb-4">
          <FontAwesome name="check" size={28} color="#22c55e" />
        </View>
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('create.savedTitle')}
        </Text>
        <View className="flex-row gap-3 mt-2">
          {saveFeedback.tags > 0 && (
            <Badge label={t('create.tagCount', { count: saveFeedback.tags })} variant="cyan" size="md" />
          )}
          {saveFeedback.todos > 0 && (
            <Badge label={t('create.todoCount', { count: saveFeedback.todos })} variant="green" size="md" />
          )}
        </View>
      </View>
    )
  }

  // Quick mode: large text area
  if (mode === 'quick') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-gray-950"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Mode Toggle */}
        <View className="flex-row items-center px-4 pt-3 pb-1">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setMode('chat')}
          >
            <FontAwesome name="comments" size={16} color="#9ca3af" />
            <Text className="text-sm text-gray-400 dark:text-gray-500 ml-1.5">{t('create.switchToChat')}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-4 pt-2">
          <TextInput
            className="flex-1 text-base text-gray-900 dark:text-gray-100 leading-7 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900"
            placeholder={t('create.placeholder')}
            value={quickText}
            onChangeText={setQuickText}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>

        <View className="p-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            title={isSaving ? t('create.saving') : t('create.saveEntry')}
            onPress={handleSave}
            loading={isSaving}
            disabled={!quickText.trim()}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Chat mode (default)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-950"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Mode Toggle */}
      <View className="flex-row items-center px-4 pt-3 pb-1">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setMode('quick')}
        >
          <FontAwesome name="pencil-square-o" size={16} color="#9ca3af" />
          <Text className="text-sm text-gray-400 dark:text-gray-500 ml-1.5">{t('create.switchToQuick')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            animate={item.id === animatingId}
            onAnimationComplete={handleAnimationComplete}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isComplete ? (
        <View className="p-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            title={isSaving ? t('create.saving') : t('create.saveEntry')}
            onPress={handleSave}
            loading={isSaving}
            size="lg"
          />
        </View>
      ) : (
        <View className="flex-row items-end p-4 border-t border-gray-100 dark:border-gray-800">
          <TextInput
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base mr-3 max-h-24 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('create.inputPlaceholder')}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!isBusy}
            onSubmitEditing={() => handleSend()}
            blurOnSubmit={false}
            onKeyPress={handleChatKeyPress}
          />
          <TouchableOpacity
            className={`rounded-xl px-5 py-3 ${
              input.trim() && !isBusy ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            onPress={() => handleSend()}
            disabled={!input.trim() || isBusy}
          >
            <Text className="text-white font-semibold">{tCommon('action.send')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
