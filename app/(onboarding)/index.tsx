import { useState } from 'react'
import { View, Text, TouchableOpacity, useWindowDimensions, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSettingsStore } from '@/stores/settingsStore'
import { TimePickerModal } from '@/components/ui/TimePickerModal'

const TOTAL_STEPS = 3

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${pad(m)} ${period}`
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const { t } = useTranslation('onboarding')
  const { t: tSettings } = useTranslation('settings')
  const { width } = useWindowDimensions()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const isDesktop = width >= 768

  // Local state — saved in batch at Step 3
  const [morningTime, setMorningTime] = useState('09:00')
  const [eveningTime, setEveningTime] = useState('21:00')
  const [weeklyDay, setWeeklyDay] = useState(6) // 0=Mon..6=Sun, default Sunday
  const [weeklyTime, setWeeklyTime] = useState('19:00')
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Time picker modal state
  const [morningPickerVisible, setMorningPickerVisible] = useState(false)
  const [eveningPickerVisible, setEveningPickerVisible] = useState(false)
  const [weeklyPickerVisible, setWeeklyPickerVisible] = useState(false)

  const { saveNotificationSettings } = useSettingsStore()

  const handleRequestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Web: always enable at app level; browser permission is best-effort
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      // Enable regardless — web notifications are polling-based demo
      setNotifEnabled(true)
      setPermissionDenied(false)
      return true
    } else {
      const { requestPermissions } = await import('@/lib/notifications')
      const granted = await requestPermissions()
      if (granted) {
        setNotifEnabled(true)
        setPermissionDenied(false)
        return true
      } else {
        setPermissionDenied(true)
        return false
      }
    }
  }

  const proceedFromStep3 = async (enabled: boolean) => {
    await saveNotificationSettings({
      notificationsEnabled: enabled,
      morningNotificationTime: morningTime,
      eveningNotificationTime: eveningTime,
      weeklyReviewDay: weeklyDay,
      weeklyReviewTime: weeklyTime,
    })
    router.push('/(onboarding)/persona' as any)
  }

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
      return
    }

    // Step 3: request permission if not yet decided
    if (!notifEnabled && !permissionDenied) {
      const granted = await handleRequestPermission()
      if (granted) {
        await proceedFromStep3(true)
      }
      // Native: permission denied → user sees "알림 없이 계속"
      return
    }

    // Already decided (granted or denied) → proceed
    await proceedFromStep3(notifEnabled)
  }

  const handleSkip = () => {
    router.push('/(onboarding)/persona' as any)
  }

  const DAY_KEYS = [0, 1, 2, 3, 4, 5, 6] as const

  const emojis = ['🔄', '📅', '🔔']
  const currentEmoji = emojis[step]
  const isLastStep = step === TOTAL_STEPS - 1

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-1 items-center justify-center px-6">
        <View className={`w-full items-center ${isDesktop ? 'max-w-md bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800' : ''}`}>
          {/* Illustration */}
          <Text className="text-7xl mb-6">{currentEmoji}</Text>

          {/* Subtitle */}
          <Text className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide mb-2">
            {t(`step${step + 1}.subtitle`)}
          </Text>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-3">
            {t(`step${step + 1}.title`)}
          </Text>

          {/* Description */}
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-6">
            {t(`step${step + 1}.description`)}
          </Text>

          {/* Step 2: Weekly review day/time picker */}
          {step === 1 && (
            <View className="w-full mb-6">
              {/* Day selector chips */}
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('step2.dayLabel')}
              </Text>
              <View className="flex-row flex-wrap justify-center mb-4" style={{ gap: 6 }}>
                {DAY_KEYS.map((d) => {
                  const selected = weeklyDay === d
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setWeeklyDay(d)}
                      activeOpacity={0.7}
                      className={`px-3.5 py-2 rounded-xl border ${
                        selected
                          ? 'bg-cyan-100 dark:bg-gray-700/40 border-cyan-400 dark:border-cyan-500'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {tSettings(`notifications.daysShort.${d}` as any)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Time selector */}
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('step2.timeLabel')}
              </Text>
              <TouchableOpacity
                className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700"
                onPress={() => setWeeklyPickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text className="text-base text-gray-900 dark:text-gray-100">
                  {formatTime12(weeklyTime)}
                </Text>
                <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Notification time pickers + permission */}
          {step === 2 && (
            <View className="w-full mb-6">
              {/* Morning */}
              <TouchableOpacity
                className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 mb-3"
                onPress={() => setMorningPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <FontAwesome name="sun-o" size={16} color={isDark ? '#fbbf24' : '#f59e0b'} />
                  <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t('step3.morningLabel')}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatTime12(morningTime)}
                </Text>
              </TouchableOpacity>

              {/* Evening */}
              <TouchableOpacity
                className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 mb-4"
                onPress={() => setEveningPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <FontAwesome name="moon-o" size={16} color={isDark ? '#22d3ee' : '#22d3ee'} />
                  <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {t('step3.eveningLabel')}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatTime12(eveningTime)}
                </Text>
              </TouchableOpacity>

              {/* Permission status indicator */}
              {notifEnabled && (
                <View className="w-full bg-green-50 dark:bg-green-900/20 py-3 rounded-xl items-center">
                  <View className="flex-row items-center">
                    <FontAwesome name="check-circle" size={16} color="#22c55e" />
                    <Text className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">
                      {t('step3.permissionGranted')}
                    </Text>
                  </View>
                </View>
              )}

              {permissionDenied && !notifEnabled && (
                <View className="w-full bg-gray-50 dark:bg-gray-800 py-3 rounded-xl items-center">
                  <Text className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    {t('step3.permissionDeniedInline')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Page indicators */}
          <View className="flex-row items-center gap-2 mb-6">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${
                  i === step
                    ? 'w-6 bg-cyan-600 dark:bg-cyan-400'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </View>

          {/* Action button */}
          <TouchableOpacity
            className="w-full bg-cyan-600 dark:bg-cyan-500 py-4 rounded-2xl items-center"
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              {isLastStep && !notifEnabled && !permissionDenied
                ? t('step3.allowAndContinue')
                : isLastStep && permissionDenied && !notifEnabled
                  ? t('step3.continueWithout')
                  : t('next')}
            </Text>
          </TouchableOpacity>

          {/* Skip */}
          {!isLastStep && (
            <TouchableOpacity
              onPress={handleSkip}
              activeOpacity={0.7}
              className="mt-4"
            >
              <Text className="text-sm text-gray-400 dark:text-gray-500">
                {t('skip')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Time Picker Modals */}
      <TimePickerModal
        visible={morningPickerVisible}
        title={tSettings('notifications.morningPickerTitle')}
        value={morningTime}
        onSave={setMorningTime}
        onClose={() => setMorningPickerVisible(false)}
      />
      <TimePickerModal
        visible={eveningPickerVisible}
        title={tSettings('notifications.eveningPickerTitle')}
        value={eveningTime}
        onSave={setEveningTime}
        onClose={() => setEveningPickerVisible(false)}
      />
      <TimePickerModal
        visible={weeklyPickerVisible}
        title={tSettings('notifications.weeklyTimePickerTitle')}
        value={weeklyTime}
        onSave={setWeeklyTime}
        onClose={() => setWeeklyPickerVisible(false)}
      />
    </SafeAreaView>
  )
}
