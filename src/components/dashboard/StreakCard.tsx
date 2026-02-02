import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { StreakData } from '@/features/gamification/types'

interface StreakCardProps {
  streak: StreakData
}

export function StreakCard({ streak }: StreakCardProps) {
  const { t } = useTranslation('dashboard')

  return (
    <Card className="flex-1">
      <View className="items-center">
        <Text className="text-3xl mb-1">
          {streak.hasEntryToday ? '🔥' : '💤'}
        </Text>
        <Text className="text-3xl font-bold text-gray-900">
          {streak.currentStreak}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">{t('streak.consecutiveDays')}</Text>
      </View>
      <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
        <View className="items-center flex-1">
          <Text className="text-sm font-semibold text-gray-700">
            {streak.longestStreak}
          </Text>
          <Text className="text-[10px] text-gray-400">{t('streak.longestRecord')}</Text>
        </View>
        <View className="w-px bg-gray-100" />
        <View className="items-center flex-1">
          <Text className="text-sm font-semibold text-gray-700">
            {streak.hasEntryToday ? t('streak.todayDone') : t('streak.todayNotDone')}
          </Text>
          <Text className="text-[10px] text-gray-400">{t('streak.todayLabel')}</Text>
        </View>
      </View>
    </Card>
  )
}
