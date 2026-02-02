import '@/i18n'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { AppShell } from '@/components/layout/AppShell'
import '../global.css'

const queryClient = new QueryClient()

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { initialized, user, initialize } = useAuthStore()
  const { theme, hasSeenOnboarding, initialized: settingsReady, initialize: initSettings } = useSettingsStore()
  const { colorScheme, setColorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const segments = useSegments()
  const router = useRouter()
  const { t } = useTranslation('common')

  useEffect(() => {
    initialize()
    initSettings()
  }, [])

  useEffect(() => {
    if (settingsReady) {
      setColorScheme(theme)
    }
  }, [theme, settingsReady])

  useEffect(() => {
    if (!initialized || !settingsReady) return

    SplashScreen.hideAsync()

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && !hasSeenOnboarding && !inOnboarding) {
      router.replace('/(onboarding)')
    } else if (user && hasSeenOnboarding && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)')
    }
  }, [initialized, settingsReady, user, hasSeenOnboarding, segments])

  if (!initialized || !settingsReady) {
    return null
  }

  const inAuthGroup = segments[0] === '(auth)'
  const inOnboardingGroup = segments[0] === '(onboarding)'

  const stack = (
    <Stack screenOptions={{
      headerShown: false,
      headerStyle: { backgroundColor: isDark ? '#111827' : '#ffffff' },
      headerTintColor: isDark ? '#f3f4f6' : '#111827',
      contentStyle: { backgroundColor: isDark ? '#030712' : '#f9fafb' },
    }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="entries/new"
        options={{
          headerShown: true,
          title: t('screen.newEntry'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="entries/[id]"
        options={{
          headerShown: true,
          title: t('screen.entryDetail'),
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: t('screen.settings'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  )

  return (
    <QueryClientProvider client={queryClient}>
      {user && !inAuthGroup && !inOnboardingGroup ? <AppShell>{stack}</AppShell> : stack}
    </QueryClientProvider>
  )
}
