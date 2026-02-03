# AI 기능 구현 현황

> 최종 수정: 2026-02-03

## 개요

Miriel의 AI 파이프라인은 사용자가 기록을 저장하면 자동으로 **태깅 → 할일 추출 → 요약 생성**을 수행합니다.
모든 AI 호출은 Supabase Edge Functions (Deno) → OpenAI GPT-4o API 경로로 처리됩니다.

---

## 기능별 구현 현황

| # | 기능 | 상태 | Edge Function | 비고 |
|---|------|------|---------------|------|
| 1 | 자동 태깅 | ✅ 구현 완료 | `tagging` | 프로젝트/사람/이슈 추출 |
| 2 | 할일 추출 | ✅ 구현 완료 | `extract-todos` | "~해야 한다" 패턴 |
| 3 | 일간 요약 | ✅ 구현 완료 | `generate-summary` | 3문장 + 근거 Entry ID |
| 4 | 주간 회고 | ✅ 구현 완료 | `generate-weekly` | 3~5 포인트 + 근거 Entry ID |
| 5 | 대화형 작성 | ✅ 구현 완료 | — (클라이언트) | 아침/저녁 체크인 질문 |
| 6 | 감정 분석 | ⏳ 미구현 | — | schema.ts에 타입만 정의 |
| 7 | AI 출력 스키마 | ✅ 구현 완료 | — | ProcessedEntry 타입 + 정규화 |

---

## Edge Functions 상세

### 1. `tagging` — 자동 태깅

- **경로**: `supabase/functions/tagging/index.ts`
- **입력**: `{ text: string }`
- **출력**: `{ tags: string[] }` (예: `["프로젝트:A", "사람:김대리", "이슈:버그"]`)
- **프롬프트**:
  ```
  다음 기록에서 프로젝트명, 사람 이름, 주요 이슈를 추출해주세요.
  JSON 형식으로만 응답하세요: { "projects": [], "people": [], "issues": [] }
  ```
- **모델**: GPT-4o, temperature: 0.3
- **폴백**: OpenAI 키 없으면 정규식 기반 mock 태깅
- **호출 시점**: 기록 저장 직후 (`app/entries/new.tsx`)

### 2. `extract-todos` — 할일 추출

- **경로**: `supabase/functions/extract-todos/index.ts`
- **입력**: `{ text: string, entry_id?: string }`
- **출력**: `{ todos: Array<{ text, due_hint }> }`
- **프롬프트**:
  ```
  다음 기록에서 해야 할 일(action item)을 추출해주세요.
  - "~해야 한다", "~할 예정", "~하기로 했다" 등의 표현에서 추출
  - 이미 완료된 일은 제외
  ```
- **모델**: GPT-4o, temperature: 0.3
- **폴백**: 한국어 패턴 정규식 매칭
- **호출 시점**: 기록 저장 직후 (태깅과 병렬 실행)

### 3. `generate-summary` — 일간 요약

- **경로**: `supabase/functions/generate-summary/index.ts`
- **입력**: `{ date?: string }` (YYYY-MM-DD, 기본값 오늘)
- **출력**: `{ summary: Summary, sentences: SummarySentence[] }`
- **프롬프트**:
  ```
  다음은 오늘 하루의 기록들입니다. 3문장 이내로 요약하고,
  각 문장이 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.
  ```
- **모델**: GPT-4o, temperature: 0.5
- **근거 링크**: 각 문장마다 `entry_ids[]` 포함 → EvidenceChip 컴포넌트로 표시
- **호출 시점**: 요약 탭에서 "생성" 버튼 클릭

### 4. `generate-weekly` — 주간 회고

- **경로**: `supabase/functions/generate-weekly/index.ts`
- **입력**: `{ week_start?: string }` (YYYY-MM-DD, 기본값 이번 주 월요일)
- **출력**: `{ summary: Summary, sentences: SummarySentence[] }`
- **프롬프트**:
  ```
  다음은 한 주간의 기록들입니다. 핵심 3~5개 포인트로 회고해주세요.
  각 포인트가 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.
  ```
- **모델**: GPT-4o, temperature: 0.5
- **호출 시점**: 요약 탭 Weekly 모드에서 "생성" 버튼 클릭

---

## 클라이언트 AI 로직

### 대화형 기록 작성 (Chat Mode)

- **파일**: `src/stores/chatStore.ts`, `src/lib/constants.ts`
- **동작**: 시간대에 따라 아침/저녁 체크인 질문을 순서대로 표시
- **질문 소스**: `src/i18n/locales/{ko,en}/gamification.json` → `checkin.morning[]` / `checkin.evening[]`
- **완료 시**: 사용자 응답들을 `\n\n`으로 합쳐서 기록 텍스트 생성

### AI 출력 스키마 정형화

- **파일**: `src/features/entry/schema.ts`
- **타입**: `ProcessedEntry` (metadata, sentiment, suggested_todos, tags)
- **헬퍼**: `normalizeProcessedEntry()`, `processedEntryToTags()`
- **용도**: Edge Function 응답을 정형화하여 일관된 데이터 구조 보장

---

## 기록 저장 시 AI 파이프라인

```
사용자 기록 저장
  ├─ 1. entries 테이블에 INSERT
  ├─ 2. tagging Edge Function 호출 (병렬)
  │    └─ 결과 tags로 entry UPDATE
  └─ 3. extract-todos Edge Function 호출 (병렬)
       └─ 결과 todos 테이블에 INSERT

요약 생성 (수동 트리거)
  ├─ 일간: generate-summary → summaries + sentences_data
  └─ 주간: generate-weekly → summaries + sentences_data
```

---

## 근거 링크 시스템

모든 요약은 원문 기록으로 돌아갈 수 있어야 한다는 원칙에 따라:

1. AI가 요약 문장 생성 시 각 문장의 근거 `entry_ids`를 함께 출력
2. `summaries.sentences_data` JSONB 컬럼에 저장
3. `SummaryDetailView` → `EvidenceChip` 컴포넌트로 클릭 가능한 근거 링크 표시
4. 클릭 시 해당 기록 상세 화면으로 네비게이션

---

## 폴백 전략

| 상황 | 동작 |
|------|------|
| OpenAI API 키 없음 | 정규식 기반 mock 결과 반환 |
| Edge Function 에러 | 빈 결과 반환, 에러 토스트 표시 |
| 기록 없는 날 요약 요청 | "기록이 없습니다" 메시지 |

---

## TODO: 미구현 AI 기능

- [ ] **감정 분석** — 기록의 감정(positive/neutral/negative) 자동 분류. `ProcessedEntry.sentiment`에 타입 정의만 있음. Edge Function 추가 필요.
- [ ] **페르소나 기반 질문 개인화** — 사용자의 직업/관심사에 따라 체크인 질문 커스터마이징
- [ ] **요약 자동 생성** — 일정 시간(예: 자정)에 자동으로 일간 요약 생성 (현재는 수동 트리거)
- [ ] **스마트 알림** — 기록 패턴 분석으로 최적 알림 시간 제안
- [ ] **태그 기반 통계** — 프로젝트/사람/이슈별 언급 빈도 대시보드

---

## 환경 변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | Supabase Edge Function secrets | GPT-4o API 키 |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Supabase anon key |

---

## 관련 파일 인덱스

| 카테고리 | 파일 경로 |
|----------|----------|
| Edge Functions | `supabase/functions/{tagging,extract-todos,generate-summary,generate-weekly}/index.ts` |
| 클라이언트 API | `src/features/{entry,summary,todo}/api.ts` |
| React Query 훅 | `src/features/{entry,summary,todo}/hooks.ts` |
| AI 스키마 | `src/features/entry/schema.ts` |
| 챗봇 상태 | `src/stores/chatStore.ts` |
| 체크인 질문 | `src/lib/constants.ts` |
| 기록 작성 UI | `app/entries/new.tsx` |
| 근거 링크 UI | `src/components/EvidenceChip.tsx`, `src/components/SummaryDetailView.tsx` |
