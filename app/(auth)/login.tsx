import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { showErrorAlert } from '@/lib/errors'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<TextInput>(null)
  const signIn = useAuthStore((s) => s.signIn)
  const { t } = useTranslation('auth')

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('login.alertTitle'), t('login.alertFillFields'))
      return
    }

    setLoading(true)
    try {
      await signIn(username, password)
    } catch (error: unknown) {
      showErrorAlert(t('login.failedTitle'), error)
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
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          Miriel
        </Text>
        <Text className="text-base text-center text-gray-500 dark:text-gray-400 mb-10">
          {t('login.tagline')}
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.username')}</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('login.usernamePlaceholder')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.password')}</Text>
          <TextInput
            ref={passwordRef}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        <TouchableOpacity
          className={`rounded-lg py-3.5 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? t('login.loading') : t('login.button')}
          </Text>
        </TouchableOpacity>

        {/* Find ID / Find Password links */}
        <View className="flex-row justify-center mt-4" style={{ gap: 16 }}>
          <Link href="/(auth)/find-id" asChild>
            <TouchableOpacity>
              <Text className="text-sm text-gray-500 dark:text-gray-400">{t('login.findId')}</Text>
            </TouchableOpacity>
          </Link>
          <Text className="text-sm text-gray-300 dark:text-gray-600">|</Text>
          <Link href="/(auth)/find-password" asChild>
            <TouchableOpacity>
              <Text className="text-sm text-gray-500 dark:text-gray-400">{t('login.findPassword')}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 dark:text-gray-400">{t('login.noAccount')}</Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-indigo-600 dark:text-indigo-400 font-semibold">{t('login.signUpLink')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
