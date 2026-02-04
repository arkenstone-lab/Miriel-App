import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useEntry } from '@/features/entry/hooks'

interface EvidenceChipProps {
  entryId: string
}

export function EvidenceChip({ entryId }: EvidenceChipProps) {
  const router = useRouter()
  const { data: entry } = useEntry(entryId)
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { t } = useTranslation('summary')

  const preview = entry
    ? entry.raw_text.length > 30
      ? entry.raw_text.slice(0, 30) + '...'
      : entry.raw_text
    : t('loadingEntry')

  return (
    <TouchableOpacity
      className="flex-row items-center bg-cyan-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 mr-2 mb-2"
      onPress={() => router.push(`/entries/${entryId}`)}
      activeOpacity={0.7}
    >
      <FontAwesome name="link" size={10} color={isDark ? '#67e8f9' : '#22d3ee'} />
      <Text className="text-xs text-cyan-600 dark:text-cyan-400 ml-1.5 flex-shrink" numberOfLines={1}>
        {preview}
      </Text>
      <FontAwesome
        name="chevron-right"
        size={8}
        color={isDark ? '#22d3ee' : '#67e8f9'}
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  )
}
