'use client'

import { useState } from 'react'
import { useTodos } from '@/features/todo/hooks'
import TodoItem from './TodoItem'

export default function TodoList() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const { data: todos, isLoading, error } = useTodos(filter)

  const pendingCount = todos?.filter((t) => t.status === 'pending').length ?? 0
  const doneCount = todos?.filter((t) => t.status === 'done').length ?? 0

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-4">할 일</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {[
          { key: undefined, label: '전체' },
          { key: 'pending', label: `미완료 (${pendingCount})` },
          { key: 'done', label: `완료 (${doneCount})` },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-8">불러오는 중...</div>
      ) : error ? (
        <div className="text-center text-red-500 text-sm py-8">
          할 일을 불러올 수 없습니다.
        </div>
      ) : !todos || todos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">
            {filter === 'done'
              ? '완료한 할 일이 없어요'
              : '아직 할 일이 없어요'}
          </p>
          <p className="text-gray-300 text-xs mt-2">
            기록을 작성하면 AI가 할 일을 자동으로 추출해요
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  )
}
