import { useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSummaries, useGenerateSummary, useGenerateWeeklySummary } from '@/features/summary/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAiPreferences } from '@/features/ai-preferences/hooks'
import { buildAiContext } from '@/features/ai-preferences/context'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { SummaryDetailView } from '@/components/SummaryDetailView'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
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

function SummaryListCard({
  summary,
  period,
  onPress,
  isSelected,
}: {
  summary: Summary
  period: 'daily' | 'weekly'
  onPress: () => void
  isSelected: boolean
}) {
  const { t } = useTranslation('summary')
  const { t: tCommon } = useTranslation('common')
  const sentenceCount = summary.sentences_data?.length || summary.text.split('\n').filter(Boolean).length
  const countLabel = period === 'daily'
    ? t('daily.summaryCount', { count: sentenceCount })
    : t('weekly.pointCount', { count: sentenceCount })
  const dateLabel = period === 'daily'
    ? summary.period_start
    : formatWeekRange(summary.period_start)

  return (
    <Card
      onPress={onPress}
      className={`mb-3 ${isSelected ? 'border-cyan-300 dark:border-gray-600 bg-cyan-50 dark:bg-gray-800/50' : ''}`}
    >
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        {dateLabel}
      </Text>
      <Text className="text-base text-gray-900 dark:text-gray-100 leading-6" numberOfLines={3}>
        {summary.text}
      </Text>
      <View className="flex-row gap-2 mt-2.5">
        <Badge label={countLabel} variant="gray" />
        {summary.entry_links.length > 0 && (
          <Badge label={tCommon('label.evidenceCount', { count: summary.entry_links.length })} variant="cyan" />
        )}
      </View>
    </Card>
  )
}

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default function SummaryScreen() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const { data: summaries, isLoading, error } = useSummaries(period)
  const dailyMutation = useGenerateSummary()
  const weeklyMutation = useGenerateWeeklySummary()
  const generateMutation = period === 'daily' ? dailyMutation : weeklyMutation
  const { isDesktop } = useResponsiveLayout()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { t } = useTranslation('summary')
  const { t: tCommon } = useTranslation('common')
  const { data: aiPrefs } = useAiPreferences()
  const { nickname, occupation, interests } = useSettingsStore()

  const selectedSummary = summaries?.find((s) => s.id === selectedId)

  const periodOptions: { label: string; value: 'daily' | 'weekly' }[] = [
    { label: t('tab.daily'), value: 'daily' },
    { label: t('tab.weekly'), value: 'weekly' },
  ]

  const handlePeriodChange = (v: 'daily' | 'weekly') => {
    setPeriod(v)
    setSelectedId(null)
  }

  if (isLoading) return <LoadingState />

  if (error) {
    return <ErrorDisplay error={error} />
  }

  const handleGenerate = () => {
    const aiContext = buildAiContext(aiPrefs, { nickname, occupation, interests })
    generateMutation.mutate(aiContext ? { aiContext } : undefined)
  }

  const handleSelect = (summary: Summary) => {
    setSelectedId(summary.id)
  }

  // Weekly review 1-per-week limit
  const currentWeekStart = getMonday(new Date())
  const hasWeeklyThisWeek = period === 'weekly' && summaries?.some(
    (s) => s.period_start === currentWeekStart
  )

  const generateLabel = period === 'daily'
    ? (generateMutation.isPending ? t('daily.generating') : t('daily.generateButton'))
    : hasWeeklyThisWeek
      ? t('weekly.alreadyGenerated')
      : (generateMutation.isPending ? t('weekly.generating') : t('weekly.generateButton'))

  const emptyEmoji = period === 'daily' ? '📊' : '📅'
  const emptyTitle = period === 'daily' ? t('daily.emptyTitle') : t('weekly.emptyTitle')
  const emptyDesc = period === 'daily' ? t('daily.emptyDescription') : t('weekly.emptyDescription')
  const detailPlaceholder = period === 'daily'
    ? tCommon('placeholder.selectSummary')
    : tCommon('placeholder.selectWeekly')

  const master = (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={summaries || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <SummaryListCard
              summary={item}
              period={period}
              onPress={() => handleSelect(item)}
              isSelected={isDesktop && selectedId === item.id}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="px-4 pt-4 pb-1" style={{ gap: 12 }}>
            <SegmentedControl
              options={periodOptions}
              value={period}
              onChange={handlePeriodChange}
            />
            <Button
              title={generateLabel}
              onPress={handleGenerate}
              loading={generateMutation.isPending}
              disabled={hasWeeklyThisWeek}
              size="lg"
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji={emptyEmoji}
            title={emptyTitle}
            description={emptyDesc}
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
        detailPlaceholder={detailPlaceholder}
      />
    )
  }

  // Mobile: tap opens inline detail
  if (selectedSummary) {
    return (
      <View className="flex-1">
        <View className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
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
