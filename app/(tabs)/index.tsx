import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useEntries } from '@/features/entry/hooks'
import type { Entry } from '@/features/entry/types'

function EntryCard({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm text-gray-500">{entry.date}</Text>
        <Text className="text-xs text-gray-400">
          {new Date(entry.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text className="text-base text-gray-900 leading-6" numberOfLines={3}>
        {entry.raw_text}
      </Text>
      {entry.tags.length > 0 && (
        <View className="flex-row flex-wrap mt-2 gap-1">
          {entry.tags.slice(0, 3).map((tag, i) => (
            <View key={i} className="bg-indigo-50 rounded-full px-2.5 py-0.5">
              <Text className="text-xs text-indigo-700">{tag}</Text>
            </View>
          ))}
          {entry.tags.length > 3 && (
            <Text className="text-xs text-gray-400 self-center">
              +{entry.tags.length - 3}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

export default function TimelineScreen() {
  const { data: entries, isLoading, error } = useEntries()
  const router = useRouter()

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-8">
        <Text className="text-red-500 text-center">{error.message}</Text>
      </View>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-8">
        <Text className="text-4xl mb-4">📝</Text>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          아직 기록이 없어요
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          오른쪽 상단 + 버튼을 눌러{'\n'}첫 번째 기록을 시작해보세요!
        </Text>
        <TouchableOpacity
          className="bg-indigo-600 rounded-lg px-6 py-3"
          onPress={() => router.push('/entries/new')}
        >
          <Text className="text-white font-semibold">새 기록 작성</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/entries/${item.id}`)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  )
}
