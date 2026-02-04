export interface UserAiPreferences {
  id: string
  user_id: string
  summary_style: string
  focus_areas: string[]
  custom_instructions: string
  share_persona: boolean
}

export interface UpsertAiPreferencesInput {
  summary_style?: string
  focus_areas?: string[]
  custom_instructions?: string
  share_persona?: boolean
}
