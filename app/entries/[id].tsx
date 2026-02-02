import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useEntry } from '@/features/entry/hooks'

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: entry, isLoading, error } = useEntry(id!)

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (error || !entry) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-8">
        <Text className="text-red-500 text-center">
          {error?.message || '기록을 찾을 수 없습니다.'}
        </Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-sm text-gray-500">{entry.date}</Text>
          <Text className="text-xs text-gray-400">
            {new Date(entry.created_at).toLocaleString('ko-KR')}
          </Text>
        </View>

        <Text className="text-base text-gray-900 leading-7 mb-6">
          {entry.raw_text}
        </Text>

        {entry.tags.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">태그</Text>
            <View className="flex-row flex-wrap gap-2">
              {entry.tags.map((tag, i) => (
                <View key={i} className="bg-indigo-50 rounded-full px-3 py-1">
                  <Text className="text-sm text-indigo-700">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
