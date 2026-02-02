# AI 일기장 (가칭: ReflectLog)

## 프로젝트 개요
- **한 줄 설명**: 내가 쓴 기록을 바탕으로, AI가 '근거 링크'가 있는 회고를 대신 정리해주는 저널
- **목표**: 투자 심사용 MVP (D-Day: 2026-02-19) — **완성도 높은 UI로 작동하는 데모 프로덕트**
- **데모 시나리오**: "오늘 기록(3분) → 자동 정리 → 일간 요약 → 주간 회고 → 대시보드" 3~5분 시연
- **핵심 방향**: 듀오링고처럼 지독하게 리텐션을 끌어올릴 수 있는 제품

## 핵심 문제 (해결하려는 것)
1. 쓰는 행위 자체가 귀찮아서 기록이 끊김
2. 기록은 쌓이는데 돌아보지 않아 성장으로 연결 안 됨
3. 회고하려면 뭘 봐야 할지 모르겠음

## 타겟 사용자
- 매일 업무 로그를 남기는 바쁜 지식 노동자
- 목표: 하루 3분 기록 + 주간 10분 회고

---

## MVP 범위 (Do / Don't)

### ✅ 반드시 구현 (Do)
1. **빠른 입력**: 텍스트 중심 웹 입력
2. **대화형 작성**: 챗봇 질문(아침/저녁 체크인)으로 Entry 생성
3. **자동 정리**: 날짜/프로젝트/사람/이슈 태깅 (반자동 OK)
4. **일간 요약**: AI 생성 + 근거 링크
5. **주간 회고**: 핵심 3~5개 요약 + 근거 링크
6. **근거 연결**: 요약 클릭 시 원문 Entry로 이동
7. **To-do 제안**: 기록 기반 다음 액션 자동 추출 (간단 버전)
8. **리텐션 시스템**: 연속 기록 스트릭 + 게이미피케이션 (레벨/배지/포인트)
9. **반응형 UI**: PC 버전 + 모바일 버전 대응 (Tailwind 반응형)
10. **유틸리티**: 알림(푸시/인앱), 팝업(확인/모달), 위젯(스트릭 표시 등)
11. **대시보드**: 기록 통계, 스트릭 현황, 최근 활동 한눈에 보기

### ❌ 이번엔 안 함 (Don't)
- 소셜/공유/팔로우
- 의사결정 로그 (옵션/근거/결과 추적)
- 감정/정신건강 진단
- 캘린더/슬랙 연동
- 백그라운드 활동 자동 수집 (금지)

### ⏳ 나중에 (Later)
- 네이티브 모바일 앱 + 음성 입력
- 외부 연동 (캘린더, 슬랙, 노션)
- 리더보드 / 소셜 스트릭 (친구와 비교)

---

## 기술 스택
- **Framework**: Expo (React Native) + Expo Router + TypeScript
- **스타일링**: NativeWind (Tailwind CSS for RN), 다크 모드 지원 (`darkMode: 'class'`)
- **i18n**: i18next + react-i18next + expo-localization (한국어/영어, 시스템 로케일 자동 감지)
- **상태관리**: React Query (서버 상태) + Zustand (클라이언트: auth, chat, settings)
- **Backend**: Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (이메일/소셜 간단히)
- **AI**: OpenAI API (GPT-4o) - 요약/태깅용
- **배포**: EAS Build (iOS/Android) + Expo Web (PC)
- **크로스플랫폼**: PC(웹) + iOS + Android 단일 코드베이스

---

## 데이터 모델

```typescript
// Entry (기록)
interface Entry {
  id: string;
  user_id: string;
  date: string;           // YYYY-MM-DD
  raw_text: string;
  tags: string[];         // ["프로젝트:A", "사람:김대리", "이슈:버그"]
  created_at: timestamp;
}

// Summary (요약)
interface Summary {
  id: string;
  user_id: string;
  period: 'daily' | 'weekly';
  period_start: string;   // YYYY-MM-DD
  text: string;
  entry_links: string[];  // Entry IDs
  created_at: timestamp;
}

// Todo (할 일)
interface Todo {
  id: string;
  user_id: string;
  text: string;
  source_entry_id: string;  // 이 할 일이 추출된 Entry
  status: 'pending' | 'done';
  due_date?: string;        // YYYY-MM-DD (선택)
  created_at: timestamp;
}

// Streak (연속 기록)
interface Streak {
  id: string;
  user_id: string;
  current_streak: number;    // 현재 연속 일수
  longest_streak: number;    // 최장 연속 일수
  last_entry_date: string;   // YYYY-MM-DD (마지막 기록일)
  updated_at: timestamp;
}

// UserStats (게이미피케이션)
interface UserStats {
  id: string;
  user_id: string;
  level: number;             // 현재 레벨
  xp: number;                // 경험치
  badges: string[];          // 획득 배지 목록 ["first_entry", "7day_streak", ...]
  total_entries: number;
  updated_at: timestamp;
}
```

---

## 화면 구성 (8개) — PC + iOS + Android

### 탭 화면 (하단 탭 네비게이션)
1. **대시보드 (홈)** - 스트릭, 레벨/배지, 최근 요약, 빠른 기록 버튼
2. **기록 화면** - 챗봇 형태 질문 + 텍스트 입력
3. **타임라인** - Entry 리스트 (날짜별) + 일간/주간 요약 진입
4. **To-do 리스트** - AI 추출 할 일 + 완료 체크 + 근거 Entry 링크

### 상세/모달 화면
5. **일간 요약** - 오늘의 요약 + 근거 링크 목록
6. **주간 회고** - 한 주 핵심 3~5개 + 근거 링크

### 부가 화면
7. **온보딩** - 첫 사용자 가이드 (2~3 스텝)
8. **설정** - 알림 시간, 체크인 시간대

---

## 핵심 설계 원칙

1. **입력은 가볍게, 회고는 가치있게** - 3분 안에 기록 완료
2. **근거 기반** - 모든 요약은 원문으로 돌아갈 수 있어야 함
3. **거부감 최소화** - AI가 감시/관리하는 느낌 금지, 도우미 톤 유지
4. **리텐션 퍼스트** - 듀오링고처럼 매일 돌아오게 만드는 구조 (스트릭, 보상, 알림)
5. **완성도 높은 UI** - 데모 프로덕트로서 신뢰감 있는 비주얼 퀄리티
6. **반응형 필수** - PC와 모바일 모두에서 자연스러운 UX

---

## 코딩 컨벤션

- 컴포넌트: `PascalCase`, 함수형 + hooks
- 파일: feature 기반 폴더 (`/features/entry`, `/features/summary`)
- API: Supabase Edge Functions (`/functions/entries`, `/functions/summaries`)
- 상태관리: React Query (서버 상태) + Zustand (클라이언트)
- 스타일링: NativeWind (`className` 사용, Tailwind 문법)
- 네비게이션: Expo Router (파일 기반 라우팅, `/app` 디렉토리)
- 에러 처리: 데모용이므로 happy path 우선, 최소한의 toast/alert 에러
- i18n: 모든 UI 문자열은 `src/i18n/locales/{ko,en}/` JSON에서 관리, 컴포넌트에서 `useTranslation()` 사용, 하드코딩 금지

---

## 진행 상황 체크리스트

> **참고**: Phase 1-3은 Next.js로 완료됨 (로직 재사용 가능, UI는 Expo로 재구현 필요)

### Phase R1: Expo 프로젝트 셋업 ✅ 완료
- [x] Expo 프로젝트 생성 (Expo Router + NativeWind + TypeScript)
- [x] Supabase 연동 (클라이언트 설정, Auth)
- [x] 공통 레이아웃 (탭 네비게이션, 헤더)
- [x] 기존 비즈니스 로직 마이그레이션 (타입, Supabase 쿼리, AI 프롬프트)
- [x] Supabase Edge Functions로 API 이전

### Phase R2: 핵심 화면 재구현 ✅ 완료
- [x] 기록 화면 (챗봇 형태 입력 + 빠른 입력 모드 + 자동 태깅/할일 추출)
- [x] 타임라인 (Entry 리스트 + 날짜 그룹핑 + Desktop 2패널)
- [x] 일간 요약 + 근거 링크 (문장별 Evidence Chip)
- [x] 주간 회고 + 근거 링크 (SummaryDetailView 공유)
- [x] To-do 리스트 (필터 탭 + 근거 Entry 링크 + Desktop 2패널)
- [x] 공통 UI 컴포넌트 라이브러리 (Button, Card, Badge, EmptyState, LoadingState)
- [x] 반응형 레이아웃 (Sidebar + MasterDetail + 하단 탭 자동 전환)
- [x] DB 마이그레이션 (sentences_data JSONB 컬럼)
- [x] 기록 상세 (편집/삭제 + 관련 할일/요약 표시)

### Phase R3: 리텐션 + 대시보드 ✅ 완료
- [x] 대시보드 (홈) — 스트릭, 최근 요약, 빠른 기록 진입
- [x] 스트릭 시스템 (연속 기록 추적 + 시각 표시)
- [x] 게이미피케이션 (레벨/배지 — 간단 버전)
- [x] 인앱 리마인더 배너 (미기록 시 CTA 표시)

### Phase R3.5: 다국어 (i18n) ✅ 완료
- [x] i18next + react-i18next + expo-localization 설치
- [x] 번역 인프라 구축 (src/i18n/index.ts + 8 네임스페이스 × 2 언어 = 16 JSON)
- [x] 전체 화면/컴포넌트 한국어 하드코딩 → t() 함수로 전환 (~30 파일)
- [x] 시스템 로케일 자동 감지 (ko → 한국어, 그 외 → 영어)
- [x] TypeScript 타입 체크 통과, 잔여 하드코딩 한국어 0건 확인

### Phase R3.7: 설정 + 다크 모드 + 개인정보 ✅ 완료
- [x] 설정 스토어 (Zustand + AsyncStorage — 테마/언어/개인정보 동의)
- [x] 설정 화면 (언어 전환, 테마 전환, 계정 정보, 개인정보 섹션)
- [x] 설정 네비게이션 (사이드바 톱니바퀴 아이콘, 모바일 헤더 아이콘)
- [x] 다크 모드 전체 적용 (NativeWind `dark:` 변형 ~30개 파일)
- [x] React Navigation 헤더/탭바 다크 모드 (JS 레벨 조건부 스타일)
- [x] 개인정보 고지 컴포넌트 (배너/인라인 모드)
- [x] AI 출력 스키마 정형화 (ProcessedEntry 타입 + 정규화 함수)
- [x] settings + privacy 번역 네임스페이스 추가 (ko/en)

### Phase R4: 폴리시 + 제출 준비 (진행중)
- [x] 온보딩 (3스텝 가이드: 빠른 기록 → AI 정리 → 리텐션 습관)
- [x] 데모 데이터 시딩 (22 Entry + 12 Summary + 15 Todo, 설정 화면에서 실행)
- [x] 다크모드 보완 (MasterDetail 디테일 패인, 대시보드 모바일, 채팅 배경, FontAwesome 아이콘 8개 파일)
- [x] UX 개선: 로그인/회원가입 Enter-to-submit, 채팅 Enter 전송 + Shift+Enter 줄바꿈
- [x] 닉네임 기능 (설정 화면에서 입력, 대시보드 인사말에 반영)
- [x] 설정 UI 개선: 데모 데이터 섹션 제거, 닉네임 팝업 모달(EditModal) 전환
- [x] 모바일 탭바 높이/패딩 수정 (글자 잘림 해결) + 헤더 높이 축소
- [x] 탭 네비게이션 리팩토링: 일간요약+주간회고 → 통합 "요약" 탭 (Daily/Weekly 토글)
- [x] 프로필 탭 신설 (유저 정보, 게이미피케이션, 설정, 개인정보, 로그아웃)
- [x] Write Today FAB (모바일 하단 플로팅 버튼)
- [x] 공유 컴포넌트 추출 (SegmentedControl, EditModal → src/components/ui/)
- [ ] EAS Build (iOS TestFlight + Android APK)
- [ ] Expo Web 빌드 (PC)
- [ ] 데모 영상 촬영

---

## AI 프롬프트 가이드

### 체크인 질문 (Entry 작성 유도)
```
아침: "오늘 가장 중요한 일은 뭔가요?"
저녁: "오늘 어떤 일이 있었나요? 잘된 것과 아쉬운 것이 있다면?"
```

### 태깅 프롬프트
```
다음 기록에서 프로젝트명, 사람 이름, 주요 이슈를 추출해주세요.
JSON 형식: { "projects": [], "people": [], "issues": [] }
```

### 일간 요약 프롬프트
```
다음은 오늘 하루의 기록입니다. 3문장 이내로 요약하고,
각 문장이 어떤 기록(Entry ID)에서 나왔는지 표시해주세요.
```

### To-do 추출 프롬프트
```
다음 기록에서 해야 할 일(action item)을 추출해주세요.
- "~해야 한다", "~할 예정", "~하기로 했다" 등의 표현에서 추출
- 이미 완료된 일은 제외
- JSON 형식: { "todos": [{ "text": "할 일 내용", "due_hint": "마감 힌트 (있으면)" }] }
```

---

## 주의사항

- 데모용이므로 완벽한 에러 처리보다 **핵심 플로우 우선**
- 하드코딩 허용 (데모 데이터, 프롬프트 등)
- UI는 **완성도 높게** — 투자 심사에서 "진짜 제품처럼 보이는" 수준 목표
- "AI가 감시한다" 느낌 절대 금지 → 친근한 도우미 톤
- 모든 화면은 PC(1200px+)와 모바일(375px~)에서 동작해야 함
- 리텐션 요소는 자연스럽게 — 강제적이지 않고 "하고 싶게" 만드는 톤

---

## 와우 포인트 (데모 핵심)
> "3분 기록 → 주간 회고가 '읽을 가치'로 변환되는 순간"
> 근거 링크를 클릭하면 원문이 바로 보이는 신뢰감
> 스트릭이 쌓이면서 "오늘도 기록해야지" 하는 자연스러운 습관 형성
> 대시보드에서 내 성장이 한눈에 보이는 만족감

---

## 개발자 문서 (`docs/`)

아래 문서들은 개발 시 참고용으로 작성된 기술 레퍼런스입니다. 새로운 기능 추가나 기존 코드 수정 시 반드시 참고하세요.

| 문서 | 경로 | 참고 시점 |
|------|------|----------|
| **아키텍처 개요** | [`docs/architecture.md`](docs/architecture.md) | 프로젝트 구조, 라우팅, 상태관리 패턴을 파악할 때 |
| **다크 모드 가이드** | [`docs/dark-mode.md`](docs/dark-mode.md) | UI 컴포넌트 추가/수정 시 `dark:` 변형 색상 매핑 참조 |
| **i18n 가이드** | [`docs/i18n.md`](docs/i18n.md) | 번역 키 추가, 새 네임스페이스 생성, 컴포넌트/스토어에서 t() 사용법 |
| **데이터 모델 & API** | [`docs/data-model.md`](docs/data-model.md) | DB 스키마, TypeScript 타입, API 함수, React Query 훅, Edge Functions |
| **컴포넌트 가이드** | [`docs/components.md`](docs/components.md) | UI 프리미티브(Button/Card/Badge 등) 사용법, 새 컴포넌트 작성 규칙 |
| **설정 & 개인정보** | [`docs/settings-and-privacy.md`](docs/settings-and-privacy.md) | settingsStore 구조, 설정 화면, 개인정보 고지 컴포넌트 |
| **게이미피케이션** | [`docs/gamification.md`](docs/gamification.md) | 스트릭/XP/레벨/배지 시스템, 새 배지 추가 방법 |

### 문서 활용 원칙
1. **새 UI 컴포넌트 작성 시**: `components.md` (사용법) → `dark-mode.md` (색상 매핑) → `i18n.md` (번역 키)
2. **새 데이터 기능 추가 시**: `data-model.md` (DB/API/훅 패턴) → `architecture.md` (feature 모듈 구조)
3. **설정 항목 추가 시**: `settings-and-privacy.md` (스토어/화면 구조)
4. **게이미피케이션 확장 시**: `gamification.md` (XP/배지/레벨 시스템)

---

## 참고 자료
- 실행 준비 문서: `/docs/실행_준비_문서.pdf`

---

## 🔄 개발 피드백 가이드

이 문서는 개발 과정에서 지속적으로 업데이트됩니다. Claude Code와 협업 시 아래 패턴을 활용하세요.

### 문서 업데이트 요청 예시
```bash
# 기능 완료 시
"[기능명] 완료. 체크리스트 업데이트해줘"

# 설계 변경 시
"[변경 내용] 반영해서 CLAUDE.md 수정해줘"

# 버그/삽질 기록
"[이슈 내용] 주의사항에 추가해줘"

# 새로운 결정
"[결정 내용] 결정 로그에 추가해줘"
```

### 피드백 루프 원칙
1. **작은 단위로 자주** - 큰 기능 완료 후보다 작은 단위로 문서 동기화
2. **삽질은 바로 기록** - 같은 실수 반복 방지
3. **왜(Why) 기록** - 무엇을 했는지보다 왜 그렇게 결정했는지가 중요
4. **체크리스트 실시간 반영** - 진행 상황 한눈에 파악

---

## 📋 결정 로그

| 날짜 | 결정 사항 | 이유 | 대안 (기각) |
|------|----------|------|-------------|
| 2026-02-02 | To-do 기능 MVP 포함 | 데모 임팩트 강화, 실용성 어필 | 후순위로 미루기 |
| 2026-02-02 | 리텐션 시스템 (스트릭+게이미피케이션) MVP 포함 | 듀오링고식 리텐션으로 제품 차별화, 투자 심사 어필 | 리텐션 기능 없이 출시 |
| 2026-02-02 | PC+모바일 반응형 웹 우선 | 안드로이드 래퍼 대신 반응형 웹으로 양쪽 커버 | 안드로이드 래퍼 (Capacitor/TWA) |
| 2026-02-02 | 화면 6개 → 10개로 확장 | 대시보드/온보딩/프로필/설정 추가로 완성도 높은 데모 | 기존 6개 유지 |
| 2026-02-02 | UI 완성도 최우선 | 투자 심사용 데모에서 "진짜 제품" 인상 필요 | 기능 우선, UI 나중에 |
| 2026-02-02 | Expo (React Native) 전환 | PC+iOS+Android 단일 코드베이스, 네이티브 푸시 알림, 진짜 앱 데모 가능 | Capacitor (기존 코드 활용), 반응형 웹 유지 |
| 2026-02-02 | 화면 10개 → 8개로 축소 | 태그 확인/프로필을 다른 화면에 통합, 데모에 집중 | 10개 유지 |
| 2026-02-03 | i18n (한국어+영어) 적용 | 글로벌 데모 대응, 투자 심사 시 영어 시연 가능 | 한국어 하드코딩 유지 |
| 2026-02-03 | 설정 화면을 6번째 탭이 아닌 모달로 구현 | 탭 5개가 이미 충분, 설정은 자주 쓰지 않으므로 사이드바 톱니바퀴 아이콘 진입 | 6번째 탭 추가 |
| 2026-02-03 | 다크 모드 전체 적용 (후순위 아닌 즉시) | 투자 심사 데모에서 완성도 인상 강화, NativeWind `dark:` 패턴으로 비용 낮음 | 다크 모드 나중에 |
| 2026-02-03 | 개인정보 고지 + AI 출력 스키마 동시 도입 | 데이터 안전성 시각화 + AI 출력 정형화로 신뢰성 향상 | 고지만 / 스키마만 |
| 2026-02-03 | 온보딩을 `(onboarding)` route group으로 구현 | Expo Router 파일 기반 라우팅 패턴 유지, settingsStore에서 게이트 제어 | 모달 / 조건부 렌더링 |
| 2026-02-03 | 데모 데이터 시딩을 설정 화면 버튼으로 제공 | 시연자가 직접 제어 가능, 멱등 실행(clear-first), React Query 캐시 무효화 | CLI 스크립트 / 자동 시딩 |
| 2026-02-03 | 닉네임을 settingsStore(AsyncStorage)에 저장 | Supabase user_metadata 수정 없이 클라이언트만으로 구현, 데모용 간결함 유지 | Supabase Auth user_metadata |
| 2026-02-03 | 데모 데이터 섹션을 설정 UI에서 제거 (코드는 유지) | 데모데이 전까지 불필요한 UI 노출 방지, 필요 시 코드 복원 용이 | 설정에 계속 노출 |
| 2026-02-03 | 설정 입력을 팝업 모달(EditModal)로 전환 | 인라인 TextInput보다 아기자기하고 즐거운 UX, 모달 패턴 재사용 가능 | 인라인 입력 유지 |
| 2026-02-03 | 일간요약+주간회고 → 통합 "요약" 탭 (SegmentedControl 토글) | 탭 수 최적화, 전환 UX 개선, 한 화면에서 일간/주간 모두 접근 | 별도 탭 유지 |
| 2026-02-03 | 프로필 탭 신설 (5번째 탭, 설정 통합) | 유저 정보+게이미피케이션+설정을 한 곳에, 모바일 headerRight 설정 버튼 제거로 헤더 깔끔 | 설정 모달 유지 |
| 2026-02-03 | Write Today FAB (모바일 전용) | 기록 진입 접근성 향상, 모바일 UX 업계 표준 패턴 | 탭바 + 버튼만 |
| 2026-02-03 | SegmentedControl/EditModal을 공유 컴포넌트로 추출 | settings.tsx와 profile.tsx에서 중복 사용, DRY 원칙 | settings.tsx 인라인 유지 |
| | | | |

---

## ⚠️ 삽질 노트 / 주의사항

개발 중 발견한 이슈와 해결책을 기록합니다.

```
- Supabase RLS: 테이블 생성 후 RLS 정책 반드시 설정할 것
- OpenAI API: 응답 형식 JSON 강제하려면 response_format 설정 필요
- AsyncStorage + Expo Web: expo export 시 window is not defined 에러 발생
  → Platform.OS !== 'web' 일 때만 AsyncStorage를 storage로 전달
  → 웹에서는 Supabase 기본 localStorage 사용
- NativeWind v4: babel.config.js에 jsxImportSource: 'nativewind' 필수
- Supabase Edge Functions: Deno 환경이므로 tsconfig.json에서 exclude 처리 필요
- i18n: 상수 파일(gamification/constants.ts 등)에서 i18n.t()를 모듈 레벨에서 호출 시 import '@/i18n'이 먼저 실행되어야 함 → app/_layout.tsx 최상단에서 import
- i18n: useTranslation() 훅은 React 컴포넌트 내에서만 사용, 순수 함수/store에서는 i18n.t() 직접 호출
- Dark Mode: NativeWind dark: 클래스는 React Navigation style 객체(headerStyle, tabBarStyle)에 적용 안 됨
  → useColorScheme()에서 colorScheme 읽어서 JS 조건부 스타일 사용 (isDark ? '#111827' : '#ffffff')
- Dark Mode: 새 컴포넌트 추가 시 bg-white, text-gray-*, border-gray-* 에 반드시 dark: 변형 추가 → docs/dark-mode.md 색상 매핑 참조
- Onboarding routing: _layout.tsx에서 initialized(auth)와 settingsReady(settings) 모두 true여야 라우팅 결정 가능
  → 한쪽만 체크하면 hasSeenOnboarding이 아직 false인 채로 판단해 무한 리다이렉트 발생
- AppShell 래핑: 온보딩 중에는 AppShell(사이드바) 표시하면 안 됨 → inOnboardingGroup 조건 추가 필수
- Expo Router 타입: 새 route group 추가 후 .expo/types/router.d.ts 재생성 필요 (`npx expo customize tsconfig.json`)
- Dark Mode: FontAwesome 아이콘의 color prop은 NativeWind className과 무관 → useColorScheme()으로 isDark 읽어서 조건부 색상 전달 필수
  → indigo: isDark ? '#818cf8' : '#4f46e5' / light gray: isDark ? '#6b7280' : '#d1d5db'
  → 새 아이콘 추가 시 반드시 dark 색상 매핑 확인
- Dark Mode: MasterDetailLayout 디테일 패인에 배경색 미지정 시 기본 흰색 → 반드시 bg-gray-50 dark:bg-gray-950 추가
- Chat Enter/Shift+Enter: React Native에서 multiline TextInput은 onSubmitEditing이 동작 안 함
  → Platform.OS === 'web'일 때 onKeyPress에서 Enter(shiftKey 없음) 감지해 전송, e.preventDefault()로 줄바꿈 방지
- Tab Bar 글자 잘림: 기본 높이로는 하단 탭 텍스트가 잘림 → tabBarStyle에 height: 56, paddingBottom: 6, paddingTop: 4 명시
- Header 높이: 모바일에서 기본 헤더가 너무 높음 → headerStyle: { height: 48 }로 줄임
- Settings 팝업 모달: React Native Modal + KeyboardAvoidingView + transparent overlay 패턴 사용
  → onShow 콜백에서 draft 동기화, onSubmitEditing으로 키보드 Done 지원
```

---

## 📝 변경 로그

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-02-02 | v0.1 | 프로젝트 초기 셋업 — 문서 작성, MVP 범위 확정, Expo 전환, Phase R1~R2 완료 | Chris |
| 2026-02-03 | v0.2 | i18n (한국어+영어) — 시스템 로케일 자동 감지, 전체 UI 문자열 다국어 전환 | Chris |
| 2026-02-03 | v0.3 | 설정 + 다크 모드 + 개인정보 — 설정 화면, 전체 다크 모드, 개인정보 고지, AI 스키마, 개발자 문서 | Chris |
| 2026-02-03 | v0.4 | Phase R4 온보딩 + 데모 데이터 — 3스텝 온보딩, 데모 시딩/삭제, i18n onboarding 네임스페이스 | Chris |
| 2026-02-03 | v0.5 | UX 폴리시 — 다크모드 보완(8파일), Enter-to-submit(인증/채팅), 온보딩 Skip 버튼, 닉네임 기능 | Chris |
| 2026-02-03 | v0.6 | UI 폴리시 — 설정 팝업 모달, 데모 데이터 UI 제거, 모바일 탭바/헤더 높이 조정 | Chris |
| 2026-02-03 | v0.7 | 탭 리팩토링 — 요약 탭 통합(Daily/Weekly 토글), 프로필 탭 신설, Write Today FAB, 공유 컴포넌트 추출 | Chris |
| | | | |

<details>
<summary>v0.1 상세 이력 (클릭하여 펼치기)</summary>

1. **문서 & 설계**: CLAUDE.md 초기 작성, MVP 범위(Do/Don't) 확정, To-do 기능 포함 결정
2. **기술 결정**: Expo(React Native) 전환, 반응형 웹 → 크로스플랫폼 단일 코드베이스, 화면 10개→8개 축소
3. **Phase R1 — 프로젝트 셋업**: Expo Router + NativeWind + TypeScript 구성, Supabase 연동(Auth/DB), 탭 네비게이션, 비즈니스 로직 마이그레이션, Edge Functions 4개 생성
4. **Phase R2 — 핵심 화면 재구현**:
   - 반응형 레이아웃 시스템 (Desktop 사이드바 + 2패널 / Mobile 하단 탭)
   - 공통 UI 컴포넌트 (Button, Card, Badge, EmptyState, LoadingState)
   - 타임라인: 날짜 그룹핑(SectionList) + Desktop MasterDetail
   - 기록 화면: 챗봇/빠른입력 모드 전환, 자동 태깅, 자동 할일 추출, 저장 피드백
   - 기록 상세: 편집/삭제, 관련 할일·요약 표시
   - 일간 요약 + 주간 회고: 문장별 근거 링크(EvidenceChip), SummaryDetailView 공유
   - 할 일 리스트: 전체/진행중/완료 필터 탭, 근거 Entry 링크
   - DB 마이그레이션: summaries 테이블에 sentences_data JSONB 컬럼 추가

</details>

<details>
<summary>v0.2 상세 이력 (클릭하여 펼치기)</summary>

1. **i18n 인프라 구축**: i18next + react-i18next + expo-localization 설치, `src/i18n/index.ts` 초기화 (시스템 로케일 자동 감지)
2. **번역 파일 생성**: 8개 네임스페이스 × 2개 언어(ko/en) = 16 JSON 파일 (`src/i18n/locales/`)
   - common, dashboard, timeline, entry, summary, todos, auth, gamification
3. **전체 UI 문자열 전환 (~30 파일)**:
   - 앱 레이아웃: 루트 레이아웃, 탭 레이아웃, 사이드바, MasterDetail 플레이스홀더
   - 인증: 로그인/회원가입 폼 라벨, 알림, 유효성 메시지
   - 대시보드: 인사말, 스트릭, 레벨, 배지, 퀵액션, 리마인더, 통계, 주간활동
   - 핵심 화면: 타임라인(날짜 그룹), 일간 요약, 주간 회고, 할 일 목록
   - 기록: 생성(챗봇/빠른입력), 상세(편집/삭제), 저장 피드백
   - 공유 컴포넌트: EntryCard(상대 시간), EntryDetail, EvidenceChip, SummaryDetailView, TodoItem
   - 상수/스토어: 게이미피케이션(8 레벨, 11 배지), 체크인 질문, 챗 완료 메시지
4. **검증**: TypeScript 타입 체크 0 에러, 소스 파일 내 잔여 한국어 하드코딩 0건

</details>

<details>
<summary>v0.3 상세 이력 (클릭하여 펼치기)</summary>

1. **설정 기반**: settingsStore (Zustand + AsyncStorage) — 테마/언어/개인정보 동의 상태 관리
2. **설정 화면** (`app/settings.tsx`): 언어 전환(시스템/한국어/영어), 테마 전환(시스템/라이트/다크), 계정 정보, 개인정보 섹션
3. **설정 네비게이션**: 사이드바 톱니바퀴 아이콘 (desktop), 탭바 headerRight 아이콘 (mobile)
4. **다크 모드 전체 적용** (~30 파일):
   - NativeWind `darkMode: 'class'` + `setColorScheme()` 연동
   - UI 프리미티브 5개, 레이아웃 3개, 대시보드 8개, 탭 화면 6개, 기록 2개, 인증 2개, 기타 3개
   - React Navigation 헤더/탭바: JS 레벨 `isDark` 조건부 색상
5. **개인정보 고지**: PrivacyNotice 컴포넌트 (배너/인라인 모드), 대시보드 첫 방문 시 표시
6. **AI 출력 스키마**: ProcessedEntry 타입 + normalizeProcessedEntry() + processedEntryToTags()
7. **i18n 확장**: settings + privacy 네임스페이스 추가 (4 JSON 파일)
8. **개발자 문서**: `docs/` 폴더에 7개 기술 레퍼런스 문서 작성
9. **검증**: TypeScript 0 에러, `bg-white` / `text-gray-900` 누락 검사 0건

</details>

<details>
<summary>v0.4 상세 이력 (클릭하여 펼치기)</summary>

1. **온보딩 기반**: settingsStore에 `hasSeenOnboarding` + `acknowledgeOnboarding()` 추가, AsyncStorage `@reflectlog/onboarding_seen`
2. **온보딩 화면** (`app/(onboarding)/index.tsx`): 3스텝 페이저 (빠른 기록 → AI 정리 → 리텐션 습관), 이모지 일러스트, 페이지 인디케이터, Skip/Next/Get Started
3. **온보딩 라우팅**: `_layout.tsx`에서 `initialized` + `settingsReady` 동시 체크, `(onboarding)` route group, AppShell 래핑 제외
4. **i18n 확장**: onboarding 네임스페이스 추가 (2 JSON 파일, ko/en)
5. **데모 데이터 생성기** (`src/lib/demoData.ts`):
   - 22개 Entry: 14일 중 12일 활성 (D-12, D-11 빈 날 → 스트릭 끊김/회복), early_bird(06:45), night_owl(23:10) 트리거
   - 12개 Summary: 일간 10개 + 주간 2개, sentences_data에 실제 entry_id 참조
   - 15개 Todo: done 10 + pending 5, source_entry_id 연결
6. **시드 실행** (`src/lib/seedDemoData.ts`): clearDemoData() → entries INSERT → summaries INSERT → todos INSERT, 멱등 실행
7. **설정 화면 확장**: "데모 데이터" 섹션 (불러오기/삭제 버튼, 확인 Alert, 로딩 스피너, React Query 캐시 무효화)
8. **i18n 확장**: settings.json에 `demo.*` 키 추가 (ko/en)
9. **검증**: TypeScript 0 에러, Expo Router 타입 재생성 확인

</details>

<details>
<summary>v0.5 상세 이력 (클릭하여 펼치기)</summary>

1. **온보딩 Skip 버튼**: 카드 내부 텍스트 → SafeAreaView 상단 우측 칩 버튼(bg-gray-100 rounded-full)으로 이동
2. **다크모드 보완** (8개 파일):
   - `MasterDetailLayout`: 디테일 패인 + 플레이스홀더에 `bg-gray-50 dark:bg-gray-950` 추가
   - `entries/new.tsx`: 채팅 모드 `bg-white` → `dark:bg-gray-950`, 모드 토글 텍스트 `dark:` 추가
   - `(tabs)/index.tsx`: 모바일 대시보드 `bg-gray-50` → `dark:bg-gray-950`
   - `SummaryDetailView`, `EvidenceChip`, `TodoItem`, `entries/[id].tsx`, `settings.tsx`: FontAwesome 아이콘 hardcoded color → `isDark` 조건부 색상
3. **Enter-to-submit**:
   - 로그인/회원가입: 이메일 Enter → 비밀번호 포커스, 비밀번호 Enter → 로그인/가입 실행
   - 채팅: Enter → 전송, Shift+Enter → 줄바꿈 (웹 onKeyPress + e.preventDefault)
4. **닉네임 기능**:
   - settingsStore: `nickname` 상태 + `setNickname()` + AsyncStorage `@reflectlog/nickname`
   - 설정 화면: 계정 섹션에 닉네임 입력 필드 (max 20자)
   - 대시보드: `greeting.withName` i18n 키로 "좋은 아침이에요, {name}님" / "Good morning, {name}" 표시
5. **검증**: TypeScript 0 에러

</details>

<details>
<summary>v0.6 상세 이력 (클릭하여 펼치기)</summary>

1. **설정 데모 데이터 제거**: `app/settings.tsx`에서 데모 데이터 섹션(불러오기/삭제 버튼, 핸들러, 상태, import) 전체 삭제, `settings.json`(ko/en)에서 `demo.*` 키 삭제 — 코드(`src/lib/demoData.ts`, `seedDemoData.ts`)는 보존
2. **설정 팝업 모달**: `EditModal` 컴포넌트 신규 — transparent overlay + 중앙 카드 + TextInput + Cancel/Save 버튼, KeyboardAvoidingView 지원
   - 닉네임: 인라인 TextInput → TouchableOpacity 행(현재값 + chevron-right) → 탭 시 EditModal 팝업
   - i18n: `modal.cancel`, `modal.save` 키 추가 (ko/en)
3. **모바일 탭바 수정** (`app/(tabs)/_layout.tsx`):
   - tabBarStyle: `height: 56, paddingBottom: 6, paddingTop: 4` (텍스트 잘림 해결)
   - TabBarIcon: `size: 24→22`, `marginBottom: -3→0`
4. **모바일 헤더 축소**: `headerStyle: { height: 48 }` (기본 ~56에서 축소)
5. **검증**: TypeScript 0 에러

</details>

<details>
<summary>v0.7 상세 이력 (클릭하여 펼치기)</summary>

1. **공유 컴포넌트 추출**: `SegmentedControl<T>` + `EditModal` → `src/components/ui/`로 분리, settings.tsx에서 import로 전환
2. **요약 탭 통합** (`app/(tabs)/summary.tsx`):
   - `useState<'daily' | 'weekly'>` + `SegmentedControl`로 기간 토글
   - `SummaryListCard`: period에 따라 날짜 포맷/라벨 분기 (daily: period_start, weekly: formatWeekRange)
   - 생성 버튼/빈 상태/디테일 플레이스홀더 모두 기간별 분기
   - `formatWeekRange()` 함수를 weekly.tsx에서 이관
3. **프로필 탭** (`app/(tabs)/profile.tsx`):
   - 이니셜 아바타 + 닉네임(EditModal 편집) + 이메일
   - 활동 현황: StreakCard + LevelProgressCard + StatsRow + BadgeGrid
   - 설정: 언어/테마 SegmentedControl
   - 개인정보 고지 (PrivacyNotice 인라인)
   - 로그아웃 버튼 + 버전 정보
4. **탭 레이아웃 수정** (`app/(tabs)/_layout.tsx`):
   - 헤더 height: 48 삭제 (기본값 사용으로 일관성 확보)
   - 탭바: height 64, paddingBottom 10 (텍스트 잘림 해결)
   - `weekly` 탭: `href: null`로 탭바에서 숨김
   - `profile` 탭 추가 (icon: user-circle-o)
   - 설정 headerRight 버튼 제거 (프로필 탭에 설정 통합)
   - Write Today FAB: 모바일 전용 인디고 플로팅 버튼 (bottom: 76, right: 20)
5. **사이드바 수정**: dailySummary+weeklyReview → 단일 "Summary", profile 항목 추가
6. **i18n 확장**: tab.summary, tab.profile (common), tab.daily/weekly (summary), profile.* (settings)
7. **검증**: TypeScript 0 에러 (Expo Router 타입 재생성 포함)

</details>

