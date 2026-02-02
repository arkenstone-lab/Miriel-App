export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastEntryDate: string | null
  hasEntryToday: boolean
}

export interface XPBreakdown {
  entries: number
  todosCompleted: number
  dailySummaries: number
  weeklySummaries: number
  streakBonus: number
  total: number
}

export interface LevelInfo {
  level: number
  title: string
  currentXP: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progress: number // 0-1
}

export interface BadgeDefinition {
  id: string
  emoji: string
  title: string
  description: string
  check: (stats: BadgeCheckContext) => boolean
}

export interface BadgeCheckContext {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  todosCompleted: number
  dailySummaries: number
  weeklySummaries: number
  hasEarlyEntry: boolean
  hasLateEntry: boolean
}

export interface EarnedBadge {
  id: string
  emoji: string
  title: string
  description: string
  earned: boolean
}

export interface GamificationStats {
  streak: StreakData
  xp: XPBreakdown
  level: LevelInfo
  badges: EarnedBadge[]
  totalEntries: number
  todosCompleted: number
  totalSummaries: number
}
