import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/lib/errors'

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const passwordRef = useRef<TextInput>(null)
  const signIn = useAuthStore((s) => s.signIn)
  const { t } = useTranslation('auth')

  const handleLogin = async () => {
    setErrorText('')

    if (!usernameOrEmail || !password) {
      setErrorText(t('login.alertFillFields'))
      return
    }

    setLoading(true)
    try {
      await signIn(usernameOrEmail, password)
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
        <Image
          source={require('../../assets/images/logo-128.png')}
          className="w-16 h-16 self-center mb-3 rounded-2xl"
        />
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          Miriel
        </Text>
        <Text className="text-base text-center text-gray-500 dark:text-gray-400 mb-10">
          {t('login.tagline')}
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.usernameOrEmail')}</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('login.usernameOrEmailPlaceholder')}
            value={usernameOrEmail}
            onChangeText={(v) => { setUsernameOrEmail(v); setErrorText('') }}
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
            onChangeText={(v) => { setPassword(v); setErrorText('') }}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        {/* Inline error message */}
        {errorText !== '' && (
          <View className="mb-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <Text className="text-sm text-red-600 dark:text-red-400">{errorText}</Text>
          </View>
        )}

        <TouchableOpacity
          className={`rounded-lg py-3.5 ${loading ? 'bg-cyan-400' : 'bg-cyan-600'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? t('login.loading') : t('login.button')}
          </Text>
        </TouchableOpacity>

        {/* Find Password link */}
        <View className="flex-row justify-center mt-4">
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
              <Text className="text-cyan-600 dark:text-cyan-400 font-semibold">{t('login.signUpLink')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
