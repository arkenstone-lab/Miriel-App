# Settings & Privacy System

## Settings Store

`src/stores/settingsStore.ts` manages user preferences with Zustand.

### Storage Strategy

| Data Category | Storage | Reason |
|---------------|---------|--------|
| Theme, Language | AsyncStorage | Device-level preferences |
| Nickname, Gender, Occupation, Interests, Avatar, Onboarding, Privacy, Notifications | Supabase user_metadata | Account-level, synced across devices |
| Username, Phone | Supabase `profiles` table | Shared data (username lookup for login) |

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
| `username` | `string` | `''` | profiles table (read-only) |
| `phone` | `string` | `''` | profiles table |
| `notificationsEnabled` | `boolean` | `false` | user_metadata |
| `morningNotificationTime` | `string` | `'09:00'` | user_metadata |
| `eveningNotificationTime` | `string` | `'21:00'` | user_metadata |
| `initialized` | `boolean` | `false` | — |
| `userDataLoaded` | `boolean` | `false` | — |

### Actions

| Action | Description |
|--------|-------------|
| `initialize()` | Reads theme/language from AsyncStorage, applies language to i18n |
| `loadUserData(metadata, userId)` | Loads user_metadata fields (sync) + fetches profiles data (async) |
| `clearUserData()` | Resets all user fields, sets `userDataLoaded: false` |
| `setTheme(theme)` | Persists to AsyncStorage, triggers NativeWind color scheme |
| `setLanguage(lang)` | Persists to AsyncStorage, calls `i18n.changeLanguage()` |
| `setNickname(name)` | Updates user_metadata |
| `setPhone(phone)` | Updates profiles table |
| `setEmail(email)` | Calls `supabase.auth.updateUser({ email })` |
| `changePassword(password)` | Calls `supabase.auth.updateUser({ password })` |
| `savePersona(data)` | Batch update user_metadata (nickname, gender, occupation, interests) |
| `acknowledgePrivacyNotice()` | Sets flag in user_metadata |
| `acknowledgeOnboarding()` | Sets flag in user_metadata |
| `setNotificationsEnabled(enabled)` | Requests permissions, schedules/cancels notifications |
| `setMorningNotificationTime(time)` | Reschedules morning notification |
| `setEveningNotificationTime(time)` | Reschedules evening notification |

### Initialization

Called in `app/_layout.tsx` alongside auth initialization:

```tsx
useEffect(() => {
  initialize()      // auth
  initSettings()    // settings (AsyncStorage)
}, [])

// User data loaded when user changes
useEffect(() => {
  if (user) {
    loadUserData(user.user_metadata || {}, user.id)
  } else {
    clearUserData()
  }
}, [user])
```

### loadUserData Flow

1. **Sync**: Set all user_metadata fields immediately (nickname, gender, etc.)
2. **Async**: Fetch `profiles` table for username/phone (using `.maybeSingle()`)
3. If profile exists → set username/phone → `userDataLoaded: true`
4. If profile doesn't exist AND `metadata.pendingUsername` is set (post email verification): auto-create profile → clear pending flags from user_metadata → `userDataLoaded: true`
5. If profiles fetch fails or no pending data → still set `userDataLoaded: true` (don't block routing)

## Settings Screen

`app/settings.tsx` — Opens as a modal (Stack.Screen with `presentation: 'modal'`).

### Sections

1. **Language** — Segmented control: System / 한국어 / English
2. **Theme** — Segmented control: System / Light / Dark
3. **Notifications** — Toggle + morning/evening time pickers (native only)
4. **Account**
   - Username (read-only, shows `@username`)
   - Nickname (EditModal)
   - Email (EditModal → `setEmail`)
   - Phone (EditModal → `setPhone`)
   - Password (EditModal with `secureTextEntry` → `changePassword`)
   - Sign Out (confirmation alert)
5. **Privacy & Data** — Inline privacy notice
6. **Support** — External links (homepage, Telegram, Discord, X)
7. **Legal** — Terms of Service, Privacy Policy (LegalModal)
8. **Version** — App version number

### Navigation Entry Points

- **Desktop:** Gear icon (`cog`) in SidebarNav, above sign-out
- **Mobile:** Profile tab → "Settings" button

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

1. Decide storage: AsyncStorage (device-level) or user_metadata (account-level) or profiles (shared)
2. Add the state field to `settingsStore.ts`
3. Add action method with appropriate persistence
4. For user_metadata: data loaded automatically in `loadUserData()`
5. For profiles: add fetch in `loadUserData()` and update action with `supabase.from('profiles').update()`
6. Add translation keys to `settings.json` (both ko and en)
7. Add UI section in `app/settings.tsx`
