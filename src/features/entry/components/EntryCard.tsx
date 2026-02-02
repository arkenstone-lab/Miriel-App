import Link from 'next/link'
import type { Entry } from '@/features/entry/types'

function getTagColor(tag: string) {
  if (tag.startsWith('프로젝트:')) return 'bg-blue-50 text-blue-600'
  if (tag.startsWith('사람:')) return 'bg-green-50 text-green-600'
  if (tag.startsWith('이슈:')) return 'bg-red-50 text-red-600'
  return 'bg-gray-50 text-gray-600'
}

export default function EntryCard({ entry }: { entry: Entry }) {
  const preview =
    entry.raw_text.length > 120
      ? entry.raw_text.slice(0, 120) + '...'
      : entry.raw_text

  const time = new Date(entry.created_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/entries/${entry.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all"
    >
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {preview}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {entry.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-full text-xs ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-400">
              +{entry.tags.length - 3}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </Link>
  )
}
