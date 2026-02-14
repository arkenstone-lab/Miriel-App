import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { apiPublicFetch } from '@/lib/api'
import { getApiUrl } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

type Step = 1 | 2 | 3

export default function SignupScreen() {
  const [step, setStep] = useState<Step>(1)

  // Invite code requirement (fetched from server)
  const [inviteRequired, setInviteRequired] = useState(false)
  const [inviteCode, setInviteCode] = useState('')

  // Step 1
  const [email, setEmail] = useState('')
  const [sendingCode, setSendingCode] = useState(false)

  // Step 2
  const [code, setCode] = useState('')
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Step 3
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [errorText, setErrorText] = useState('')

  const codeRef = useRef<TextInput>(null)
  const usernameRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmPasswordRef = useRef<TextInput>(null)

  const router = useRouter()
  const signUp = useAuthStore((s) => s.signUp)
  const { t, i18n } = useTranslation('auth')

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  // Check if invite code is required
  useEffect(() => {
    fetch(`${getApiUrl()}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.invite_required) setInviteRequired(true)
      })
      .catch(() => {})
  }, [])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSendCode = async () => {
    setErrorText('')
    if (inviteRequired && !inviteCode.trim()) {
      setErrorText(t('signup.step1.alertInviteCodeRequired'))
      return
    }
    if (!email || !email.includes('@')) {
      setErrorText(t('signup.step1.alertInvalidEmail'))
      return
    }

    setSendingCode(true)
    try {
      const data = await apiPublicFetch<{ error?: string }>('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), lang: i18n.language }),
      })

      if (data?.error === 'email_already_registered') {
        setErrorText(t('signup.step1.emailAlreadyRegistered'))
        return
      }
      if (data?.error === 'rate_limit') {
        setErrorText(t('signup.step1.rateLimitError'))
        return
      }
      if (data?.error) {
        setErrorText(t('signup.step1.sendFailed'))
        return
      }

      setStep(2)
      setResendCooldown(60)
      setTimeout(() => codeRef.current?.focus(), 300)
    } catch {
      setErrorText(t('signup.step1.sendFailed'))
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    setErrorText('')
    if (!code || code.length !== 6) {
      setErrorText(t('signup.step2.alertInvalidCode'))
      return
    }

    setVerifyingCode(true)
    try {
      const data = await apiPublicFetch<{ error?: string; verified?: boolean; verification_token?: string }>('/auth/verify-email-code', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      })

      if (data?.error === 'invalid_code') {
        setErrorText(t('signup.step2.invalidCode'))
        return
      }
      if (data?.error === 'expired') {
        setErrorText(t('signup.step2.codeExpired'))
        return
      }
      if (data?.error) {
        setErrorText(t('signup.step2.verifyFailed'))
        return
      }

      if (data?.verified && data?.verification_token) {
        setVerificationToken(data.verification_token)
        setStep(3)
        setTimeout(() => usernameRef.current?.focus(), 300)
      } else {
        setErrorText(t('signup.step2.verifyFailed'))
      }
    } catch {
      setErrorText(t('signup.step2.verifyFailed'))
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setErrorText('')
    setSendingCode(true)
    try {
      const data = await apiPublicFetch<{ error?: string }>('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), lang: i18n.language }),
      })
      if (!data?.error) {
        setResendCooldown(60)
        setCode('')
      } else {
        setErrorText(t('signup.step1.sendFailed'))
      }
    } catch {
      setErrorText(t('signup.step1.sendFailed'))
    } finally {
      setSendingCode(false)
    }
  }

  const handleSignup = async () => {
    setErrorText('')

    if (!username || !password) {
      setErrorText(t('signup.step3.alertFillFields'))
      return
    }
    if (!USERNAME_REGEX.test(username)) {
      setErrorText(t('signup.alertUsernameFormat'))
      return
    }
    if (password.length < 6) {
      setErrorText(t('signup.alertPasswordShort'))
      return
    }
    if (password !== confirmPassword) {
      setErrorText(t('signup.alertPasswordMismatch'))
      return
    }

    setLoading(true)
    try {
      await signUp({
        username,
        email: email.trim().toLowerCase(),
        password,
        verificationToken,
        ...(inviteRequired ? { inviteCode: inviteCode.trim() } : {}),
      })
      // session created → onAuthStateChange routes to onboarding
    } catch (error: unknown) {
      setErrorText(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setErrorText('')
    if (step === 2) {
      setStep(1)
      setCode('')
    } else if (step === 3) {
      setStep(2)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-950"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator */}
        <View className="flex-row justify-center mb-8" style={{ gap: 8 }}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              className={`h-2 rounded-full ${
                s === step
                  ? 'w-8 bg-cyan-600 dark:bg-cyan-400'
                  : s < step
                  ? 'w-2 bg-cyan-300 dark:bg-cyan-700'
                  : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </View>

        {/* Back Button (Steps 2 & 3) */}
        {step > 1 && (
          <TouchableOpacity onPress={goBack} className="mb-4">
            <Text className="text-cyan-600 dark:text-cyan-400 text-sm">{`\u2190 ${t('signup.back')}`}</Text>
          </TouchableOpacity>
        )}

        {/* ===== STEP 1: Email ===== */}
        {step === 1 && (
          <>
            <Image
              source={require('../../assets/images/logo-128.png')}
              className="w-16 h-16 self-center mb-3 rounded-2xl"
            />
            <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
              {t('signup.title')}
            </Text>
            <Text className="text-base text-center text-gray-500 dark:text-gray-400 mb-10">
              {t('signup.step1.description')}
            </Text>

            {/* Invite Code (shown only when required) */}
            {inviteRequired && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('signup.inviteCode')}
                </Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                  placeholder={t('signup.inviteCodePlaceholder')}
                  value={inviteCode}
                  onChangeText={(v) => { setInviteCode(v); setErrorText('') }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="next"
                />
                <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('signup.inviteCodeHint')}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.email')}
              </Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                placeholder="email@example.com"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrorText('') }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                autoFocus={!inviteRequired}
                returnKeyType="done"
                onSubmitEditing={handleSendCode}
              />
            </View>

            {errorText !== '' && (
              <View className="mb-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Text className="text-sm text-red-600 dark:text-red-400">{errorText}</Text>
              </View>
            )}

            <TouchableOpacity
              className={`rounded-lg py-3.5 ${sendingCode ? 'bg-cyan-400' : 'bg-cyan-600'}`}
              onPress={handleSendCode}
              disabled={sendingCode}
            >
              <Text className="text-white text-center font-semibold text-base">
                {sendingCode ? t('signup.step1.sendingCode') : t('signup.step1.sendCode')}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6 mb-8">
              <Text className="text-gray-500 dark:text-gray-400">{t('signup.hasAccount')}</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-cyan-600 dark:text-cyan-400 font-semibold">{t('signup.loginLink')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </>
        )}

        {/* ===== STEP 2: Code Verification ===== */}
        {step === 2 && (
          <>
            <Text className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
              {t('signup.step2.title')}
            </Text>
            <Text className="text-base text-center text-gray-500 dark:text-gray-400 mb-8">
              {t('signup.step2.description', { email: email.trim() })}
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.step2.codeLabel')}
              </Text>
              <TextInput
                ref={codeRef}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                placeholder="000000"
                value={code}
                onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setErrorText('') }}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyCode}
              />
            </View>

            {errorText !== '' && (
              <View className="mb-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Text className="text-sm text-red-600 dark:text-red-400">{errorText}</Text>
              </View>
            )}

            <TouchableOpacity
              className={`rounded-lg py-3.5 ${verifyingCode ? 'bg-cyan-400' : 'bg-cyan-600'}`}
              onPress={handleVerifyCode}
              disabled={verifyingCode}
            >
              <Text className="text-white text-center font-semibold text-base">
                {verifyingCode ? t('signup.step2.verifying') : t('signup.step2.verify')}
              </Text>
            </TouchableOpacity>

            {/* Resend & Change Email */}
            <View className="flex-row justify-center mt-5" style={{ gap: 16 }}>
              <TouchableOpacity onPress={handleResendCode} disabled={resendCooldown > 0 || sendingCode}>
                <Text className={`text-sm ${
                  resendCooldown > 0 ? 'text-gray-400 dark:text-gray-500' : 'text-cyan-600 dark:text-cyan-400'
                }`}>
                  {resendCooldown > 0
                    ? t('signup.step2.resendCooldown', { seconds: resendCooldown })
                    : t('signup.step2.resendCode')
                  }
                </Text>
              </TouchableOpacity>
              <Text className="text-sm text-gray-300 dark:text-gray-600">|</Text>
              <TouchableOpacity onPress={() => { setStep(1); setCode(''); setErrorText('') }}>
                <Text className="text-sm text-gray-500 dark:text-gray-400">{t('signup.step2.changeEmail')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ===== STEP 3: Account Creation ===== */}
        {step === 3 && (
          <>
            <Text className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
              {t('signup.step3.title')}
            </Text>
            <Text className="text-base text-center text-gray-500 dark:text-gray-400 mb-8">
              {t('signup.step3.description')}
            </Text>

            {/* Username */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.username')}</Text>
              <TextInput
                ref={usernameRef}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                placeholder={t('signup.usernamePlaceholder')}
                value={username}
                onChangeText={(v) => { setUsername(v); setErrorText('') }}
                autoCapitalize="none"
                autoComplete="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t('signup.usernameHint')}
              </Text>
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.password')}</Text>
              <TextInput
                ref={passwordRef}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                placeholder={t('signup.passwordPlaceholder')}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorText('') }}
                secureTextEntry
                autoComplete="password"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            {/* Confirm Password */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.confirmPassword')}</Text>
              <TextInput
                ref={confirmPasswordRef}
                className={`border rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 ${
                  passwordMismatch
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('signup.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrorText('') }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
              {passwordMismatch && (
                <Text className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {t('signup.alertPasswordMismatch')}
                </Text>
              )}
            </View>

            {errorText !== '' && (
              <View className="mb-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Text className="text-sm text-red-600 dark:text-red-400">{errorText}</Text>
              </View>
            )}

            <TouchableOpacity
              className={`rounded-lg py-3.5 ${loading ? 'bg-cyan-400' : 'bg-cyan-600'}`}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold text-base">
                {loading ? t('signup.step3.loading') : t('signup.step3.button')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
