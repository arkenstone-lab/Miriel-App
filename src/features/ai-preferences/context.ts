import type { UserAiPreferences } from './types'

interface PersonaInfo {
  nickname?: string
  occupation?: string
  interests?: string[]
}

/**
 * Build a context string to inject into AI system prompts.
 * Empty/missing fields are omitted.
 */
export function buildAiContext(
  prefs: UserAiPreferences | null | undefined,
  persona?: PersonaInfo
): string | undefined {
  if (!prefs) return undefined

  const parts: string[] = []

  // Persona info (if sharing enabled)
  if (prefs.share_persona && persona) {
    const personaParts: string[] = []
    if (persona.nickname) personaParts.push(`이름: ${persona.nickname}`)
    if (persona.occupation) personaParts.push(`직업: ${persona.occupation}`)
    if (persona.interests && persona.interests.length > 0) {
      personaParts.push(`관심사: ${persona.interests.join(', ')}`)
    }
    if (personaParts.length > 0) {
      parts.push(personaParts.join('\n'))
    }
  }

  // Summary style
  if (prefs.summary_style) {
    parts.push(`요약 스타일: ${prefs.summary_style}`)
  }

  // Focus areas
  if (prefs.focus_areas && prefs.focus_areas.length > 0) {
    parts.push(`집중 영역: ${prefs.focus_areas.join(', ')}`)
  }

  // Custom instructions
  if (prefs.custom_instructions) {
    parts.push(`추가 지시: ${prefs.custom_instructions}`)
  }

  if (parts.length === 0) return undefined
  return parts.join('\n')
}
