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
import { useChatStore, type ChatMessage } from '@/stores/chatStore'
import { useCreateEntry } from '@/features/entry/hooks'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <View
      className={`mb-3 max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}
    >
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
  const { messages, isComplete, addUserMessage, getFullText, reset } = useChatStore()
  const createEntry = useCreateEntry()
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
    const fullText = getFullText()
    if (!fullText.trim()) return

    try {
      await createEntry.mutateAsync({ raw_text: fullText })
      reset()
      router.back()
    } catch (error: any) {
      Alert.alert('저장 실패', error.message || '다시 시도해주세요.')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
          <TouchableOpacity
            className={`rounded-lg py-3.5 ${
              createEntry.isPending ? 'bg-indigo-400' : 'bg-indigo-600'
            }`}
            onPress={handleSave}
            disabled={createEntry.isPending}
          >
            <Text className="text-white text-center font-semibold text-base">
              {createEntry.isPending ? '저장 중...' : '기록 저장하기'}
            </Text>
          </TouchableOpacity>
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
