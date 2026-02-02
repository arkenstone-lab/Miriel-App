import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '@/i18n'
import { getLocales } from 'expo-localization'

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'ko' | 'en'

const KEYS = {
  theme: '@reflectlog/theme',
  language: '@reflectlog/language',
  privacySeen: '@reflectlog/privacy_seen',
  onboardingSeen: '@reflectlog/onboarding_seen',
  nickname: '@reflectlog/nickname',
} as const

interface SettingsState {
  theme: ThemeMode
  language: Language | null
  nickname: string
  hasSeenPrivacyNotice: boolean
  hasSeenOnboarding: boolean
  initialized: boolean
  initialize: () => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setLanguage: (lang: Language | null) => Promise<void>
  setNickname: (name: string) => Promise<void>
  acknowledgePrivacyNotice: () => Promise<void>
  acknowledgeOnboarding: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  language: null,
  nickname: '',
  hasSeenPrivacyNotice: false,
  hasSeenOnboarding: false,
  initialized: false,

  initialize: async () => {
    try {
      const [storedTheme, storedLang, storedPrivacy, storedOnboarding, storedNickname] = await Promise.all([
        AsyncStorage.getItem(KEYS.theme),
        AsyncStorage.getItem(KEYS.language),
        AsyncStorage.getItem(KEYS.privacySeen),
        AsyncStorage.getItem(KEYS.onboardingSeen),
        AsyncStorage.getItem(KEYS.nickname),
      ])

      const theme = (storedTheme as ThemeMode) || 'system'
      const language = (storedLang as Language) || null
      const nickname = storedNickname || ''
      const hasSeenPrivacyNotice = storedPrivacy === 'true'
      const hasSeenOnboarding = storedOnboarding === 'true'

      set({ theme, language, nickname, hasSeenPrivacyNotice, hasSeenOnboarding, initialized: true })

      // Apply persisted language override (null = follow system locale)
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

  acknowledgePrivacyNotice: async () => {
    set({ hasSeenPrivacyNotice: true })
    await AsyncStorage.setItem(KEYS.privacySeen, 'true')
  },

  setNickname: async (name: string) => {
    const trimmed = name.trim()
    set({ nickname: trimmed })
    if (trimmed) {
      await AsyncStorage.setItem(KEYS.nickname, trimmed)
    } else {
      await AsyncStorage.removeItem(KEYS.nickname)
    }
  },

  acknowledgeOnboarding: async () => {
    set({ hasSeenOnboarding: true })
    await AsyncStorage.setItem(KEYS.onboardingSeen, 'true')
  },
}))
