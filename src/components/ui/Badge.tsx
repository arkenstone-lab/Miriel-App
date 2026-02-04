import { View, Text, TouchableOpacity } from 'react-native'

type BadgeVariant = 'cyan' | 'gray' | 'green' | 'red' | 'amber' | 'gold'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  onPress?: () => void
  size?: 'sm' | 'md'
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  cyan: { bg: 'bg-cyan-50 dark:bg-gray-800/50', text: 'text-cyan-700 dark:text-cyan-300' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  gold: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
}

export function Badge({ label, variant = 'cyan', onPress, size = 'sm' }: BadgeProps) {
  const v = variantClasses[variant]
  const padding = size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-1'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  const content = (
    <View className={`rounded-full ${padding} ${v.bg}`}>
      <Text className={`${textSize} font-medium ${v.text}`}>{label}</Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}
