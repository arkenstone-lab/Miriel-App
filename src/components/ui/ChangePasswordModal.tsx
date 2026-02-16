import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { showErrorAlert } from '@/lib/errors'

export function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorText, setErrorText] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation('settings')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const resetFields = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrorText('')
    setLoading(false)
  }

  const handleShow = () => resetFields()

  const handleClose = () => {
    resetFields()
    onClose()
  }

  const handleSave = async () => {
    setErrorText('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorText(t('account.currentPasswordPlaceholder'))
      return
    }
    // Password complexity: 8+ chars, at least one uppercase, at least one number
    if (newPassword.length < 8) {
      setErrorText(t('account.passwordTooShort'))
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorText(t('account.passwordNoUppercase'))
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setErrorText(t('account.passwordNoNumber'))
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorText(t('account.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      await useSettingsStore.getState().changePassword(currentPassword, newPassword)
      Alert.alert('', t('account.passwordChanged'))
      handleClose()
    } catch (error: unknown) {
      // Error message is set by changePassword (SETTINGS_005 for wrong current, SETTINGS_004 for update fail)
      if (error instanceof Error) {
        setErrorText(error.message)
      } else {
        showErrorAlert(t('account.password'), error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={handleShow}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center px-6"
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
          >
            {/* Header */}
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-5">
              {t('account.password')}
            </Text>

            {/* Current Password */}
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('account.currentPassword')}
            </Text>
            <TextInput
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 mb-3"
              style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
              placeholder={t('account.currentPasswordPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={currentPassword}
              onChangeText={(v) => { setCurrentPassword(v); setErrorText('') }}
              secureTextEntry
              autoFocus
              returnKeyType="next"
            />

            {/* New Password */}
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('account.newPassword')}
            </Text>
            <TextInput
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 mb-3"
              style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
              placeholder={t('account.newPasswordPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); setErrorText('') }}
              secureTextEntry
              returnKeyType="next"
            />

            {/* Confirm New Password */}
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('account.confirmNewPassword')}
            </Text>
            <TextInput
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 mb-1"
              style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
              placeholder={t('account.confirmPasswordPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrorText('') }}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            {mismatch && (
              <Text className="text-xs text-red-500 mb-2">{t('account.passwordMismatch')}</Text>
            )}

            {/* Inline error */}
            {errorText !== '' && !mismatch && (
              <View className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Text className="text-xs text-red-600 dark:text-red-400">{errorText}</Text>
              </View>
            )}

            <View className="h-2" />

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 items-center"
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t('modal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center ${loading ? 'bg-cyan-400' : 'bg-cyan-600 dark:bg-cyan-500'}`}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text className="text-sm font-semibold text-white">
                  {loading ? '...' : t('modal.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  )
}
