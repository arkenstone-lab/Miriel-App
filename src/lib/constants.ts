export const CHECKIN_QUESTIONS = {
  morning: [
    '좋은 아침이에요! 오늘 가장 중요한 일은 뭔가요?',
    '오늘 집중하고 싶은 프로젝트가 있나요?',
    '어제 마무리 못한 일이 있다면 알려주세요.',
  ],
  evening: [
    '오늘 하루 수고했어요! 어떤 일이 있었나요?',
    '오늘 잘된 것과 아쉬운 것이 있다면 알려주세요.',
    '내일 꼭 해야 할 일이 있나요?',
  ],
} as const

export function getCheckinQuestions(): string[] {
  const hour = new Date().getHours()
  if (hour < 14) {
    return [...CHECKIN_QUESTIONS.morning]
  }
  return [...CHECKIN_QUESTIONS.evening]
}
