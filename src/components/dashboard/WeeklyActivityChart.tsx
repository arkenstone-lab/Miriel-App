import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { Entry } from '@/features/entry/types'

interface WeeklyActivityChartProps {
  entries: Entry[]
}

/** Builds the last 7 days with localized day-of-week labels. */
function getLast7Days(dayNames: string[]): { date: string; dayLabel: string }[] {
  const days: { date: string; dayLabel: string }[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({ date: dateStr, dayLabel: dayNames[d.getDay()] })
  }

  return days
}

export function WeeklyActivityChart({ entries }: WeeklyActivityChartProps) {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')

  const dayNames = tCommon('date.dayNames', { returnObjects: true }) as string[]
  const last7Days = getLast7Days(dayNames)
  const entryDates = new Set((entries || []).map((e) => e.date))

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <Card>
      <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('weeklyActivity.title')}</Text>
      <View className="flex-row justify-between">
        {last7Days.map(({ date, dayLabel }) => {
          const hasEntry = entryDates.has(date)
          const isToday = date === todayStr

          return (
            <View key={date} className="items-center" style={{ gap: 4 }}>
              <Text className={`text-[10px] ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {dayLabel}
              </Text>
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  hasEntry
                    ? 'bg-indigo-500'
                    : isToday
                    ? 'bg-indigo-100 dark:bg-indigo-800/40 border-2 border-indigo-300 dark:border-indigo-600'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {hasEntry && (
                  <Text className="text-xs text-white font-bold">✓</Text>
                )}
              </View>
            </View>
          )
        })}
      </View>
    </Card>
  )
}
