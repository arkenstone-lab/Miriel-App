import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'

import koCommon from './locales/ko/common.json'
import koDashboard from './locales/ko/dashboard.json'
import koTimeline from './locales/ko/timeline.json'
import koEntry from './locales/ko/entry.json'
import koSummary from './locales/ko/summary.json'
import koTodos from './locales/ko/todos.json'
import koAuth from './locales/ko/auth.json'
import koGamification from './locales/ko/gamification.json'
import koSettings from './locales/ko/settings.json'
import koPrivacy from './locales/ko/privacy.json'
import koOnboarding from './locales/ko/onboarding.json'
import koLegal from './locales/ko/legal.json'

import enCommon from './locales/en/common.json'
import enDashboard from './locales/en/dashboard.json'
import enTimeline from './locales/en/timeline.json'
import enEntry from './locales/en/entry.json'
import enSummary from './locales/en/summary.json'
import enTodos from './locales/en/todos.json'
import enAuth from './locales/en/auth.json'
import enGamification from './locales/en/gamification.json'
import enSettings from './locales/en/settings.json'
import enPrivacy from './locales/en/privacy.json'
import enOnboarding from './locales/en/onboarding.json'
import enLegal from './locales/en/legal.json'

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en'
const lng = deviceLanguage === 'ko' ? 'ko' : 'en'

i18n.use(initReactI18next).init({
  lng,
  fallbackLng: 'en',
  ns: ['common', 'dashboard', 'timeline', 'entry', 'summary', 'todos', 'auth', 'gamification', 'settings', 'privacy', 'onboarding', 'legal'],
  defaultNS: 'common',
  resources: {
    ko: {
      common: koCommon,
      dashboard: koDashboard,
      timeline: koTimeline,
      entry: koEntry,
      summary: koSummary,
      todos: koTodos,
      auth: koAuth,
      gamification: koGamification,
      settings: koSettings,
      privacy: koPrivacy,
      onboarding: koOnboarding,
      legal: koLegal,
    },
    en: {
      common: enCommon,
      dashboard: enDashboard,
      timeline: enTimeline,
      entry: enEntry,
      summary: enSummary,
      todos: enTodos,
      auth: enAuth,
      gamification: enGamification,
      settings: enSettings,
      privacy: enPrivacy,
      onboarding: enOnboarding,
      legal: enLegal,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
