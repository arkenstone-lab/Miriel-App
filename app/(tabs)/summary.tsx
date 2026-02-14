import { useState, useMemo } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSummaries, useGenerateSummary, useGenerateWeeklySummary, useGenerateMonthlySummary } from '@/features/summary/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAiPreferences } from '@/features/ai-preferences/hooks'
import { buildAiContext } from '@/features/ai-preferences/context'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { SummaryDetailView } from '@/components/SummaryDetailView'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { CalendarGrid } from '@/components/ui/CalendarGrid'
import { ViewModeToggle } from '@/components/ui/ViewModeToggle'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Summary } from '@/features/summary/types'

type Period = 'daily' | 'weekly' | 'monthly'
type ViewMode = 'list' | 'calendar'

function formatWeekRange(periodStart: string): string {
  const start = new Date(periodStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} ~ ${fmt(end)}`
}

function formatMonthRange(periodStart: string, monthlyReviewDay: number): string {
  const start = new Date(periodStart + 'T00:00:00')
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(end.getDate() - 1)
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} ~ ${fmt(end)}`
}

/** Check if a selected date falls within a summary's period range */
function isDateInPeriod(dateStr: string, periodStart: string, period: Period, monthlyReviewDay: number): boolean {
  const date = new Date(dateStr + 'T00:00:00')
  const start = new Date(periodStart + 'T00:00:00')

  if (period === 'daily') {
    return dateStr === periodStart
  }

  if (period === 'weekly') {
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return date >= start && date <= end
  }

  // monthly
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(end.getDate() - 1)
  return date >= start && date <= end
}

function SummaryListCard({
  summary,
  period,
  monthlyReviewDay,
  onPress,
  isSelected,
}: {
  summary: Summary
  period: Period
  monthlyReviewDay?: number
  onPress: () => void
  isSelected: boolean
}) {
  const { t } = useTranslation('summary')
  const { t: tCommon } = useTranslation('common')
  const sentenceCount = summary.sentences_data?.length || summary.text.split('\n').filter(Boolean).length
  const countLabel = period === 'daily'
    ? t('daily.summaryCount', { count: sentenceCount })
    : t(period === 'weekly' ? 'weekly.pointCount' : 'monthly.pointCount', { count: sentenceCount })
  const dateLabel = period === 'daily'
    ? summary.period_start
    : period === 'weekly'
      ? formatWeekRange(summary.period_start)
      : formatMonthRange(summary.period_start, monthlyReviewDay ?? 1)

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

/** Calculate the month period start (reviewDay of last month or this month) */
function getMonthlyPeriodStart(reviewDay: number): string {
  const now = new Date()
  const today = now.getDate()
  // If today >= reviewDay, period started this month; otherwise last month
  if (today >= reviewDay) {
    return formatDateStr(new Date(now.getFullYear(), now.getMonth(), reviewDay))
  }
  return formatDateStr(new Date(now.getFullYear(), now.getMonth() - 1, reviewDay))
}

/** Calculate the month period end (day before next reviewDay) */
function getMonthlyPeriodEnd(reviewDay: number): string {
  const now = new Date()
  const today = now.getDate()
  if (today >= reviewDay) {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, reviewDay - 1)
    return formatDateStr(end)
  }
  const end = new Date(now.getFullYear(), now.getMonth(), reviewDay - 1)
  return formatDateStr(end)
}

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function SummaryScreen() {
  const [period, setPeriod] = useState<Period>('daily')
  const { data: summaries, isLoading, error } = useSummaries(period)
  const dailyMutation = useGenerateSummary()
  const weeklyMutation = useGenerateWeeklySummary()
  const monthlyMutation = useGenerateMonthlySummary()
  const { isDesktop } = useResponsiveLayout()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { t } = useTranslation('summary')
  const { t: tCommon } = useTranslation('common')
  const { data: aiPrefs } = useAiPreferences()
  const { nickname, occupation, interests, monthlyReviewDay } = useSettingsStore()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const selectedSummary = summaries?.find((s) => s.id === selectedId)

  const periodOptions: { label: string; value: Period }[] = [
    { label: t('tab.daily'), value: 'daily' },
    { label: t('tab.weekly'), value: 'weekly' },
    { label: t('tab.monthly'), value: 'monthly' },
  ]

  const handlePeriodChange = (v: Period) => {
    setPeriod(v)
    setSelectedId(null)
    setSelectedDate(null)
  }

  const markedDates = useMemo(() => {
    if (!summaries) return new Set<string>()
    return new Set(summaries.map((s) => s.period_start))
  }, [summaries])

  const filteredSummaries = useMemo(() => {
    if (!summaries || !selectedDate) return summaries || []
    const day = monthlyReviewDay || 1
    return summaries.filter((s) => isDateInPeriod(selectedDate, s.period_start, period, day))
  }, [summaries, selectedDate, period, monthlyReviewDay])

  if (isLoading) return <LoadingState />

  if (error) {
    return <ErrorDisplay error={error} />
  }

  const aiContext = buildAiContext(aiPrefs, { nickname, occupation, interests })

  const handleGenerate = () => {
    if (period === 'monthly') {
      const day = monthlyReviewDay || 1
      const monthStart = getMonthlyPeriodStart(day)
      const monthEnd = getMonthlyPeriodEnd(day)
      monthlyMutation.mutate({ monthStart, monthEnd, ...(aiContext ? { aiContext } : {}) })
    } else if (period === 'weekly') {
      weeklyMutation.mutate(aiContext ? { aiContext } : undefined)
    } else {
      dailyMutation.mutate(aiContext ? { aiContext } : undefined)
    }
  }

  const generateMutation = period === 'daily' ? dailyMutation : period === 'weekly' ? weeklyMutation : monthlyMutation

  const handleSelect = (summary: Summary) => {
    setSelectedId(summary.id)
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date))
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode === 'list') setSelectedDate(null)
  }

  // Weekly review 1-per-week limit
  const currentWeekStart = getMonday(new Date())
  const hasWeeklyThisWeek = period === 'weekly' && summaries?.some(
    (s) => s.period_start === currentWeekStart
  )

  // Monthly review 1-per-period limit
  const currentMonthStart = getMonthlyPeriodStart(monthlyReviewDay || 1)
  const hasMonthlyThisPeriod = period === 'monthly' && summaries?.some(
    (s) => s.period_start === currentMonthStart
  )

  const isLimitReached = hasWeeklyThisWeek || hasMonthlyThisPeriod

  const generateLabel = period === 'daily'
    ? (generateMutation.isPending ? t('daily.generating') : t('daily.generateButton'))
    : period === 'weekly'
      ? hasWeeklyThisWeek
        ? t('weekly.alreadyGenerated')
        : (generateMutation.isPending ? t('weekly.generating') : t('weekly.generateButton'))
      : hasMonthlyThisPeriod
        ? t('monthly.alreadyGenerated')
        : (generateMutation.isPending ? t('monthly.generating') : t('monthly.generateButton'))

  const emptyEmoji = period === 'daily' ? '📊' : period === 'weekly' ? '📅' : '📆'
  const emptyTitle = period === 'daily' ? t('daily.emptyTitle') : period === 'weekly' ? t('weekly.emptyTitle') : t('monthly.emptyTitle')
  const emptyDesc = period === 'daily' ? t('daily.emptyDescription') : period === 'weekly' ? t('weekly.emptyDescription') : t('monthly.emptyDescription')
  const detailPlaceholder = period === 'daily'
    ? tCommon('placeholder.selectSummary')
    : period === 'weekly'
      ? tCommon('placeholder.selectWeekly')
      : tCommon('placeholder.selectMonthly')

  const listData = viewMode === 'calendar' ? filteredSummaries : (summaries || [])

  const master = (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <SummaryListCard
              summary={item}
              period={period}
              monthlyReviewDay={monthlyReviewDay}
              onPress={() => handleSelect(item)}
              isSelected={isDesktop && selectedId === item.id}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="px-4 pt-4 pb-1" style={{ gap: 12 }}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View className="flex-1">
                <SegmentedControl
                  options={periodOptions}
                  value={period}
                  onChange={handlePeriodChange}
                />
              </View>
              <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
            </View>
            <Button
              title={generateLabel}
              onPress={handleGenerate}
              loading={generateMutation.isPending}
              disabled={isLimitReached}
              size="lg"
            />
            {viewMode === 'calendar' && (
              <View style={{ marginHorizontal: -16 }}>
                <CalendarGrid
                  selectedDate={selectedDate}
                  markedDates={markedDates}
                  onSelectDate={handleSelectDate}
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          viewMode === 'calendar' && selectedDate ? (
            <View className="items-center py-8">
              <Text className="text-sm text-gray-400 dark:text-gray-500">
                {t('calendar.noSummaries')}
              </Text>
            </View>
          ) : (
            <EmptyState
              emoji={emptyEmoji}
              title={emptyTitle}
              description={emptyDesc}
            />
          )
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
