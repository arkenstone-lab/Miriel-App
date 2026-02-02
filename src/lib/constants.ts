import i18n from '@/i18n'

export const CHECKIN_QUESTIONS = {
  morning: () => i18n.t('gamification:checkin.morning', { returnObjects: true }) as string[],
  evening: () => i18n.t('gamification:checkin.evening', { returnObjects: true }) as string[],
} as const

/** Returns check-in questions based on time of day (morning before 2 PM, evening after). */
export function getCheckinQuestions(): string[] {
  const hour = new Date().getHours()
  if (hour < 14) {
    return [...CHECKIN_QUESTIONS.morning()]
  }
  return [...CHECKIN_QUESTIONS.evening()]
}
