# Component Guide

## UI Primitives (`src/components/ui/`)

These are the building blocks. Use them instead of creating one-off styled views.

### Button

```tsx
import { Button } from '@/components/ui/Button'

<Button title="Save" onPress={handleSave} />
<Button title="Cancel" variant="secondary" onPress={handleCancel} />
<Button title="Delete" variant="ghost" size="sm" onPress={handleDelete} />
<Button title="Saving..." loading={true} onPress={handleSave} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Button text |
| `onPress` | function | required | Press handler |
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding/font size |
| `loading` | boolean | `false` | Shows spinner, disables press |
| `disabled` | boolean | `false` | Grays out, disables press |

### Card

```tsx
import { Card } from '@/components/ui/Card'

<Card>content</Card>                              // static card
<Card onPress={handlePress}>tappable card</Card>  // touchable card
<Card className="border-indigo-300">custom</Card> // extra classes
```

Provides: `bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800`.

### Badge

```tsx
import { Badge } from '@/components/ui/Badge'

<Badge label="project:A" variant="indigo" />
<Badge label="3 done" variant="green" size="md" />
<Badge label="urgent" variant="red" onPress={handlePress} />
```

Variants: `indigo`, `gray`, `green`, `red`, `amber`, `gold`. All have dark mode support built in.

### EmptyState

```tsx
<EmptyState
  emoji="📝"
  title="No entries yet"
  description="Start writing to see your entries here."
  actionLabel="Write Now"
  onAction={() => router.push('/entries/new')}
/>
```

Centered vertically. Use `emoji` or `icon` (FontAwesome name), not both.

### LoadingState

```tsx
<LoadingState />               // default indigo spinner
<LoadingState color="#22c55e" /> // custom color
```

Full-screen centered spinner with `bg-gray-50 dark:bg-gray-950` background.

## Layout Components (`src/components/layout/`)

### AppShell

Wraps the entire app. On desktop, shows sidebar + content. On mobile, passthrough.

```tsx
<AppShell>{children}</AppShell>
```

### SidebarNav

Desktop-only navigation sidebar with:
- Brand logo
- "New Entry" button
- Nav items (home, timeline, summary, weekly, todos)
- Settings gear icon
- Sign out button

### MasterDetailLayout

Desktop-only split view. Used by timeline, summary, weekly, and todos screens.

```tsx
<MasterDetailLayout
  master={<FlatList ... />}
  detail={selectedItem ? <DetailView /> : null}
  detailPlaceholder="Select an item"
/>
```

Left panel is 380px wide. Right panel fills remaining space. On mobile, only `master` renders.

## Dashboard Components (`src/components/dashboard/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `StreakCard` | `streak: StreakData` | Current streak count, longest record, today status |
| `LevelProgressCard` | `level: LevelInfo` | Level number, title, XP progress bar |
| `BadgeGrid` | `badges: EarnedBadge[]` | Grid of earned/locked badges with emojis |
| `StatsRow` | `totalEntries, todosCompleted, totalSummaries` | Three-column stat display |
| `WeeklyActivityChart` | `entries: Entry[]` | 7-day dot chart showing entry activity |
| `RecentSummaryCard` | (none, fetches own data) | Latest daily summary preview |
| `QuickActions` | (none) | "Write Today" + secondary action buttons |
| `TodayReminderBanner` | `streak: StreakData` | Amber banner shown when no entry today |

## Content Components (`src/components/`)

| Component | Usage |
|-----------|-------|
| `EntryCard` | Entry list item (date, text preview, tags). Used in timeline. |
| `EntryDetail` | Full entry view (date, text, tags). Used in master-detail. |
| `EvidenceChip` | Clickable chip linking to a source entry. Used in summaries. |
| `SummaryDetailView` | Full summary with numbered sentences + evidence chips. |
| `TodoItem` | Todo with checkbox, source link, delete button. |
| `PrivacyNotice` | Privacy disclosure card. `mode='banner'` (dismissible) or `mode='inline'` (always shown). |

## Creating a New Component

1. Place it in the appropriate directory:
   - `ui/` for reusable primitives
   - `dashboard/` for dashboard-specific
   - `components/` root for content-level components
2. Always include `dark:` variants on all color classes (see `docs/dark-mode.md`)
3. Use `useTranslation()` for all user-facing strings (see `docs/i18n.md`)
4. Accept `className` prop for customization when appropriate
5. Export as named export (not default)
