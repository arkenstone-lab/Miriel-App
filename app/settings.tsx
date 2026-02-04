import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { AppError, showErrorAlert } from '@/lib/errors'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EditModal } from '@/components/ui/EditModal'
import { TimePickerModal } from '@/components/ui/TimePickerModal'
import { DayPickerModal } from '@/components/ui/DayPickerModal'
import { LegalModal } from '@/components/ui/LegalModal'
import { useAiPreferences, useUpsertAiPreferences } from '@/features/ai-preferences/hooks'

const SUPPORT_LINKS = {
  homepage: 'https://miriel.app',
  telegram: 'https://t.me/mirielapp',
  discord: 'https://discord.gg/mirielapp',
  x: 'https://x.com/mirielapp',
} as const

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'ko' | 'en'

export default function SettingsScreen() {
  const { t } = useTranslation('settings')
  const { t: tPrivacy } = useTranslation('privacy')
  const {
    theme, language, nickname, username, phone,
    setTheme, setLanguage, setNickname, setPhone, setEmail, changePassword,
    notificationsEnabled, morningNotificationTime, eveningNotificationTime,
    weeklyReviewDay, weeklyReviewTime,
    setNotificationsEnabled, setMorningNotificationTime, setEveningNotificationTime,
    setWeeklyReviewDay, setWeeklyReviewTime,
  } = useSettingsStore()
  const { user, signOut } = useAuthStore()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [nicknameModalVisible, setNicknameModalVisible] = useState(false)
  const [emailModalVisible, setEmailModalVisible] = useState(false)
  const [phoneModalVisible, setPhoneModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [morningPickerVisible, setMorningPickerVisible] = useState(false)
  const [eveningPickerVisible, setEveningPickerVisible] = useState(false)
  const [weeklyDayPickerVisible, setWeeklyDayPickerVisible] = useState(false)
  const [weeklyTimePickerVisible, setWeeklyTimePickerVisible] = useState(false)
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null)
  const [styleModalVisible, setStyleModalVisible] = useState(false)
  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false)

  // AI Personalization
  const { data: aiPrefs, isLoading: aiPrefsLoading } = useAiPreferences()
  const upsertAiPrefs = useUpsertAiPreferences()

  const FOCUS_AREA_KEYS = [
    'projectMgmt', 'selfDev', 'workEfficiency',
    'communication', 'health', 'learning',
  ] as const

  const handleAiPrefToggle = (field: 'share_persona', value: boolean) => {
    upsertAiPrefs.mutate({ [field]: value })
  }

  const handleStyleSave = async (value: string) => {
    try {
      await upsertAiPrefs.mutateAsync({ summary_style: value })
    } catch (error: unknown) {
      showErrorAlert(t('aiPersonalization.title'), error)
      throw error
    }
  }

  const handleInstructionsSave = async (value: string) => {
    try {
      await upsertAiPrefs.mutateAsync({ custom_instructions: value })
    } catch (error: unknown) {
      showErrorAlert(t('aiPersonalization.title'), error)
      throw error
    }
  }

  const toggleFocusArea = (key: string) => {
    const label = t(`aiPersonalization.focusOptions.${key}` as any)
    const current = aiPrefs?.focus_areas || []
    const next = current.includes(label)
      ? current.filter((a) => a !== label)
      : [...current, label]
    upsertAiPrefs.mutate({ focus_areas: next })
  }

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

  const formatTimeDisplay = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`
  }

  const handleNotificationToggle = async (enabled: boolean) => {
    await setNotificationsEnabled(enabled)
    const current = useSettingsStore.getState().notificationsEnabled
    if (enabled && !current) {
      Alert.alert(t('notifications.title'), t('notifications.permissionDenied'))
    }
  }

  const handleEmailSave = async (newEmail: string) => {
    try {
      await setEmail(newEmail.trim())
      Alert.alert('', t('account.emailChanged'))
    } catch (error: unknown) {
      showErrorAlert(t('account.title'), error)
      throw error // Keep modal open on error
    }
  }

  const handlePhoneSave = async (newPhone: string) => {
    try {
      await setPhone(newPhone)
      Alert.alert('', t('account.phoneChanged'))
    } catch (error: unknown) {
      showErrorAlert(t('account.title'), error)
      throw error
    }
  }

  const handlePasswordSave = async (newPassword: string) => {
    if (newPassword.length < 6) {
      const err = new AppError('SETTINGS_003')
      showErrorAlert(t('account.title'), err)
      throw err
    }
    try {
      await changePassword(newPassword)
      Alert.alert('', t('account.passwordChanged'))
    } catch (error: unknown) {
      showErrorAlert(t('account.title'), error)
      throw error
    }
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

        {/* Notifications */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('notifications.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {/* Toggle */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <FontAwesome name="bell-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">
                {t('notifications.enable')}
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#818cf8' }}
                thumbColor={notificationsEnabled ? '#4f46e5' : '#f4f3f4'}
              />
            </View>
            {/* Morning */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 ${
                !notificationsEnabled ? 'opacity-40' : ''
              }`}
              disabled={!notificationsEnabled}
              onPress={() => setMorningPickerVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="sun-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.morning')}
              </Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {formatTimeDisplay(morningNotificationTime)}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {/* Evening */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 ${
                !notificationsEnabled ? 'opacity-40' : ''
              }`}
              disabled={!notificationsEnabled}
              onPress={() => setEveningPickerVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="moon-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.evening')}
              </Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {formatTimeDisplay(eveningNotificationTime)}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {/* Weekly Review Section Divider */}
            <View className={`px-4 py-2 bg-gray-50 dark:bg-gray-800 ${!notificationsEnabled ? 'opacity-40' : ''}`}>
              <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                {t('notifications.weeklyReviewSection')}
              </Text>
            </View>
            {/* Weekly Day */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 ${
                !notificationsEnabled ? 'opacity-40' : ''
              }`}
              disabled={!notificationsEnabled}
              onPress={() => setWeeklyDayPickerVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="calendar" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.weeklyDay')}
              </Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {t(`notifications.days.${weeklyReviewDay}` as any)}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {/* Weekly Time */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3.5 ${
                !notificationsEnabled ? 'opacity-40' : ''
              }`}
              disabled={!notificationsEnabled}
              onPress={() => setWeeklyTimePickerVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="clock-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.weeklyTime')}
              </Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {formatTimeDisplay(weeklyReviewTime)}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Personalization */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('aiPersonalization.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {aiPrefsLoading ? (
              <View className="px-4 py-6 items-center">
                <ActivityIndicator size="small" color={isDark ? '#818cf8' : '#4f46e5'} />
              </View>
            ) : (
              <>
                {/* Share Persona Toggle */}
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <FontAwesome name="user-circle-o" size={16} color="#9ca3af" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-900 dark:text-gray-100">
                      {t('aiPersonalization.sharePersona')}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {t('aiPersonalization.sharePersonaDesc')}
                    </Text>
                  </View>
                  <Switch
                    value={aiPrefs?.share_persona ?? true}
                    onValueChange={(v) => handleAiPrefToggle('share_persona', v)}
                    trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#818cf8' }}
                    thumbColor={(aiPrefs?.share_persona ?? true) ? '#4f46e5' : '#f4f3f4'}
                  />
                </View>

                {/* Summary Style */}
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
                  onPress={() => setStyleModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="magic" size={16} color="#9ca3af" />
                  <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('aiPersonalization.summaryStyle')}
                  </Text>
                  <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100" numberOfLines={1} style={{ maxWidth: 150 }}>
                    {aiPrefs?.summary_style || t('aiPersonalization.summaryStylePlaceholder')}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {/* Focus Areas */}
                <View className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                  <View className="flex-row items-center mb-2">
                    <FontAwesome name="crosshairs" size={16} color="#9ca3af" />
                    <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                      {t('aiPersonalization.focusAreas')}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {FOCUS_AREA_KEYS.map((key) => {
                      const label = t(`aiPersonalization.focusOptions.${key}` as any)
                      const selected = (aiPrefs?.focus_areas || []).includes(label)
                      return (
                        <TouchableOpacity
                          key={key}
                          className={`px-3 py-1.5 rounded-full border ${
                            selected
                              ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                          onPress={() => toggleFocusArea(key)}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              selected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>

                {/* Custom Instructions */}
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3.5"
                  onPress={() => setInstructionsModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="pencil" size={16} color="#9ca3af" />
                  <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400 flex-1">
                    {t('aiPersonalization.customInstructions')}
                  </Text>
                  <Text className="text-sm text-gray-900 dark:text-gray-100" numberOfLines={1} style={{ maxWidth: 120 }}>
                    {aiPrefs?.custom_instructions
                      ? `${aiPrefs.custom_instructions.slice(0, 15)}...`
                      : '—'}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Account */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('account.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {/* Username (read-only) */}
            <View className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <FontAwesome name="id-badge" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">{t('account.username')}</Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {username ? `@${username}` : '—'}
              </Text>
            </View>
            {/* Nickname */}
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
            {/* Email */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => setEmailModalVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="envelope-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">{t('account.email')}</Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">{user?.email ?? '—'}</Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {/* Phone */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => setPhoneModalVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="phone" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">{t('account.phone')}</Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {phone || t('account.phonePlaceholder')}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {/* Password */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => setPasswordModalVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="lock" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">{t('account.password')}</Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">••••••</Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {/* Sign Out */}
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

        {/* Support */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('support.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => Linking.openURL(SUPPORT_LINKS.homepage)}
              activeOpacity={0.7}
            >
              <FontAwesome name="globe" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('support.homepage')}</Text>
              <FontAwesome name="external-link" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => Linking.openURL(SUPPORT_LINKS.telegram)}
              activeOpacity={0.7}
            >
              <FontAwesome name="paper-plane" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('support.telegram')}</Text>
              <FontAwesome name="external-link" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => Linking.openURL(SUPPORT_LINKS.discord)}
              activeOpacity={0.7}
            >
              <FontAwesome name="comments-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('support.discord')}</Text>
              <FontAwesome name="external-link" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5"
              onPress={() => Linking.openURL(SUPPORT_LINKS.x)}
              activeOpacity={0.7}
            >
              <FontAwesome name="twitter" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('support.x')}</Text>
              <FontAwesome name="external-link" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('legal.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={() => setLegalModalType('terms')}
              activeOpacity={0.7}
            >
              <FontAwesome name="file-text-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('legal.terms')}</Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5"
              onPress={() => setLegalModalType('privacy')}
              activeOpacity={0.7}
            >
              <FontAwesome name="lock" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('legal.privacy')}</Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
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

      {/* Email Edit Modal */}
      <EditModal
        visible={emailModalVisible}
        title={t('account.email')}
        value={user?.email ?? ''}
        placeholder={t('account.emailPlaceholder')}
        onSave={handleEmailSave}
        onClose={() => setEmailModalVisible(false)}
      />

      {/* Phone Edit Modal */}
      <EditModal
        visible={phoneModalVisible}
        title={t('account.phone')}
        value={phone}
        placeholder={t('account.phonePlaceholder')}
        onSave={handlePhoneSave}
        onClose={() => setPhoneModalVisible(false)}
      />

      {/* Password Edit Modal */}
      <EditModal
        visible={passwordModalVisible}
        title={t('account.password')}
        value=""
        placeholder={t('account.newPasswordPlaceholder')}
        secureTextEntry
        onSave={handlePasswordSave}
        onClose={() => setPasswordModalVisible(false)}
      />

      {/* Summary Style Modal */}
      <EditModal
        visible={styleModalVisible}
        title={t('aiPersonalization.summaryStyle')}
        value={aiPrefs?.summary_style ?? ''}
        placeholder={t('aiPersonalization.summaryStylePlaceholder')}
        maxLength={100}
        onSave={handleStyleSave}
        onClose={() => setStyleModalVisible(false)}
      />

      {/* Custom Instructions Modal */}
      <EditModal
        visible={instructionsModalVisible}
        title={t('aiPersonalization.customInstructions')}
        value={aiPrefs?.custom_instructions ?? ''}
        placeholder={t('aiPersonalization.customInstructionsPlaceholder')}
        maxLength={500}
        multiline
        onSave={handleInstructionsSave}
        onClose={() => setInstructionsModalVisible(false)}
      />

      {/* Legal Modal */}
      <LegalModal
        visible={legalModalType !== null}
        type={legalModalType ?? 'terms'}
        onClose={() => setLegalModalType(null)}
      />

      {/* Time Picker Modals */}
      <TimePickerModal
        visible={morningPickerVisible}
        title={t('notifications.morningPickerTitle')}
        value={morningNotificationTime}
        onSave={setMorningNotificationTime}
        onClose={() => setMorningPickerVisible(false)}
      />
      <TimePickerModal
        visible={eveningPickerVisible}
        title={t('notifications.eveningPickerTitle')}
        value={eveningNotificationTime}
        onSave={setEveningNotificationTime}
        onClose={() => setEveningPickerVisible(false)}
      />
      <DayPickerModal
        visible={weeklyDayPickerVisible}
        title={t('notifications.weeklyDayPickerTitle')}
        value={weeklyReviewDay}
        onSave={setWeeklyReviewDay}
        onClose={() => setWeeklyDayPickerVisible(false)}
      />
      <TimePickerModal
        visible={weeklyTimePickerVisible}
        title={t('notifications.weeklyTimePickerTitle')}
        value={weeklyReviewTime}
        onSave={setWeeklyReviewTime}
        onClose={() => setWeeklyTimePickerVisible(false)}
      />
    </ScrollView>
  )
}
