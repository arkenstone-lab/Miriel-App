import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { useSummaries } from '@/features/summary/hooks'

export function RecentSummaryCard() {
  const { data: summaries } = useSummaries('daily')
  const router = useRouter()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')

  const latest = summaries?.[0]

  if (!latest) {
    return (
      <Card>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('recentSummary.title')}</Text>
        </View>
        <Text className="text-sm text-gray-400 dark:text-gray-500">
          {t('recentSummary.empty')}
        </Text>
      </Card>
    )
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('recentSummary.title')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/summary')}
          activeOpacity={0.7}
        >
          <Text className="text-xs text-indigo-600 dark:text-indigo-400">{tCommon('action.seeMore')}</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{latest.period_start}</Text>
      <Text className="text-sm text-gray-700 dark:text-gray-300 leading-5" numberOfLines={3}>
        {latest.text}
      </Text>
      <View className="flex-row items-center mt-2">
        <FontAwesome name="link" size={10} color="#9ca3af" />
        <Text className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
          {t('recentSummary.evidenceCount', { count: latest.entry_links?.length || 0 })}
        </Text>
      </View>
    </Card>
  )
}
