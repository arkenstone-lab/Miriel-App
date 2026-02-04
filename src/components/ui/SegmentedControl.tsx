import { View, Text, TouchableOpacity } from 'react-native'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <TouchableOpacity
            key={opt.value}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              active ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
            }`}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                active
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
