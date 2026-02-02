'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSummaries, useGenerateWeeklySummary } from '@/features/summary/hooks'
import type { SummarySentence } from '@/lib/openai'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00')
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const fmt = (d: Date) =>
    d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

  return `${fmt(monday)} ~ ${fmt(sunday)}`
}

export default function WeeklyReviewView() {
  const currentMonday = formatDate(getMonday(new Date()))
  const [weekStart, setWeekStart] = useState(currentMonday)
  const { data: summaries, isLoading } = useSummaries('weekly', weekStart)
  const generate = useGenerateWeeklySummary()
  const [sentences, setSentences] = useState<SummarySentence[]>([])

  const summary = summaries?.[0]

  const handleGenerate = async () => {
    try {
      const result = await generate.mutateAsync(weekStart)
      setSentences(result.sentences)
    } catch {
      // handled by mutation state
    }
  }

  const handlePrevWeek = () => {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    setWeekStart(formatDate(d))
    setSentences([])
  }

  const handleNextWeek = () => {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    if (d <= new Date()) {
      setWeekStart(formatDate(d))
      setSentences([])
    }
  }

  const isCurrentWeek = weekStart === currentMonday

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Week selector */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">주간 회고</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            &larr;
          </button>
          <span className="text-sm text-gray-700 min-w-[140px] text-center">
            {formatWeekLabel(weekStart)}
          </span>
          <button
            onClick={handleNextWeek}
            disabled={isCurrentWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            &rarr;
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-8">불러오는 중...</div>
      ) : summary ? (
        <div className="space-y-4">
          {/* Summary points */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-3">이번 주 핵심 포인트</h3>
            <div className="space-y-3">
              {summary.text.split('\n').filter(Boolean).map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-800 pt-0.5">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence links */}
          {summary.entry_links.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                근거 기록 ({summary.entry_links.length}건)
              </h3>
              <div className="space-y-1.5">
                {summary.entry_links.map((entryId, i) => (
                  <Link
                    key={entryId}
                    href={`/entries/${entryId}`}
                    className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    기록 #{i + 1} 보기 &rarr;
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sentence-level links (if just generated) */}
          {sentences.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">포인트별 근거</h3>
              <div className="space-y-3">
                {sentences.map((s, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-gray-800 mb-1">{s.text}</p>
                    <div className="flex gap-1.5">
                      {s.entry_ids.map((eid) => (
                        <Link
                          key={eid}
                          href={`/entries/${eid}`}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          [근거]
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate */}
          <button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="w-full py-2.5 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            {generate.isPending ? '생성 중...' : '회고 다시 생성'}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm mb-4">
            아직 이 주의 회고가 없어요
          </p>
          <button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {generate.isPending ? '생성 중...' : 'AI 주간 회고 생성하기'}
          </button>
          {generate.isError && (
            <p className="text-red-500 text-sm mt-3">
              {generate.error?.message || '회고 생성에 실패했습니다.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
