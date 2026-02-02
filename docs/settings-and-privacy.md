# Settings & Privacy System

## Settings Store

`src/stores/settingsStore.ts` manages user preferences with Zustand + AsyncStorage.

### State

| Field | Type | Default | AsyncStorage Key |
|-------|------|---------|-----------------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | `@reflectlog/theme` |
| `language` | `'ko' \| 'en' \| null` | `null` (system) | `@reflectlog/language` |
| `hasSeenPrivacyNotice` | `boolean` | `false` | `@reflectlog/privacy_seen` |
| `initialized` | `boolean` | `false` | — |

### Actions

| Action | Description |
|--------|-------------|
| `initialize()` | Reads all 3 keys from AsyncStorage, applies language to i18n |
| `setTheme(theme)` | Persists theme, triggers NativeWind color scheme change |
| `setLanguage(lang)` | Persists language (or removes if null), calls `i18n.changeLanguage()` |
| `acknowledgePrivacyNotice()` | Sets flag to true, persists |

### Initialization

Called in `app/_layout.tsx` alongside auth initialization:

```tsx
useEffect(() => {
  initialize()      // auth
  initSettings()    // settings
}, [])
```

## Settings Screen

`app/settings.tsx` — Opens as a modal (Stack.Screen with `presentation: 'modal'`).

### Sections

1. **Language** — Segmented control: System / 한국어 / English
2. **Theme** — Segmented control: System / Light / Dark
3. **Account** — Email display + sign out (with confirmation alert)
4. **Privacy & Data** — Inline privacy notice (always shown, not dismissible)
5. **Version** — App version number

### Navigation Entry Points

- **Desktop:** Gear icon (`cog`) in SidebarNav, above sign-out
- **Mobile:** Gear icon in tab bar's `headerRight`

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

1. Add the state field + AsyncStorage key to `settingsStore.ts`
2. Add action methods (getter/setter with persistence)
3. Read from storage in `initialize()`
4. Add translation keys to `settings.json` (both ko and en)
5. Add UI section in `app/settings.tsx`
