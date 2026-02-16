import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function OnboardingLayout() {
  const { t } = useTranslation()

  return (
    // headerShown: false stays — title still sets document.title on web
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: t('screen.onboarding') }} />
      <Stack.Screen name="persona" options={{ title: t('screen.onboarding') }} />
      <Stack.Screen name="complete" options={{ title: t('screen.onboarding') }} />
    </Stack>
  )
}
