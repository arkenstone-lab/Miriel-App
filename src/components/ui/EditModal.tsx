import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'

export function EditModal({
  visible,
  title,
  value,
  onSave,
  onClose,
  placeholder,
  maxLength,
}: {
  visible: boolean
  title: string
  value: string
  onSave: (v: string) => void
  onClose: () => void
  placeholder?: string
  maxLength?: number
}) {
  const [draft, setDraft] = useState(value)
  const { t } = useTranslation('settings')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  // Sync draft when modal opens
  const handleShow = () => setDraft(value)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center px-6"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
          >
            {/* Header */}
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-5">
              {title}
            </Text>

            {/* Input */}
            <TextInput
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 mb-5"
              style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              value={draft}
              onChangeText={setDraft}
              autoFocus
              maxLength={maxLength}
              returnKeyType="done"
              onSubmitEditing={() => {
                onSave(draft.trim())
                onClose()
              }}
            />

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 items-center"
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t('modal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-indigo-600 dark:bg-indigo-500 items-center"
                onPress={() => {
                  onSave(draft.trim())
                  onClose()
                }}
                activeOpacity={0.8}
              >
                <Text className="text-sm font-semibold text-white">
                  {t('modal.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  )
}
