import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const masked = local.charAt(0) + '***'
  return `${masked}@${domain}`
}

export default function FindPasswordScreen() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useTranslation('auth')

  const handleFindPassword = async () => {
    if (!input) {
      Alert.alert(t('findPassword.alertTitle'), t('findPassword.alertFillField'))
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
        if (error) throw error
        if (!data) {
          Alert.alert(t('findPassword.resultTitle'), t('findPassword.notFound'))
          return
        }
        email = data
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error

      Alert.alert(
        t('findPassword.resultTitle'),
        t('findPassword.success', { email: maskEmail(email) }),
      )
    } catch {
      Alert.alert(t('findPassword.resultTitle'), t('findPassword.notFound'))
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
            onChangeText={setInput}
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="done"
            onSubmitEditing={handleFindPassword}
          />
        </View>

        <TouchableOpacity
          className={`rounded-lg py-3.5 mb-4 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
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
          <Text className="text-sm text-indigo-600 dark:text-indigo-400">
            {t('findPassword.goToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
