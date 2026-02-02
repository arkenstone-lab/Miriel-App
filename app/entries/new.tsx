import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useChatStore, type ChatMessage } from '@/stores/chatStore'
import { useCreateEntry, useUpdateEntry } from '@/features/entry/hooks'
import { requestTagging } from '@/features/entry/api'
import { extractTodos } from '@/features/todo/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <View className={`mb-3 max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-indigo-600' : 'bg-gray-100'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            isUser ? 'text-white' : 'text-gray-900'
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
  const { messages, isComplete, addUserMessage, getFullText, reset, mode, setMode } = useChatStore()
  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  const router = useRouter()
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    reset()
  }, [])

  const handleSend = () => {
    if (!input.trim()) return
    addUserMessage(input.trim())
    setInput('')
  }

  const handleSave = async () => {
    const fullText = mode === 'quick' ? quickText : getFullText()
    if (!fullText.trim()) return

    setIsSaving(true)
    try {
      const entry = await createEntry.mutateAsync({ raw_text: fullText })

      // Auto-tag + auto-extract todos in background
      let tagCount = 0
      let todoCount = 0

      try {
        const tagResult = await requestTagging(fullText)
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

      try {
        const todoResult = await extractTodos(fullText, entry.id)
        todoCount = todoResult.todos?.length || 0
      } catch {
        // Todo extraction failed silently
      }

      setSaveFeedback({ tags: tagCount, todos: todoCount })
      setIsSaving(false)

      // Show feedback briefly then navigate back
      setTimeout(() => {
        reset()
        setSaveFeedback(null)
        router.back()
      }, 2000)
    } catch (error: any) {
      setIsSaving(false)
      Alert.alert('저장 실패', error.message || '다시 시도해주세요.')
    }
  }

  // Save success feedback screen
  if (saveFeedback) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-8">
        <View className="bg-green-50 rounded-full w-16 h-16 items-center justify-center mb-4">
          <FontAwesome name="check" size={28} color="#22c55e" />
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          기록이 저장됐어요!
        </Text>
        <View className="flex-row gap-3 mt-2">
          {saveFeedback.tags > 0 && (
            <Badge label={`태그 ${saveFeedback.tags}개`} variant="indigo" size="md" />
          )}
          {saveFeedback.todos > 0 && (
            <Badge label={`할일 ${saveFeedback.todos}개 추출`} variant="green" size="md" />
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
        className="flex-1 bg-white"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Mode Toggle */}
        <View className="flex-row items-center px-4 pt-3 pb-1">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setMode('chat')}
          >
            <FontAwesome name="comments" size={16} color="#9ca3af" />
            <Text className="text-sm text-gray-400 ml-1.5">챗봇 모드로 전환</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-4 pt-2">
          <TextInput
            className="flex-1 text-base text-gray-900 leading-7 border border-gray-200 rounded-xl p-4"
            placeholder="오늘 있었던 일을 자유롭게 적어보세요..."
            value={quickText}
            onChangeText={setQuickText}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>

        <View className="p-4 border-t border-gray-100">
          <Button
            title={isSaving ? '저장 중...' : '기록 저장하기'}
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
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Mode Toggle */}
      <View className="flex-row items-center px-4 pt-3 pb-1">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setMode('quick')}
        >
          <FontAwesome name="pencil-square-o" size={16} color="#9ca3af" />
          <Text className="text-sm text-gray-400 ml-1.5">빠른 입력 모드로 전환</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isComplete ? (
        <View className="p-4 border-t border-gray-100">
          <Button
            title={isSaving ? '저장 중...' : '기록 저장하기'}
            onPress={handleSave}
            loading={isSaving}
            size="lg"
          />
        </View>
      ) : (
        <View className="flex-row items-end p-4 border-t border-gray-100">
          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base mr-3 max-h-24 text-gray-900"
            placeholder="여기에 입력하세요..."
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            className={`rounded-xl px-5 py-3 ${
              input.trim() ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text className="text-white font-semibold">전송</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
