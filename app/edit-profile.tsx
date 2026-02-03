import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { pickAndUploadAvatar, deleteAvatar } from '@/lib/avatar'

const GENDER_OPTIONS = ['male', 'female'] as const

const INTEREST_KEYS = [
  'tech', 'design', 'business', 'marketing',
  'data', 'selfDev', 'health', 'other',
] as const

export default function EditProfileScreen() {
  const router = useRouter()
  const { t } = useTranslation('settings')
  const { t: tOnboarding } = useTranslation('onboarding')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const {
    nickname, gender, occupation, interests, avatarUrl,
    savePersona, setAvatarUrl,
  } = useSettingsStore()
  const { user } = useAuthStore()

  const [localNickname, setLocalNickname] = useState(nickname)
  const [localGender, setLocalGender] = useState(gender)
  const [localOccupation, setLocalOccupation] = useState(occupation)
  const [localInterests, setLocalInterests] = useState<string[]>([...interests])
  const [localAvatarUrl, setLocalAvatarUrl] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggleInterest = (key: string) => {
    setLocalInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handlePickAvatar = async () => {
    if (!user) return
    setUploading(true)
    try {
      const url = await pickAndUploadAvatar(user.id)
      if (url) {
        setLocalAvatarUrl(url)
        await setAvatarUrl(url)
      }
    } catch {
      Alert.alert('Error', 'Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    setUploading(true)
    try {
      await deleteAvatar(user.id)
      setLocalAvatarUrl('')
      await setAvatarUrl('')
    } catch {
      // Ignore delete errors
    } finally {
      setUploading(false)
      Alert.alert('', t('profile.photoRemoved'))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePersona({
        nickname: localNickname,
        gender: localGender,
        occupation: localOccupation,
        interests: localInterests,
      })
      router.back()
    } catch {
      Alert.alert('Error', 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const { username } = useSettingsStore()
  const displayName = localNickname || username || '?'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-lg self-center">
        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="relative mb-3">
            {localAvatarUrl ? (
              <Image
                source={{ uri: localAvatarUrl }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center">
                <Text className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  {initial}
                </Text>
              </View>
            )}
            {uploading && (
              <View className="absolute inset-0 w-24 h-24 rounded-full bg-black/40 items-center justify-center">
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
          </View>
          <View className="flex-row" style={{ gap: 12 }}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
              <Text className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {t('profile.changePhoto')}
              </Text>
            </TouchableOpacity>
            {localAvatarUrl ? (
              <TouchableOpacity onPress={handleRemoveAvatar} activeOpacity={0.7}>
                <Text className="text-sm font-medium text-red-500">
                  {t('profile.removePhoto')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Nickname */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {tOnboarding('persona.nickname')}
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={tOnboarding('persona.nicknamePlaceholder')}
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={localNickname}
            onChangeText={setLocalNickname}
            maxLength={20}
          />
        </View>

        {/* Gender */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {tOnboarding('persona.gender')}
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
                    {tOnboarding(`persona.gender${g.charAt(0).toUpperCase() + g.slice(1)}` as any)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Occupation */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {tOnboarding('persona.occupation')}
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
            placeholder={tOnboarding('persona.occupationPlaceholder')}
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={localOccupation}
            onChangeText={setLocalOccupation}
          />
        </View>

        {/* Interests */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {tOnboarding('persona.interests')}
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
                    {tOnboarding(`persona.interestOptions.${key}` as any)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          className={`w-full py-4 rounded-2xl items-center ${saving ? 'bg-indigo-400' : 'bg-indigo-600 dark:bg-indigo-500'}`}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text className="text-base font-semibold text-white">
            {saving ? '...' : t('modal.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
