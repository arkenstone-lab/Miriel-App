import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'

const THEMES = [
  { code: 'light' as const, emoji: '☀️', key: 'light' },
  { code: 'dark' as const, emoji: '🌙', key: 'dark' },
] as const

export default function SetupThemeScreen() {
  const router = useRouter()
  const { t } = useTranslation('setup')
  const { theme, setTheme } = useSettingsStore()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const currentTheme = theme === 'system' ? 'light' : theme

  const handleSelect = async (selected: 'light' | 'dark') => {
    await setTheme(selected)
  }

  const handleNext = () => {
    router.push('/(setup)/welcome' as any)
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-1 items-center justify-center px-6">
        <View className={`w-full items-center ${isDesktop ? 'max-w-md bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800' : ''}`}>
          <Text className="text-7xl mb-8">🎨</Text>

          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {t('theme.title')}
          </Text>

          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">
            {t('theme.subtitle')}
          </Text>

          <View className="w-full flex-row gap-3 mb-10">
            {THEMES.map((item) => {
              const isSelected = currentTheme === item.code
              return (
                <TouchableOpacity
                  key={item.code}
                  className={`flex-1 items-center py-6 rounded-2xl border-2 ${
                    isSelected
                      ? 'border-cyan-600 dark:border-cyan-400 bg-cyan-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                  onPress={() => handleSelect(item.code)}
                  activeOpacity={0.7}
                >
                  <Text className="text-4xl mb-3">{item.emoji}</Text>
                  <Text className={`text-base font-semibold ${
                    isSelected
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {t(`theme.${item.key}`)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Page indicators */}
          <View className="flex-row items-center gap-2 mb-8">
            <View className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            <View className="w-6 h-2 rounded-full bg-cyan-600 dark:bg-cyan-400" />
            <View className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
          </View>

          <TouchableOpacity
            className="w-full bg-cyan-600 dark:bg-cyan-500 py-4 rounded-2xl items-center"
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
