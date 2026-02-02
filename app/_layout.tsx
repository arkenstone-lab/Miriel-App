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
  const { theme, initialized: settingsReady, initialize: initSettings } = useSettingsStore()
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
    if (!initialized) return

    SplashScreen.hideAsync()

    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [initialized, user, segments])

  if (!initialized) {
    return null
  }

  const inAuthGroup = segments[0] === '(auth)'

  const stack = (
    <Stack screenOptions={{
      headerShown: false,
      headerStyle: { backgroundColor: isDark ? '#111827' : '#ffffff' },
      headerTintColor: isDark ? '#f3f4f6' : '#111827',
      contentStyle: { backgroundColor: isDark ? '#030712' : '#f9fafb' },
    }}>
      <Stack.Screen name="(auth)" />
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
      {user && !inAuthGroup ? <AppShell>{stack}</AppShell> : stack}
    </QueryClientProvider>
  )
}
