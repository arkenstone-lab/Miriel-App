import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { StreakData } from '@/features/gamification/types'

interface TodayReminderBannerProps {
  streak: StreakData
}

export function TodayReminderBanner({ streak }: TodayReminderBannerProps) {
  const router = useRouter()
  const { t } = useTranslation('dashboard')

  if (streak.hasEntryToday) return null

  const message = streak.currentStreak > 0
    ? t('reminder.streakMessage', { count: streak.currentStreak })
    : t('reminder.startMessage')

  return (
    <TouchableOpacity
      className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 flex-row items-center"
      onPress={() => router.push('/entries/new')}
      activeOpacity={0.7}
    >
      <Text className="text-lg mr-2">⏰</Text>
      <View className="flex-1">
        <Text className="text-sm font-medium text-amber-800 dark:text-amber-200">{message}</Text>
        <Text className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t('reminder.tapToStart')}</Text>
      </View>
    </TouchableOpacity>
  )
}
