import '@/i18n'
import { useEffect } from 'react'
import { Platform } from 'react-native'
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
  const {
    theme, hasSeenOnboarding,
    initialized: settingsReady, userDataLoaded,
    initialize: initSettings, loadUserData, clearUserData,
  } = useSettingsStore()
  const { colorScheme, setColorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const segments = useSegments()
  const router = useRouter()
  const { t } = useTranslation('common')

  useEffect(() => {
    initialize()
    initSettings()
  }, [])

  // Initialize notification handler & channel (native only)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('@/lib/notifications').then(({ setupNotificationHandler, setupNotificationChannel }) => {
        setupNotificationHandler()
        setupNotificationChannel()
      })
    }
  }, [])

  // Re-schedule notifications on app restart if enabled
  useEffect(() => {
    if (userDataLoaded && Platform.OS !== 'web') {
      const state = useSettingsStore.getState()
      if (state.notificationsEnabled) {
        import('@/lib/notifications').then(({ scheduleNotifications }) => {
          scheduleNotifications(state.morningNotificationTime, state.eveningNotificationTime)
        })
      }
    }
  }, [userDataLoaded])

  // Load / clear user-specific data from Supabase user_metadata
  useEffect(() => {
    if (user) {
      loadUserData(user.user_metadata || {}, user.id)
    } else {
      clearUserData()
    }
  }, [user])

  useEffect(() => {
    if (settingsReady) {
      setColorScheme(theme)
    }
  }, [theme, settingsReady])

  useEffect(() => {
    if (!initialized || !settingsReady) return
    // Wait for user_metadata to be loaded before routing
    if (user && !userDataLoaded) return

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
  }, [initialized, settingsReady, userDataLoaded, user, hasSeenOnboarding, segments])

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
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: true,
          title: t('screen.editProfile'),
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
