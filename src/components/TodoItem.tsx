import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useUpdateTodo, useDeleteTodo } from '@/features/todo/hooks'
import { Card } from '@/components/ui/Card'
import type { Todo } from '@/features/todo/types'

interface TodoItemProps {
  todo: Todo
  onPress?: () => void
  isSelected?: boolean
  showSource?: boolean
}

export function TodoItem({
  todo,
  onPress,
  isSelected = false,
  showSource = true,
}: TodoItemProps) {
  const router = useRouter()
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { t } = useTranslation('todos')

  const toggleStatus = () => {
    updateMutation.mutate({
      id: todo.id,
      updates: { status: todo.status === 'pending' ? 'done' : 'pending' },
    })
  }

  return (
    <Card
      className={`mb-3 ${isSelected ? 'border-cyan-300 dark:border-gray-600 bg-cyan-50 dark:bg-gray-800/50' : ''}`}
      onPress={onPress}
    >
      <View className="flex-row items-start">
        <TouchableOpacity onPress={toggleStatus} className="mr-3 mt-0.5">
          <FontAwesome
            name={todo.status === 'done' ? 'check-circle' : 'circle-o'}
            size={22}
            color={todo.status === 'done' ? '#22c55e' : isDark ? '#6b7280' : '#d1d5db'}
          />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className={`text-base leading-6 ${
              todo.status === 'done' ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {todo.text}
          </Text>
          <View className="flex-row items-center mt-1.5 gap-2">
            {todo.due_date && (
              <View className="flex-row items-center">
                <FontAwesome name="clock-o" size={11} color={isDark ? '#9ca3af' : '#9ca3af'} />
                <Text className="text-xs text-gray-400 dark:text-gray-500 ml-1">{todo.due_date}</Text>
              </View>
            )}
            {showSource && todo.source_entry_id && (
              <TouchableOpacity
                className="flex-row items-center bg-cyan-50 dark:bg-gray-800/50 rounded px-2 py-0.5"
                onPress={() => router.push(`/entries/${todo.source_entry_id}`)}
              >
                <FontAwesome name="link" size={9} color={isDark ? '#67e8f9' : '#22d3ee'} />
                <Text className="text-xs text-cyan-600 dark:text-cyan-400 ml-1">{t('evidence.link')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => deleteMutation.mutate(todo.id)}
          className="ml-2 p-1"
        >
          <FontAwesome name="trash-o" size={16} color={isDark ? '#6b7280' : '#d1d5db'} />
        </TouchableOpacity>
      </View>
    </Card>
  )
}
