import { Alert } from 'react-native'
import i18n from '@/i18n'

/**
 * Application error with a unique error code for CS tracking.
 * Error codes follow the pattern: CATEGORY_NNN (e.g. AUTH_001, ENTRY_003)
 */
export class AppError extends Error {
  code: string
  originalError?: unknown

  constructor(code: string, originalError?: unknown) {
    const messageKey = `errors:${code}.message`
    const fallbackKey = 'errors:UNKNOWN.message'
    const translated = i18n.exists(messageKey)
      ? i18n.t(messageKey)
      : i18n.t(fallbackKey)

    super(translated)
    this.name = 'AppError'
    this.code = code
    this.originalError = originalError
  }
}

/**
 * Show an Alert with user-friendly error message and error code.
 * If the error is an AppError, uses its translated message + code.
 * Otherwise falls back to the UNKNOWN error message.
 *
 * Format: "사용자 메시지\n\n(오류 코드: AUTH_001)"
 */
export function showErrorAlert(title: string, error: unknown): void {
  const codeLabel = i18n.t('errors:codeLabel')

  if (error instanceof AppError) {
    Alert.alert(title, `${error.message}\n\n(${codeLabel}: ${error.code})`)
  } else {
    const fallback = i18n.t('errors:UNKNOWN.message')
    Alert.alert(title, fallback)
  }
}
