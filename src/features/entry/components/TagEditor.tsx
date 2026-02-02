'use client'

import { useState } from 'react'

interface TagEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  readOnly?: boolean
}

export default function TagEditor({ tags, onChange, readOnly = false }: TagEditorProps) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInput('')
    }
  }

  const handleRemove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const getTagColor = (tag: string) => {
    if (tag.startsWith('프로젝트:')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (tag.startsWith('사람:')) return 'bg-green-50 text-green-700 border-green-200'
    if (tag.startsWith('이슈:')) return 'bg-red-50 text-red-700 border-red-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.length === 0 && (
          <span className="text-sm text-gray-400">태그 없음</span>
        )}
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
          >
            {tag}
            {!readOnly && (
              <button
                onClick={() => handleRemove(tag)}
                className="hover:opacity-70 ml-0.5"
              >
                &times;
              </button>
            )}
          </span>
        ))}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="태그 추가 (예: 프로젝트:앱개발)"
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            추가
          </button>
        </div>
      )}
    </div>
  )
}
