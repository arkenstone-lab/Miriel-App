# Dark Mode Guide

## How It Works

Dark mode uses NativeWind's `darkMode: 'class'` strategy. The user's preference is stored in `settingsStore` and applied via `setColorScheme()` from `nativewind`.

### Initialization Flow

1. `settingsStore.initialize()` reads `@miriel/theme` from AsyncStorage
2. `_layout.tsx` calls `setColorScheme(theme)` when settings are ready
3. NativeWind toggles `dark:` variant classes globally
4. React Navigation headers/tab bars use JS-level `isDark` conditional

### Color Scheme Sync

```tsx
// app/_layout.tsx
const { colorScheme, setColorScheme } = useColorScheme()  // from 'nativewind'
const { theme } = useSettingsStore()

useEffect(() => {
  if (settingsReady) setColorScheme(theme)  // 'light' | 'dark' | 'system'
}, [theme, settingsReady])
```

### React Navigation Headers (JS-level)

NativeWind `dark:` classes don't work on React Navigation's `headerStyle` / `tabBarStyle` because those use plain JS style objects. Use the `isDark` pattern:

```tsx
// app/(tabs)/_layout.tsx
const { colorScheme } = useColorScheme()
const isDark = colorScheme === 'dark'

<Tabs screenOptions={{
  headerStyle: { backgroundColor: isDark ? '#111827' : '#ffffff' },
  headerTintColor: isDark ? '#f3f4f6' : '#111827',
  tabBarStyle: { backgroundColor: isDark ? '#111827' : '#ffffff', borderTopColor: isDark ? '#1f2937' : '#e5e7eb' },
}}>
```

## Color Mapping Reference

When adding `dark:` variants, follow this table consistently:

### Backgrounds

| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-gray-900` |
| `bg-gray-50` | `dark:bg-gray-950` |
| `bg-gray-100` | `dark:bg-gray-800` |
| `bg-gray-300` | `dark:bg-gray-600` |

### Text

| Light | Dark |
|-------|------|
| `text-gray-900` | `dark:text-gray-100` |
| `text-gray-800` | `dark:text-gray-200` |
| `text-gray-700` | `dark:text-gray-300` |
| `text-gray-600` | `dark:text-gray-400` |
| `text-gray-500` | `dark:text-gray-400` |
| `text-gray-400` | `dark:text-gray-500` |

### Borders

| Light | Dark |
|-------|------|
| `border-gray-100` | `dark:border-gray-800` |
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-300` | `dark:border-gray-600` |

### Brand/Accent Colors (Cyan)

| Light | Dark | Notes |
|-------|------|-------|
| `bg-cyan-50` | `dark:bg-gray-800/50` | 배경은 다크모드에서 순수 그레이 |
| `bg-cyan-100` | `dark:bg-gray-700/40` | 선택 상태 배경도 그레이 |
| `text-cyan-600` | `dark:text-cyan-400` | 텍스트 액센트는 시안 유지 |
| `text-cyan-700` | `dark:text-cyan-300` | 텍스트 액센트는 시안 유지 |
| `border-cyan-100` | `dark:border-gray-700` | 보더는 다크모드에서 그레이 |
| `border-cyan-300` | `dark:border-gray-600` | 보더는 다크모드에서 그레이 |

### JS Hex Code Reference (Cyan)

| Hex | Tailwind Equivalent | Usage |
|-----|---------------------|-------|
| `#06b6d4` | cyan-500 | 기본 액센트 (버튼, FAB, 탭 active, 토글 thumb) |
| `#22d3ee` | cyan-400 | 밝은 액센트 (다크모드 아이콘, 토글 track) |
| `#67e8f9` | cyan-300 | 매우 밝은 액센트 (쉐브론, 서브 아이콘) |

### Semantic Colors (amber, green, red, yellow)

| Light | Dark |
|-------|------|
| `bg-amber-50` | `dark:bg-amber-900/30` |
| `bg-green-50` | `dark:bg-green-900/30` |
| `bg-red-50` | `dark:bg-red-900/30` |
| `bg-yellow-50` | `dark:bg-yellow-900/30` |
| `text-amber-700` | `dark:text-amber-300` |
| `text-amber-800` | `dark:text-amber-200` |
| `text-green-700` | `dark:text-green-300` |
| `text-red-700` | `dark:text-red-300` |
| `border-amber-200` | `dark:border-amber-700` |

### Keep As-Is (no dark variant needed)

- `bg-cyan-600` (primary buttons — works in both modes)
- `text-white` on colored backgrounds
- `bg-cyan-500` (filled chart dots, active button backgrounds)
- `dark:text-cyan-400`, `dark:text-cyan-300` (다크모드 텍스트 액센트 — 시안 유지)
- `dark:bg-cyan-500` (다크모드 버튼 배경 — 시안 유지)

## Adding Dark Mode to a New Component

1. Add `dark:` variants to every `bg-`, `text-`, `border-` class using the mapping above
2. For `TextInput`, add `bg-white dark:bg-gray-900` explicitly (inputs need explicit background)
3. Test: toggle theme in Settings and verify contrast is readable
4. For JS style objects (React Navigation), use the `isDark` pattern

## Verification Commands

```bash
# Find bg-white without dark: variant (should return 0 for .tsx files)
grep -rn "bg-white" --include="*.tsx" | grep -v "dark:"

# Same for text-gray-900
grep -rn "text-gray-900" --include="*.tsx" | grep -v "dark:"
```
