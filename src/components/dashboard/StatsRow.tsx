import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

interface StatsRowProps {
  totalEntries: number
  todosCompleted: number
  totalSummaries: number
}

interface StatItemProps {
  value: number
  label: string
  emoji: string
}

function StatItem({ value, label, emoji }: StatItemProps) {
  return (
    <View className="items-center flex-1">
      <Text className="text-base mb-0.5">{emoji}</Text>
      <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</Text>
      <Text className="text-[10px] text-gray-400 dark:text-gray-500">{label}</Text>
    </View>
  )
}

export function StatsRow({ totalEntries, todosCompleted, totalSummaries }: StatsRowProps) {
  const { t } = useTranslation('dashboard')

  return (
    <Card>
      <View className="flex-row">
        <StatItem value={totalEntries} label={t('stats.totalEntries')} emoji="📝" />
        <View className="w-px bg-gray-100 dark:bg-gray-800" />
        <StatItem value={todosCompleted} label={t('stats.todosCompleted')} emoji="✅" />
        <View className="w-px bg-gray-100 dark:bg-gray-800" />
        <StatItem value={totalSummaries} label={t('stats.summaries')} emoji="📋" />
      </View>
    </Card>
  )
}
