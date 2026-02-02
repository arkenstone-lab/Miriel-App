'use client'

import Link from 'next/link'
import { useUpdateTodo, useDeleteTodo } from '@/features/todo/hooks'
import type { Todo } from '@/features/todo/types'

export default function TodoItem({ todo }: { todo: Todo }) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const isDone = todo.status === 'done'

  const handleToggle = () => {
    updateTodo.mutate({
      id: todo.id,
      updates: { status: isDone ? 'pending' : 'done' },
    })
  }

  const handleDelete = () => {
    deleteTodo.mutate(todo.id)
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
      isDone ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
    }`}>
      <button
        onClick={handleToggle}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isDone
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        {isDone && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${
          isDone ? 'text-gray-400 line-through' : 'text-gray-800'
        }`}>
          {todo.text}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          {todo.source_entry_id && (
            <Link
              href={`/entries/${todo.source_entry_id}`}
              className="text-xs text-blue-500 hover:underline"
            >
              근거 기록 →
            </Link>
          )}
          {todo.due_date && (
            <span className="text-xs text-gray-400">
              {new Date(todo.due_date).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
