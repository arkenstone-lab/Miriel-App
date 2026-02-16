import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { apiPublicFetch } from '@/lib/api'
import { AppError, getErrorMessage } from '@/lib/errors'

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [successText, setSuccessText] = useState('')
  const [resetToken, setResetToken] = useState('')
  const router = useRouter()
  const params = useLocalSearchParams<{ token?: string }>()
  const { t } = useTranslation('auth')

  // Extract reset token from URL params or hash fragment
  useEffect(() => {
    // Try from search params first
    if (params.token) {
      setResetToken(params.token)
      return
    }

    // Try from URL hash fragment (web only)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash
      const searchParams = new URLSearchParams(hash.replace('#', '?'))
      const token = searchParams.get('token')
      if (token) {
        setResetToken(token)
        return
      }
      // Also check query string
      const urlParams = new URLSearchParams(window.location.search)
      const qToken = urlParams.get('token')
      if (qToken) {
        setResetToken(qToken)
      }
    }
  }, [params.token])

  const sessionReady = resetToken.length > 0

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleReset = async () => {
    setErrorText('')
    setSuccessText('')

    // Password complexity: 8+ chars, at least one uppercase, at least one number
    if (newPassword.length < 8) {
      setErrorText(t('resetPassword.tooShort'))
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorText(t('resetPassword.noUppercase'))
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setErrorText(t('resetPassword.noNumber'))
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorText(t('resetPassword.mismatch'))
      return
    }
    if (!resetToken) {
      setErrorText(t('resetPassword.invalidLink'))
      return
    }

    setLoading(true)
    try {
      const data = await apiPublicFetch<{ error?: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      })
      if (data?.error) throw new AppError('AUTH_016', data.error)

      setSuccessText(t('resetPassword.success'))
    } catch (error: unknown) {
      setErrorText(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-950"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-6xl text-center mb-6">🔐</Text>

        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-3">
          {t('resetPassword.title')}
        </Text>

        {successText ? (
          <>
            <View className="mb-6 px-3 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <Text className="text-sm text-cyan-700 dark:text-cyan-300 text-center">{successText}</Text>
            </View>
            <TouchableOpacity
              className="rounded-lg py-3.5 bg-cyan-600"
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text className="text-white text-center font-semibold text-base">
                {t('resetPassword.goToLogin')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* New Password */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('resetPassword.newPassword')}
              </Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                placeholder={t('resetPassword.newPasswordPlaceholder')}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setErrorText('') }}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
              />
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('resetPassword.confirmPassword')}
              </Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrorText('') }}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
              {mismatch && (
                <Text className="text-xs text-red-500 mt-1">{t('resetPassword.mismatch')}</Text>
              )}
            </View>

            {/* Inline error */}
            {errorText !== '' && (
              <View className="mb-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Text className="text-sm text-red-600 dark:text-red-400">{errorText}</Text>
              </View>
            )}

            <TouchableOpacity
              className={`rounded-lg py-3.5 mb-4 ${loading || !sessionReady ? 'bg-cyan-400' : 'bg-cyan-600'}`}
              onPress={handleReset}
              disabled={loading || !sessionReady}
            >
              <Text className="text-white text-center font-semibold text-base">
                {loading ? '...' : t('resetPassword.button')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center"
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text className="text-sm text-cyan-600 dark:text-cyan-400">
                {t('resetPassword.goToLogin')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
