import { View, Text } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name']
  emoji?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center px-8">
      {emoji ? (
        <Text className="text-4xl mb-4">{emoji}</Text>
      ) : icon ? (
        <View className="mb-4">
          <FontAwesome name={icon} size={40} color="#d1d5db" />
        </View>
      ) : null}
      <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
        {title}
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-5">{description}</Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} />
      )}
    </View>
  )
}
