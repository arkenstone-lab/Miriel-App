'use client'

import { useEntries } from '@/features/entry/hooks'
import type { Entry } from '@/features/entry/types'
import EntryCard from './EntryCard'
import Link from 'next/link'

function groupByDate(entries: Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>()
  for (const entry of entries) {
    const group = map.get(entry.date) || []
    group.push(entry)
    map.set(entry.date, group)
  }
  return map
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = today.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '오늘'
  if (days === 1) return '어제'

  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function EntryTimeline() {
  const { data: entries, isLoading, error } = useEntries()

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">불러오는 중...</div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        기록을 불러올 수 없습니다.
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-sm mb-4">아직 기록이 없어요</p>
        <Link
          href="/entries/new"
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          첫 기록 시작하기
        </Link>
      </div>
    )
  }

  const grouped = groupByDate(entries)

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {Array.from(grouped.entries()).map(([date, group]) => (
        <div key={date}>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">
            {formatDateLabel(date)}
          </h2>
          <div className="space-y-2">
            {group.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
