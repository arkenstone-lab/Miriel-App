import { View, Text } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { AppError } from '@/lib/errors'

interface ErrorDisplayProps {
  error: Error | null
  fallbackMessage?: string
}

/**
 * Full-screen centered error display with error code.
 * Used in tab screens and detail pages for React Query error states.
 */
export function ErrorDisplay({ error, fallbackMessage }: ErrorDisplayProps) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { t } = useTranslation('errors')

  const isAppError = error instanceof AppError
  const message = error?.message || fallbackMessage || t('UNKNOWN.message')
  const code = isAppError ? error.code : null

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-950 px-8">
      <FontAwesome
        name="exclamation-circle"
        size={32}
        color={isDark ? '#f87171' : '#ef4444'}
        style={{ marginBottom: 12 }}
      />
      <Text className="text-base text-red-500 dark:text-red-400 text-center leading-6">
        {message}
      </Text>
      {code && (
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          ({t('codeLabel')}: {code})
        </Text>
      )}
    </View>
  )
}
