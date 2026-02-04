import { Stack } from 'expo-router'

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="welcome" />
    </Stack>
  )
}
