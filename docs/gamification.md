# Gamification System

## Overview

The gamification system drives daily engagement through streaks, XP/levels, and badges. All calculations happen client-side based on API data — no dedicated gamification table exists.

## Streak Tracking

Calculated in `features/gamification/calculations.ts` from the entry list:

```typescript
interface StreakData {
  currentStreak: number    // Consecutive days with entries up to today
  longestStreak: number    // All-time longest streak
  lastEntryDate: string | null
  hasEntryToday: boolean
}
```

Streak logic:
- A day "counts" if at least one entry exists for that date
- Streak breaks if a calendar day is missed
- `hasEntryToday` drives the reminder banner and streak emoji (fire vs sleep)

## XP & Levels

### XP Rewards (`features/gamification/constants.ts`)

| Action | XP |
|--------|----|
| New entry | 10 |
| Todo completed | 5 |
| Daily summary generated | 15 |
| Weekly summary generated | 25 |
| Streak bonus (per day) | 2 |

### Level Thresholds

| Level | XP Required | Title (localized) |
|-------|-------------|-------------------|
| 1 | 0 | Beginner |
| 2 | 50 | Recorder |
| 3 | 150 | Practitioner |
| 4 | 300 | Analyst |
| 5 | 500 | Reflector |
| 6 | 800 | Strategist |
| 7 | 1200 | Mentor |
| 8 | 1800 | Master |

Level titles are localized via `gamification:levels.*` namespace.

## Badges

11 badge definitions in `features/gamification/constants.ts`:

| ID | Emoji | Condition |
|----|-------|-----------|
| `first_entry` | ✏️ | totalEntries >= 1 |
| `streak_3` | 🔥 | longestStreak >= 3 |
| `streak_7` | 💪 | longestStreak >= 7 |
| `streak_30` | 👑 | longestStreak >= 30 |
| `entries_10` | 📚 | totalEntries >= 10 |
| `entries_50` | 🏆 | totalEntries >= 50 |
| `todo_master` | ✅ | todosCompleted >= 10 |
| `summary_first` | 📋 | dailySummaries >= 1 |
| `weekly_first` | 📊 | weeklySummaries >= 1 |
| `early_bird` | 🌅 | hasEarlyEntry (before 7 AM) |
| `night_owl` | 🦉 | hasLateEntry (after 11 PM) |

Each badge has a `check()` function that receives a `BadgeCheckContext` and returns boolean.

## Data Flow

```
useGamificationStats() hook
  → fetches entries, todos, summaries via Worker API
  → calculateStreak(entries)
  → calculateXP(entries, todos, summaries, streak)
  → calculateLevel(xp)
  → evaluateBadges(context)
  → returns GamificationStats
```

All gamification is computed, not stored. This keeps it simple and avoids sync issues.

## Dashboard Components

- `StreakCard` — Current streak + longest record + today status
- `LevelProgressCard` — Level number + title + XP progress bar
- `BadgeGrid` — Grid of all badges (earned = colored, locked = grayed + 🔒)
- `StatsRow` — Total entries, todos completed, summaries count
- `WeeklyActivityChart` — 7-day dot visualization
- `TodayReminderBanner` — Amber CTA when no entry today

## Adding a New Badge

1. Add definition to `BADGE_DEFINITIONS` in `features/gamification/constants.ts`
2. Add translation keys to `gamification.json` (both ko/en): `badges.<id>.title` and `badges.<id>.description`
3. If the badge needs new context data, update `BadgeCheckContext` type and the stats hook
