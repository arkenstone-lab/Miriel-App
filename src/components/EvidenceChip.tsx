import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useRouter } from 'expo-router'
import { useEntry } from '@/features/entry/hooks'

interface EvidenceChipProps {
  entryId: string
}

export function EvidenceChip({ entryId }: EvidenceChipProps) {
  const router = useRouter()
  const { data: entry } = useEntry(entryId)

  const preview = entry
    ? entry.raw_text.length > 30
      ? entry.raw_text.slice(0, 30) + '...'
      : entry.raw_text
    : '기록 로딩 중...'

  return (
    <TouchableOpacity
      className="flex-row items-center bg-indigo-50 rounded-lg px-3 py-2 mr-2 mb-2"
      onPress={() => router.push(`/entries/${entryId}`)}
      activeOpacity={0.7}
    >
      <FontAwesome name="link" size={10} color="#6366f1" />
      <Text className="text-xs text-indigo-600 ml-1.5 flex-shrink" numberOfLines={1}>
        {preview}
      </Text>
      <FontAwesome
        name="chevron-right"
        size={8}
        color="#a5b4fc"
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  )
}
