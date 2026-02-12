import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1) // 1~28

export function MonthDayPickerModal({
  visible,
  title,
  value,
  onSave,
  onClose,
}: {
  visible: boolean
  title: string
  value: number  // 1~28
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

          {/* Day grid (7 columns × 4 rows) */}
          <ScrollView style={{ maxHeight: 280 }} className="mb-5">
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {DAYS.map((day) => {
                const isSelected = day === selected
                return (
                  <TouchableOpacity
                    key={day}
                    className={`items-center justify-center rounded-xl ${
                      isSelected
                        ? 'bg-cyan-100 dark:bg-gray-700/40'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                    style={{ width: 40, height: 40 }}
                    onPress={() => setSelected(day)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? 'font-bold text-cyan-600 dark:text-cyan-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

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
