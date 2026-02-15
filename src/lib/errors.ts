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
 * Extract a human-readable detail from the original error (API, network, etc.)
 * Returns undefined if no useful detail is available.
 */
function getOriginalDetail(error: AppError): string | undefined {
  const orig = error.originalError
  if (!orig) return undefined

  // API errors typically have a .message property
  if (typeof orig === 'object' && orig !== null && 'message' in orig) {
    const msg = (orig as { message: string }).message
    // Skip generic/duplicate messages
    if (msg && msg !== error.message && msg.length < 200) {
      return msg
    }
  }

  if (typeof orig === 'string' && orig.length < 200) {
    return orig
  }

  return undefined
}

/**
 * Show an Alert with user-friendly error message, original cause detail, and error code.
 *
 * Format:
 *   "사용자 메시지"
 *   "상세: API error message"        ← if available
 *   "(오류 코드: AUTH_001)"
 */
export function showErrorAlert(title: string, error: unknown): void {
  const codeLabel = i18n.t('errors:codeLabel')

  if (error instanceof AppError) {
    const detail = getOriginalDetail(error)
    const parts = [error.message]
    if (detail) parts.push(detail)
    parts.push(`(${codeLabel}: ${error.code})`)
    Alert.alert(title, parts.join('\n\n'))
  } else {
    const fallback = i18n.t('errors:UNKNOWN.message')
    Alert.alert(title, fallback)
  }
}

/**
 * Extract user-friendly error message with detail and error code for inline display.
 *
 * Returns: "사용자 메시지\n상세: detail\n(오류 코드: AUTH_001)"
 */
export function getErrorMessage(error: unknown): string {
  const codeLabel = i18n.t('errors:codeLabel')

  if (error instanceof AppError) {
    const detail = getOriginalDetail(error)
    const parts = [error.message]
    if (detail) parts.push(detail)
    parts.push(`(${codeLabel}: ${error.code})`)
    return parts.join('\n')
  }
  return i18n.t('errors:UNKNOWN.message')
}
