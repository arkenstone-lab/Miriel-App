import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'

const LANGUAGES = [
  { code: 'ko' as const, label: '한국어', flag: '🇰🇷' },
  { code: 'en' as const, label: 'English', flag: '🇺🇸' },
]

export default function SetupLanguageScreen() {
  const router = useRouter()
  const { t, i18n } = useTranslation('setup')
  const { setLanguage } = useSettingsStore()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const currentLang = i18n.language === 'ko' ? 'ko' : 'en'

  const handleSelect = async (lang: 'ko' | 'en') => {
    await setLanguage(lang)
  }

  const handleNext = () => {
    router.push('/(setup)/theme' as any)
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-1 items-center justify-center px-6">
        <View className={`w-full items-center ${isDesktop ? 'max-w-md bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800' : ''}`}>
          <Text className="text-7xl mb-8">🌐</Text>

          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {t('language.title')}
          </Text>

          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">
            {t('language.subtitle')}
          </Text>

          <View className="w-full gap-3 mb-10">
            {LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code
              return (
                <TouchableOpacity
                  key={lang.code}
                  className={`w-full flex-row items-center px-5 py-4 rounded-2xl border-2 ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl mr-4">{lang.flag}</Text>
                  <Text className={`text-lg font-semibold ${
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <View className="ml-auto w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-400 items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Page indicators */}
          <View className="flex-row items-center gap-2 mb-8">
            <View className="w-6 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            <View className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            <View className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
          </View>

          <TouchableOpacity
            className="w-full bg-indigo-600 dark:bg-indigo-500 py-4 rounded-2xl items-center"
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              {t('next')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
