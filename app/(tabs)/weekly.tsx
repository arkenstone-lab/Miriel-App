import { useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSummaries, useGenerateWeeklySummary } from '@/features/summary/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { SummaryDetailView } from '@/components/SummaryDetailView'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Summary } from '@/features/summary/types'

function formatWeekRange(periodStart: string): string {
  const start = new Date(periodStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} ~ ${fmt(end)}`
}

function WeeklySummaryCard({
  summary,
  onPress,
  isSelected,
}: {
  summary: Summary
  onPress: () => void
  isSelected: boolean
}) {
  const { t } = useTranslation('summary')
  const { t: tCommon } = useTranslation('common')
  const sentenceCount = summary.sentences_data?.length || summary.text.split('\n').filter(Boolean).length
  return (
    <Card
      onPress={onPress}
      className={`mb-3 ${isSelected ? 'border-indigo-300 bg-indigo-50' : ''}`}
    >
      <Text className="text-sm font-medium text-gray-500 mb-1">
        {formatWeekRange(summary.period_start)}
      </Text>
      <Text className="text-base text-gray-900 leading-6" numberOfLines={3}>
        {summary.text}
      </Text>
      <View className="flex-row gap-2 mt-2.5">
        <Badge label={t('weekly.pointCount', { count: sentenceCount })} variant="gray" />
        {summary.entry_links.length > 0 && (
          <Badge label={tCommon('label.evidenceCount', { count: summary.entry_links.length })} variant="indigo" />
        )}
      </View>
    </Card>
  )
}

export default function WeeklyScreen() {
  const { data: summaries, isLoading, error } = useSummaries('weekly')
  const generateMutation = useGenerateWeeklySummary()
  const { isDesktop } = useResponsiveLayout()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { t } = useTranslation('summary')
  const { t: tCommon } = useTranslation('common')

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
            <WeeklySummaryCard
              summary={item}
              onPress={() => handleSelect(item)}
              isSelected={isDesktop && selectedId === item.id}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="px-4 pt-4 pb-1">
            <Button
              title={
                generateMutation.isPending ? t('weekly.generating') : t('weekly.generateButton')
              }
              onPress={handleGenerate}
              loading={generateMutation.isPending}
              size="lg"
            />
            <View className="h-4" />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📅"
            title={t('weekly.emptyTitle')}
            description={t('weekly.emptyDescription')}
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
        detailPlaceholder={tCommon('placeholder.selectWeekly')}
      />
    )
  }

  // Mobile: inline detail view
  if (selectedSummary) {
    return (
      <View className="flex-1">
        <View className="bg-white border-b border-gray-100 px-4 py-3">
          <Button
            title={tCommon('action.backToList')}
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
