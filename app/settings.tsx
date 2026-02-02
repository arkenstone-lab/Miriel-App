import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EditModal } from '@/components/ui/EditModal'

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'ko' | 'en'

export default function SettingsScreen() {
  const { t } = useTranslation('settings')
  const { t: tPrivacy } = useTranslation('privacy')
  const { theme, language, nickname, setTheme, setLanguage, setNickname } = useSettingsStore()
  const { user, signOut } = useAuthStore()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [nicknameModalVisible, setNicknameModalVisible] = useState(false)

  const languageOptions: { label: string; value: 'system' | Language }[] = [
    { label: t('language.system'), value: 'system' },
    { label: t('language.ko'), value: 'ko' },
    { label: t('language.en'), value: 'en' },
  ]

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t('theme.system'), value: 'system' },
    { label: t('theme.light'), value: 'light' },
    { label: t('theme.dark'), value: 'dark' },
  ]

  const handleSignOut = () => {
    Alert.alert(t('account.signOutConfirmTitle'), t('account.signOutConfirmMessage'), [
      { text: t('modal.cancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="max-w-lg w-full mx-auto p-5">
        {/* Language */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('language.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <SegmentedControl
              options={languageOptions}
              value={language ?? 'system'}
              onChange={(v) => setLanguage(v === 'system' ? null : v)}
            />
          </View>
        </View>

        {/* Theme */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('theme.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <SegmentedControl
              options={themeOptions}
              value={theme}
              onChange={setTheme}
            />
          </View>
        </View>

        {/* Account */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('account.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => setNicknameModalVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="user-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">{t('account.nickname')}</Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {nickname || t('account.nicknamePlaceholder')}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            <View className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <FontAwesome name="envelope-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">{t('account.email')}</Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">{user?.email ?? '—'}</Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5"
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <FontAwesome name="sign-out" size={16} color="#ef4444" />
              <Text className="ml-3 text-sm text-red-500">{t('account.signOut')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy & Data */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('privacy.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <View className="flex-row items-start mb-2">
              <FontAwesome name="shield" size={18} color={isDark ? '#818cf8' : '#4f46e5'} style={{ marginTop: 2 }} />
              <Text className="ml-3 text-base font-semibold text-gray-900 dark:text-gray-100">
                {tPrivacy('notice.title')}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 dark:text-gray-300 leading-5">
              {tPrivacy('notice.body')}
            </Text>
          </View>
        </View>

        {/* Version */}
        <Text className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 mb-8">
          {t('version')} 0.1.0
        </Text>
      </View>

      {/* Nickname Edit Modal */}
      <EditModal
        visible={nicknameModalVisible}
        title={t('account.nickname')}
        value={nickname}
        placeholder={t('account.nicknamePlaceholder')}
        maxLength={20}
        onSave={setNickname}
        onClose={() => setNicknameModalVisible(false)}
      />
    </ScrollView>
  )
}
