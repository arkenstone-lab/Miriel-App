import { View, ActivityIndicator } from 'react-native'

interface LoadingStateProps {
  color?: string
}

export function LoadingState({ color = '#4f46e5' }: LoadingStateProps) {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-950">
      <ActivityIndicator size="large" color={color} />
    </View>
  )
}
