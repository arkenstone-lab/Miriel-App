import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'

interface CalendarGridProps {
  selectedDate: string | null       // YYYY-MM-DD or null
  markedDates: Set<string>          // dates with dots
  onSelectDate: (date: string) => void
  onMonthChange?: (year: number, month: number) => void
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay() // 0=Sun
}

function formatDateStr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function getTodayStr(): string {
  const now = new Date()
  return formatDateStr(now.getFullYear(), now.getMonth(), now.getDate())
}

export function CalendarGrid({
  selectedDate,
  markedDates,
  onSelectDate,
  onMonthChange,
}: CalendarGridProps) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { t } = useTranslation('common')

  const todayStr = getTodayStr()
  const dayNames: string[] = t('date.dayNames', { returnObjects: true }) as string[]

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
    onMonthChange?.(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1)
  }

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
    onMonthChange?.(viewMonth === 11 ? viewYear + 1 : viewYear, viewMonth === 11 ? 0 : viewMonth + 1)
  }

  const goToToday = () => {
    const today = new Date()
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    onMonthChange?.(today.getFullYear(), today.getMonth())
  }

  const monthLabel = `${viewYear}.${String(viewMonth + 1).padStart(2, '0')}`

  // Build calendar grid cells
  const cells = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

    // Previous month fill
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    const result: { day: number; dateStr: string; isCurrentMonth: boolean }[] = []

    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      result.push({
        day: d,
        dateStr: formatDateStr(prevYear, prevMonth, d),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({
        day: d,
        dateStr: formatDateStr(viewYear, viewMonth, d),
        isCurrentMonth: true,
      })
    }

    // Trailing days from next month
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear
    const remaining = 7 - (result.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        result.push({
          day: d,
          dateStr: formatDateStr(nextYear, nextMonth, d),
          isCurrentMonth: false,
        })
      }
    }

    return result
  }, [viewYear, viewMonth])

  const handlePress = (dateStr: string) => {
    onSelectDate(dateStr)
  }

  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mx-4 mt-3">
      {/* Month navigation header */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity onPress={goToPrev} activeOpacity={0.6} className="p-2">
          <FontAwesome name="chevron-left" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>

        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Text className="text-base font-bold text-gray-900 dark:text-gray-100">
            {monthLabel}
          </Text>
          <TouchableOpacity
            onPress={goToToday}
            activeOpacity={0.7}
            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800"
          >
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('calendar.today')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={goToNext} activeOpacity={0.6} className="p-2">
          <FontAwesome name="chevron-right" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week header */}
      <View className="flex-row mb-1">
        {dayNames.map((name, idx) => (
          <View key={idx} className="flex-1 items-center py-1">
            <Text className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* Date grid */}
      <View className="flex-row flex-wrap">
        {cells.map((cell, idx) => {
          const isSelected = selectedDate === cell.dateStr
          const isToday = cell.dateStr === todayStr
          const isMarked = markedDates.has(cell.dateStr)

          return (
            <TouchableOpacity
              key={idx}
              className="items-center justify-center"
              style={{ width: '14.285%', height: 42 }}
              onPress={() => handlePress(cell.dateStr)}
              activeOpacity={0.6}
            >
              <View
                className={`items-center justify-center rounded-full ${
                  isSelected
                    ? 'bg-cyan-100 dark:bg-gray-700'
                    : ''
                }`}
                style={{ width: 34, height: 34 }}
              >
                <Text
                  className={`text-sm ${
                    isSelected
                      ? 'font-bold text-cyan-600 dark:text-cyan-400'
                      : !cell.isCurrentMonth
                        ? 'text-gray-300 dark:text-gray-600'
                        : isToday
                          ? 'font-bold text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={isToday && !isSelected ? { textDecorationLine: 'underline' } : undefined}
                >
                  {cell.day}
                </Text>
              </View>
              {/* Dot indicator for marked dates */}
              {isMarked && (
                <View
                  className="rounded-full bg-cyan-500 dark:bg-cyan-400"
                  style={{ width: 4, height: 4, marginTop: 1 }}
                />
              )}
              {!isMarked && <View style={{ width: 4, height: 4, marginTop: 1 }} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
