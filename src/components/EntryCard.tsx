import { View, Text } from 'react-native'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Entry } from '@/features/entry/types'

interface EntryCardProps {
  entry: Entry
  onPress: () => void
  isSelected?: boolean
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHr < 24) return `${diffHr}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function EntryCard({ entry, onPress, isSelected = false }: EntryCardProps) {
  return (
    <Card
      onPress={onPress}
      className={`mb-3 ${isSelected ? 'border-indigo-300 bg-indigo-50' : ''}`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-medium text-gray-500">{entry.date}</Text>
        <Text className="text-xs text-gray-400">{getRelativeTime(entry.created_at)}</Text>
      </View>
      <Text className="text-base text-gray-900 leading-6" numberOfLines={3}>
        {entry.raw_text}
      </Text>
      {entry.tags.length > 0 && (
        <View className="flex-row flex-wrap mt-2.5 gap-1.5">
          {entry.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} label={tag} variant="indigo" />
          ))}
          {entry.tags.length > 3 && (
            <Text className="text-xs text-gray-400 self-center ml-1">
              +{entry.tags.length - 3}
            </Text>
          )}
        </View>
      )}
    </Card>
  )
}
