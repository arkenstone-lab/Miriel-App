import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useTodos, useUpdateTodo, useDeleteTodo } from '@/features/todo/hooks'
import type { Todo } from '@/features/todo/types'

function TodoItem({ todo }: { todo: Todo }) {
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()

  const toggleStatus = () => {
    updateMutation.mutate({
      id: todo.id,
      updates: { status: todo.status === 'pending' ? 'done' : 'pending' },
    })
  }

  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row items-center">
      <TouchableOpacity onPress={toggleStatus} className="mr-3">
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
        {todo.due_date && (
          <Text className="text-xs text-gray-400 mt-1">{todo.due_date}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => deleteMutation.mutate(todo.id)}
        className="ml-2 p-1"
      >
        <FontAwesome name="trash-o" size={16} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  )
}

export default function TodosScreen() {
  const { data: todos, isLoading, error } = useTodos()

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-8">
        <Text className="text-red-500 text-center">{error.message}</Text>
      </View>
    )
  }

  if (!todos || todos.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-8">
        <Text className="text-4xl mb-4">✅</Text>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          할 일이 없어요
        </Text>
        <Text className="text-gray-500 text-center">
          기록을 작성하면{'\n'}AI가 자동으로 할 일을 추출해줘요!
        </Text>
      </View>
    )
  }

  const pending = todos.filter((t) => t.status === 'pending')
  const done = todos.filter((t) => t.status === 'done')

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={[...pending, ...done]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TodoItem todo={item} />}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Text className="text-sm text-gray-500 mb-3">
            {pending.length}개 진행 중 · {done.length}개 완료
          </Text>
        }
      />
    </View>
  )
}
