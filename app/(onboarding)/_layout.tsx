import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    // document.title is handled by root layout's useEffect (segments-based)
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="persona" />
      <Stack.Screen name="complete" />
    </Stack>
  )
}
