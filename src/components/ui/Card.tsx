import { View, TouchableOpacity, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  onPress?: () => void
  className?: string
  style?: ViewStyle
}

export function Card({ children, onPress, className = '', style }: CardProps) {
  const baseClass = `bg-white rounded-xl p-4 border border-gray-100 ${className}`

  if (onPress) {
    return (
      <TouchableOpacity
        className={baseClass}
        onPress={onPress}
        activeOpacity={0.7}
        style={style}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View className={baseClass} style={style}>
      {children}
    </View>
  )
}
