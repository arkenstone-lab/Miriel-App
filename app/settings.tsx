import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TimePickerModal } from '@/components/ui/TimePickerModal'
import { DayPickerModal } from '@/components/ui/DayPickerModal'
import { MonthDayPickerModal } from '@/components/ui/MonthDayPickerModal'
import { LegalModal } from '@/components/ui/LegalModal'

const SUPPORT_LINKS = {
  homepage: 'https://www.arkenstone-labs.com/miriel/',
  x: 'https://x.com/miriel_app',
  telegram: 'https://t.me/miriel_communtiy',
  discord: 'https://discord.gg/PnHNNtJNjn',
} as const

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'ko' | 'en'

export default function SettingsScreen() {
  const { t } = useTranslation('settings')
  const {
    theme, language,
    setTheme, setLanguage,
    notificationsEnabled, morningNotificationTime, eveningNotificationTime,
    weeklyReviewDay, weeklyReviewTime,
    monthlyReviewDay, monthlyReviewTime,
    setNotificationsEnabled, setMorningNotificationTime, setEveningNotificationTime,
    setWeeklyReviewDay, setWeeklyReviewTime,
    setMonthlyReviewDay, setMonthlyReviewTime,
  } = useSettingsStore()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [morningPickerVisible, setMorningPickerVisible] = useState(false)
  const [eveningPickerVisible, setEveningPickerVisible] = useState(false)
  const [weeklyDayPickerVisible, setWeeklyDayPickerVisible] = useState(false)
  const [weeklyTimePickerVisible, setWeeklyTimePickerVisible] = useState(false)
  const [monthlyDayPickerVisible, setMonthlyDayPickerVisible] = useState(false)
  const [monthlyTimePickerVisible, setMonthlyTimePickerVisible] = useState(false)
  // Separate visible + type to prevent content flash during fade-out animation
  const [legalModalVisible, setLegalModalVisible] = useState(false)
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms')

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
                trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#22d3ee' }}
                thumbColor={notificationsEnabled ? '#06b6d4' : '#f4f3f4'}
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
            {/* Monthly Review Section Divider */}
            <View className={`px-4 py-2 bg-gray-50 dark:bg-gray-800 ${!notificationsEnabled ? 'opacity-40' : ''}`}>
              <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                {t('notifications.monthlyReviewSection')}
              </Text>
            </View>
            {/* Monthly Day */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 ${
                !notificationsEnabled ? 'opacity-40' : ''
              }`}
              disabled={!notificationsEnabled}
              onPress={() => setMonthlyDayPickerVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="calendar-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.monthlyDay')}
              </Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {monthlyReviewDay}{t('notifications.monthlyDayUnit')}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {/* Monthly Time */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3.5 ${
                !notificationsEnabled ? 'opacity-40' : ''
              }`}
              disabled={!notificationsEnabled}
              onPress={() => setMonthlyTimePickerVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="clock-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.monthlyTime')}
              </Text>
              <Text className="ml-auto text-sm text-gray-900 dark:text-gray-100">
                {formatTimeDisplay(monthlyReviewTime)}
              </Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
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
              onPress={() => Linking.openURL(SUPPORT_LINKS.x)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, color: '#9ca3af', fontWeight: '700', width: 16, textAlign: 'center' }}>𝕏</Text>
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('support.x')}</Text>
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
              className="flex-row items-center px-4 py-3.5"
              onPress={() => Linking.openURL(SUPPORT_LINKS.discord)}
              activeOpacity={0.7}
            >
              <FontAwesome name="comments-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('support.discord')}</Text>
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
              onPress={() => { setLegalModalType('terms'); setLegalModalVisible(true) }}
              activeOpacity={0.7}
            >
              <FontAwesome name="file-text-o" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('legal.terms')}</Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5"
              onPress={() => { setLegalModalType('privacy'); setLegalModalVisible(true) }}
              activeOpacity={0.7}
            >
              <FontAwesome name="lock" size={16} color="#9ca3af" />
              <Text className="ml-3 text-sm text-gray-900 dark:text-gray-100 flex-1">{t('legal.privacy')}</Text>
              <FontAwesome name="chevron-right" size={12} color={isDark ? '#6b7280' : '#d1d5db'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version & Branding */}
        <Text className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          {t('version')} 0.1.0
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('http://arkenstone-labs.com/')}
          activeOpacity={0.7}
          className="mb-8 mt-1"
        >
          <Text className="text-center text-xs text-gray-400 dark:text-gray-500">
            Made by{' '}
            <Text className="text-gray-500 dark:text-gray-400 underline">Arkenstone Labs</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legal Modal */}
      <LegalModal
        visible={legalModalVisible}
        type={legalModalType}
        onClose={() => setLegalModalVisible(false)}
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
      <MonthDayPickerModal
        visible={monthlyDayPickerVisible}
        title={t('notifications.monthlyDayPickerTitle')}
        value={monthlyReviewDay}
        onSave={setMonthlyReviewDay}
        onClose={() => setMonthlyDayPickerVisible(false)}
      />
      <TimePickerModal
        visible={monthlyTimePickerVisible}
        title={t('notifications.monthlyTimePickerTitle')}
        value={monthlyReviewTime}
        onSave={setMonthlyReviewTime}
        onClose={() => setMonthlyTimePickerVisible(false)}
      />
    </ScrollView>
  )
}
