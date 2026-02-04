import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useSettingsStore } from '@/stores/settingsStore'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${pad(m)} ${period}`
}

export default function OnboardingCompleteScreen() {
  const router = useRouter()
  const { t } = useTranslation('onboarding')
  const { t: tSettings } = useTranslation('settings')
  const { width } = useWindowDimensions()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const isDesktop = width >= 768

  const {
    notificationsEnabled,
    morningNotificationTime,
    eveningNotificationTime,
    weeklyReviewDay,
    weeklyReviewTime,
  } = useSettingsStore()

  const handleStart = () => {
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-1 items-center justify-center px-6">
        <View className={`w-full items-center ${isDesktop ? 'max-w-md bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800' : ''}`}>
          {/* Celebration emoji */}
          <Text className="text-7xl mb-6">🎉</Text>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {t('complete.title')}
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8">
            {t('complete.subtitle')}
          </Text>

          {/* Settings summary */}
          {notificationsEnabled ? (
            <View className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-8" style={{ gap: 10 }}>
              <View className="flex-row items-center">
                <FontAwesome name="sun-o" size={16} color={isDark ? '#fbbf24' : '#f59e0b'} />
                <Text className="ml-3 text-sm text-gray-600 dark:text-gray-300 flex-1">
                  {t('complete.morningAlarm')}
                </Text>
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatTime12(morningNotificationTime)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <FontAwesome name="moon-o" size={16} color={isDark ? '#22d3ee' : '#22d3ee'} />
                <Text className="ml-3 text-sm text-gray-600 dark:text-gray-300 flex-1">
                  {t('complete.eveningAlarm')}
                </Text>
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatTime12(eveningNotificationTime)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <FontAwesome name="calendar" size={16} color={isDark ? '#22d3ee' : '#06b6d4'} />
                <Text className="ml-3 text-sm text-gray-600 dark:text-gray-300 flex-1">
                  {t('complete.weeklyReview')}
                </Text>
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {tSettings(`notifications.daysShort.${weeklyReviewDay}` as any)} {formatTime12(weeklyReviewTime)}
                </Text>
              </View>
            </View>
          ) : (
            <View className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-8 items-center">
              <Text className="text-sm text-gray-400 dark:text-gray-500">
                {t('complete.notificationsOff')}
              </Text>
            </View>
          )}

          {/* Start button */}
          <TouchableOpacity
            className="w-full bg-cyan-600 dark:bg-cyan-500 py-4 rounded-2xl items-center"
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              {t('complete.startRecording')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
