import { View, Text, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/Badge'
import type { Entry } from '@/features/entry/types'

interface EntryDetailProps {
  entry: Entry
}

export function EntryDetail({ entry }: EntryDetailProps) {
  const { t } = useTranslation('common')

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">{entry.date}</Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(entry.created_at).toLocaleString()}
          </Text>
        </View>

        <Text className="text-base text-gray-900 dark:text-gray-100 leading-7 mb-6">
          {entry.raw_text}
        </Text>

        {entry.tags.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('label.tags')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {entry.tags.map((tag, i) => (
                <Badge key={i} label={tag} variant="indigo" size="md" />
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
