import { View, Text, TouchableOpacity } from 'react-native'

type BadgeVariant = 'indigo' | 'gray' | 'green' | 'red' | 'amber' | 'gold'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  onPress?: () => void
  size?: 'sm' | 'md'
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
  green: { bg: 'bg-green-50', text: 'text-green-700' },
  red: { bg: 'bg-red-50', text: 'text-red-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  gold: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
}

export function Badge({ label, variant = 'indigo', onPress, size = 'sm' }: BadgeProps) {
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
