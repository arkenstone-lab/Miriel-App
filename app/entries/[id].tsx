import { useState } from 'react'
import { View, Text, ScrollView, TextInput, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useTranslation } from 'react-i18next'
import { useEntry, useUpdateEntry, useDeleteEntry } from '@/features/entry/hooks'
import { useTodosByEntry, useUpdateTodo } from '@/features/todo/hooks'
import { useSummaries } from '@/features/summary/hooks'
import { LoadingState } from '@/components/ui/LoadingState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: entry, isLoading, error } = useEntry(id!)
  const { data: relatedTodos } = useTodosByEntry(id!)
  const { data: dailySummaries } = useSummaries('daily', entry?.date)
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const updateTodo = useUpdateTodo()
  const { t } = useTranslation('entry')
  const { t: tCommon } = useTranslation('common')

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')

  if (isLoading) return <LoadingState />

  if (error || !entry) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-8">
        <Text className="text-red-500 text-center">
          {error?.message || t('detail.notFound')}
        </Text>
      </View>
    )
  }

  const handleDelete = () => {
    Alert.alert(t('detail.deleteTitle'), t('detail.deleteMessage'), [
      { text: tCommon('action.cancel'), style: 'cancel' },
      {
        text: tCommon('action.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry.mutateAsync(entry.id)
            router.back()
          } catch (e: any) {
            Alert.alert(t('detail.deleteFailed'), e.message)
          }
        },
      },
    ])
  }

  const handleEdit = () => {
    setEditText(entry.raw_text)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) return
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        input: { raw_text: editText },
      })
      setIsEditing(false)
    } catch (e: any) {
      Alert.alert(t('detail.editFailed'), e.message)
    }
  }

  const toggleTodo = (todoId: string, currentStatus: string) => {
    updateTodo.mutate({
      id: todoId,
      updates: { status: currentStatus === 'pending' ? 'done' : 'pending' },
    })
  }

  const dailySummary = dailySummaries?.[0]

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header with actions */}
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-sm font-medium text-gray-500">{entry.date}</Text>
            <Text className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.created_at).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              title={isEditing ? tCommon('action.cancel') : tCommon('action.edit')}
              variant="ghost"
              size="sm"
              onPress={isEditing ? () => setIsEditing(false) : handleEdit}
            />
            <Button
              title={tCommon('action.delete')}
              variant="ghost"
              size="sm"
              onPress={handleDelete}
            />
          </View>
        </View>

        {/* Content */}
        {isEditing ? (
          <View className="mb-6">
            <TextInput
              className="border border-gray-200 rounded-xl p-4 text-base text-gray-900 leading-7 min-h-[120px]"
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <View className="mt-3">
              <Button
                title={tCommon('action.save')}
                onPress={handleSaveEdit}
                loading={updateEntry.isPending}
              />
            </View>
          </View>
        ) : (
          <Text className="text-base text-gray-900 leading-7 mb-6">
            {entry.raw_text}
          </Text>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">{tCommon('label.tags')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {entry.tags.map((tag, i) => (
                <Badge key={i} label={tag} variant="indigo" size="md" />
              ))}
            </View>
          </View>
        )}

        {/* Related Todos */}
        {relatedTodos && relatedTodos.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('detail.extractedTodos')}
            </Text>
            {relatedTodos.map((todo) => (
              <Card key={todo.id} className="mb-2" onPress={() => toggleTodo(todo.id, todo.status)}>
                <View className="flex-row items-center">
                  <FontAwesome
                    name={todo.status === 'done' ? 'check-circle' : 'circle-o'}
                    size={18}
                    color={todo.status === 'done' ? '#22c55e' : '#d1d5db'}
                  />
                  <Text
                    className={`ml-2.5 text-sm flex-1 ${
                      todo.status === 'done'
                        ? 'text-gray-400 line-through'
                        : 'text-gray-800'
                    }`}
                  >
                    {todo.text}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Related Daily Summary */}
        {dailySummary && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('detail.dailySummary')}
            </Text>
            <Card
              onPress={() => router.push('/(tabs)/summary')}
              className="bg-indigo-50 border-indigo-100"
            >
              <View className="flex-row items-center">
                <FontAwesome name="file-text-o" size={16} color="#4f46e5" />
                <Text className="ml-2 text-sm text-indigo-700 flex-1" numberOfLines={2}>
                  {dailySummary.text}
                </Text>
                <FontAwesome name="chevron-right" size={12} color="#a5b4fc" />
              </View>
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
