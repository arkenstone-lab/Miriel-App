import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTodos } from '@/features/todo/hooks'
import { useEntry } from '@/features/entry/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { EntryDetail } from '@/components/EntryDetail'
import { TodoItem } from '@/components/TodoItem'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Todo } from '@/features/todo/types'

type FilterTab = 'all' | 'pending' | 'done'

export default function TodosScreen() {
  const { data: todos, isLoading, error } = useTodos()
  const { isDesktop } = useResponsiveLayout()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const { t } = useTranslation('todos')
  const { t: tCommon } = useTranslation('common')

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('filter.all') },
    { key: 'pending', label: t('filter.pending') },
    { key: 'done', label: t('filter.done') },
  ]

  const selectedTodo = todos?.find((td) => td.id === selectedTodoId)
  const { data: sourceEntry } = useEntry(selectedTodo?.source_entry_id || '')

  if (isLoading) return <LoadingState />

  if (error) {
    return <ErrorDisplay error={error} />
  }

  if (!todos || todos.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        <EmptyState
          emoji="✅"
          title={t('empty.title')}
          description={t('empty.description')}
        />
      </View>
    )
  }

  const filteredTodos = todos.filter((td) => {
    if (filter === 'all') return true
    return td.status === filter
  })

  const pendingCount = todos.filter((td) => td.status === 'pending').length
  const doneCount = todos.filter((td) => td.status === 'done').length

  // Sort: pending first, then done
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.status === 'pending' && b.status === 'done') return -1
    if (a.status === 'done' && b.status === 'pending') return 1
    return 0
  })

  const master = (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
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
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t('stats', { pending: pendingCount, done: doneCount })}
            </Text>

            {/* Filter Tabs */}
            <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    filter === tab.key ? 'bg-white dark:bg-gray-700' : ''
                  }`}
                  onPress={() => setFilter(tab.key)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filter === tab.key ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
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
            <Text className="text-gray-400 dark:text-gray-500 text-sm">
              {filter === 'pending'
                ? t('empty.pendingEmpty')
                : filter === 'done'
                ? t('empty.doneEmpty')
                : t('empty.allEmpty')}
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
              <View className="px-6 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {t('evidence.header')}
                </Text>
              </View>
              <EntryDetail entry={sourceEntry} />
            </View>
          ) : null
        }
        detailPlaceholder={tCommon('placeholder.selectTodoEvidence')}
      />
    )
  }

  return master
}
