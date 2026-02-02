import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Entry } from '@/features/entry/types'

interface EntryCardProps {
  entry: Entry
  onPress: () => void
  isSelected?: boolean
}

/** Formats a date string into a localized relative time (e.g. "3m ago", "2h ago"). */
function useRelativeTime() {
  const { t } = useTranslation('common')

  return (dateStr: string): string => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return t('date.justNow')
    if (diffMin < 60) return t('date.minutesAgo', { count: diffMin })
    if (diffHr < 24) return t('date.hoursAgo', { count: diffHr })
    if (diffDay < 7) return t('date.daysAgo', { count: diffDay })
    return date.toLocaleDateString()
  }
}

export function EntryCard({ entry, onPress, isSelected = false }: EntryCardProps) {
  const getRelativeTime = useRelativeTime()

  return (
    <Card
      onPress={onPress}
      className={`mb-3 ${isSelected ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">{entry.date}</Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500">{getRelativeTime(entry.created_at)}</Text>
      </View>
      <Text className="text-base text-gray-900 dark:text-gray-100 leading-6" numberOfLines={3}>
        {entry.raw_text}
      </Text>
      {entry.tags.length > 0 && (
        <View className="flex-row flex-wrap mt-2.5 gap-1.5">
          {entry.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} label={tag} variant="indigo" />
          ))}
          {entry.tags.length > 3 && (
            <Text className="text-xs text-gray-400 dark:text-gray-500 self-center ml-1">
              +{entry.tags.length - 3}
            </Text>
          )}
        </View>
      )}
    </Card>
  )
}
