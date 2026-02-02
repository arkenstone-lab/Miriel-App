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
} as const

interface SettingsState {
  theme: ThemeMode
  language: Language | null
  hasSeenPrivacyNotice: boolean
  initialized: boolean
  initialize: () => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setLanguage: (lang: Language | null) => Promise<void>
  acknowledgePrivacyNotice: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  language: null,
  hasSeenPrivacyNotice: false,
  initialized: false,

  initialize: async () => {
    try {
      const [storedTheme, storedLang, storedPrivacy] = await Promise.all([
        AsyncStorage.getItem(KEYS.theme),
        AsyncStorage.getItem(KEYS.language),
        AsyncStorage.getItem(KEYS.privacySeen),
      ])

      const theme = (storedTheme as ThemeMode) || 'system'
      const language = (storedLang as Language) || null
      const hasSeenPrivacyNotice = storedPrivacy === 'true'

      set({ theme, language, hasSeenPrivacyNotice, initialized: true })

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
}))
