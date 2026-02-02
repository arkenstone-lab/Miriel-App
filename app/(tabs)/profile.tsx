import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useGamificationStats } from '@/features/gamification/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { LevelProgressCard } from '@/components/dashboard/LevelProgressCard'
import { BadgeGrid } from '@/components/dashboard/BadgeGrid'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { PrivacyNotice } from '@/components/PrivacyNotice'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EditModal } from '@/components/ui/EditModal'
import { LoadingState } from '@/components/ui/LoadingState'

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'ko' | 'en'

export default function ProfileScreen() {
  const { t } = useTranslation('settings')
  const { t: tPrivacy } = useTranslation('privacy')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { isDesktop } = useResponsiveLayout()

  const { theme, language, nickname, setTheme, setLanguage, setNickname } = useSettingsStore()
  const { user, signOut } = useAuthStore()
  const { data: stats, isLoading } = useGamificationStats()

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

  if (isLoading || !stats) return <LoadingState />

  const displayName = nickname || user?.email?.split('@')[0] || '?'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className={`w-full mx-auto ${isDesktop ? 'max-w-lg' : ''} px-5 pt-6 pb-10`}>
        {/* User Info */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {initial}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setNicknameModalVisible(true)}
            activeOpacity={0.7}
            className="flex-row items-center"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {nickname || t('account.nicknamePlaceholder')}
            </Text>
            <FontAwesome
              name="pencil"
              size={14}
              color={isDark ? '#818cf8' : '#4f46e5'}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {user?.email ?? ''}
          </Text>
        </View>

        {/* Activity */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('profile.activity')}
          </Text>
          <View className="flex-row mb-3" style={{ gap: 8 }}>
            <StreakCard streak={stats.streak} />
            <LevelProgressCard level={stats.level} />
          </View>
          <StatsRow
            totalEntries={stats.totalEntries}
            todosCompleted={stats.todosCompleted}
            totalSummaries={stats.totalSummaries}
          />
          <View className="mt-3">
            <BadgeGrid badges={stats.badges} />
          </View>
        </View>

        {/* Settings */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('profile.settings')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 mb-3">
            <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              {t('language.title')}
            </Text>
            <SegmentedControl
              options={languageOptions}
              value={language ?? 'system'}
              onChange={(v) => setLanguage(v === 'system' ? null : v)}
            />
          </View>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              {t('theme.title')}
            </Text>
            <SegmentedControl
              options={themeOptions}
              value={theme}
              onChange={setTheme}
            />
          </View>
        </View>

        {/* Privacy */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('profile.privacyData')}
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

        {/* Sign Out + Version */}
        <TouchableOpacity
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-3.5 items-center mb-4"
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text className="text-sm font-semibold text-red-500">{t('account.signOut')}</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 dark:text-gray-500 mb-4">
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
