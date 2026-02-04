import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'

export default function SetupWelcomeScreen() {
  const router = useRouter()
  const { t } = useTranslation('setup')
  const { completeSetup } = useSettingsStore()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  const handleSignUp = async () => {
    await completeSetup()
    router.replace('/(auth)/signup' as any)
  }

  const handleSignIn = async () => {
    await completeSetup()
    router.replace('/(auth)/login' as any)
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-1 items-center justify-center px-6">
        <View className={`w-full items-center ${isDesktop ? 'max-w-md bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800' : ''}`}>
          <Text className="text-7xl mb-8">✨</Text>

          <Text className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 text-center mb-2">
            Miriel
          </Text>

          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {t('welcome.title')}
          </Text>

          <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-10">
            {t('welcome.subtitle')}
          </Text>

          {/* Page indicators */}
          <View className="flex-row items-center gap-2 mb-8">
            <View className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            <View className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            <View className="w-6 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          </View>

          <TouchableOpacity
            className="w-full bg-indigo-600 dark:bg-indigo-500 py-4 rounded-2xl items-center mb-3"
            onPress={handleSignUp}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              {t('welcome.signUp')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full border-2 border-indigo-600 dark:border-indigo-400 py-4 rounded-2xl items-center"
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
              {t('welcome.signIn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
