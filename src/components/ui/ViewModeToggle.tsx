import { View, TouchableOpacity } from 'react-native'
import { useColorScheme } from 'nativewind'
import FontAwesome from '@expo/vector-icons/FontAwesome'

type ViewMode = 'list' | 'calendar'

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const modes: { mode: ViewMode; icon: 'list' | 'calendar' }[] = [
    { mode: 'list', icon: 'list' },
    { mode: 'calendar', icon: 'calendar' },
  ]

  return (
    <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      {modes.map(({ mode, icon }) => {
        const active = mode === value
        return (
          <TouchableOpacity
            key={mode}
            className={`px-3 py-2 rounded-md items-center justify-center ${
              active ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
            }`}
            onPress={() => onChange(mode)}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={icon}
              size={14}
              color={
                active
                  ? (isDark ? '#22d3ee' : '#06b6d4')
                  : (isDark ? '#9ca3af' : '#6b7280')
              }
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
