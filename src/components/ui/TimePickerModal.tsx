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

function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number)
  return { hour: h, minute: m }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

export function TimePickerModal({
  visible,
  title,
  value,
  onSave,
  onClose,
}: {
  visible: boolean
  title: string
  value: string
  onSave: (time: string) => void
  onClose: () => void
}) {
  const { hour: initH, minute: initM } = parseTime(value)
  const [selectedHour, setSelectedHour] = useState(initH)
  const [selectedMinute, setSelectedMinute] = useState(initM)
  const { t } = useTranslation('settings')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const handleShow = () => {
    const { hour, minute } = parseTime(value)
    setSelectedHour(hour)
    setSelectedMinute(minute)
  }

  const handleSave = () => {
    onSave(`${pad(selectedHour)}:${pad(selectedMinute)}`)
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
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {title}
          </Text>

          {/* Preview */}
          <Text className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 text-center mb-5">
            {pad(selectedHour)}:{pad(selectedMinute)}
          </Text>

          {/* Columns */}
          <View className="flex-row mb-5" style={{ height: 180 }}>
            {/* Hour */}
            <View className="flex-1 mr-2">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center mb-2 uppercase">
                {t('notifications.hour')}
              </Text>
              <ScrollView
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600"
                style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
                showsVerticalScrollIndicator={false}
              >
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    className={`py-2.5 px-3 items-center ${
                      h === selectedHour
                        ? 'bg-cyan-100 dark:bg-gray-700/40'
                        : ''
                    }`}
                    onPress={() => setSelectedHour(h)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base ${
                        h === selectedHour
                          ? 'font-bold text-cyan-600 dark:text-cyan-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {pad(h)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Minute */}
            <View className="flex-1 ml-2">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center mb-2 uppercase">
                {t('notifications.minute')}
              </Text>
              <ScrollView
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600"
                style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
                showsVerticalScrollIndicator={false}
              >
                {MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    className={`py-2.5 px-3 items-center ${
                      m === selectedMinute
                        ? 'bg-cyan-100 dark:bg-gray-700/40'
                        : ''
                    }`}
                    onPress={() => setSelectedMinute(m)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base ${
                        m === selectedMinute
                          ? 'font-bold text-cyan-600 dark:text-cyan-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {pad(m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
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
