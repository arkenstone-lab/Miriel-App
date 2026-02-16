import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Alert, ActivityIndicator, Platform, Modal, TextInput } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useRouter } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { apiFetch } from '@/lib/api'
import { showErrorAlert } from '@/lib/errors'
import { useGamificationStats } from '@/features/gamification/hooks'
import { useTodos } from '@/features/todo/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useAiPreferences, useUpsertAiPreferences } from '@/features/ai-preferences/hooks'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { LevelProgressCard } from '@/components/dashboard/LevelProgressCard'
import { TodoCompletionCard } from '@/components/dashboard/TodoCompletionCard'
import { BadgeGrid } from '@/components/dashboard/BadgeGrid'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { LoadingState } from '@/components/ui/LoadingState'
import { EditModal } from '@/components/ui/EditModal'
import { ChangePasswordModal } from '@/components/ui/ChangePasswordModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export default function ProfileScreen() {
  const { t } = useTranslation('settings')
  const { t: tOnboarding } = useTranslation('onboarding')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { isDesktop } = useResponsiveLayout()
  const router = useRouter()

  const { username, gender, occupation, interests, avatarUrl, setEmail } = useSettingsStore()
  const { user, signOut } = useAuthStore()
  const { data: stats, isLoading } = useGamificationStats()
  const { data: allTodos } = useTodos()
  const { data: doneTodos } = useTodos('done')

  // AI Personalization
  const { data: aiPrefs, isLoading: aiPrefsLoading } = useAiPreferences()
  const upsertAiPrefs = useUpsertAiPreferences()

  // Modal state
  const [emailModalVisible, setEmailModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [signOutModalVisible, setSignOutModalVisible] = useState(false)
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)
  const [styleModalVisible, setStyleModalVisible] = useState(false)
  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false)

  const FOCUS_AREA_KEYS = [
    'projectMgmt', 'selfDev', 'workEfficiency',
    'communication', 'health', 'learning',
  ] as const

  // --- AI Personalization handlers ---

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

  // --- Account handlers ---

  const handleEmailSave = async (newEmail: string) => {
    try {
      await setEmail(newEmail.trim())
      Alert.alert('', t('account.emailChanged'))
    } catch (error: unknown) {
      showErrorAlert(t('account.title'), error)
      throw error // Keep modal open on error
    }
  }

  // Alert.alert callbacks are broken on web — use ConfirmModal instead
  const handleSignOut = () => {
    setSignOutModalVisible(true)
  }

  const confirmSignOut = async () => {
    setSignOutModalVisible(false)
    await signOut()
  }

  // Export all user data as JSON file download
  const handleExportData = async () => {
    setExporting(true)
    try {
      const data = await apiFetch<Record<string, unknown>>('/auth/export')
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      if (Platform.OS === 'web') {
        // Web: trigger file download via hidden anchor
        const a = document.createElement('a')
        a.href = url
        a.download = `miriel-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
      // Native: could use expo-file-system + expo-sharing, but web-first for now
      Alert.alert('', t('account.exportSuccess'))
    } catch {
      Alert.alert('', t('account.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  const openDeleteAccountModal = () => {
    setDeleteConfirmText('')
    setDeleteAccountModalVisible(true)
  }

  // Permanently delete account and all data, then force sign out
  const confirmDeleteAccount = async () => {
    // Require exact confirmation word to prevent accidental deletion
    const requiredWord = t('account.deleteAccountConfirmWord')
    if (deleteConfirmText.trim() !== requiredWord) return

    setDeleteAccountModalVisible(false)
    try {
      await apiFetch('/auth/account', { method: 'DELETE' })
      Alert.alert('', t('account.deleteAccountSuccess'))
      // Force sign out — tokens are already invalidated server-side
      const { forceSignOut } = useAuthStore.getState()
      forceSignOut()
    } catch (error: unknown) {
      showErrorAlert(t('account.title'), error)
    }
  }

  if (isLoading || !stats) return <LoadingState />

  const displayName = username || '?'
  const initial = displayName.charAt(0).toUpperCase()

  const totalTodos = allTodos?.length ?? 0
  const completedTodos = doneTodos?.length ?? 0

  // Build persona chips
  const personaChips: string[] = []
  if (gender) {
    personaChips.push(tOnboarding(`persona.gender${gender.charAt(0).toUpperCase() + gender.slice(1)}` as any))
  }
  if (occupation) {
    personaChips.push(occupation)
  }
  interests.forEach((key) => {
    personaChips.push(tOnboarding(`persona.interestOptions.${key}` as any))
  })

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className={`w-full mx-auto ${isDesktop ? 'max-w-lg' : ''} px-5 pt-6 pb-10`}>
        {/* User Info */}
        <View className="items-center mb-6">
          {/* Avatar */}
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-20 h-20 rounded-full mb-3"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-cyan-100 dark:bg-gray-700/40 items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {initial}
              </Text>
            </View>
          )}

          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {username || '?'}
          </Text>

          {/* Persona chips */}
          {personaChips.length > 0 && (
            <View className="flex-row flex-wrap justify-center mt-3" style={{ gap: 6 }}>
              {personaChips.map((chip, idx) => (
                <View
                  key={idx}
                  className="px-3 py-1 rounded-full bg-cyan-50 dark:bg-gray-800/50 border border-cyan-200 dark:border-gray-600"
                >
                  <Text className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Edit Profile button */}
          <TouchableOpacity
            onPress={() => router.push('/edit-profile' as any)}
            activeOpacity={0.7}
            className="mt-4 px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700"
          >
            <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('profile.editProfile')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achievements */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('profile.achievements')}
          </Text>
          <View className="flex-row mb-3" style={{ gap: 8 }}>
            <StreakCard streak={stats.streak} />
            <LevelProgressCard level={stats.level} />
          </View>

          {/* Todo completion */}
          <View className="mb-3">
            <TodoCompletionCard completed={completedTodos} total={totalTodos} />
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

        {/* AI Personalization — moved from Settings for cleaner separation */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('aiPersonalization.title')}
          </Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {/* OpenAI data processing notice — transparency for users */}
            <View className="flex-row items-start px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-900/10">
              <FontAwesome name="info-circle" size={14} color={isDark ? '#fbbf24' : '#d97706'} style={{ marginTop: 2 }} />
              <Text className="ml-2 text-xs text-amber-700 dark:text-amber-400 flex-1 leading-4">
                {t('aiPersonalization.aiDataNotice')}
              </Text>
            </View>
            {aiPrefsLoading ? (
              <View className="px-4 py-6 items-center">
                <ActivityIndicator size="small" color={isDark ? '#22d3ee' : '#06b6d4'} />
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
                    trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#22d3ee' }}
                    thumbColor={(aiPrefs?.share_persona ?? true) ? '#06b6d4' : '#f4f3f4'}
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
                              ? 'bg-cyan-50 dark:bg-gray-700/40 border-cyan-300 dark:border-gray-600'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                          onPress={() => toggleFocusArea(key)}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              selected
                                ? 'text-cyan-600 dark:text-cyan-400'
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

        {/* Account — moved from Settings for cleaner separation */}
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
            {/* Export Data */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={handleExportData}
              activeOpacity={0.7}
              disabled={exporting}
            >
              <FontAwesome name="download" size={16} color="#9ca3af" />
              <View className="ml-3 flex-1">
                <Text className="text-sm text-gray-900 dark:text-gray-100">
                  {exporting ? t('account.exporting') : t('account.exportData')}
                </Text>
                <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {t('account.exportDataDesc')}
                </Text>
              </View>
              {exporting && <ActivityIndicator size="small" color="#9ca3af" />}
            </TouchableOpacity>
            {/* Sign Out */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <FontAwesome name="sign-out" size={16} color="#ef4444" />
              <Text className="ml-3 text-sm text-red-500">{t('account.signOut')}</Text>
            </TouchableOpacity>
            {/* Delete Account — last item, most destructive action at bottom */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5"
              onPress={openDeleteAccountModal}
              activeOpacity={0.7}
            >
              <FontAwesome name="trash" size={16} color="#ef4444" />
              <Text className="ml-3 text-sm text-red-500">{t('account.deleteAccount')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Go to Settings (app preferences: language, theme, notifications) */}
        <TouchableOpacity
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-3.5 flex-row items-center justify-center mb-4"
          onPress={() => router.push('/settings' as any)}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="cog"
            size={16}
            color={isDark ? '#9ca3af' : '#6b7280'}
            style={{ marginRight: 8 }}
          />
          <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {t('profile.goToSettings')}
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 dark:text-gray-500 mb-4">
          {t('version')} 0.1.0
        </Text>
      </View>

      {/* Sign Out Confirm Modal */}
      <ConfirmModal
        visible={signOutModalVisible}
        title={t('account.signOutConfirmTitle')}
        message={t('account.signOutConfirmMessage')}
        confirmLabel={t('account.signOut')}
        cancelLabel={t('modal.cancel')}
        onConfirm={confirmSignOut}
        onCancel={() => setSignOutModalVisible(false)}
        destructive
      />

      {/* Delete Account — requires typing confirmation word (RN Modal uses inline styles for dark mode) */}
      <Modal
        visible={deleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setDeleteAccountModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
          >
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('account.deleteAccountConfirmTitle')}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-5">
              {t('account.deleteAccountConfirmMessage')}
            </Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 mb-4"
              style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
              placeholder={t('account.deleteAccountInputPlaceholder')}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row justify-end" style={{ gap: 12 }}>
              <TouchableOpacity
                className="px-4 py-2.5 rounded-xl"
                onPress={() => setDeleteAccountModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t('modal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2.5 rounded-xl ${
                  deleteConfirmText.trim() === t('account.deleteAccountConfirmWord')
                    ? 'bg-red-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                onPress={confirmDeleteAccount}
                disabled={deleteConfirmText.trim() !== t('account.deleteAccountConfirmWord')}
                activeOpacity={0.7}
              >
                <Text className={`text-sm font-semibold ${
                  deleteConfirmText.trim() === t('account.deleteAccountConfirmWord')
                    ? 'text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {t('account.deleteAccountButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Email Edit Modal */}
      <EditModal
        visible={emailModalVisible}
        title={t('account.email')}
        value={user?.email ?? ''}
        placeholder={t('account.emailPlaceholder')}
        onSave={handleEmailSave}
        onClose={() => setEmailModalVisible(false)}
      />

      {/* Password Change Modal */}
      <ChangePasswordModal
        visible={passwordModalVisible}
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
    </ScrollView>
  )
}
