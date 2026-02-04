import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { Card } from '@/components/ui/Card'

interface PrivacyNoticeProps {
  mode: 'banner' | 'inline'
}

export function PrivacyNotice({ mode }: PrivacyNoticeProps) {
  const { t } = useTranslation('privacy')
  const { hasSeenPrivacyNotice, acknowledgePrivacyNotice } = useSettingsStore()

  if (mode === 'banner' && hasSeenPrivacyNotice) return null

  return (
    <Card className="border-cyan-100 dark:border-gray-700">
      <View className="flex-row items-start mb-2">
        <FontAwesome name="shield" size={18} color="#06b6d4" style={{ marginTop: 2 }} />
        <Text className="ml-3 text-base font-semibold text-gray-900 dark:text-gray-100">
          {t('notice.title')}
        </Text>
      </View>
      <Text className="text-sm text-gray-600 dark:text-gray-300 leading-5 mb-3">
        {t('notice.body')}
      </Text>
      {mode === 'banner' && (
        <TouchableOpacity
          className="bg-cyan-600 rounded-lg py-2.5 items-center"
          onPress={acknowledgePrivacyNotice}
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold text-sm">{t('notice.acknowledge')}</Text>
        </TouchableOpacity>
      )}
    </Card>
  )
}
