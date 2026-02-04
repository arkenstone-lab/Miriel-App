import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const // 0=Mon..6=Sun

export function DayPickerModal({
  visible,
  title,
  value,
  onSave,
  onClose,
}: {
  visible: boolean
  title: string
  value: number  // 0=Mon..6=Sun
  onSave: (day: number) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(value)
  const { t } = useTranslation('settings')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const handleShow = () => {
    setSelected(value)
  }

  const handleSave = () => {
    onSave(selected)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleShow}
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
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
            {title}
          </Text>

          {/* Day list */}
          <View className="mb-5" style={{ gap: 6 }}>
            {DAYS.map((day) => {
              const isSelected = day === selected
              return (
                <TouchableOpacity
                  key={day}
                  className={`py-3 px-4 rounded-xl ${
                    isSelected
                      ? 'bg-cyan-100 dark:bg-gray-700/40'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                  onPress={() => setSelected(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-base text-center ${
                      isSelected
                        ? 'font-bold text-cyan-600 dark:text-cyan-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t(`notifications.days.${day}` as any)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

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
              className="flex-1 py-3 rounded-xl bg-cyan-600 dark:bg-cyan-500 items-center"
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-white">
                {t('modal.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}
