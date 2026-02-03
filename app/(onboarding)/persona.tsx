import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'

const GENDER_OPTIONS = ['male', 'female'] as const

const INTEREST_KEYS = [
  'tech', 'design', 'business', 'marketing',
  'data', 'selfDev', 'health', 'other',
] as const

export default function PersonaScreen() {
  const router = useRouter()
  const { t } = useTranslation('onboarding')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  const {
    nickname, gender, occupation, interests,
    savePersona, acknowledgeOnboarding,
  } = useSettingsStore()

  const [localNickname, setLocalNickname] = useState(nickname)
  const [localGender, setLocalGender] = useState(gender)
  const [localOccupation, setLocalOccupation] = useState(occupation)
  const [localInterests, setLocalInterests] = useState<string[]>(interests)

  const toggleInterest = (key: string) => {
    setLocalInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleDone = async () => {
    await savePersona({
      nickname: localNickname,
      gender: localGender,
      occupation: localOccupation,
      interests: localInterests,
    })
    await acknowledgeOnboarding()
    router.replace('/(tabs)')
  }

  const handleSkip = async () => {
    await acknowledgeOnboarding()
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className={`w-full ${isDesktop ? 'max-w-md self-center' : ''}`}>
          {/* Header */}
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {t('persona.title')}
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8">
            {t('persona.subtitle')}
          </Text>

          {/* Nickname */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('persona.nickname')}
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
              placeholder={t('persona.nicknamePlaceholder')}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={localNickname}
              onChangeText={setLocalNickname}
              maxLength={20}
              returnKeyType="next"
            />
          </View>

          {/* Gender */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('persona.gender')}
            </Text>
            <View className="flex-row" style={{ gap: 8 }}>
              {GENDER_OPTIONS.map((g) => {
                const selected = localGender === g
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setLocalGender(selected ? '' : g)}
                    activeOpacity={0.7}
                    className={`flex-1 py-3 rounded-xl items-center border ${
                      selected
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-500'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {t(`persona.gender${g.charAt(0).toUpperCase() + g.slice(1)}` as any)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Occupation */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('persona.occupation')}
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
              placeholder={t('persona.occupationPlaceholder')}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={localOccupation}
              onChangeText={setLocalOccupation}
              returnKeyType="done"
            />
          </View>

          {/* Interests */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('persona.interests')}
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {INTEREST_KEYS.map((key) => {
                const selected = localInterests.includes(key)
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleInterest(key)}
                    activeOpacity={0.7}
                    className={`px-4 py-2.5 rounded-full border ${
                      selected
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-500'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {t(`persona.interestOptions.${key}` as any)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Done button */}
          <TouchableOpacity
            className="w-full bg-indigo-600 dark:bg-indigo-500 py-4 rounded-2xl items-center"
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              {t('persona.done')}
            </Text>
          </TouchableOpacity>

          {/* Skip for now */}
          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            className="mt-4 items-center"
          >
            <Text className="text-sm text-gray-400 dark:text-gray-500">
              {t('persona.skipForNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
