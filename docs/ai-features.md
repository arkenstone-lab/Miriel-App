# AI 기능 구현 현황

> 최종 수정: 2026-02-12

## 개요

Miriel의 AI 파이프라인은 사용자가 기록을 저장하면 자동으로 **태깅 → 할일 추출 → 요약 생성**을 수행합니다.
모든 AI 호출은 Supabase Edge Functions (Deno) → `_shared/ai.ts` 추상화 레이어 → AI Provider API 경로로 처리됩니다.

### AI Provider 추상화 (v0.9)

4개 Edge Function이 공유하던 `getCorsHeaders()`, `callOpenAI()`, ai_context 처리를 `_shared/` 모듈로 추출했습니다.

- **`_shared/ai.ts`**: `callAI(systemPrompt, userMessage, options?)` — 단일 턴, `callAIMultiTurn(systemPrompt, messages[], options?)` — 멀티턴 대화
- **`_shared/cors.ts`**: `getCorsHeaders()`, `jsonResponse()`, `appendAiContext()` — CORS + 응답 + ai_context 헬퍼
- **모델 전환**: `AI_PROVIDER` 환경변수만 변경 (gemini | openai), 코드 수정 0줄
- **새 Provider 추가**: `_shared/ai.ts`에 `createXxxProvider()` + switch 1줄

**지원 Provider:**
| Provider | 모델 | 환경변수 |
|----------|------|----------|
| `gemini` (기본값) | Gemini 2.0 Flash | `GEMINI_API_KEY` |
| `openai` | GPT-4o | `OPENAI_API_KEY` |

### AI 개인화 (v0.7)

모든 Edge Function은 optional `ai_context` 문자열을 body에서 받습니다.
클라이언트가 `user_ai_preferences` 테이블 + 페르소나(닉네임/직업/관심사)를 기반으로 `buildAiContext()`를 호출하여 문자열을 빌드하고, 이를 body에 포함시킵니다.
Edge Function은 `appendAiContext(systemPrompt, ai_context)`로 시스템 프롬프트에 안전하게 병합합니다.

---

## 기능별 구현 현황

| # | 기능 | 상태 | Edge Function | 비고 |
|---|------|------|---------------|------|
| 1 | 자동 태깅 | ✅ 구현 완료 | `tagging` | 프로젝트/사람/이슈 추출 |
| 2 | 할일 추출 | ✅ 구현 완료 | `extract-todos` | "~해야 한다" 패턴 |
| 3 | 일간 요약 | ✅ 구현 완료 | `generate-summary` | 3문장 + 근거 Entry ID |
| 4 | 주간 회고 | ✅ 구현 완료 | `generate-weekly` | 3~5 포인트 + 근거 Entry ID |
| 5 | 월간 회고 | ✅ 구현 완료 | `generate-monthly` | 5~7 포인트 + 근거 Entry ID |
| 6 | 대화형 작성 | ✅ 구현 완료 | `chat` | AI 동적 질문 (3단계: Plan→Detail→Reflection) |
| 7 | 감정 분석 | ⏳ 미구현 | — | schema.ts에 타입만 정의 |
| 8 | AI 출력 스키마 | ✅ 구현 완료 | — | ProcessedEntry 타입 + 정규화 |
| 9 | AI 개인화 | ✅ 구현 완료 | 전체 (ai_context) | user_ai_preferences + buildAiContext |

---

## Edge Functions 상세

### 공유 모듈 (`_shared/`)

| 파일 | 역할 |
|------|------|
| `_shared/ai.ts` | `callAI()`, `callAIMultiTurn()` — provider 추상화, retry (3회 + exponential backoff) |
| `_shared/cors.ts` | `getCorsHeaders()`, `jsonResponse()`, `appendAiContext()` |

### 1. `tagging` — 자동 태깅

- **경로**: `supabase/functions/tagging/index.ts`
- **입력**: `{ text: string, ai_context?: string }`
- **출력**: `{ tags: string[] }` (예: `["프로젝트:A", "사람:김대리", "이슈:버그"]`)
- **프롬프트**:
  ```
  다음 기록에서 프로젝트명, 사람 이름, 주요 이슈를 추출해주세요.
  JSON 형식으로만 응답하세요: { "projects": [], "people": [], "issues": [] }
  ```
- **temperature**: 0.3
- **폴백**: API 키 없으면 정규식 기반 mock 태깅
- **호출 시점**: 기록 저장 직후 (`app/entries/new.tsx`)

### 2. `extract-todos` — 할일 추출

- **경로**: `supabase/functions/extract-todos/index.ts`
- **입력**: `{ text: string, entry_id?: string, ai_context?: string }`
- **출력**: `{ todos: Array<{ text, due_hint }> }`
- **프롬프트**:
  ```
  다음 기록에서 해야 할 일(action item)을 추출해주세요.
  - "~해야 한다", "~할 예정", "~하기로 했다" 등의 표현에서 추출
  - 이미 완료된 일은 제외
  ```
- **temperature**: 0.3
- **폴백**: 한국어 패턴 정규식 매칭
- **호출 시점**: 기록 저장 직후 (태깅과 병렬 실행)

### 3. `generate-summary` — 일간 요약

- **경로**: `supabase/functions/generate-summary/index.ts`
- **입력**: `{ date?: string, ai_context?: string }` (date: YYYY-MM-DD, 기본값 오늘)
- **출력**: `{ summary: Summary, sentences: SummarySentence[] }`
- **프롬프트**:
  ```
  다음은 오늘 하루의 기록들입니다. 3문장 이내로 요약하고,
  각 문장이 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.
  ```
- **temperature**: 0.5
- **근거 링크**: 각 문장마다 `entry_ids[]` 포함 → EvidenceChip 컴포넌트로 표시
- **호출 시점**: 요약 탭에서 "생성" 버튼 클릭

### 4. `generate-weekly` — 주간 회고

- **경로**: `supabase/functions/generate-weekly/index.ts`
- **입력**: `{ week_start?: string, ai_context?: string }` (week_start: YYYY-MM-DD, 기본값 이번 주 월요일)
- **출력**: `{ summary: Summary, sentences: SummarySentence[] }`
- **프롬프트**:
  ```
  다음은 한 주간의 기록들입니다. 핵심 3~5개 포인트로 회고해주세요.
  각 포인트가 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.
  ```
- **temperature**: 0.5
- **호출 시점**: 요약 탭 Weekly 모드에서 "생성" 버튼 클릭

### 5. `generate-monthly` — 월간 회고

- **경로**: `supabase/functions/generate-monthly/index.ts`
- **입력**: `{ month_start: string, month_end: string, ai_context?: string }` (YYYY-MM-DD)
- **출력**: `{ summary: Summary, sentences: SummarySentence[] }`
- **프롬프트**:
  ```
  다음은 한 달간의 기록들입니다. 핵심 5~7개 포인트로 회고해주세요.
  각 포인트가 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.
  ```
- **temperature**: 0.5
- **기간**: 사용자 설정 `monthlyReviewDay` 기준 (예: 15일 설정 → 1/15~2/14)
- **호출 시점**: 요약 탭 Monthly 모드에서 "생성" 버튼 클릭

### 6. `chat` — AI 대화형 체크인

- **경로**: `supabase/functions/chat/index.ts`
- **입력**: `{ messages: {role,content}[], time_of_day, pending_todos, language, ai_context? }`
- **출력**: `{ message, is_complete, phase, session_summary? }`
- **3단계 대화**: Plan (1-2턴) → Detail (2-3턴) → Reflection (1-2턴)
- **temperature**: 0.7
- **멀티턴**: `callAIMultiTurn()` 사용, 클라이언트가 전체 히스토리 전달 (stateless)
- **폴백**: AI 실패 시 기존 정적 체크인 질문으로 자동 전환
- **호출 시점**: 기록 작성 화면 (chat 모드) — 매 턴마다 호출

---

## 클라이언트 AI 로직

### 대화형 기록 작성 (Chat Mode)

- **파일**: `src/stores/chatStore.ts`, `src/features/entry/chatApi.ts`
- **동작**: AI가 맥락(할 일, 선호도, 시간대) 기반으로 동적 질문 생성
- **3단계**: Plan → Detail → Reflection (5-7 교환 후 마무리)
- **Phase 마커**: 저장 시 `[Plan]\n...\n\n[Detail]\n...\n\n[Reflection]\n...` 형태로 raw_text 구조화
- **폴백**: AI 불가 시 `src/lib/constants.ts`의 정적 질문 사용 (기존 동작 유지)

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
  ├─ 2. tagging Edge Function 호출 (await)
  │    └─ 결과 tags로 entry UPDATE
  ├─ 3. extract-todos Edge Function 호출 (병렬, non-blocking)
  │    └─ 결과 todos 테이블에 INSERT
  └─ 4. generate-summary Edge Function 호출 (병렬, non-blocking)
       └─ 일간 요약 자동 생성 → React Query 캐시 무효화

요약 생성 (수동 트리거)
  ├─ 주간: generate-weekly → summaries + sentences_data
  └─ 월간: generate-monthly → summaries + sentences_data
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
| AI API 키 없음 | 정규식 기반 mock 결과 반환 |
| Edge Function 에러 | 빈 결과 반환, 에러 토스트 표시 |
| 기록 없는 날 요약 요청 | "기록이 없습니다" 메시지 |
| chat AI 초기화 실패 | 정적 체크인 질문으로 자동 전환 |
| chat AI 응답 실패 (대화 중) | 제네릭 follow-up 메시지 표시 |

---

## TODO: 미구현 AI 기능

- [ ] **감정 분석** — 기록의 감정(positive/neutral/negative) 자동 분류. `ProcessedEntry.sentiment`에 타입 정의만 있음. Edge Function 추가 필요.
- [x] ~~**페르소나 기반 질문 개인화**~~ — chat Edge Function이 ai_context로 페르소나 + 할 일 참조
- [x] ~~**요약 자동 생성**~~ — 기록 저장 시 일간 요약 자동 생성 (fire-and-forget)
- [ ] **스마트 알림** — 기록 패턴 분석으로 최적 알림 시간 제안
- [ ] **태그 기반 통계** — 프로젝트/사람/이슈별 언급 빈도 대시보드

---

## 환경 변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `AI_PROVIDER` | Supabase Edge Function secrets | `gemini` (기본) 또는 `openai` |
| `GEMINI_API_KEY` | Supabase Edge Function secrets | Gemini 2.0 Flash API 키 |
| `OPENAI_API_KEY` | Supabase Edge Function secrets | GPT-4o API 키 |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Supabase anon key |

---

## 관련 파일 인덱스

| 카테고리 | 파일 경로 |
|----------|----------|
| 공유 모듈 | `supabase/functions/_shared/{ai,cors}.ts` |
| Edge Functions | `supabase/functions/{tagging,extract-todos,generate-summary,generate-weekly,generate-monthly,chat}/index.ts` |
| 클라이언트 API | `src/features/{entry,summary,todo,ai-preferences}/api.ts`, `src/features/entry/chatApi.ts` |
| React Query 훅 | `src/features/{entry,summary,todo,ai-preferences}/hooks.ts` |
| AI 스키마 | `src/features/entry/schema.ts` |
| 챗봇 상태 | `src/stores/chatStore.ts` |
| 체크인 질문 | `src/lib/constants.ts` |
| AI 개인화 컨텍스트 | `src/features/ai-preferences/context.ts` |
| AI 개인화 타입 | `src/features/ai-preferences/types.ts` |
| 기록 작성 UI | `app/entries/new.tsx` |
| 근거 링크 UI | `src/components/EvidenceChip.tsx`, `src/components/SummaryDetailView.tsx` |
| 월간 회고 날짜 피커 | `src/components/ui/MonthDayPickerModal.tsx` |
