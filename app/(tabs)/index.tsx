import { View, Text, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEntries } from '@/features/entry/hooks'
import { useGamificationStats } from '@/features/gamification/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { LoadingState } from '@/components/ui/LoadingState'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { LevelProgressCard } from '@/components/dashboard/LevelProgressCard'
import { BadgeGrid } from '@/components/dashboard/BadgeGrid'
import { RecentSummaryCard } from '@/components/dashboard/RecentSummaryCard'
import { WeeklyReviewCard } from '@/components/dashboard/WeeklyReviewCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { TodayReminderBanner } from '@/components/dashboard/TodayReminderBanner'
import { WeeklyActivityChart } from '@/components/dashboard/WeeklyActivityChart'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { PrivacyNotice } from '@/components/PrivacyNotice'

export default function DashboardScreen() {
  const { data: entries } = useEntries()
  const { data: stats, isLoading } = useGamificationStats()
  const { isDesktop } = useResponsiveLayout()
  const { username } = useSettingsStore()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')

  if (isLoading || !stats) return <LoadingState />

  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12
      ? t('greeting.morning')
      : hour < 18
      ? t('greeting.afternoon')
      : t('greeting.evening')
  const greeting = username
    ? t('greeting.withName', { greeting: timeGreeting, name: username })
    : timeGreeting

  const d = new Date()
  const dayNames = tCommon('date.dayNames', { returnObjects: true }) as string[]
  const dateStr = tCommon('date.monthDay', {
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayName: dayNames[d.getDay()],
  })

  const header = (
    <View className="mb-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">{greeting} 👋</Text>
      <Text className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{dateStr}</Text>
    </View>
  )

  if (isDesktop) {
    return (
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
        <View className="max-w-5xl w-full mx-auto px-6 py-8">
          <PrivacyNotice mode="banner" />
          {header}

          <View className="flex-row" style={{ gap: 24 }}>
            {/* Left column */}
            <View className="flex-1" style={{ gap: 16 }}>
              <TodayReminderBanner streak={stats.streak} />
              <QuickActions />
              <WeeklyActivityChart entries={entries || []} />
              <RecentSummaryCard />
              <WeeklyReviewCard />
            </View>

            {/* Right column */}
            <View style={{ width: 320, gap: 16 }}>
              <View className="flex-row" style={{ gap: 12 }}>
                <StreakCard streak={stats.streak} />
                <LevelProgressCard level={stats.level} />
              </View>
              <StatsRow
                totalEntries={stats.totalEntries}
                todosCompleted={stats.todosCompleted}
                totalSummaries={stats.totalSummaries}
              />
              <BadgeGrid badges={stats.badges} />
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  // Mobile layout
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-4 pt-6 pb-8" style={{ gap: 12 }}>
        <PrivacyNotice mode="banner" />
        {header}
        <TodayReminderBanner streak={stats.streak} />

        <View className="flex-row" style={{ gap: 8 }}>
          <StreakCard streak={stats.streak} />
          <LevelProgressCard level={stats.level} />
        </View>

        <QuickActions />
        <WeeklyActivityChart entries={entries || []} />
        <RecentSummaryCard />
        <WeeklyReviewCard />
        <StatsRow
          totalEntries={stats.totalEntries}
          todosCompleted={stats.todosCompleted}
          totalSummaries={stats.totalSummaries}
        />
        <BadgeGrid badges={stats.badges} />
      </View>
    </ScrollView>
  )
}
