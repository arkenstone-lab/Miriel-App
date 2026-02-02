import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import '../global.css'

const queryClient = new QueryClient()

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { initialized, user, initialize } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [])

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

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="entries/new"
          options={{
            headerShown: true,
            title: '새 기록',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="entries/[id]"
          options={{
            headerShown: true,
            title: '기록 상세',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </QueryClientProvider>
  )
}
