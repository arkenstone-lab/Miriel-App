import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Link } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const signUp = useAuthStore((s) => s.signUp)

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.')
      return
    }
    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password)
      Alert.alert('회원가입 완료', '이메일을 확인해주세요.')
    } catch (error: any) {
      Alert.alert('회원가입 실패', error.message || '다시 시도해주세요.')
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
          회원가입
        </Text>
        <Text className="text-base text-center text-gray-500 mb-10">
          ReflectLog와 함께 기록을 시작하세요
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
            placeholder="6자 이상"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          className={`rounded-lg py-3.5 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? '가입 중...' : '회원가입'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">이미 계정이 있으신가요? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-indigo-600 font-semibold">로그인</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
