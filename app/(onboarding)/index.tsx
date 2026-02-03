import { useState } from 'react'
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

const STEPS = [
  { emoji: '✏️', ns: 'step1' },
  { emoji: '🤖', ns: 'step2' },
  { emoji: '🏆', ns: 'step3' },
] as const

export default function OnboardingScreen() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const { t } = useTranslation('onboarding')
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  const goToPersona = () => {
    router.push('/(onboarding)/persona' as any)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      goToPersona()
    }
  }

  const current = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Centered content */}
      <View className="flex-1 items-center justify-center px-6">
        <View className={`w-full items-center ${isDesktop ? 'max-w-md bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800' : ''}`}>
          {/* Illustration */}
          <Text className="text-7xl mb-8">{current.emoji}</Text>

          {/* Subtitle */}
          <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">
            {t(`${current.ns}.subtitle`)}
          </Text>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
            {t(`${current.ns}.title`)}
          </Text>

          {/* Description */}
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-10">
            {t(`${current.ns}.description`)}
          </Text>

          {/* Page indicators */}
          <View className="flex-row items-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${
                  i === step
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </View>

          {/* Action button */}
          <TouchableOpacity
            className="w-full bg-indigo-600 dark:bg-indigo-500 py-4 rounded-2xl items-center"
            onPress={next}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              {isLastStep ? t('getStarted') : t('next')}
            </Text>
          </TouchableOpacity>

          {/* Skip — below action button, hidden on last step */}
          {!isLastStep && (
            <TouchableOpacity
              onPress={goToPersona}
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
    </SafeAreaView>
  )
}
