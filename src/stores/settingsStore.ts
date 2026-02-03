import { create } from 'zustand'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '@/i18n'
import { getLocales } from 'expo-localization'
import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'ko' | 'en'

// Device-level settings only (AsyncStorage)
const KEYS = {
  theme: '@miriel/theme',
  language: '@miriel/language',
} as const

interface PersonaData {
  nickname: string
  gender: string
  occupation: string
  interests: string[]
}

interface SettingsState {
  // Device settings (AsyncStorage)
  theme: ThemeMode
  language: Language | null
  // User data (Supabase user_metadata)
  nickname: string
  gender: string
  occupation: string
  interests: string[]
  avatarUrl: string
  hasSeenPrivacyNotice: boolean
  hasSeenOnboarding: boolean
  // Profile data (Supabase profiles table)
  username: string
  phone: string
  // Notification settings (Supabase user_metadata)
  notificationsEnabled: boolean
  morningNotificationTime: string  // "HH:mm"
  eveningNotificationTime: string  // "HH:mm"
  // Flags
  initialized: boolean
  userDataLoaded: boolean
  // Device settings actions
  initialize: () => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setLanguage: (lang: Language | null) => Promise<void>
  // User data actions (Supabase user_metadata)
  loadUserData: (metadata: Record<string, any>, userId: string) => void
  clearUserData: () => void
  setNickname: (name: string) => Promise<void>
  setGender: (gender: string) => Promise<void>
  setOccupation: (occupation: string) => Promise<void>
  setInterests: (interests: string[]) => Promise<void>
  setAvatarUrl: (url: string) => Promise<void>
  savePersona: (data: PersonaData) => Promise<void>
  acknowledgePrivacyNotice: () => Promise<void>
  acknowledgeOnboarding: () => Promise<void>
  // Account actions
  setPhone: (phone: string) => Promise<void>
  setEmail: (email: string) => Promise<void>
  changePassword: (password: string) => Promise<void>
  // Notification actions
  setNotificationsEnabled: (enabled: boolean) => Promise<void>
  setMorningNotificationTime: (time: string) => Promise<void>
  setEveningNotificationTime: (time: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  language: null,
  nickname: '',
  gender: '',
  occupation: '',
  interests: [],
  avatarUrl: '',
  hasSeenPrivacyNotice: false,
  hasSeenOnboarding: false,
  username: '',
  phone: '',
  notificationsEnabled: false,
  morningNotificationTime: '09:00',
  eveningNotificationTime: '21:00',
  initialized: false,
  userDataLoaded: false,

  initialize: async () => {
    try {
      const [storedTheme, storedLang] = await Promise.all([
        AsyncStorage.getItem(KEYS.theme),
        AsyncStorage.getItem(KEYS.language),
      ])

      const theme = (storedTheme as ThemeMode) || 'system'
      const language = (storedLang as Language) || null

      set({ theme, language, initialized: true })

      if (language) {
        await i18n.changeLanguage(language)
      } else {
        const deviceLang = getLocales()[0]?.languageCode ?? 'en'
        await i18n.changeLanguage(deviceLang === 'ko' ? 'ko' : 'en')
      }
    } catch {
      set({ initialized: true })
    }
  },

  loadUserData: (metadata: Record<string, any>, userId: string) => {
    // Load user_metadata fields immediately
    set({
      nickname: metadata?.nickname || '',
      gender: metadata?.gender || '',
      occupation: metadata?.occupation || '',
      interests: metadata?.interests || [],
      avatarUrl: metadata?.avatarUrl || '',
      hasSeenOnboarding: metadata?.hasSeenOnboarding === true,
      hasSeenPrivacyNotice: metadata?.hasSeenPrivacyNotice === true,
      notificationsEnabled: metadata?.notificationsEnabled === true,
      morningNotificationTime: metadata?.morningNotificationTime || '09:00',
      eveningNotificationTime: metadata?.eveningNotificationTime || '21:00',
    })

    // Fetch profile data (username, phone) from profiles table
    supabase
      .from('profiles')
      .select('username, phone')
      .eq('id', userId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error) {
          set({ userDataLoaded: true })
          return
        }

        if (data) {
          set({
            username: data.username || '',
            phone: data.phone || '',
            userDataLoaded: true,
          })
          return
        }

        // Profile doesn't exist — create from pending metadata (post email verification)
        if (metadata?.pendingUsername) {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: userId,
            username: metadata.pendingUsername,
            phone: metadata.pendingPhone || null,
          })
          if (!insertError) {
            await supabase.auth.updateUser({
              data: { pendingUsername: null, pendingPhone: null },
            })
            set({
              username: metadata.pendingUsername,
              phone: metadata.pendingPhone || '',
              userDataLoaded: true,
            })
            return
          }
        }

        set({ userDataLoaded: true })
      })
  },

  clearUserData: () => {
    set({
      nickname: '',
      gender: '',
      occupation: '',
      interests: [],
      avatarUrl: '',
      hasSeenOnboarding: false,
      hasSeenPrivacyNotice: false,
      username: '',
      phone: '',
      notificationsEnabled: false,
      morningNotificationTime: '09:00',
      eveningNotificationTime: '21:00',
      userDataLoaded: false,
    })
  },

  setTheme: async (theme: ThemeMode) => {
    set({ theme })
    await AsyncStorage.setItem(KEYS.theme, theme)
  },

  setLanguage: async (lang: Language | null) => {
    set({ language: lang })
    if (lang) {
      await AsyncStorage.setItem(KEYS.language, lang)
      await i18n.changeLanguage(lang)
    } else {
      await AsyncStorage.removeItem(KEYS.language)
      const deviceLang = getLocales()[0]?.languageCode ?? 'en'
      await i18n.changeLanguage(deviceLang === 'ko' ? 'ko' : 'en')
    }
  },

  setNickname: async (name: string) => {
    const trimmed = name.trim()
    set({ nickname: trimmed })
    await supabase.auth.updateUser({ data: { nickname: trimmed } })
  },

  setGender: async (gender: string) => {
    set({ gender })
    await supabase.auth.updateUser({ data: { gender } })
  },

  setOccupation: async (occupation: string) => {
    const trimmed = occupation.trim()
    set({ occupation: trimmed })
    await supabase.auth.updateUser({ data: { occupation: trimmed } })
  },

  setInterests: async (interests: string[]) => {
    set({ interests })
    await supabase.auth.updateUser({ data: { interests } })
  },

  setAvatarUrl: async (url: string) => {
    set({ avatarUrl: url })
    await supabase.auth.updateUser({ data: { avatarUrl: url } })
  },

  // Batch save — single updateUser call (avoids race conditions)
  savePersona: async (data: PersonaData) => {
    const payload = {
      nickname: data.nickname.trim(),
      gender: data.gender,
      occupation: data.occupation.trim(),
      interests: data.interests,
    }
    set(payload)
    await supabase.auth.updateUser({ data: payload })
  },

  acknowledgePrivacyNotice: async () => {
    set({ hasSeenPrivacyNotice: true })
    await supabase.auth.updateUser({ data: { hasSeenPrivacyNotice: true } })
  },

  acknowledgeOnboarding: async () => {
    set({ hasSeenOnboarding: true })
    await supabase.auth.updateUser({ data: { hasSeenOnboarding: true } })
  },

  setPhone: async (phone: string) => {
    const trimmed = phone.trim()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ phone: trimmed || null })
      .eq('id', user.id)
    if (error) throw new AppError('SETTINGS_002', error)
    set({ phone: trimmed })
  },

  setEmail: async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw new AppError('SETTINGS_001', error)
  },

  changePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new AppError('SETTINGS_004', error)
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    if (enabled) {
      if (Platform.OS !== 'web') {
        const { requestPermissions, scheduleNotifications } = await import('@/lib/notifications')
        const granted = await requestPermissions()
        if (!granted) return // permission denied — stay disabled
        const state = useSettingsStore.getState()
        await scheduleNotifications(state.morningNotificationTime, state.eveningNotificationTime)
      }
      set({ notificationsEnabled: true })
      await supabase.auth.updateUser({ data: { notificationsEnabled: true } })
    } else {
      if (Platform.OS !== 'web') {
        const { cancelAllNotifications } = await import('@/lib/notifications')
        await cancelAllNotifications()
      }
      set({ notificationsEnabled: false })
      await supabase.auth.updateUser({ data: { notificationsEnabled: false } })
    }
  },

  setMorningNotificationTime: async (time: string) => {
    set({ morningNotificationTime: time })
    await supabase.auth.updateUser({ data: { morningNotificationTime: time } })
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled && Platform.OS !== 'web') {
      const { scheduleNotifications } = await import('@/lib/notifications')
      await scheduleNotifications(time, state.eveningNotificationTime)
    }
  },

  setEveningNotificationTime: async (time: string) => {
    set({ eveningNotificationTime: time })
    await supabase.auth.updateUser({ data: { eveningNotificationTime: time } })
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled && Platform.OS !== 'web') {
      const { scheduleNotifications } = await import('@/lib/notifications')
      await scheduleNotifications(state.morningNotificationTime, time)
    }
  },
}))
