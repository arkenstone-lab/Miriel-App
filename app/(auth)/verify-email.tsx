import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { AppError, showErrorAlert } from '@/lib/errors'

const COOLDOWN_SECONDS = 60

export default function VerifyEmailScreen() {
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email?: string }>()
  const { t } = useTranslation('auth')

  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = useCallback(async () => {
    if (!email || resending || cooldown > 0) return

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw new AppError('AUTH_014', error)
      Alert.alert(t('verify.resendSuccessTitle'), t('verify.resendSuccessMessage'))
      setCooldown(COOLDOWN_SECONDS)
    } catch (error: unknown) {
      showErrorAlert(t('verify.resendFailedTitle'), error)
    } finally {
      setResending(false)
    }
  }, [email, resending, cooldown, t])

  const resendDisabled = resending || cooldown > 0

  return (
    <View className="flex-1 bg-white dark:bg-gray-950 justify-center px-8">
      {/* Mail icon */}
      <Text className="text-6xl text-center mb-6">📧</Text>

      {/* Heading */}
      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
        {t('verify.heading')}
      </Text>

      {/* Description */}
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-8">
        {t('verify.description', { email: email || '' })}
      </Text>

      {/* Go to Login */}
      <TouchableOpacity
        className="bg-indigo-600 py-3.5 rounded-lg items-center mb-4"
        onPress={() => router.replace('/(auth)/login')}
        activeOpacity={0.8}
      >
        <Text className="text-white text-center font-semibold text-base">
          {t('verify.goToLogin')}
        </Text>
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity
        activeOpacity={0.7}
        className="items-center"
        onPress={handleResend}
        disabled={resendDisabled}
      >
        <Text className={`text-sm ${resendDisabled ? 'text-gray-300 dark:text-gray-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
          {resending
            ? t('verify.resending')
            : cooldown > 0
              ? t('verify.resendCooldown', { seconds: cooldown })
              : t('verify.resend')}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
