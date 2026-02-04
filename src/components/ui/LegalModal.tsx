import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'

interface LegalModalProps {
  visible: boolean
  type: 'terms' | 'privacy'
  onClose: () => void
}

export function LegalModal({ visible, type, onClose }: LegalModalProps) {
  const { t: tLegal } = useTranslation('legal')
  const { t: tSettings } = useTranslation('settings')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const title = type === 'terms' ? tSettings('legal.terms') : tSettings('legal.privacy')
  const content = tLegal(type)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/40 justify-center items-center px-4"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', maxHeight: '80%' }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-5 pb-3">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1" activeOpacity={0.7}>
              <FontAwesome name="times" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 16 }}>
            <Text className="text-sm text-gray-700 dark:text-gray-300 leading-6">
              {content}
            </Text>
          </ScrollView>

          {/* Footer */}
          <View className="px-6 pb-5 pt-3">
            <TouchableOpacity
              className="py-3 rounded-xl bg-cyan-600 dark:bg-cyan-500 items-center"
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-white">
                {tSettings('modal.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}
