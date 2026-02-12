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
  hasCompletedSetup: '@miriel/hasCompletedSetup',
} as const

interface PersonaData {
  nickname: string
  gender: string
  occupation: string
  interests: string[]
}

interface NotificationSettings {
  notificationsEnabled: boolean
  morningNotificationTime: string
  eveningNotificationTime: string
  weeklyReviewDay: number
  weeklyReviewTime: string
  monthlyReviewDay: number
  monthlyReviewTime: string
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
  weeklyReviewDay: number          // 0=Mon..6=Sun
  weeklyReviewTime: string         // "HH:mm"
  monthlyReviewDay: number         // 1~28 (day of month)
  monthlyReviewTime: string        // "HH:mm"
  hasCompletedSetup: boolean
  // Flags
  initialized: boolean
  userDataLoaded: boolean
  // Device settings actions
  initialize: () => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setLanguage: (lang: Language | null) => Promise<void>
  completeSetup: () => Promise<void>
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
  setWeeklyReviewDay: (day: number) => Promise<void>
  setWeeklyReviewTime: (time: string) => Promise<void>
  setMonthlyReviewDay: (day: number) => Promise<void>
  setMonthlyReviewTime: (time: string) => Promise<void>
  saveNotificationSettings: (settings: NotificationSettings) => Promise<void>
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
  hasCompletedSetup: false,
  username: '',
  phone: '',
  notificationsEnabled: false,
  morningNotificationTime: '09:00',
  eveningNotificationTime: '21:00',
  weeklyReviewDay: 6,
  weeklyReviewTime: '19:00',
  monthlyReviewDay: 1,
  monthlyReviewTime: '19:00',
  initialized: false,
  userDataLoaded: false,

  initialize: async () => {
    try {
      const [storedTheme, storedLang, storedSetup] = await Promise.all([
        AsyncStorage.getItem(KEYS.theme),
        AsyncStorage.getItem(KEYS.language),
        AsyncStorage.getItem(KEYS.hasCompletedSetup),
      ])

      const theme = (storedTheme as ThemeMode) || 'system'
      const language = (storedLang as Language) || null
      const hasCompletedSetup = storedSetup === 'true'

      set({ theme, language, hasCompletedSetup, initialized: true })

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
      weeklyReviewDay: metadata?.weeklyReviewDay ?? 6,
      weeklyReviewTime: metadata?.weeklyReviewTime || '19:00',
      monthlyReviewDay: metadata?.monthlyReviewDay ?? 1,
      monthlyReviewTime: metadata?.monthlyReviewTime || '19:00',
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
      weeklyReviewDay: 6,
      weeklyReviewTime: '19:00',
      monthlyReviewDay: 1,
      monthlyReviewTime: '19:00',
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

  completeSetup: async () => {
    set({ hasCompletedSetup: true })
    await AsyncStorage.setItem(KEYS.hasCompletedSetup, 'true')
  },

  setNickname: async (name: string) => {
    const trimmed = name.trim()
    const prev = useSettingsStore.getState().nickname
    set({ nickname: trimmed })
    const { error } = await supabase.auth.updateUser({ data: { nickname: trimmed } })
    if (error) {
      set({ nickname: prev })
      throw new AppError('SETTINGS_003', error)
    }
  },

  setGender: async (gender: string) => {
    const prev = useSettingsStore.getState().gender
    set({ gender })
    const { error } = await supabase.auth.updateUser({ data: { gender } })
    if (error) {
      set({ gender: prev })
      throw new AppError('SETTINGS_003', error)
    }
  },

  setOccupation: async (occupation: string) => {
    const trimmed = occupation.trim()
    const prev = useSettingsStore.getState().occupation
    set({ occupation: trimmed })
    const { error } = await supabase.auth.updateUser({ data: { occupation: trimmed } })
    if (error) {
      set({ occupation: prev })
      throw new AppError('SETTINGS_003', error)
    }
  },

  setInterests: async (interests: string[]) => {
    const prev = useSettingsStore.getState().interests
    set({ interests })
    const { error } = await supabase.auth.updateUser({ data: { interests } })
    if (error) {
      set({ interests: prev })
      throw new AppError('SETTINGS_003', error)
    }
  },

  setAvatarUrl: async (url: string) => {
    const prev = useSettingsStore.getState().avatarUrl
    set({ avatarUrl: url })
    const { error } = await supabase.auth.updateUser({ data: { avatarUrl: url } })
    if (error) {
      set({ avatarUrl: prev })
      throw new AppError('SETTINGS_003', error)
    }
  },

  // Batch save — single updateUser call (avoids race conditions)
  savePersona: async (data: PersonaData) => {
    const payload = {
      nickname: data.nickname.trim(),
      gender: data.gender,
      occupation: data.occupation.trim(),
      interests: data.interests,
    }
    const prev = {
      nickname: useSettingsStore.getState().nickname,
      gender: useSettingsStore.getState().gender,
      occupation: useSettingsStore.getState().occupation,
      interests: useSettingsStore.getState().interests,
    }
    set(payload)
    const { error } = await supabase.auth.updateUser({ data: payload })
    if (error) {
      set(prev)
      throw new AppError('SETTINGS_003', error)
    }
  },

  acknowledgePrivacyNotice: async () => {
    set({ hasSeenPrivacyNotice: true })
    const { error } = await supabase.auth.updateUser({ data: { hasSeenPrivacyNotice: true } })
    if (error) {
      set({ hasSeenPrivacyNotice: false })
      throw new AppError('SETTINGS_003', error)
    }
  },

  acknowledgeOnboarding: async () => {
    set({ hasSeenOnboarding: true })
    const { error } = await supabase.auth.updateUser({ data: { hasSeenOnboarding: true } })
    if (error) {
      set({ hasSeenOnboarding: false })
      throw new AppError('SETTINGS_003', error)
    }
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
      if (Platform.OS === 'web') {
        const { requestWebPermission } = await import('@/lib/webNotifications')
        const granted = await requestWebPermission()
        if (!granted) return
      } else {
        const { requestPermissions } = await import('@/lib/notifications')
        const granted = await requestPermissions()
        if (!granted) return
      }
      set({ notificationsEnabled: true })
      await supabase.auth.updateUser({ data: { notificationsEnabled: true } })
      const state = useSettingsStore.getState()
      await rescheduleAllNotifications(state)
    } else {
      if (Platform.OS === 'web') {
        const { cancelWebNotifications } = await import('@/lib/webNotifications')
        cancelWebNotifications()
      } else {
        const { cancelAllNotifications } = await import('@/lib/notifications')
        await cancelAllNotifications()
      }
      set({ notificationsEnabled: false })
      await supabase.auth.updateUser({ data: { notificationsEnabled: false } })
    }
  },

  setMorningNotificationTime: async (time: string) => {
    set({ morningNotificationTime: time })
    const { error } = await supabase.auth.updateUser({ data: { morningNotificationTime: time } })
    if (error) throw new AppError('SETTINGS_003', error)
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled) await rescheduleAllNotifications(state)
  },

  setEveningNotificationTime: async (time: string) => {
    set({ eveningNotificationTime: time })
    const { error } = await supabase.auth.updateUser({ data: { eveningNotificationTime: time } })
    if (error) throw new AppError('SETTINGS_003', error)
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled) await rescheduleAllNotifications(state)
  },

  setWeeklyReviewDay: async (day: number) => {
    set({ weeklyReviewDay: day })
    const { error } = await supabase.auth.updateUser({ data: { weeklyReviewDay: day } })
    if (error) throw new AppError('SETTINGS_003', error)
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled) await rescheduleAllNotifications(state)
  },

  setWeeklyReviewTime: async (time: string) => {
    set({ weeklyReviewTime: time })
    const { error } = await supabase.auth.updateUser({ data: { weeklyReviewTime: time } })
    if (error) throw new AppError('SETTINGS_003', error)
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled) await rescheduleAllNotifications(state)
  },

  setMonthlyReviewDay: async (day: number) => {
    set({ monthlyReviewDay: day })
    const { error } = await supabase.auth.updateUser({ data: { monthlyReviewDay: day } })
    if (error) throw new AppError('SETTINGS_003', error)
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled) await rescheduleAllNotifications(state)
  },

  setMonthlyReviewTime: async (time: string) => {
    set({ monthlyReviewTime: time })
    const { error } = await supabase.auth.updateUser({ data: { monthlyReviewTime: time } })
    if (error) throw new AppError('SETTINGS_003', error)
    const state = useSettingsStore.getState()
    if (state.notificationsEnabled) await rescheduleAllNotifications(state)
  },

  saveNotificationSettings: async (settings: NotificationSettings) => {
    set({
      notificationsEnabled: settings.notificationsEnabled,
      morningNotificationTime: settings.morningNotificationTime,
      eveningNotificationTime: settings.eveningNotificationTime,
      weeklyReviewDay: settings.weeklyReviewDay,
      weeklyReviewTime: settings.weeklyReviewTime,
      monthlyReviewDay: settings.monthlyReviewDay,
      monthlyReviewTime: settings.monthlyReviewTime,
    })
    const { error } = await supabase.auth.updateUser({
      data: {
        notificationsEnabled: settings.notificationsEnabled,
        morningNotificationTime: settings.morningNotificationTime,
        eveningNotificationTime: settings.eveningNotificationTime,
        weeklyReviewDay: settings.weeklyReviewDay,
        weeklyReviewTime: settings.weeklyReviewTime,
        monthlyReviewDay: settings.monthlyReviewDay,
        monthlyReviewTime: settings.monthlyReviewTime,
      },
    })
    if (error) throw new AppError('SETTINGS_003', error)
    if (settings.notificationsEnabled) {
      await rescheduleAllNotifications(settings)
    }
  },
}))

/** Helper: reschedule all notifications (native + web) based on current settings */
async function rescheduleAllNotifications(state: {
  morningNotificationTime: string
  eveningNotificationTime: string
  weeklyReviewDay: number
  weeklyReviewTime: string
  monthlyReviewDay: number
  monthlyReviewTime: string
}) {
  if (Platform.OS === 'web') {
    const { scheduleWebNotifications } = await import('@/lib/webNotifications')
    scheduleWebNotifications(state)
  } else {
    const { scheduleAllNotifications } = await import('@/lib/notifications')
    await scheduleAllNotifications(state)
  }
}
