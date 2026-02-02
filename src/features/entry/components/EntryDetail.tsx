'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEntry, useUpdateEntry, useDeleteEntry } from '@/features/entry/hooks'
import { requestTagging } from '@/features/entry/api'
import TagEditor from './TagEditor'

export default function EntryDetail({ id }: { id: string }) {
  const { data: entry, isLoading, error } = useEntry(id)
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const router = useRouter()
  const [retagging, setRetagging] = useState(false)

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">불러오는 중...</div>
    )
  }

  if (error || !entry) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        기록을 불러올 수 없습니다.
      </div>
    )
  }

  const handleTagChange = (tags: string[]) => {
    updateEntry.mutate({ id: entry.id, input: { tags } })
  }

  const handleRetag = async () => {
    setRetagging(true)
    try {
      const result = await requestTagging(entry.raw_text)
      updateEntry.mutate({ id: entry.id, input: { tags: result.tags } })
    } finally {
      setRetagging(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 기록을 삭제할까요?')) return
    await deleteEntry.mutateAsync(entry.id)
    router.push('/entries')
  }

  const formattedDate = new Date(entry.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">{formattedDate}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(entry.created_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="text-sm text-red-400 hover:text-red-600 transition-colors"
        >
          삭제
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
          {entry.raw_text}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">태그</h3>
          <button
            onClick={handleRetag}
            disabled={retagging}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {retagging ? '분석 중...' : 'AI 재분석'}
          </button>
        </div>
        <TagEditor tags={entry.tags} onChange={handleTagChange} />
      </div>
    </div>
  )
}
