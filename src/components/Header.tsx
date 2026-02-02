'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/entries', label: '타임라인' },
  { href: '/summary', label: '일간 요약' },
  { href: '/weekly', label: '주간 회고' },
  { href: '/todos', label: '할 일' },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <Link href="/entries" className="text-lg font-bold text-gray-900">
            ReflectLog
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/entries/new"
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 새 기록
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        <nav className="flex gap-1 -mb-px">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
