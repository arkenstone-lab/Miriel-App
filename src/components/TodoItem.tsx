import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useRouter } from 'expo-router'
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

  const toggleStatus = () => {
    updateMutation.mutate({
      id: todo.id,
      updates: { status: todo.status === 'pending' ? 'done' : 'pending' },
    })
  }

  return (
    <Card
      className={`mb-3 ${isSelected ? 'border-indigo-300 bg-indigo-50' : ''}`}
      onPress={onPress}
    >
      <View className="flex-row items-start">
        <TouchableOpacity onPress={toggleStatus} className="mr-3 mt-0.5">
          <FontAwesome
            name={todo.status === 'done' ? 'check-circle' : 'circle-o'}
            size={22}
            color={todo.status === 'done' ? '#22c55e' : '#d1d5db'}
          />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className={`text-base leading-6 ${
              todo.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {todo.text}
          </Text>
          <View className="flex-row items-center mt-1.5 gap-2">
            {todo.due_date && (
              <View className="flex-row items-center">
                <FontAwesome name="clock-o" size={11} color="#9ca3af" />
                <Text className="text-xs text-gray-400 ml-1">{todo.due_date}</Text>
              </View>
            )}
            {showSource && todo.source_entry_id && (
              <TouchableOpacity
                className="flex-row items-center bg-indigo-50 rounded px-2 py-0.5"
                onPress={() => router.push(`/entries/${todo.source_entry_id}`)}
              >
                <FontAwesome name="link" size={9} color="#6366f1" />
                <Text className="text-xs text-indigo-600 ml-1">근거 기록</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => deleteMutation.mutate(todo.id)}
          className="ml-2 p-1"
        >
          <FontAwesome name="trash-o" size={16} color="#d1d5db" />
        </TouchableOpacity>
      </View>
    </Card>
  )
}
