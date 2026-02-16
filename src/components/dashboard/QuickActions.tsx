import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useTodayEntry } from '@/features/entry/hooks'

export function QuickActions() {
  const router = useRouter()
  const { t } = useTranslation('dashboard')
  const { data: todayEntry } = useTodayEntry()

  // Navigate to existing entry if today's entry exists, otherwise create new
  const handleEntryPress = () => {
    if (todayEntry) {
      router.push(`/entries/${todayEntry.id}`)
    } else {
      router.push('/entries/new')
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Button
        title={todayEntry ? t('quickActions.viewTodayEntry') : t('quickActions.writeToday')}
        onPress={handleEntryPress}
        size="lg"
        className="w-full"
      />
      <View className="flex-row" style={{ gap: 8 }}>
        <Button
          title={t('quickActions.viewDailySummary')}
          variant="secondary"
          onPress={() => router.push('/(tabs)/summary')}
          size="sm"
          className="flex-1"
        />
        <Button
          title={t('quickActions.checkTodos')}
          variant="secondary"
          onPress={() => router.push('/(tabs)/todos')}
          size="sm"
          className="flex-1"
        />
      </View>
    </View>
  )
}
