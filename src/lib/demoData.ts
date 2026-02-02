/**
 * Demo data generator — produces realistic 2-week journal entries,
 * summaries, and todos for investor demo scenarios.
 *
 * Pure data functions — no Supabase dependency.
 */

// ─── Helpers ──────────────────────────────────────────────

function dayOffset(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function iso(d: Date, hours: number, minutes: number): string {
  const t = new Date(d)
  t.setHours(hours, minutes, 0, 0)
  return t.toISOString()
}

// ─── Entry Templates ──────────────────────────────────────

interface RawEntry {
  dayOffset: number
  hour: number
  minute: number
  raw_text: string
  tags: string[]
}

const ENTRY_TEMPLATES: RawEntry[] = [
  // D-13 (Day 1)
  {
    dayOffset: -13,
    hour: 9,
    minute: 15,
    raw_text:
      '프로젝트 A 킥오프 미팅. 김대리와 디자인 시스템 방향 논의. Figma 컴포넌트 라이브러리 먼저 정리하기로 함. 일정은 2주 스프린트로 잡았다.',
    tags: ['프로젝트:A', '사람:김대리', '이슈:디자인시스템'],
  },
  {
    dayOffset: -13,
    hour: 18,
    minute: 30,
    raw_text:
      '오후에 API 설계 리뷰. REST vs GraphQL 고민했는데 REST로 결정. 팀원들 의견 수렴 완료. 내일 스키마 초안 작성 예정.',
    tags: ['프로젝트:A', '이슈:API설계'],
  },
  // D-12, D-11: 빈 날 (스트릭 끊김)
  // D-10 (Day 4) — early bird
  {
    dayOffset: -10,
    hour: 6,
    minute: 45,
    raw_text:
      '새벽에 일어나서 대시보드 와이어프레임 작업. 집중 잘 됨. 차트 라이브러리 victory-native 테스트 완료. 퍼포먼스 괜찮다.',
    tags: ['프로젝트:대시보드', '이슈:와이어프레임'],
  },
  {
    dayOffset: -10,
    hour: 14,
    minute: 20,
    raw_text:
      '박과장님과 투자 심사 자료 방향 논의. 핵심 지표 3가지: DAU, 리텐션율, 평균 기록 시간으로 정리하기로 했다.',
    tags: ['프로젝트:투자준비', '사람:박과장'],
  },
  // D-9 (Day 5)
  {
    dayOffset: -9,
    hour: 10,
    minute: 0,
    raw_text:
      'Supabase Edge Functions 배포 성공. entries CRUD + summaries 생성 API 완성. RLS 정책도 적용함.',
    tags: ['프로젝트:A', '이슈:백엔드'],
  },
  {
    dayOffset: -9,
    hour: 17,
    minute: 45,
    raw_text:
      'NativeWind v4 다크모드 적용 완료. 예상보다 빨리 끝남. dark: 접두사로 거의 모든 컴포넌트 커버됨.',
    tags: ['프로젝트:A', '이슈:다크모드'],
  },
  // D-8 (Day 6) — night owl
  {
    dayOffset: -8,
    hour: 11,
    minute: 30,
    raw_text:
      'i18n 작업 시작. i18next + expo-localization 연동. 8개 네임스페이스로 번역 파일 구조 설계 완료.',
    tags: ['프로젝트:A', '이슈:i18n'],
  },
  {
    dayOffset: -8,
    hour: 23,
    minute: 10,
    raw_text:
      '밤늦게까지 번역 작업. 30개 파일 하드코딩 한국어 → t() 함수로 전환 완료. 영어 번역도 다 넣었다. 꽤 뿌듯함.',
    tags: ['프로젝트:A', '이슈:i18n'],
  },
  // D-7 (Day 7)
  {
    dayOffset: -7,
    hour: 9,
    minute: 30,
    raw_text:
      '주간 회고. 이번 주 가장 큰 성과: Expo 전환 완료 + 다크모드. 아쉬운 점: 테스트 코드 미작성. 다음 주 목표: 온보딩 + 데모 데이터.',
    tags: ['프로젝트:A', '이슈:회고'],
  },
  // D-6 (Day 8)
  {
    dayOffset: -6,
    hour: 10,
    minute: 15,
    raw_text:
      '설정 화면 구현. 언어/테마 전환, 계정 정보, 개인정보 섹션. Zustand + AsyncStorage로 영속 상태 관리.',
    tags: ['프로젝트:A', '이슈:설정화면'],
  },
  {
    dayOffset: -6,
    hour: 16,
    minute: 0,
    raw_text:
      '개인정보 고지 컴포넌트 완성. 배너/인라인 두 가지 모드 지원. 대시보드 첫 방문 시 자동 표시.',
    tags: ['프로젝트:A', '이슈:개인정보'],
  },
  // D-5 (Day 9)
  {
    dayOffset: -5,
    hour: 8,
    minute: 50,
    raw_text:
      '게이미피케이션 시스템 설계. XP 계산 로직, 레벨 테이블, 배지 11종 정의. 듀오링고 참고해서 리텐션 요소 배치.',
    tags: ['프로젝트:A', '이슈:게이미피케이션'],
  },
  {
    dayOffset: -5,
    hour: 15,
    minute: 30,
    raw_text:
      '대시보드 메인 카드 구현. 스트릭 불꽃 애니메이션, 레벨 프로그레스바, 배지 그리드. 시각적으로 꽤 만족스럽다.',
    tags: ['프로젝트:대시보드', '이슈:게이미피케이션'],
  },
  // D-4 (Day 10)
  {
    dayOffset: -4,
    hour: 9,
    minute: 40,
    raw_text:
      '타임라인 뷰 리팩토링. SectionList 날짜 그룹핑 + 데스크톱 2패널 MasterDetail. 반응형 레이아웃 자연스럽게 전환됨.',
    tags: ['프로젝트:A', '이슈:타임라인'],
  },
  // D-3 (Day 11)
  {
    dayOffset: -3,
    hour: 10,
    minute: 10,
    raw_text:
      '할 일 리스트 기능 완성. AI가 기록에서 자동 추출한 액션 아이템 표시. 필터 탭(전체/진행중/완료) + 근거 링크.',
    tags: ['프로젝트:A', '이슈:할일'],
  },
  {
    dayOffset: -3,
    hour: 19,
    minute: 0,
    raw_text:
      '발표 슬라이드 초안 작성 시작. 문제 정의 → 솔루션 → 데모 → 비즈니스 모델 순서. 김대리 피드백 받기로.',
    tags: ['프로젝트:투자준비', '사람:김대리', '이슈:발표'],
  },
  // D-2 (Day 12)
  {
    dayOffset: -2,
    hour: 9,
    minute: 0,
    raw_text:
      '코드 리뷰 & 버그 수정. Evidence Chip 클릭 시 원문 이동 안 되던 버그 해결. deep link 라우팅 수정.',
    tags: ['프로젝트:A', '이슈:버그수정'],
  },
  {
    dayOffset: -2,
    hour: 14,
    minute: 30,
    raw_text:
      '반응형 테스트. PC(1200px+), 태블릿(768px), 모바일(375px) 모두 확인. 사이드바↔하단탭 전환 매끄럽다.',
    tags: ['프로젝트:A', '이슈:반응형'],
  },
  // D-1 (Day 13)
  {
    dayOffset: -1,
    hour: 8,
    minute: 30,
    raw_text:
      '최종 데모 리허설. 3분 기록 → 자동 정리 → 일간 요약 → 주간 회고 → 대시보드 흐름 확인. 타이밍 4분 30초.',
    tags: ['프로젝트:투자준비', '이슈:데모'],
  },
  {
    dayOffset: -1,
    hour: 16,
    minute: 0,
    raw_text:
      '마지막 폴리시. 로딩 스피너 통일, 빈 상태 일러스트 추가, 에러 토스트 메시지 다듬기.',
    tags: ['프로젝트:A', '이슈:폴리시'],
  },
  // D-0 (Today)
  {
    dayOffset: 0,
    hour: 9,
    minute: 0,
    raw_text:
      '온보딩 화면 구현 완료. 3스텝 가이드: 빠른 기록 → AI 정리 → 리텐션 습관. 데모 데이터 시딩도 준비 완료.',
    tags: ['프로젝트:A', '이슈:온보딩'],
  },
  {
    dayOffset: 0,
    hour: 13,
    minute: 0,
    raw_text:
      '팀 전체 미팅. 투자 심사 D-day 일정 확인. 박과장님이 발표 자료 최종 리뷰해 주심. 피드백 반영 완료.',
    tags: ['프로젝트:투자준비', '사람:박과장', '이슈:발표'],
  },
]

// ─── Summary Templates ────────────────────────────────────

interface DailySummaryTemplate {
  dayOffset: number
  text: string
  sentences: { text: string; entryIndices: number[] }[]
}

// entryIndices refer to positions in the ENTRY_TEMPLATES array above
const DAILY_SUMMARY_TEMPLATES: DailySummaryTemplate[] = [
  {
    dayOffset: -13,
    text: '프로젝트 A 킥오프와 API 설계 방향을 결정한 하루.',
    sentences: [
      { text: '김대리와 디자인 시스템 방향을 논의하고 Figma 컴포넌트 라이브러리 정리를 시작했다.', entryIndices: [0] },
      { text: 'API 설계 리뷰에서 REST로 결정하고 내일 스키마 초안 작성을 계획했다.', entryIndices: [1] },
    ],
  },
  {
    dayOffset: -10,
    text: '새벽 집중 작업과 투자 심사 지표를 정리한 하루.',
    sentences: [
      { text: '대시보드 와이어프레임 작업을 새벽에 완료하고 victory-native 차트 라이브러리를 테스트했다.', entryIndices: [2] },
      { text: '박과장님과 투자 심사 핵심 지표(DAU, 리텐션율, 평균 기록 시간)를 확정했다.', entryIndices: [3] },
    ],
  },
  {
    dayOffset: -9,
    text: '백엔드 배포와 다크모드 적용을 완료한 하루.',
    sentences: [
      { text: 'Supabase Edge Functions로 entries/summaries API를 배포하고 RLS 정책을 적용했다.', entryIndices: [4] },
      { text: 'NativeWind v4로 다크모드를 전체 적용하여 모든 컴포넌트에 dark: 접두사를 추가했다.', entryIndices: [5] },
    ],
  },
  {
    dayOffset: -8,
    text: '다국어(i18n) 전환 작업을 완주한 하루.',
    sentences: [
      { text: 'i18next + expo-localization 연동 후 8개 네임스페이스로 번역 구조를 설계했다.', entryIndices: [6] },
      { text: '30개 파일의 하드코딩 한국어를 t() 함수로 전환하고 영어 번역까지 완료했다.', entryIndices: [7] },
    ],
  },
  {
    dayOffset: -7,
    text: '주간 회고를 통해 진행 상황을 점검하고 다음 주 목표를 설정한 하루.',
    sentences: [
      { text: 'Expo 전환과 다크모드 적용을 이번 주 최대 성과로 평가했다.', entryIndices: [8] },
      { text: '테스트 코드 미작성이 아쉬움으로 남았고, 다음 주 온보딩과 데모 데이터에 집중하기로 했다.', entryIndices: [8] },
    ],
  },
  {
    dayOffset: -6,
    text: '설정 화면과 개인정보 고지를 구현한 하루.',
    sentences: [
      { text: '언어/테마 전환, 계정 정보, 개인정보 섹션이 포함된 설정 화면을 완성했다.', entryIndices: [9] },
      { text: '배너/인라인 모드를 지원하는 개인정보 고지 컴포넌트를 만들었다.', entryIndices: [10] },
    ],
  },
  {
    dayOffset: -5,
    text: '게이미피케이션 시스템을 설계하고 대시보드에 시각화한 하루.',
    sentences: [
      { text: 'XP 계산, 레벨 테이블, 배지 11종을 듀오링고 참고하여 설계했다.', entryIndices: [11] },
      { text: '스트릭 불꽃, 레벨 프로그레스바, 배지 그리드를 대시보드에 구현했다.', entryIndices: [12] },
    ],
  },
  {
    dayOffset: -4,
    text: '타임라인 반응형 리팩토링을 완료한 하루.',
    sentences: [
      { text: 'SectionList 날짜 그룹핑과 데스크톱 MasterDetail 2패널 레이아웃으로 타임라인을 개선했다.', entryIndices: [13] },
    ],
  },
  {
    dayOffset: -3,
    text: '할 일 기능을 완성하고 발표 준비를 시작한 하루.',
    sentences: [
      { text: 'AI 자동 추출 액션 아이템, 필터 탭, 근거 링크가 포함된 할 일 리스트를 완성했다.', entryIndices: [14] },
      { text: '투자 심사 발표 슬라이드 초안을 문제 정의→솔루션→데모→비즈니스 모델 순서로 작성하기 시작했다.', entryIndices: [15] },
    ],
  },
  {
    dayOffset: -2,
    text: '버그 수정과 반응형 테스트를 마친 하루.',
    sentences: [
      { text: 'Evidence Chip 클릭 시 원문 이동 버그를 deep link 라우팅 수정으로 해결했다.', entryIndices: [16] },
      { text: 'PC/태블릿/모바일 3가지 뷰포트에서 사이드바↔하단탭 전환을 확인했다.', entryIndices: [17] },
    ],
  },
]

// ─── Weekly Summary Templates ─────────────────────────────

interface WeeklySummaryTemplate {
  dayOffset: number // period_start
  text: string
  sentences: { text: string; entryIndices: number[] }[]
}

const WEEKLY_SUMMARY_TEMPLATES: WeeklySummaryTemplate[] = [
  {
    dayOffset: -13, // Week 1: D-13 ~ D-7
    text: '첫째 주: 프로젝트 A 기반 구축 완료',
    sentences: [
      { text: '프로젝트 A 킥오프, API 설계(REST 결정), 디자인 시스템 정리를 시작했다.', entryIndices: [0, 1] },
      { text: 'Supabase Edge Functions 배포, NativeWind 다크모드 전체 적용을 완료했다.', entryIndices: [4, 5] },
      { text: 'i18n(한국어/영어) 전환을 30개 파일에 걸쳐 완주했다.', entryIndices: [6, 7] },
      { text: '투자 심사 핵심 지표(DAU, 리텐션율, 평균 기록 시간)를 박과장님과 확정했다.', entryIndices: [3] },
    ],
  },
  {
    dayOffset: -6, // Week 2: D-6 ~ D-0
    text: '둘째 주: 폴리시와 데모 준비 완료',
    sentences: [
      { text: '설정 화면, 개인정보 고지, 게이미피케이션 시스템을 구현해 제품 완성도를 높였다.', entryIndices: [9, 10, 11] },
      { text: '타임라인 리팩토링, 할 일 기능, 반응형 테스트를 마무리했다.', entryIndices: [13, 14, 17] },
      { text: '발표 슬라이드 초안을 작성하고 박과장님 피드백을 반영했다.', entryIndices: [15, 21] },
      { text: '데모 리허설(4분30초)과 최종 폴리시(로딩/빈상태/에러)를 완료했다.', entryIndices: [18, 19] },
      { text: '온보딩 화면과 데모 데이터 시딩을 마지막으로 구현했다.', entryIndices: [20] },
    ],
  },
]

// ─── Todo Templates ───────────────────────────────────────

interface TodoTemplate {
  text: string
  sourceEntryIndex: number
  status: 'pending' | 'done'
}

const TODO_TEMPLATES: TodoTemplate[] = [
  // Done (10)
  { text: 'Figma 컴포넌트 라이브러리 정리', sourceEntryIndex: 0, status: 'done' },
  { text: 'REST API 스키마 초안 작성', sourceEntryIndex: 1, status: 'done' },
  { text: 'victory-native 차트 라이브러리 통합', sourceEntryIndex: 2, status: 'done' },
  { text: 'Supabase RLS 정책 설정', sourceEntryIndex: 4, status: 'done' },
  { text: 'NativeWind 다크모드 전체 적용', sourceEntryIndex: 5, status: 'done' },
  { text: '30개 파일 i18n 전환', sourceEntryIndex: 7, status: 'done' },
  { text: '설정 화면 구현 (언어/테마/계정)', sourceEntryIndex: 9, status: 'done' },
  { text: '게이미피케이션 시스템 구현', sourceEntryIndex: 11, status: 'done' },
  { text: 'Evidence Chip 딥링크 버그 수정', sourceEntryIndex: 16, status: 'done' },
  { text: '반응형 3뷰포트 테스트 완료', sourceEntryIndex: 17, status: 'done' },
  // Pending (5)
  { text: '테스트 코드 작성 (유닛 + 통합)', sourceEntryIndex: 8, status: 'pending' },
  { text: '발표 슬라이드 최종 검토', sourceEntryIndex: 15, status: 'pending' },
  { text: 'EAS Build로 iOS TestFlight 배포', sourceEntryIndex: 20, status: 'pending' },
  { text: 'Expo Web 빌드 및 배포', sourceEntryIndex: 20, status: 'pending' },
  { text: '데모 영상 촬영 (3~5분)', sourceEntryIndex: 18, status: 'pending' },
]

// ─── Public API ───────────────────────────────────────────

export interface DemoEntry {
  user_id: string
  date: string
  raw_text: string
  tags: string[]
  created_at: string
}

export interface DemoSummary {
  user_id: string
  period: 'daily' | 'weekly'
  period_start: string
  text: string
  entry_links: string[]
  sentences_data: { text: string; entry_ids: string[] }[]
  created_at: string
}

export interface DemoTodo {
  user_id: string
  text: string
  source_entry_id: string
  status: 'pending' | 'done'
  created_at: string
}

export function generateDemoEntries(userId: string, baseDate?: Date): DemoEntry[] {
  const base = baseDate ?? new Date()
  return ENTRY_TEMPLATES.map((tpl) => {
    const d = dayOffset(base, tpl.dayOffset)
    return {
      user_id: userId,
      date: fmt(d),
      raw_text: tpl.raw_text,
      tags: tpl.tags,
      created_at: iso(d, tpl.hour, tpl.minute),
    }
  })
}

export function generateDemoSummaries(
  userId: string,
  insertedEntryIds: string[],
  baseDate?: Date,
): DemoSummary[] {
  const base = baseDate ?? new Date()
  const results: DemoSummary[] = []

  // Daily summaries
  for (const tpl of DAILY_SUMMARY_TEMPLATES) {
    const d = dayOffset(base, tpl.dayOffset)
    const entryLinks = tpl.sentences.flatMap((s) =>
      s.entryIndices.map((i) => insertedEntryIds[i]).filter(Boolean),
    )
    results.push({
      user_id: userId,
      period: 'daily',
      period_start: fmt(d),
      text: tpl.text,
      entry_links: [...new Set(entryLinks)],
      sentences_data: tpl.sentences.map((s) => ({
        text: s.text,
        entry_ids: s.entryIndices.map((i) => insertedEntryIds[i]).filter(Boolean),
      })),
      created_at: iso(d, 22, 0),
    })
  }

  // Weekly summaries
  for (const tpl of WEEKLY_SUMMARY_TEMPLATES) {
    const d = dayOffset(base, tpl.dayOffset)
    const entryLinks = tpl.sentences.flatMap((s) =>
      s.entryIndices.map((i) => insertedEntryIds[i]).filter(Boolean),
    )
    results.push({
      user_id: userId,
      period: 'weekly',
      period_start: fmt(d),
      text: tpl.text,
      entry_links: [...new Set(entryLinks)],
      sentences_data: tpl.sentences.map((s) => ({
        text: s.text,
        entry_ids: s.entryIndices.map((i) => insertedEntryIds[i]).filter(Boolean),
      })),
      created_at: iso(d, 22, 30),
    })
  }

  return results
}

export function generateDemoTodos(
  userId: string,
  insertedEntryIds: string[],
): DemoTodo[] {
  const base = new Date()
  return TODO_TEMPLATES.map((tpl, i) => ({
    user_id: userId,
    text: tpl.text,
    source_entry_id: insertedEntryIds[tpl.sourceEntryIndex],
    status: tpl.status,
    created_at: new Date(base.getTime() - (TODO_TEMPLATES.length - i) * 3600_000).toISOString(),
  }))
}
