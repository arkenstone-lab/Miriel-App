import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const signUp = useAuthStore((s) => s.signUp)
  const { t } = useTranslation('auth')

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert(t('signup.alertTitle'), t('signup.alertFillFields'))
      return
    }
    if (password.length < 6) {
      Alert.alert(t('signup.alertTitle'), t('signup.alertPasswordShort'))
      return
    }

    setLoading(true)
    try {
      await signUp(email, password)
      Alert.alert(t('signup.successTitle'), t('signup.successMessage'))
    } catch (error: any) {
      Alert.alert(t('signup.failedTitle'), error.message || t('signup.failedMessage'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
          {t('signup.title')}
        </Text>
        <Text className="text-base text-center text-gray-500 mb-10">
          {t('signup.tagline')}
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">{t('signup.email')}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">{t('signup.password')}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            placeholder={t('signup.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          className={`rounded-lg py-3.5 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? t('signup.loading') : t('signup.button')}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">{t('signup.hasAccount')}</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-indigo-600 font-semibold">{t('signup.loginLink')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
