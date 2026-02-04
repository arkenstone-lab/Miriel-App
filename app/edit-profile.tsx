import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { pickImageForAvatar, uploadAvatar, deleteAvatar } from '@/lib/avatar'
import { AppError, showErrorAlert } from '@/lib/errors'
import { AvatarCropModal } from '@/components/ui/AvatarCropModal'

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

  // Web crop modal state
  const [cropSource, setCropSource] = useState('')
  const [showCropModal, setShowCropModal] = useState(false)

  const toggleInterest = (key: string) => {
    setLocalInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const doUpload = async (uri: string, mimeType?: string) => {
    if (!user) return
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, uri, mimeType)
      setLocalAvatarUrl(url)
      await setAvatarUrl(url)
    } catch (error: unknown) {
      showErrorAlert('', error)
    } finally {
      setUploading(false)
    }
  }

  const handlePickAvatar = async () => {
    if (!user) return
    try {
      const asset = await pickImageForAvatar()
      if (!asset) return

      if (Platform.OS === 'web') {
        // Show crop modal on web (allowsEditing doesn't work)
        setCropSource(asset.uri)
        setShowCropModal(true)
      } else {
        // Native: already cropped by system image picker
        await doUpload(asset.uri, asset.mimeType || undefined)
      }
    } catch (error: unknown) {
      showErrorAlert('', error)
    }
  }

  const handleCropComplete = async (croppedUri: string) => {
    setShowCropModal(false)
    await doUpload(croppedUri, 'image/jpeg')
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
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace('/(tabs)' as any)
      }
    } catch (error: unknown) {
      showErrorAlert('', new AppError('PROFILE_002', error))
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
              <View className="w-24 h-24 rounded-full bg-cyan-100 dark:bg-gray-700/40 items-center justify-center">
                <Text className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">
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
              <Text className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
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
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {t('profile.photoSizeHint')}
          </Text>
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
                      ? 'bg-cyan-50 dark:bg-gray-800/50 border-cyan-400 dark:border-cyan-500'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selected
                        ? 'text-cyan-600 dark:text-cyan-400'
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
                      ? 'bg-cyan-50 dark:bg-gray-800/50 border-cyan-400 dark:border-cyan-500'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selected
                        ? 'text-cyan-600 dark:text-cyan-400'
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
          className={`w-full py-4 rounded-2xl items-center ${saving ? 'bg-cyan-400' : 'bg-cyan-600 dark:bg-cyan-500'}`}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text className="text-base font-semibold text-white">
            {saving ? '...' : t('modal.save')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Web crop modal */}
      <AvatarCropModal
        visible={showCropModal}
        imageUri={cropSource}
        onCrop={handleCropComplete}
        onCancel={() => setShowCropModal(false)}
      />
    </ScrollView>
  )
}
