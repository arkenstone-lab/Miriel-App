import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { apiPublicFetch } from '@/lib/api'
import { AppError, getErrorMessage } from '@/lib/errors'

export default function FindIdScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [resultText, setResultText] = useState('')
  const router = useRouter()
  const { t, i18n } = useTranslation('auth')

  const handleFindId = async () => {
    setErrorText('')
    setResultText('')

    if (!email) {
      setErrorText(t('findId.alertFillEmail'))
      return
    }

    setLoading(true)
    try {
      const data = await apiPublicFetch<{ error?: string; fallback?: boolean; username?: string }>('/auth/send-find-id-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), lang: i18n.language }),
      })

      if (data?.error === 'not_found') {
        setErrorText(t('findId.notFound'))
        return
      }

      if (data?.error) throw new AppError('AUTH_015', data.error)

      // Fallback: RESEND_API_KEY not set, username returned directly
      if (data?.fallback && data?.username) {
        setResultText(t('findId.result', { username: data.username }))
        return
      }

      // Email sent successfully
      setResultText(t('findId.emailSent') + '\n' + t('findId.emailSentDesc'))
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
        <Text className="text-6xl text-center mb-6">🔍</Text>

        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-3">
          {t('findId.title')}
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-8">
          {t('findId.description')}
        </Text>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('findId.email')}</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder="email@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrorText(''); setResultText('') }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={handleFindId}
          />
        </View>

        {/* Inline result message */}
        {resultText !== '' && (
          <View className="mb-3 px-3 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <Text className="text-sm text-cyan-700 dark:text-cyan-300">{resultText}</Text>
          </View>
        )}

        {/* Inline error message */}
        {errorText !== '' && (
          <View className="mb-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <Text className="text-sm text-red-600 dark:text-red-400">{errorText}</Text>
          </View>
        )}

        <TouchableOpacity
          className={`rounded-lg py-3.5 mb-4 ${loading ? 'bg-cyan-400' : 'bg-cyan-600'}`}
          onPress={handleFindId}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? '...' : t('findId.button')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text className="text-sm text-cyan-600 dark:text-cyan-400">
            {t('findId.goToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
