import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { useSummaries } from '@/features/summary/hooks'
import { useEntries } from '@/features/entry/hooks'

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function WeeklyReviewCard() {
  const { data: summaries } = useSummaries('weekly')
  const { data: entries } = useEntries()
  const router = useRouter()
  const { t } = useTranslation('dashboard')

  const currentWeekStart = getMonday(new Date())

  // Find this week's review
  const thisWeekReview = summaries?.find((s) => s.period_start === currentWeekStart)

  // Count entries this week
  const weekEntries = entries?.filter((e) => e.date >= currentWeekStart) || []

  if (thisWeekReview) {
    // Has review — show preview
    return (
      <Card>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('weeklyReview.title')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/summary')}
            activeOpacity={0.7}
          >
            <Text className="text-xs text-cyan-600 dark:text-cyan-400">
              {t('weeklyReview.viewReview')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text
          className="text-sm text-gray-700 dark:text-gray-300 leading-5"
          numberOfLines={3}
        >
          {thisWeekReview.text}
        </Text>
        <View className="flex-row items-center mt-2">
          <FontAwesome name="link" size={10} color="#9ca3af" />
          <Text className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
            {t('weeklyReview.evidenceCount', { count: thisWeekReview.entry_links?.length || 0 })}
          </Text>
        </View>
      </Card>
    )
  }

  // No review yet
  return (
    <Card>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('weeklyReview.title')}
        </Text>
      </View>
      {weekEntries.length > 0 ? (
        <TouchableOpacity
          className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg py-3 px-4 items-center"
          onPress={() => router.push('/(tabs)/summary')}
          activeOpacity={0.7}
        >
          <Text className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
            {t('weeklyReview.generate')}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-sm text-gray-400 dark:text-gray-500">
          {t('weeklyReview.empty')}
        </Text>
      )}
    </Card>
  )
}
