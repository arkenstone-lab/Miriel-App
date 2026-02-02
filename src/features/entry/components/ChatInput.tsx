'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chatStore'
import { useCreateEntry } from '@/features/entry/hooks'
import { requestTagging } from '@/features/entry/api'
import ChatMessage from './ChatMessage'

export default function ChatInput() {
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const { messages, isComplete, addUserMessage, getFullText, reset } = useChatStore()
  const createEntry = useCreateEntry()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isComplete) {
      inputRef.current?.focus()
    }
  }, [isComplete, messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    addUserMessage(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const fullText = getFullText()

      // Request auto-tagging
      let tags: string[] = []
      try {
        const result = await requestTagging(fullText)
        tags = result.tags
      } catch {
        // tagging failure is non-critical
      }

      const entry = await createEntry.mutateAsync({
        raw_text: fullText,
        tags,
      })

      // Auto-extract todos (fire and forget)
      fetch('/api/todos/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText, entry_id: entry.id }),
      }).catch(() => {})

      reset()
      router.push(`/entries/${entry.id}`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 p-4 bg-white">
        {isComplete ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '기록 저장하기'}
          </button>
        ) : (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="여기에 입력하세요..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              전송
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
