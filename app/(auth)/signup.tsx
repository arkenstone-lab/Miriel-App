import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/lib/errors'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export default function SignupScreen() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  const emailRef = useRef<TextInput>(null)
  const phoneRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmPasswordRef = useRef<TextInput>(null)

  const router = useRouter()
  const signUp = useAuthStore((s) => s.signUp)
  const { t } = useTranslation('auth')

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSignup = async () => {
    setErrorText('')

    if (!username || !email || !password) {
      setErrorText(t('signup.alertFillFields'))
      return
    }
    if (!USERNAME_REGEX.test(username)) {
      setErrorText(t('signup.alertUsernameFormat'))
      return
    }
    if (password.length < 6) {
      setErrorText(t('signup.alertPasswordShort'))
      return
    }
    if (password !== confirmPassword) {
      setErrorText(t('signup.alertPasswordMismatch'))
      return
    }

    setLoading(true)
    try {
      const result = await signUp({ username, email, phone: phone || undefined, password })
      if (result.needsEmailVerification) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email } })
      }
      // else: session created → onAuthStateChange routes to onboarding
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          {t('signup.title')}
        </Text>
        <Text className="text-base text-center text-gray-500 dark:text-gray-400 mb-10">
          {t('signup.tagline')}
        </Text>

        {/* Username */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.username')}</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('signup.usernamePlaceholder')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
          />
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t('signup.usernameHint')}
          </Text>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.email')}</Text>
          <TextInput
            ref={emailRef}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        {/* Phone (optional) */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('signup.phone')} <Text className="text-gray-400 dark:text-gray-500">({t('signup.optional')})</Text>
          </Text>
          <TextInput
            ref={phoneRef}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('signup.phonePlaceholder')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.password')}</Text>
          <TextInput
            ref={passwordRef}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={t('signup.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        {/* Confirm Password */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.confirmPassword')}</Text>
          <TextInput
            ref={confirmPasswordRef}
            className={`border rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 ${
              passwordMismatch
                ? 'border-red-400 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={t('signup.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setErrorText('') }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignup}
          />
          {passwordMismatch && (
            <Text className="text-xs text-red-500 dark:text-red-400 mt-1">
              {t('signup.alertPasswordMismatch')}
            </Text>
          )}
        </View>

        {/* Inline error message */}
        {errorText !== '' && (
          <View className="mb-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <Text className="text-sm text-red-600 dark:text-red-400">{errorText}</Text>
          </View>
        )}

        <TouchableOpacity
          className={`rounded-lg py-3.5 ${loading ? 'bg-cyan-400' : 'bg-cyan-600'}`}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? t('signup.loading') : t('signup.button')}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6 mb-8">
          <Text className="text-gray-500 dark:text-gray-400">{t('signup.hasAccount')}</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-cyan-600 dark:text-cyan-400 font-semibold">{t('signup.loginLink')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
