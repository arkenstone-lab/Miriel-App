import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function SetupLayout() {
  const { t } = useTranslation()

  return (
    // headerShown: false stays — title still sets document.title on web
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: t('screen.setup') }} />
      <Stack.Screen name="theme" options={{ title: t('screen.setup') }} />
      <Stack.Screen name="welcome" options={{ title: t('screen.welcome') }} />
    </Stack>
  )
}
