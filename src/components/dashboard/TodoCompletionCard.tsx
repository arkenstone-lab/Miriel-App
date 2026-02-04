import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

interface TodoCompletionCardProps {
  completed: number
  total: number
}

export function TodoCompletionCard({ completed, total }: TodoCompletionCardProps) {
  const { t } = useTranslation('settings')
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card>
      <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
        {t('profile.todoCompletion')}
      </Text>
      <View className="flex-row items-center mb-2">
        <Text className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
          {percent}%
        </Text>
      </View>
      <View className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <View
          className="h-full bg-cyan-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </View>
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        {t('profile.completedOf', { completed, total })}
      </Text>
    </Card>
  )
}
