import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useTodos } from '@/features/todo/hooks'
import { useEntry } from '@/features/entry/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { EntryDetail } from '@/components/EntryDetail'
import { TodoItem } from '@/components/TodoItem'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Todo } from '@/features/todo/types'

type FilterTab = 'all' | 'pending' | 'done'

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '진행 중' },
  { key: 'done', label: '완료' },
]

export default function TodosScreen() {
  const { data: todos, isLoading, error } = useTodos()
  const { isDesktop } = useResponsiveLayout()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)

  const selectedTodo = todos?.find((t) => t.id === selectedTodoId)
  const { data: sourceEntry } = useEntry(selectedTodo?.source_entry_id || '')

  if (isLoading) return <LoadingState />

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-8">
        <Text className="text-red-500 text-center">{error.message}</Text>
      </View>
    )
  }

  if (!todos || todos.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <EmptyState
          emoji="✅"
          title="할 일이 없어요"
          description={'기록을 작성하면\nAI가 자동으로 할 일을 추출해줘요!'}
        />
      </View>
    )
  }

  const filteredTodos = todos.filter((t) => {
    if (filter === 'all') return true
    return t.status === filter
  })

  const pendingCount = todos.filter((t) => t.status === 'pending').length
  const doneCount = todos.filter((t) => t.status === 'done').length

  // Sort: pending first, then done
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.status === 'pending' && b.status === 'done') return -1
    if (a.status === 'done' && b.status === 'pending') return 1
    return 0
  })

  const master = (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={sortedTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <TodoItem
              todo={item}
              onPress={
                isDesktop && item.source_entry_id
                  ? () => setSelectedTodoId(item.id)
                  : undefined
              }
              isSelected={isDesktop && selectedTodoId === item.id}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* Stats */}
            <Text className="text-sm text-gray-500 mb-3">
              {pendingCount}개 진행 중 · {doneCount}개 완료
            </Text>

            {/* Filter Tabs */}
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    filter === tab.key ? 'bg-white' : ''
                  }`}
                  onPress={() => setFilter(tab.key)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filter === tab.key ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center pt-12">
            <Text className="text-gray-400 text-sm">
              {filter === 'pending'
                ? '진행 중인 할 일이 없어요'
                : filter === 'done'
                ? '완료된 할 일이 없어요'
                : '할 일이 없어요'}
            </Text>
          </View>
        }
      />
    </View>
  )

  if (isDesktop) {
    return (
      <MasterDetailLayout
        master={master}
        detail={
          sourceEntry ? (
            <View className="flex-1">
              <View className="px-6 pt-4 pb-2 border-b border-gray-100">
                <Text className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  근거 기록
                </Text>
              </View>
              <EntryDetail entry={sourceEntry} />
            </View>
          ) : null
        }
        detailPlaceholder="할 일을 선택하면 근거 기록이 표시됩니다"
      />
    )
  }

  return master
}
