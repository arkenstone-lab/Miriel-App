import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    // document.title is handled by root layout's useEffect (segments-based)
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="find-id" />
      <Stack.Screen name="find-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  )
}
