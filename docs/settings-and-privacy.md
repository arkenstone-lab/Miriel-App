# Settings & Privacy System

## Settings Store

`src/stores/settingsStore.ts` manages user preferences with Zustand.

### Storage Strategy

| Data Category | Storage | Reason |
|---------------|---------|--------|
| Theme, Language | AsyncStorage | Device-level preferences |
| Nickname, Gender, Occupation, Interests, Avatar, Onboarding, Privacy, Notifications | `users.user_metadata` (JSON column via `PUT /auth/user`) | Account-level, synced across devices |
| Username, Email, Phone | `users` table (via `GET /auth/me`, `PUT /auth/user`) | Core account data |

### State

| Field | Type | Default | Storage |
|-------|------|---------|---------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | AsyncStorage |
| `language` | `'ko' \| 'en' \| null` | `null` (system) | AsyncStorage |
| `nickname` | `string` | `''` | user_metadata |
| `gender` | `string` | `''` | user_metadata |
| `occupation` | `string` | `''` | user_metadata |
| `interests` | `string[]` | `[]` | user_metadata |
| `avatarUrl` | `string` | `''` | user_metadata |
| `hasSeenOnboarding` | `boolean` | `false` | user_metadata |
| `hasSeenPrivacyNotice` | `boolean` | `false` | user_metadata |
| `username` | `string` | `''` | users table (read-only) |
| `notificationsEnabled` | `boolean` | `false` | user_metadata |
| `morningNotificationTime` | `string` | `'09:00'` | user_metadata |
| `eveningNotificationTime` | `string` | `'21:00'` | user_metadata |
| `weeklyReviewDay` | `number` | `4` (Friday) | user_metadata |
| `weeklyReviewTime` | `string` | `'10:00'` | user_metadata |
| `initialized` | `boolean` | `false` | — |
| `userDataLoaded` | `boolean` | `false` | — |

### Actions

| Action | Description |
|--------|-------------|
| `initialize()` | Reads theme/language from AsyncStorage, applies language to i18n |
| `loadUserData(userData)` | Parses user_metadata JSON + sets username/email from user object |
| `clearUserData()` | Resets all user fields, sets `userDataLoaded: false` |
| `setTheme(theme)` | Persists to AsyncStorage, triggers NativeWind color scheme |
| `setLanguage(lang)` | Persists to AsyncStorage, calls `i18n.changeLanguage()` |
| `setNickname(name)` | `PUT /auth/user` with updated user_metadata |
| `setEmail(email)` | `PUT /auth/user` with new email |
| `changePassword(current, new)` | `POST /auth/change-password` |
| `savePersona(data)` | Batch `PUT /auth/user` with user_metadata merge (nickname, gender, occupation, interests) |
| `acknowledgePrivacyNotice()` | Sets flag via `PUT /auth/user` user_metadata |
| `acknowledgeOnboarding()` | Sets flag via `PUT /auth/user` user_metadata |
| `setNotificationsEnabled(enabled)` | Requests permissions, schedules/cancels notifications |
| `setMorningNotificationTime(time)` | Reschedules morning notification |
| `setEveningNotificationTime(time)` | Reschedules evening notification |
| `setWeeklyReviewDay(day)` | Updates weekly review day (0=Mon..6=Sun) |
| `setWeeklyReviewTime(time)` | Updates weekly review time |
| `saveNotificationSettings(data)` | Batch save notification settings from onboarding |

### Initialization

Called in `app/_layout.tsx` alongside auth initialization:

```tsx
useEffect(() => {
  initialize()      // auth (restore tokens)
  initSettings()    // settings (AsyncStorage)
}, [])

// User data loaded when user changes
useEffect(() => {
  if (user) {
    loadUserData(user)  // parse user_metadata JSON, set username/email
  } else {
    clearUserData()
  }
}, [user])
```

### loadUserData Flow

1. Parse `user_metadata` JSON string → set all metadata fields (nickname, gender, etc.)
2. Set `username`, `email` from user object
3. Set `userDataLoaded: true`

## Settings Screen

`app/settings.tsx` — Opens as a modal (Stack.Screen with `presentation: 'modal'`).

### Sections

1. **Language** — Segmented control: System / Korean / English
2. **Theme** — Segmented control: System / Light / Dark
3. **Notifications** — Toggle + morning/evening time pickers + weekly review day/time
4. **AI Personalization** — Customize how AI processes entries
   - Share Persona (Switch toggle) — Whether to share nickname/occupation/interests with AI
   - Summary Style (EditModal) — Summary style preference (e.g. "concise", "detailed")
   - Focus Areas (6 chip toggles) — Project management, self-development, work efficiency, communication, health/wellness, learning/growth
   - Custom Instructions (EditModal multiline, 500 chars) — Free-text instructions for AI
   - Data: `user_ai_preferences` table (separate — own user only)
   - Hooks: `useAiPreferences()`, `useUpsertAiPreferences()` (`src/features/ai-preferences/`)
5. **Account**
   - Username (read-only, shows `@username`)
   - Nickname (EditModal)
   - Email (EditModal → `setEmail`)
   - Password (ChangePasswordModal → `POST /auth/change-password`)
   - Sign Out (confirmation alert)
6. **Privacy & Data** — Inline privacy notice
7. **Support** — External links (homepage, Telegram, Discord, X)
8. **Legal** — Terms of Service, Privacy Policy (LegalModal)
9. **Version** — App version number

### Navigation Entry Points

- **Desktop:** Gear icon (`cog`) in SidebarNav, above sign-out
- **Mobile:** Profile tab → "Settings" button, Home tab → header right gear icon

## Privacy Notice Component

`src/components/PrivacyNotice.tsx`

### Props

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `'banner' \| 'inline'` | Banner = dismissible (dashboard), inline = always visible (settings) |

### Behavior

- **Banner mode:** Shows on dashboard if `!hasSeenPrivacyNotice`. Renders an "I Understand" button that calls `acknowledgePrivacyNotice()`. Disappears once acknowledged.
- **Inline mode:** Always renders. No dismiss button. Used in settings screen.

### Translations

Namespace: `privacy`

```json
{
  "notice": {
    "title": "How We Use Your Data",
    "body": "Your entries are processed by AI...",
    "acknowledge": "I Understand"
  }
}
```

## Adding New Settings

1. Decide storage: AsyncStorage (device-level) or user_metadata (account-level)
2. Add the state field to `settingsStore.ts`
3. Add action method with appropriate persistence
4. For user_metadata: update via `PUT /auth/user` with merged metadata JSON
5. Add translation keys to `settings.json` (both ko and en)
6. Add UI section in `app/settings.tsx`
7. For AI-related settings, use `user_ai_preferences` table + `src/features/ai-preferences/` module (not settingsStore)
