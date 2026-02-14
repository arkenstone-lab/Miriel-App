import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId, now } from '../lib/db';

const seed = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Demo Data Templates (copied from src/lib/demoData.ts) ───

function dayOffset(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function iso(d: Date, hours: number, minutes: number): string {
  const t = new Date(d);
  t.setHours(hours, minutes, 0, 0);
  return t.toISOString();
}

interface EntryTemplate {
  dayOffset: number;
  hour: number;
  minute: number;
  raw_text: string;
  tags: string[];
}

const ENTRIES: EntryTemplate[] = [
  { dayOffset: -13, hour: 9, minute: 15, raw_text: '프로젝트 A 킥오프 미팅. 김대리와 디자인 시스템 방향 논의. Figma 컴포넌트 라이브러리 먼저 정리하기로 함.', tags: ['프로젝트:A', '사람:김대리', '이슈:디자인시스템'] },
  { dayOffset: -13, hour: 18, minute: 30, raw_text: '오후에 API 설계 리뷰. REST vs GraphQL 고민했는데 REST로 결정. 내일 스키마 초안 작성 예정.', tags: ['프로젝트:A', '이슈:API설계'] },
  { dayOffset: -10, hour: 6, minute: 45, raw_text: '새벽에 대시보드 와이어프레임 작업. 집중 잘 됨. 차트 라이브러리 victory-native 테스트 완료.', tags: ['프로젝트:대시보드', '이슈:와이어프레임'] },
  { dayOffset: -10, hour: 14, minute: 20, raw_text: '박과장님과 투자 심사 자료 방향 논의. 핵심 지표 3가지: DAU, 리텐션율, 평균 기록 시간.', tags: ['프로젝트:투자준비', '사람:박과장'] },
  { dayOffset: -9, hour: 10, minute: 0, raw_text: 'Supabase Edge Functions 배포 성공. entries CRUD + summaries 생성 API 완성.', tags: ['프로젝트:A', '이슈:백엔드'] },
  { dayOffset: -9, hour: 17, minute: 45, raw_text: 'NativeWind v4 다크모드 적용 완료. dark: 접두사로 거의 모든 컴포넌트 커버됨.', tags: ['프로젝트:A', '이슈:다크모드'] },
  { dayOffset: -8, hour: 11, minute: 30, raw_text: 'i18n 작업 시작. i18next + expo-localization 연동.', tags: ['프로젝트:A', '이슈:i18n'] },
  { dayOffset: -8, hour: 23, minute: 10, raw_text: '밤늦게까지 번역 작업. 30개 파일 하드코딩 한국어 → t() 함수로 전환 완료.', tags: ['프로젝트:A', '이슈:i18n'] },
  { dayOffset: -7, hour: 9, minute: 30, raw_text: '주간 회고. 이번 주 최대 성과: Expo 전환 완료 + 다크모드. 다음 주 목표: 온보딩 + 데모 데이터.', tags: ['프로젝트:A', '이슈:회고'] },
  { dayOffset: -6, hour: 10, minute: 15, raw_text: '설정 화면 구현. 언어/테마 전환, 계정 정보, 개인정보 섹션 완성.', tags: ['프로젝트:A', '이슈:설정화면'] },
  { dayOffset: -6, hour: 16, minute: 0, raw_text: '개인정보 고지 컴포넌트 완성. 배너/인라인 두 가지 모드 지원.', tags: ['프로젝트:A', '이슈:개인정보'] },
  { dayOffset: -5, hour: 8, minute: 50, raw_text: '게이미피케이션 시스템 설계. XP 계산 로직, 레벨 테이블, 배지 11종 정의.', tags: ['프로젝트:A', '이슈:게이미피케이션'] },
  { dayOffset: -5, hour: 15, minute: 30, raw_text: '대시보드 메인 카드 구현. 스트릭 불꽃, 레벨 프로그레스바, 배지 그리드.', tags: ['프로젝트:대시보드', '이슈:게이미피케이션'] },
  { dayOffset: -4, hour: 9, minute: 40, raw_text: '타임라인 뷰 리팩토링. SectionList 날짜 그룹핑 + 데스크톱 2패널 MasterDetail.', tags: ['프로젝트:A', '이슈:타임라인'] },
  { dayOffset: -3, hour: 10, minute: 10, raw_text: '할 일 리스트 기능 완성. AI가 기록에서 자동 추출한 액션 아이템 표시.', tags: ['프로젝트:A', '이슈:할일'] },
  { dayOffset: -3, hour: 19, minute: 0, raw_text: '발표 슬라이드 초안 작성 시작. 문제 정의 → 솔루션 → 데모 → 비즈니스 모델.', tags: ['프로젝트:투자준비', '사람:김대리', '이슈:발표'] },
  { dayOffset: -2, hour: 9, minute: 0, raw_text: '코드 리뷰 & 버그 수정. Evidence Chip 클릭 시 원문 이동 버그 해결.', tags: ['프로젝트:A', '이슈:버그수정'] },
  { dayOffset: -2, hour: 14, minute: 30, raw_text: '반응형 테스트. PC/태블릿/모바일 모두 확인. 사이드바↔하단탭 전환 매끄럽다.', tags: ['프로젝트:A', '이슈:반응형'] },
  { dayOffset: -1, hour: 8, minute: 30, raw_text: '최종 데모 리허설. 3분 기록 → 자동 정리 → 일간 요약 → 주간 회고 → 대시보드 흐름 확인.', tags: ['프로젝트:투자준비', '이슈:데모'] },
  { dayOffset: -1, hour: 16, minute: 0, raw_text: '마지막 폴리시. 로딩 스피너 통일, 빈 상태 일러스트 추가, 에러 토스트 다듬기.', tags: ['프로젝트:A', '이슈:폴리시'] },
  { dayOffset: 0, hour: 9, minute: 0, raw_text: '온보딩 화면 구현 완료. 3스텝 가이드. 데모 데이터 시딩도 준비 완료.', tags: ['프로젝트:A', '이슈:온보딩'] },
  { dayOffset: 0, hour: 13, minute: 0, raw_text: '팀 전체 미팅. 투자 심사 D-day 일정 확인. 박과장님이 발표 자료 최종 리뷰해 주심.', tags: ['프로젝트:투자준비', '사람:박과장', '이슈:발표'] },
];

const TODO_TEMPLATES = [
  { text: 'Figma 컴포넌트 라이브러리 정리', entryIdx: 0, status: 'done' as const },
  { text: 'REST API 스키마 초안 작성', entryIdx: 1, status: 'done' as const },
  { text: 'victory-native 차트 라이브러리 통합', entryIdx: 2, status: 'done' as const },
  { text: 'Supabase RLS 정책 설정', entryIdx: 4, status: 'done' as const },
  { text: 'NativeWind 다크모드 전체 적용', entryIdx: 5, status: 'done' as const },
  { text: '30개 파일 i18n 전환', entryIdx: 7, status: 'done' as const },
  { text: '설정 화면 구현', entryIdx: 9, status: 'done' as const },
  { text: '게이미피케이션 시스템 구현', entryIdx: 11, status: 'done' as const },
  { text: 'Evidence Chip 딥링크 버그 수정', entryIdx: 16, status: 'done' as const },
  { text: '반응형 3뷰포트 테스트 완료', entryIdx: 17, status: 'done' as const },
  { text: '테스트 코드 작성 (유닛 + 통합)', entryIdx: 8, status: 'pending' as const },
  { text: '발표 슬라이드 최종 검토', entryIdx: 15, status: 'pending' as const },
  { text: 'EAS Build로 iOS TestFlight 배포', entryIdx: 20, status: 'pending' as const },
  { text: 'Expo Web 빌드 및 배포', entryIdx: 20, status: 'pending' as const },
  { text: '데모 영상 촬영 (3~5분)', entryIdx: 18, status: 'pending' as const },
];

// POST /seed-demo-data [Protected]
seed.post('/seed-demo-data', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const base = new Date();

  // 1. Clear existing data
  await c.env.DB.prepare('DELETE FROM todos WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare('DELETE FROM summaries WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare('DELETE FROM entries WHERE user_id = ?').bind(userId).run();

  // 2. Insert entries
  const entryIds: string[] = [];
  for (const tpl of ENTRIES) {
    const id = generateId();
    entryIds.push(id);
    const d = dayOffset(base, tpl.dayOffset);
    await c.env.DB
      .prepare('INSERT INTO entries (id, user_id, date, raw_text, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, userId, fmt(d), tpl.raw_text, JSON.stringify(tpl.tags), iso(d, tpl.hour, tpl.minute), iso(d, tpl.hour, tpl.minute))
      .run();
  }

  // 3. Insert daily summaries (simplified — just create for days that have entries)
  const dailySummaries = [
    { offset: -13, text: '프로젝트 A 킥오프와 API 설계 방향을 결정한 하루.', indices: [0, 1] },
    { offset: -10, text: '새벽 집중 작업과 투자 심사 지표를 정리한 하루.', indices: [2, 3] },
    { offset: -9, text: '백엔드 배포와 다크모드 적용을 완료한 하루.', indices: [4, 5] },
    { offset: -8, text: '다국어(i18n) 전환 작업을 완주한 하루.', indices: [6, 7] },
    { offset: -7, text: '주간 회고를 통해 진행 상황을 점검한 하루.', indices: [8] },
    { offset: -6, text: '설정 화면과 개인정보 고지를 구현한 하루.', indices: [9, 10] },
    { offset: -5, text: '게이미피케이션 시스템을 설계하고 구현한 하루.', indices: [11, 12] },
    { offset: -4, text: '타임라인 반응형 리팩토링을 완료한 하루.', indices: [13] },
    { offset: -3, text: '할 일 기능을 완성하고 발표 준비를 시작한 하루.', indices: [14, 15] },
    { offset: -2, text: '버그 수정과 반응형 테스트를 마친 하루.', indices: [16, 17] },
  ];

  let summaryCount = 0;
  for (const s of dailySummaries) {
    const d = dayOffset(base, s.offset);
    const links = s.indices.map((i) => entryIds[i]);
    const sentences = s.indices.map((i) => ({ text: ENTRIES[i].raw_text.slice(0, 80), entry_ids: [entryIds[i]] }));
    await c.env.DB
      .prepare('INSERT INTO summaries (id, user_id, period, period_start, text, entry_links, sentences_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(generateId(), userId, 'daily', fmt(d), s.text, JSON.stringify(links), JSON.stringify(sentences), iso(d, 22, 0))
      .run();
    summaryCount++;
  }

  // Weekly summaries
  const weeklySummaries = [
    { offset: -13, text: '첫째 주: 프로젝트 A 기반 구축 완료', indices: [0, 1, 4, 5, 6, 7, 3] },
    { offset: -6, text: '둘째 주: 폴리시와 데모 준비 완료', indices: [9, 10, 11, 13, 14, 17, 18, 19, 20, 21] },
  ];

  for (const s of weeklySummaries) {
    const d = dayOffset(base, s.offset);
    const links = s.indices.filter((i) => i < entryIds.length).map((i) => entryIds[i]);
    const sentences = [{ text: s.text, entry_ids: links.slice(0, 3) }];
    await c.env.DB
      .prepare('INSERT INTO summaries (id, user_id, period, period_start, text, entry_links, sentences_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(generateId(), userId, 'weekly', fmt(d), s.text, JSON.stringify(links), JSON.stringify(sentences), iso(d, 22, 30))
      .run();
    summaryCount++;
  }

  // 4. Insert todos
  let todoCount = 0;
  for (let i = 0; i < TODO_TEMPLATES.length; i++) {
    const tpl = TODO_TEMPLATES[i];
    const entryId = entryIds[tpl.entryIdx] || null;
    await c.env.DB
      .prepare('INSERT INTO todos (id, user_id, text, source_entry_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(generateId(), userId, tpl.text, entryId, tpl.status, new Date(base.getTime() - (TODO_TEMPLATES.length - i) * 3600000).toISOString())
      .run();
    todoCount++;
  }

  return c.json({
    entries: entryIds.length,
    summaries: summaryCount,
    todos: todoCount,
  }, 201);
});

export { seed as seedRoutes };
