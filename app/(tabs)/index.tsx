import { useState, useMemo } from 'react'
import { View, Text, SectionList } from 'react-native'
import { useRouter } from 'expo-router'
import { useEntries, useEntry } from '@/features/entry/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout'
import { EntryCard } from '@/components/EntryCard'
import { EntryDetail } from '@/components/EntryDetail'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Entry } from '@/features/entry/types'

function getDateGroup(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')

  const diffMs = today.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return '이번 주'
  return '이전'
}

interface Section {
  title: string
  data: Entry[]
}

function groupEntries(entries: Entry[]): Section[] {
  const groups: Record<string, Entry[]> = {}
  const order = ['오늘', '어제', '이번 주', '이전']

  for (const entry of entries) {
    const group = getDateGroup(entry.date)
    if (!groups[group]) groups[group] = []
    groups[group].push(entry)
  }

  return order.filter((key) => groups[key]).map((key) => ({
    title: key,
    data: groups[key],
  }))
}

export default function TimelineScreen() {
  const { data: entries, isLoading, error } = useEntries()
  const router = useRouter()
  const { isDesktop } = useResponsiveLayout()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedEntry } = useEntry(selectedId || '')

  const sections = useMemo(() => {
    if (!entries) return []
    return groupEntries(entries)
  }, [entries])

  if (isLoading) return <LoadingState />

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-8">
        <Text className="text-red-500 text-center">{error.message}</Text>
      </View>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <EmptyState
          emoji="📝"
          title="아직 기록이 없어요"
          description={`${isDesktop ? '좌측 사이드바의' : '오른쪽 상단'} + 버튼을 눌러\n첫 번째 기록을 시작해보세요!`}
          actionLabel="새 기록 작성"
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

  const master = (
    <View className="flex-1 bg-gray-50">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View className="px-4 pt-4 pb-2 bg-gray-50">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
    </View>
  )

  if (isDesktop) {
    return (
      <MasterDetailLayout
        master={master}
        detail={selectedEntry ? <EntryDetail entry={selectedEntry} /> : null}
        detailPlaceholder="기록을 선택해주세요"
      />
    )
  }

  return master
}
