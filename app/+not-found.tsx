import { Link, Stack } from 'expo-router'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

export default function NotFoundScreen() {
  const { t } = useTranslation('common')

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View className="flex-1 items-center justify-center p-5 bg-white dark:bg-gray-950">
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('notFound.title')}
        </Text>
        <Link href="/" className="mt-4 py-4">
          <Text className="text-sm text-indigo-600 dark:text-indigo-400">{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  )
}
