import { useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useSummaries, useGenerateSummary } from '@/features/summary/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { SummaryDetailView } from '@/components/SummaryDetailView'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Summary } from '@/features/summary/types'

function SummaryCard({
  summary,
  onPress,
  isSelected,
}: {
  summary: Summary
  onPress: () => void
  isSelected: boolean
}) {
  const sentenceCount = summary.sentences_data?.length || summary.text.split('\n').filter(Boolean).length
  return (
    <Card
      onPress={onPress}
      className={`mb-3 ${isSelected ? 'border-indigo-300 bg-indigo-50' : ''}`}
    >
      <Text className="text-sm font-medium text-gray-500 mb-2">
        {summary.period_start}
      </Text>
      <Text className="text-base text-gray-900 leading-6" numberOfLines={3}>
        {summary.text}
      </Text>
      <View className="flex-row gap-2 mt-2.5">
        <Badge label={`${sentenceCount}개 요약`} variant="gray" />
        {summary.entry_links.length > 0 && (
          <Badge label={`근거 ${summary.entry_links.length}개`} variant="indigo" />
        )}
      </View>
    </Card>
  )
}

export default function SummaryScreen() {
  const { data: summaries, isLoading, error } = useSummaries('daily')
  const generateMutation = useGenerateSummary()
  const { isDesktop } = useResponsiveLayout()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedSummary = summaries?.find((s) => s.id === selectedId)

  if (isLoading) return <LoadingState />

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-8">
        <Text className="text-red-500 text-center">{error.message}</Text>
      </View>
    )
  }

  const handleGenerate = () => {
    generateMutation.mutate(undefined)
  }

  const handleSelect = (summary: Summary) => {
    setSelectedId(summary.id)
  }

  const master = (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={summaries || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <SummaryCard
              summary={item}
              onPress={() => handleSelect(item)}
              isSelected={isDesktop && selectedId === item.id}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="px-4 pt-4 pb-1">
            <Button
              title={generateMutation.isPending ? '요약 생성 중...' : '오늘 요약 생성'}
              onPress={handleGenerate}
              loading={generateMutation.isPending}
              size="lg"
            />
            <View className="h-4" />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📊"
            title="아직 일간 요약이 없어요"
            description={'기록을 작성한 후\n요약을 생성해보세요!'}
          />
        }
      />
    </View>
  )

  if (isDesktop) {
    return (
      <MasterDetailLayout
        master={master}
        detail={selectedSummary ? <SummaryDetailView summary={selectedSummary} /> : null}
        detailPlaceholder="요약을 선택해주세요"
      />
    )
  }

  // Mobile: tap opens inline detail
  if (selectedSummary) {
    return (
      <View className="flex-1">
        <View className="bg-white border-b border-gray-100 px-4 py-3">
          <Button
            title="목록으로"
            variant="ghost"
            size="sm"
            onPress={() => setSelectedId(null)}
          />
        </View>
        <SummaryDetailView summary={selectedSummary} />
      </View>
    )
  }

  return master
}
