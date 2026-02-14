import { useState, useMemo } from 'react'
import { View, Text, SectionList, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useEntries, useEntry } from '@/features/entry/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { EntryCard } from '@/components/EntryCard'
import { EntryDetail } from '@/components/EntryDetail'
import { CalendarGrid } from '@/components/ui/CalendarGrid'
import { ViewModeToggle } from '@/components/ui/ViewModeToggle'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import type { Entry } from '@/features/entry/types'

/** Maps a date string to a relative-date group key (today/yesterday/thisWeek/earlier). */
function getDateGroupKey(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')

  const diffMs = today.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return 'thisWeek'
  return 'earlier'
}

interface Section {
  title: string
  data: Entry[]
}

function groupEntries(entries: Entry[], labels: Record<string, string>): Section[] {
  const groups: Record<string, Entry[]> = {}
  const order = ['today', 'yesterday', 'thisWeek', 'earlier']

  for (const entry of entries) {
    const key = getDateGroupKey(entry.date)
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }

  return order
    .filter((key) => groups[key])
    .map((key) => ({ title: labels[key], data: groups[key] }))
}

type ViewMode = 'list' | 'calendar'

export default function TimelineScreen() {
  const { data: entries, isLoading, error } = useEntries()
  const router = useRouter()
  const { isDesktop } = useResponsiveLayout()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedEntry } = useEntry(selectedId || '')
  const { t } = useTranslation('timeline')
  const { t: tCommon } = useTranslation('common')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const dateLabels: Record<string, string> = {
    today: tCommon('date.today'),
    yesterday: tCommon('date.yesterday'),
    thisWeek: tCommon('date.thisWeek'),
    earlier: tCommon('date.earlier'),
  }

  const sections = useMemo(() => {
    if (!entries) return []
    return groupEntries(entries, dateLabels)
  }, [entries])

  const markedDates = useMemo(() => {
    if (!entries) return new Set<string>()
    return new Set(entries.map((e) => e.date))
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (!entries || !selectedDate) return entries || []
    return entries.filter((e) => e.date === selectedDate)
  }, [entries, selectedDate])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode === 'list') setSelectedDate(null)
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date))
  }

  if (isLoading) return <LoadingState />

  if (error) {
    return <ErrorDisplay error={error} />
  }

  if (!entries || entries.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        <EmptyState
          emoji="📝"
          title={t('empty.title')}
          description={isDesktop ? t('empty.descriptionDesktop') : t('empty.descriptionMobile')}
          actionLabel={t('empty.action')}
          onAction={() => router.push('/entries/new')}
        />
      </View>
    )
  }

  const handlePress = (entry: Entry) => {
    if (isDesktop) {
      setSelectedId(entry.id)
    } else {
      router.push(`/entries/${entry.id}`)
    }
  }

  const viewToggleHeader = (
    <View className="px-4 pt-3 pb-1 flex-row justify-end">
      <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
    </View>
  )

  const listView = (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={viewToggleHeader}
      renderSectionHeader={({ section }) => (
        <View className="px-4 pt-4 pb-2 bg-gray-50 dark:bg-gray-950">
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View className="px-4">
          <EntryCard
            entry={item}
            onPress={() => handlePress(item)}
            isSelected={isDesktop && selectedId === item.id}
          />
        </View>
      )}
      stickySectionHeadersEnabled={false}
    />
  )

  const calendarView = (
    <FlatList
      data={filteredEntries}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View className="px-4 pt-3 pb-1 flex-row justify-end">
            <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
          </View>
          <CalendarGrid
            selectedDate={selectedDate}
            markedDates={markedDates}
            onSelectDate={handleSelectDate}
          />
        </View>
      }
      renderItem={({ item }) => (
        <View className="px-4">
          <EntryCard
            entry={item}
            onPress={() => handlePress(item)}
            isSelected={isDesktop && selectedId === item.id}
          />
        </View>
      )}
      ListEmptyComponent={
        selectedDate ? (
          <View className="items-center py-8">
            <Text className="text-sm text-gray-400 dark:text-gray-500">
              {t('calendar.noEntries')}
            </Text>
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  )

  const master = (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {viewMode === 'list' ? listView : calendarView}
    </View>
  )

  if (isDesktop) {
    return (
      <MasterDetailLayout
        master={master}
        detail={selectedEntry ? <EntryDetail entry={selectedEntry} onDeleted={() => setSelectedId(null)} /> : null}
        detailPlaceholder={tCommon('placeholder.selectEntry')}
      />
    )
  }

  return master
}
