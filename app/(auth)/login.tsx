import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Link } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const signIn = useAuthStore((s) => s.signIn)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message || '다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
          ReflectLog
        </Text>
        <Text className="text-base text-center text-gray-500 mb-10">
          AI가 정리해주는 나만의 회고 저널
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">이메일</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">비밀번호</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          className={`rounded-lg py-3.5 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? '로그인 중...' : '로그인'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">계정이 없으신가요? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-indigo-600 font-semibold">회원가입</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
