import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function AuthLayout() {
  const { t } = useTranslation()

  return (
    // headerShown: false stays — title still sets document.title on web
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: t('screen.login') }} />
      <Stack.Screen name="signup" options={{ title: t('screen.signup') }} />
      <Stack.Screen name="find-id" options={{ title: t('screen.findId') }} />
      <Stack.Screen name="find-password" options={{ title: t('screen.findPassword') }} />
      <Stack.Screen name="verify-email" options={{ title: t('screen.verifyEmail') }} />
    </Stack>
  )
}
