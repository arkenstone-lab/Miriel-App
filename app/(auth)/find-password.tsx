import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { AppError, getErrorMessage } from '@/lib/errors'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const masked = local.charAt(0) + '***'
  return `${masked}@${domain}`
}

export default function FindPasswordScreen() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [resultText, setResultText] = useState('')
  const router = useRouter()
  const { t } = useTranslation('auth')

  const handleFindPassword = async () => {
    setErrorText('')
    setResultText('')

    if (!input) {
      setErrorText(t('findPassword.alertFillField'))
      return
    }

    setLoading(true)
    try {
      let email: string

      if (input.includes('@')) {
        // Input is an email
        email = input
      } else {
        // Input is a username — resolve to email
        const { data, error } = await supabase.rpc('get_email_by_username', {
          p_username: input,
        })
        if (error) throw new AppError('AUTH_012', error)
        if (!data) {
          setErrorText(t('findPassword.notFound'))
          return
        }
        email = data
      }

      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/reset-password`
        : 'miriel://reset-password'
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw new AppError('AUTH_013', error)

      setResultText(t('findPassword.success', { email: maskEmail(email) }))
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
        <Text className="text-6xl text-center mb-6">🔑</Text>

        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-3">
          {t('findPassword.title')}
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-8">
          {t('findPassword.description')}
        </Text>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('findPassword.usernameOrEmail')}
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('findPassword.placeholder')}
            value={input}
            onChangeText={(v) => { setInput(v); setErrorText(''); setResultText('') }}
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="done"
            onSubmitEditing={handleFindPassword}
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
          onPress={handleFindPassword}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? '...' : t('findPassword.button')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text className="text-sm text-cyan-600 dark:text-cyan-400">
            {t('findPassword.goToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
