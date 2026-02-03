import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { AppError, showErrorAlert } from '@/lib/errors'

export default function FindIdScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useTranslation('auth')

  const handleFindId = async () => {
    if (!email) {
      Alert.alert(t('findId.alertTitle'), t('findId.alertFillEmail'))
      return
    }

    setLoading(true)
    try {
      const { data: username, error } = await supabase.rpc('get_username_by_email', {
        p_email: email,
      })
      if (error) throw new AppError('AUTH_011', error)

      if (username) {
        Alert.alert(t('findId.resultTitle'), t('findId.result', { username }))
      } else {
        Alert.alert(t('findId.resultTitle'), t('findId.notFound'))
      }
    } catch (error: unknown) {
      showErrorAlert(t('findId.resultTitle'), error)
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
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={handleFindId}
          />
        </View>

        <TouchableOpacity
          className={`rounded-lg py-3.5 mb-4 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
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
          <Text className="text-sm text-indigo-600 dark:text-indigo-400">
            {t('findId.goToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
