import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/Badge'
import { showErrorAlert } from '@/lib/errors'
import { useUpdateEntry, useDeleteEntry } from '@/features/entry/hooks'
import type { Entry } from '@/features/entry/types'

interface EntryDetailProps {
  entry: Entry
  onDeleted?: () => void
}

export function EntryDetail({ entry, onDeleted }: EntryDetailProps) {
  const { t } = useTranslation('common')
  const { t: tEntry } = useTranslation('entry')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(entry.raw_text)

  const updateEntry = useUpdateEntry()
  const deleteEntryMutation = useDeleteEntry()

  // Reset editing state when entry changes
  useEffect(() => {
    setIsEditing(false)
    setEditText(entry.raw_text)
  }, [entry.id])

  const handleSave = () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    updateEntry.mutate(
      { id: entry.id, input: { raw_text: trimmed } },
      {
        onSuccess: () => setIsEditing(false),
        onError: (error: unknown) => showErrorAlert(tEntry('detail.editFailed'), error),
      },
    )
  }

  const handleDelete = () => {
    Alert.alert(tEntry('detail.deleteTitle'), tEntry('detail.deleteMessage'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete'),
        style: 'destructive',
        onPress: () => {
          deleteEntryMutation.mutate(entry.id, {
            onSuccess: () => onDeleted?.(),
            onError: (error: unknown) => showErrorAlert(tEntry('detail.deleteFailed'), error),
          })
        },
      },
    ])
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-3">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">{entry.date}</Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(entry.created_at).toLocaleString()}
            </Text>
          </View>
          {!isEditing && (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setEditText(entry.raw_text)
                  setIsEditing(true)
                }}
                className="p-2"
                activeOpacity={0.7}
              >
                <FontAwesome name="pencil" size={16} color={isDark ? '#22d3ee' : '#06b6d4'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} className="p-2" activeOpacity={0.7}>
                <FontAwesome name="trash-o" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Body */}
        {isEditing ? (
          <View className="mb-6">
            <TextInput
              className="text-base text-gray-900 dark:text-gray-100 leading-7 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[120px]"
              style={{ backgroundColor: isDark ? '#111827' : '#f9fafb', textAlignVertical: 'top' }}
              multiline
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 items-center"
                onPress={() => {
                  setIsEditing(false)
                  setEditText(entry.raw_text)
                }}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t('action.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 dark:bg-cyan-500 items-center"
                onPress={handleSave}
                disabled={updateEntry.isPending}
                activeOpacity={0.8}
              >
                <Text className="text-sm font-semibold text-white">
                  {t('action.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text className="text-base text-gray-900 dark:text-gray-100 leading-7 mb-6">
            {entry.raw_text}
          </Text>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('label.tags')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {entry.tags.map((tag, i) => (
                <Badge key={i} label={tag} variant="cyan" size="md" />
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
