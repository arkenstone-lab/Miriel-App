import i18n from '@/i18n'
import type { BadgeDefinition } from './types'

export const XP_REWARDS = {
  entry: 10,
  todoCompleted: 5,
  dailySummary: 15,
  weeklySummary: 25,
  streakBonusPerDay: 2,
} as const

export const LEVEL_THRESHOLDS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: i18n.t('gamification:levels.1') },
  { level: 2, xp: 50, title: i18n.t('gamification:levels.2') },
  { level: 3, xp: 150, title: i18n.t('gamification:levels.3') },
  { level: 4, xp: 300, title: i18n.t('gamification:levels.4') },
  { level: 5, xp: 500, title: i18n.t('gamification:levels.5') },
  { level: 6, xp: 800, title: i18n.t('gamification:levels.6') },
  { level: 7, xp: 1200, title: i18n.t('gamification:levels.7') },
  { level: 8, xp: 1800, title: i18n.t('gamification:levels.8') },
]

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_entry',
    emoji: '✏️',
    title: i18n.t('gamification:badges.first_entry.title'),
    description: i18n.t('gamification:badges.first_entry.description'),
    check: (ctx) => ctx.totalEntries >= 1,
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    title: i18n.t('gamification:badges.streak_3.title'),
    description: i18n.t('gamification:badges.streak_3.description'),
    check: (ctx) => ctx.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    emoji: '💪',
    title: i18n.t('gamification:badges.streak_7.title'),
    description: i18n.t('gamification:badges.streak_7.description'),
    check: (ctx) => ctx.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    emoji: '👑',
    title: i18n.t('gamification:badges.streak_30.title'),
    description: i18n.t('gamification:badges.streak_30.description'),
    check: (ctx) => ctx.longestStreak >= 30,
  },
  {
    id: 'entries_10',
    emoji: '📚',
    title: i18n.t('gamification:badges.entries_10.title'),
    description: i18n.t('gamification:badges.entries_10.description'),
    check: (ctx) => ctx.totalEntries >= 10,
  },
  {
    id: 'entries_50',
    emoji: '🏆',
    title: i18n.t('gamification:badges.entries_50.title'),
    description: i18n.t('gamification:badges.entries_50.description'),
    check: (ctx) => ctx.totalEntries >= 50,
  },
  {
    id: 'todo_master',
    emoji: '✅',
    title: i18n.t('gamification:badges.todo_master.title'),
    description: i18n.t('gamification:badges.todo_master.description'),
    check: (ctx) => ctx.todosCompleted >= 10,
  },
  {
    id: 'summary_first',
    emoji: '📋',
    title: i18n.t('gamification:badges.summary_first.title'),
    description: i18n.t('gamification:badges.summary_first.description'),
    check: (ctx) => ctx.dailySummaries >= 1,
  },
  {
    id: 'weekly_first',
    emoji: '📊',
    title: i18n.t('gamification:badges.weekly_first.title'),
    description: i18n.t('gamification:badges.weekly_first.description'),
    check: (ctx) => ctx.weeklySummaries >= 1,
  },
  {
    id: 'early_bird',
    emoji: '🌅',
    title: i18n.t('gamification:badges.early_bird.title'),
    description: i18n.t('gamification:badges.early_bird.description'),
    check: (ctx) => ctx.hasEarlyEntry,
  },
  {
    id: 'night_owl',
    emoji: '🦉',
    title: i18n.t('gamification:badges.night_owl.title'),
    description: i18n.t('gamification:badges.night_owl.description'),
    check: (ctx) => ctx.hasLateEntry,
  },
]
