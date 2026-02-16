import { Stack } from 'expo-router'

export default function SetupLayout() {
  return (
    // document.title is handled by root layout's useEffect (segments-based)
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="welcome" />
    </Stack>
  )
}
