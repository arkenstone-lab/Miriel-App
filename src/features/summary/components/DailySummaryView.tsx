'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSummaries, useGenerateSummary } from '@/features/summary/hooks'
import type { SummarySentence } from '@/lib/openai'

export default function DailySummaryView() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const { data: summaries, isLoading } = useSummaries('daily', date)
  const generateSummary = useGenerateSummary()
  const [sentences, setSentences] = useState<SummarySentence[]>([])

  const summary = summaries?.[0]

  const handleGenerate = async () => {
    try {
      const result = await generateSummary.mutateAsync(date)
      setSentences(result.sentences)
    } catch {
      // error handled by mutation state
    }
  }

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Date selector */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">일간 요약</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setSentences([])
          }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <p className="text-sm text-gray-500 mb-4">{formattedDate}</p>

      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-8">불러오는 중...</div>
      ) : summary ? (
        <div className="space-y-4">
          {/* Summary text */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {summary.text}
            </p>
          </div>

          {/* Evidence links */}
          {summary.entry_links.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">근거 기록</h3>
              <div className="space-y-1.5">
                {summary.entry_links.map((entryId) => (
                  <Link
                    key={entryId}
                    href={`/entries/${entryId}`}
                    className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    기록 보기 →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sentence-level links (if just generated) */}
          {sentences.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">문장별 근거</h3>
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

          {/* Regenerate button */}
          <button
            onClick={handleGenerate}
            disabled={generateSummary.isPending}
            className="w-full py-2.5 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            {generateSummary.isPending ? '생성 중...' : '요약 다시 생성'}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm mb-4">
            아직 이 날짜의 요약이 없어요
          </p>
          <button
            onClick={handleGenerate}
            disabled={generateSummary.isPending}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {generateSummary.isPending ? '생성 중...' : 'AI 요약 생성하기'}
          </button>
          {generateSummary.isError && (
            <p className="text-red-500 text-sm mt-3">
              {generateSummary.error?.message || '요약 생성에 실패했습니다.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
