import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSummaries, useGenerateSummary } from '@/features/summary/hooks'
import type { Summary } from '@/features/summary/types'

function SummaryCard({ summary }: { summary: Summary }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
      <Text className="text-sm text-gray-500 mb-2">{summary.period_start}</Text>
      <Text className="text-base text-gray-900 leading-6">{summary.text}</Text>
      {summary.entry_links.length > 0 && (
        <Text className="text-xs text-indigo-500 mt-2">
          근거 기록 {summary.entry_links.length}개
        </Text>
      )}
    </View>
  )
}

export default function SummaryScreen() {
  const { data: summaries, isLoading, error } = useSummaries('daily')
  const generateMutation = useGenerateSummary()

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

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity
          className={`rounded-lg py-3 mb-4 ${
            generateMutation.isPending ? 'bg-indigo-400' : 'bg-indigo-600'
          }`}
          onPress={() => generateMutation.mutate(undefined)}
          disabled={generateMutation.isPending}
        >
          <Text className="text-white text-center font-semibold">
            {generateMutation.isPending ? '요약 생성 중...' : '오늘 요약 생성'}
          </Text>
        </TouchableOpacity>

        {(!summaries || summaries.length === 0) ? (
          <View className="items-center pt-16">
            <Text className="text-4xl mb-4">📊</Text>
            <Text className="text-lg font-semibold text-gray-700 mb-2">
              아직 일간 요약이 없어요
            </Text>
            <Text className="text-gray-500 text-center">
              기록을 작성한 후{'\n'}요약을 생성해보세요!
            </Text>
          </View>
        ) : (
          summaries.map((s) => <SummaryCard key={s.id} summary={s} />)
        )}
      </ScrollView>
    </View>
  )
}
