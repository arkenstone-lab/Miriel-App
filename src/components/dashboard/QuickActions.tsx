import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

export function QuickActions() {
  const router = useRouter()
  const { t } = useTranslation('dashboard')

  return (
    <View style={{ gap: 8 }}>
      <Button
        title={t('quickActions.writeToday')}
        onPress={() => router.push('/entries/new')}
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
