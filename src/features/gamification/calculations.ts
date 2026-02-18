import type { Entry } from '@/features/entry/types'
import type { Todo } from '@/features/todo/types'
import type { Summary } from '@/features/summary/types'
import { toLocalDateString } from '@/lib/date'
import type {
  StreakData,
  XPBreakdown,
  LevelInfo,
  EarnedBadge,
  BadgeCheckContext,
  GamificationStats,
} from './types'
import { XP_REWARDS, LEVEL_THRESHOLDS, BADGE_DEFINITIONS } from './constants'

export function calculateStreak(entries: Entry[]): StreakData {
  if (!entries || entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastEntryDate: null, hasEntryToday: false }
  }

  const uniqueDates = [...new Set(entries.map((e) => e.date))].sort().reverse()

  const today = new Date()
  const todayStr = toLocalDateString(today)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toLocalDateString(yesterday)

  const hasEntryToday = uniqueDates.includes(todayStr)
  const lastEntryDate = uniqueDates[0] || null

  // Current streak: count consecutive days backwards from today (or yesterday if no entry today)
  let currentStreak = 0
  const startDate = hasEntryToday ? today : (uniqueDates.includes(yesterdayStr) ? yesterday : null)

  if (startDate) {
    const checkDate = new Date(startDate)
    while (true) {
      const checkStr = toLocalDateString(checkDate)
      if (uniqueDates.includes(checkStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Longest streak: scan all dates
  let longestStreak = 0
  let tempStreak = 1
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const curr = new Date(uniqueDates[i] + 'T00:00:00')
    const next = new Date(uniqueDates[i + 1] + 'T00:00:00')
    const diffDays = (curr.getTime() - next.getTime()) / 86400000

    if (diffDays === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)
  if (uniqueDates.length === 0) longestStreak = 0

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastEntryDate,
    hasEntryToday,
  }
}

export function calculateXP(
  entries: Entry[],
  todos: Todo[],
  summaries: Summary[],
  streak: StreakData,
): XPBreakdown {
  const entriesXP = (entries?.length || 0) * XP_REWARDS.entry
  const todosCompletedCount = (todos || []).filter((t) => t.status === 'done').length
  const todosXP = todosCompletedCount * XP_REWARDS.todoCompleted
  const dailySummaries = (summaries || []).filter((s) => s.period === 'daily').length
  const weeklySummaries = (summaries || []).filter((s) => s.period === 'weekly').length
  const dailyXP = dailySummaries * XP_REWARDS.dailySummary
  const weeklyXP = weeklySummaries * XP_REWARDS.weeklySummary
  const streakBonus = streak.currentStreak * XP_REWARDS.streakBonusPerDay

  return {
    entries: entriesXP,
    todosCompleted: todosXP,
    dailySummaries: dailyXP,
    weeklySummaries: weeklyXP,
    streakBonus,
    total: entriesXP + todosXP + dailyXP + weeklyXP + streakBonus,
  }
}

export function calculateLevel(totalXP: number): LevelInfo {
  let currentLevel = LEVEL_THRESHOLDS[0]

  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXP >= threshold.xp) {
      currentLevel = threshold
    } else {
      break
    }
  }

  const currentIndex = LEVEL_THRESHOLDS.indexOf(currentLevel)
  const nextLevel = LEVEL_THRESHOLDS[currentIndex + 1]

  const xpForCurrent = currentLevel.xp
  const xpForNext = nextLevel ? nextLevel.xp : currentLevel.xp
  const progress = nextLevel
    ? (totalXP - xpForCurrent) / (xpForNext - xpForCurrent)
    : 1

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXP: totalXP,
    xpForCurrentLevel: xpForCurrent,
    xpForNextLevel: xpForNext,
    progress: Math.min(Math.max(progress, 0), 1),
  }
}

export function evaluateBadges(context: BadgeCheckContext): EarnedBadge[] {
  return BADGE_DEFINITIONS.map((badge) => ({
    id: badge.id,
    emoji: badge.emoji,
    title: badge.title,
    description: badge.description,
    earned: badge.check(context),
  }))
}

export function calculateGamificationStats(
  entries: Entry[],
  todos: Todo[],
  summaries: Summary[],
): GamificationStats {
  const streak = calculateStreak(entries)
  const xp = calculateXP(entries, todos, summaries, streak)
  const level = calculateLevel(xp.total)

  const todosCompleted = (todos || []).filter((t) => t.status === 'done').length
  const dailySummaries = (summaries || []).filter((s) => s.period === 'daily').length
  const weeklySummaries = (summaries || []).filter((s) => s.period === 'weekly').length

  // Check for early bird / night owl
  const hasEarlyEntry = (entries || []).some((e) => {
    const hour = new Date(e.created_at).getHours()
    return hour < 7
  })
  const hasLateEntry = (entries || []).some((e) => {
    const hour = new Date(e.created_at).getHours()
    return hour >= 23
  })

  const badges = evaluateBadges({
    totalEntries: entries?.length || 0,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    todosCompleted,
    dailySummaries,
    weeklySummaries,
    hasEarlyEntry,
    hasLateEntry,
  })

  return {
    streak,
    xp,
    level,
    badges,
    totalEntries: entries?.length || 0,
    todosCompleted,
    totalSummaries: dailySummaries + weeklySummaries,
  }
}
