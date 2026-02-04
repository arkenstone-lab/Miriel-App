# AI 일기장 — Miriel

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
- **Auth**: Supabase Auth (ID/비밀번호 — profiles 테이블로 username↔email 매핑)
- **AI**: OpenAI API (GPT-4o) - 요약/태깅용
- **배포**: EAS Build (iOS/Android) + Expo Web (PC)
- **크로스플랫폼**: PC(웹) + iOS + Android 단일 코드베이스

---

## 데이터 모델

```typescript
// Profile (사용자 프로필 — username↔email 매핑)
interface Profile {
  id: string;                // FK → auth.users
  username: string;          // 3~20자, 영문/숫자/_ — 로그인 ID
  phone?: string;
  created_at: timestamp;
}

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
- 에러 처리: `AppError(code)` + `showErrorAlert()` 패턴 사용, 에러 코드 카탈로그는 `docs/error-codes.md` 참조
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
- [x] 온보딩 Skip 위치 변경 (상단 우측 → 다음 버튼 아래 텍스트)
- [x] 페르소나 수집 화면 (닉네임, 성별, 직업, 관심사 — 온보딩 4단계)
- [x] 사용자 데이터 Supabase user_metadata 마이그레이션 (AsyncStorage → 계정별 서버 저장)
- [x] 프로필 탭 리팩토링 (설정 분리, 내 정보+성취감 중심, 할일 달성률 카드)
- [x] 프로필 편집 화면 (edit-profile 모달 — 아바타 업로드/삭제, 페르소나 수정)
- [x] 이메일 인증 안내 화면 (회원가입 후 verify-email 화면)
- [x] 지원/커뮤니티 링크 (설정 화면 Support 섹션)
- [x] AI 기능 문서화 (docs/ai-features.md — 파이프라인, Edge Function 스펙, 미구현 목록)
- [x] 로컬 푸시 알림 (아침/저녁 체크인 리마인더 — expo-notifications, 설정 화면 토글+시간 선택)
- [x] 이메일 인증 재전송 (verify-email 화면 — 60초 쿨다운, 성공/실패 Alert)
- [x] ID 기반 인증 전환 (email 로그인 → username 로그인, profiles 테이블 + RPC 함수 3개)
- [x] 아이디/비밀번호 찾기 (find-id, find-password 화면 — RPC 조회, 이메일 마스킹)
- [x] 계정 정보 수정 (설정 > 이메일/전화번호/비밀번호 변경 — EditModal + async onSave)
- [x] EditModal 확장 (secureTextEntry, async onSave 지원)
- [x] 프로젝트 리브랜딩 (ReflectLog → Miriel — 전체 코드/문서/i18n/설정 일괄 변경)
- [x] 에러 코드 시스템 (AppError + showErrorAlert + ErrorDisplay + errors i18n + CS 문서)
- [x] 회원가입 비밀번호 확인 필드 (비밀번호 2회 입력 + 불일치 검증)
- [x] 초기 설정 플로우 (첫 실행 시 언어→테마→환영 3단계 — 로그인 전 진입, AsyncStorage 디바이스 레벨)
- [x] 온보딩 리디자인 (성장 사이클 교육 → 주간 회고 설정 → 알림 설정 3단계 + 완료 화면)
- [x] 주간 회고 알림 설정 (요일/시간 선택 — 온보딩 + 설정 화면, DayPickerModal)
- [x] 알림 시스템 확장 (scheduleAllNotifications 주간 WEEKLY trigger + 웹 Notification API 폴링)
- [x] 일일 기록 1회 제한 (useTodayEntry 훅 + 기존 기록 편집으로 autoEdit 리다이렉트)
- [x] 주간 회고 1회 제한 (이번 주 회고 존재 시 생성 버튼 비활성화)
- [x] 설정 화면 주간 회고 섹션 (요일/시간 — DayPickerModal + TimePickerModal)
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
| **AI 기능** | [`docs/ai-features.md`](docs/ai-features.md) | AI 파이프라인, Edge Function 스펙, 프롬프트, 미구현 기능 목록 |
| **에러 코드** | [`docs/error-codes.md`](docs/error-codes.md) | 에러 코드 카탈로그, CS 대응 가이드, 사용자 메시지(ko/en) |

### 문서 활용 원칙
1. **새 UI 컴포넌트 작성 시**: `components.md` (사용법) → `dark-mode.md` (색상 매핑) → `i18n.md` (번역 키)
2. **새 데이터 기능 추가 시**: `data-model.md` (DB/API/훅 패턴) → `architecture.md` (feature 모듈 구조)
3. **설정 항목 추가 시**: `settings-and-privacy.md` (스토어/화면 구조)
4. **게이미피케이션 확장 시**: `gamification.md` (XP/배지/레벨 시스템)
5. **AI 기능 수정/추가 시**: `ai-features.md` (Edge Function 스펙, 프롬프트, 폴백 전략)
6. **에러 처리 추가 시**: `error-codes.md` (코드 카탈로그) → `src/lib/errors.ts` (AppError) → `errors.json` (ko/en 메시지)

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

### 커밋 전 문서 체크리스트
코드 변경 사항을 커밋하기 전에 반드시 아래 문서들에 추가/수정이 필요한 내용이 없는지 확인하세요:

1. **`CLAUDE.md`** — 체크리스트, 결정 로그, 삽질 노트, 변경 로그에 반영할 내용이 있는지
2. **`docs/` 폴더** — 변경된 기능과 관련된 문서(architecture, data-model, settings-and-privacy, components 등)가 최신 상태인지
3. **`README.md`** — 프로젝트 소개, 기능 목록, 설치 방법 등에 반영할 변경이 있는지

> 새 기능, 설계 변경, 버그 수정 등 모든 의미 있는 코드 변경은 관련 문서도 함께 업데이트한 뒤 커밋해야 합니다.

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
| 2026-02-03 | ~~닉네임을 settingsStore(AsyncStorage)에 저장~~ → user_metadata로 이전됨 | ~~클라이언트만으로 구현~~ → 계정별 데이터 일관성을 위해 user_metadata로 마이그레이션 | ~~Supabase Auth user_metadata~~ |
| 2026-02-03 | 데모 데이터 섹션을 설정 UI에서 제거 (코드는 유지) | 데모데이 전까지 불필요한 UI 노출 방지, 필요 시 코드 복원 용이 | 설정에 계속 노출 |
| 2026-02-03 | 설정 입력을 팝업 모달(EditModal)로 전환 | 인라인 TextInput보다 아기자기하고 즐거운 UX, 모달 패턴 재사용 가능 | 인라인 입력 유지 |
| 2026-02-03 | 일간요약+주간회고 → 통합 "요약" 탭 (SegmentedControl 토글) | 탭 수 최적화, 전환 UX 개선, 한 화면에서 일간/주간 모두 접근 | 별도 탭 유지 |
| 2026-02-03 | 프로필 탭 신설 (5번째 탭, 설정 통합) | 유저 정보+게이미피케이션+설정을 한 곳에, 모바일 headerRight 설정 버튼 제거로 헤더 깔끔 | 설정 모달 유지 |
| 2026-02-03 | Write Today FAB (모바일 전용) | 기록 진입 접근성 향상, 모바일 UX 업계 표준 패턴 | 탭바 + 버튼만 |
| 2026-02-03 | SegmentedControl/EditModal을 공유 컴포넌트로 추출 | settings.tsx와 profile.tsx에서 중복 사용, DRY 원칙 | settings.tsx 인라인 유지 |
| 2026-02-03 | 사용자 데이터를 Supabase user_metadata로 마이그레이션 | AsyncStorage는 디바이스별 저장이라 계정 전환 시 온보딩/페르소나가 공유됨. user_metadata는 계정별 서버 저장으로 정확한 상태 유지 | AsyncStorage 유지 + 로그아웃 시 리셋 |
| 2026-02-03 | 페르소나 데이터 단일 배치 저장 (savePersona) | 개별 필드마다 updateUser 호출 시 동시성 문제(last-write-wins)로 데이터 유실 | 필드별 개별 updateUser 호출 |
| 2026-02-03 | 성별 옵션에서 "기타" 제거 (남성/여성만) | 사용자 요청 — 심플한 선택지 |  "기타" 옵션 유지 |
| 2026-02-03 | 프로필 편집을 별도 모달 화면(edit-profile)으로 분리 | 프로필 탭은 조회 중심, 편집은 독립 화면으로 UX 분리. 아바타+페르소나 한 곳에서 관리 | 프로필 탭 내 인라인 편집 |
| 2026-02-03 | 아바타를 Supabase Storage + user_metadata URL로 저장 | 추후 기본 아바타 이미지 확장 시 동일한 avatarUrl 필드 활용 가능 | Base64로 user_metadata에 직접 저장 |
| 2026-02-03 | 지원 링크를 설정 화면 Support 섹션에 배치 | 설정은 앱 관리 허브, Linking.openURL로 외부 링크 처리는 업계 표준 패턴 | 프로필 탭 / 별도 화면 |
| 2026-02-03 | AI 기능 문서(docs/ai-features.md) 작성 | Edge Function 스펙, 프롬프트, 폴백 전략, 미구현 기능을 한 곳에 정리하여 개발 참조 효율화 | CLAUDE.md에 모두 포함 |
| 2026-02-03 | 로컬 푸시 알림 (expo-notifications) | 리텐션 핵심 — 아침/저녁 체크인 리마인더로 매일 기록 유도, 설정 화면에서 시간 제어 | 서버 푸시 (FCM/APNs) |
| 2026-02-03 | 알림 설정을 user_metadata에 저장 | 디바이스 전환 시 알림 설정 유지, 기존 user_metadata 패턴과 일관성 | AsyncStorage에 저장 |
| 2026-02-03 | 이메일 인증 재전송 + 60초 쿨다운 | 인증 메일 미수신 시 UX 개선, 쿨다운으로 남용 방지 | 재전송 없이 안내만 |
| 2026-02-03 | ID(username) 기반 인증으로 전환 | 이메일 노출 없이 아이디로 로그인하는 일반적 UX, profiles 테이블로 username↔email 매핑 | 이메일 로그인 유지 |
| 2026-02-03 | profiles 테이블 + SECURITY DEFINER RPC | username→email 조회가 auth.users 접근 필요, RLS로는 불가 → SECURITY DEFINER 함수로 안전하게 매핑 | 클라이언트에서 직접 auth.users 조회 |
| 2026-02-03 | 아이디/비밀번호 찾기 화면 분리 | 각각 다른 입력(이메일/아이디or이메일)이 필요, 별도 화면이 UX 명확 | 단일 "계정 찾기" 화면 |
| 2026-02-03 | 계정 정보 수정을 설정 화면 Account 섹션에 배치 | 이메일/전화번호/비밀번호 변경은 설정의 자연스러운 위치, EditModal 재사용으로 일관된 UX | 별도 "계정 관리" 화면 |
| 2026-02-03 | EditModal에 secureTextEntry + async onSave 추가 | 비밀번호 변경 시 마스킹 필요, 서버 호출 실패 시 모달 유지하려면 async 지원 필요 | 비밀번호 전용 모달 분리 |
| 2026-02-03 | signUp 시 user_metadata에 pendingUsername/Phone 임시 저장 + 지연 프로필 생성 | Supabase 이메일 인증 ON이면 session null → profiles INSERT 불가. user_metadata에 저장 후 첫 로그인 시 loadUserData에서 생성 | 이메일 인증 OFF 강제 / 서버 사이드 프로필 생성 |
| 2026-02-04 | 프로젝트 이름 ReflectLog → Miriel로 변경 | 브랜딩 결정 — VC 피칭 및 테스터 모집 전 이름 확정 | ReflectLog 유지 |
| 2026-02-04 | 에러 코드 시스템 도입 (AppError + i18n + CS 문서) | CS 대응 효율화, 사용자가 에러 코드 전달 시 즉시 원인 파악 가능. 33개 에러 코드 카탈로그 | 에러 메시지만 표시 (코드 없음) |
| 2026-02-04 | 에러 메시지를 errors 네임스페이스로 분리 | 에러별 사용자 친화적 메시지 + 다국어 지원, API 레이어의 기술적 에러를 사용자 언어로 변환 | 하드코딩 에러 메시지 유지 |
| 2026-02-04 | 멀티 테마는 세 번째 테마 확정 시 도입 (현재 light/dark 유지) | 현재 `dark:` 패턴으로 충분, 시맨틱 컬러 토큰화는 세 번째 테마가 필요해지는 시점에 진행. CSS 변수 기반 토큰(`bg-surface` 등)으로 30+ 파일 일괄 치환 예정 | 지금 즉시 토큰화 |
| 2026-02-04 | 초기 설정 플로우를 로그인 전 3단계로 구현 | 첫 실행 시 언어/테마를 미리 설정하면 로그인 화면부터 올바른 언어·테마 적용, 신규/기존 유저 분기로 자연스러운 진입 | 설정 없이 바로 로그인 |
| 2026-02-04 | hasCompletedSetup을 AsyncStorage(디바이스 레벨)에 저장 | 로그아웃해도 setup을 다시 표시하지 않음 (언어/테마는 디바이스 설정), user_metadata는 로그인 후에만 접근 가능 | user_metadata에 저장 |
| 2026-02-04 | setup 테마 선택에서 "System" 옵션 미제공 | 첫 사용자에게 심플한 2가지 선택지, 나중에 설정에서 변경 가능 | Light/Dark/System 3가지 |
| 2026-02-04 | 온보딩을 성장 사이클 교육 + 설정 중심으로 리디자인 | 기존 3스텝(기록→AI→배지)은 정보 전달뿐, 신규 3스텝은 사용자가 실제 설정까지 완료하여 리텐션 루프 진입 | 기존 교육 온보딩 유지 |
| 2026-02-04 | 온보딩 알림 설정을 로컬 state → 배치 저장 (saveNotificationSettings) | 스텝별 개별 저장 시 user_metadata 동시성 문제, 배치로 한 번에 저장하여 안전 | 스텝별 즉시 저장 |
| 2026-02-04 | 온보딩 완료 화면(complete.tsx) 별도 분리 | 설정 요약을 보여주고 "기록 시작" CTA로 자연스러운 전환, persona에서 직접 tabs 이동 시 급격한 전환 | persona에서 바로 /(tabs) 이동 |
| 2026-02-04 | 주간 회고 요일을 0=Mon..6=Sun 컨벤션 사용 | ISO 8601 요일 순서와 일관, JS getDay()(0=Sun)과 다르므로 변환 필요하지만 사용자 UX가 자연스러움 | JS getDay() 컨벤션 그대로 사용 |
| 2026-02-04 | 웹 알림을 30초 폴링으로 구현 (데모용) | Service Worker + VAPID + 서버 크론은 데모 범위 초과, 탭 열린 상태에서 시연하면 충분 | 서버 푸시 (VAPID) |
| 2026-02-04 | 일일 기록 1회 제한 — 기존 기록 편집으로 리다이렉트 | 하루 한 번 기록이라는 제품 철학, 추가 기록 대신 기존 기록 보완 유도 | 제한 없이 다중 기록 허용 |
| 2026-02-04 | 주간 회고 1회 제한 — 이번 주 월요일 기준 체크 | 중복 생성 방지, getMonday()로 현재 주 시작일 계산 후 period_start 비교 | 제한 없이 다중 생성 허용 |
| 2026-02-04 | DayPickerModal을 공유 컴포넌트로 구현 | TimePickerModal 패턴 재사용, 온보딩과 설정 화면 모두에서 사용 | 인라인 선택 UI |
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
- user_metadata 동시성: Supabase auth.updateUser()를 여러 필드에 동시 호출하면 last-write-wins로 데이터 유실
  → 반드시 단일 updateUser({ data: { ...allFields } })로 배치 호출 (savePersona 패턴)
- user_metadata 라우팅 가드: user 변경 시 loadUserData() 비동기 완료 전에 라우팅 결정하면 온보딩 플래시 발생
  → userDataLoaded 플래그로 메타데이터 로드 완료까지 라우팅 보류
- AsyncStorage vs user_metadata: 온보딩/페르소나/개인정보 동의 같은 계정별 데이터는 반드시 user_metadata에 저장
  → AsyncStorage는 디바이스별이라 계정 전환 시 다른 사용자 데이터가 남음
  → theme/language만 AsyncStorage 유지 (디바이스 설정이므로)
- Supabase Storage 아바타: 버킷 'avatars'에 {userId}/avatar.{ext} 경로로 업로드
  → 같은 경로에 덮어쓰기해도 CDN 캐시로 이전 이미지 표시될 수 있음 → ?t=timestamp 캐시버스팅 필수
  → 버킷 생성 + RLS 정책 설정을 Supabase 콘솔에서 수동으로 해야 함
- expo-image-picker: aspect [1,1]로 정사각형 크롭, quality 0.7로 파일 크기 절약
  → mediaTypes 옵션이 ImagePicker.MediaTypeOptions에서 MediaType로 변경됨 (SDK 버전 주의)
  → 웹에서 asset.uri가 data URI 또는 blob URL → `uri.split('.').pop()`으로 확장자 추출 불가
  → 반드시 `asset.mimeType`에서 contentType/확장자 결정, `fetch(uri).blob()` → ArrayBuffer 변환 후 업로드
  → 파일 크기 제한: asset.fileSize (가능하면) + blob.size 이중 체크, 2MB 초과 시 PROFILE_003 에러
- expo-notifications: 웹에서는 지원 안 됨 → 모든 함수에 Platform.OS === 'web' early return 필수
  → settingsStore에서 동적 import('@/lib/notifications')로 웹 번들에서 제외
  → Android는 NotificationChannel 필수 (checkin-reminders), iOS는 자동
- 알림 스케줄링: SchedulableTriggerInputTypes.DAILY 사용 시 cancelAllScheduledNotificationsAsync() 먼저 호출
  → 중복 스케줄 방지, 시간 변경 시에도 기존 알림 제거 후 재등록
- Supabase auth.resend(): type: 'signup'으로 호출해야 회원가입 인증 메일 재전송
  → 쿨다운 없이 연속 호출 시 rate limit 발생 가능 → 클라이언트에서 60초 쿨다운 적용
- profiles 테이블: username은 반드시 lowercase로 저장 → insert 시 username.toLowerCase() 필수
  → DB 제약조건으로 ^[a-zA-Z0-9_]{3,20}$ 포맷 강제 (대소문자 허용하지만 저장은 소문자)
- SECURITY DEFINER 함수: get_email_by_username, get_username_by_email, is_username_available
  → auth.users에 직접 접근해야 하므로 SECURITY DEFINER 필수, search_path = public 설정으로 스키마 고정
- loadUserData 2단계: user_metadata는 동기 set, profiles 데이터는 비동기 fetch 후 set
  → profiles fetch 실패(회원가입 직후 등)해도 userDataLoaded: true 설정해서 라우팅 차단하지 않음
- Supabase .single().then(): PromiseLike 타입이라 .catch() 없음 → .then() 내에서 error 체크
- EditModal async onSave: onSave가 throw하면 모달 유지, 정상이면 onClose() 호출
  → 서버 에러 시 사용자가 재시도 가능
- Supabase auth.signUp + 이메일 인증(Confirm Email) ON:
  → session이 null로 반환됨 → auth.uid()가 null이라 RLS 보호 테이블에 INSERT 불가
  → 해결: user_metadata에 pendingUsername/pendingPhone 임시 저장 → 이메일 인증 후 첫 로그인 시 loadUserData에서 profiles 생성
- Supabase auth.signUp 중복 이메일 (이메일 인증 ON + 미인증 사용자):
  → 에러 없이 "가짜" 응답 반환 (email enumeration 방지), data.user.identities === []
  → identities.length === 0 체크로 "이미 등록된 이메일" 에러 표시 필요
- Supabase auth rate limit: signUp 반복 호출 시 429 Too Many Requests (email rate limit exceeded)
  → 테스트 시 새 이메일 사용하거나 Supabase 대시보드에서 rate limit 조정
- 리브랜딩 (v0.4): AsyncStorage 키가 @reflectlog/ → @miriel/ 로 변경됨
  → 기존 테스트 기기에서 테마/언어 설정 초기화됨 (새 키로 저장되므로 이전 값 읽지 못함)
- 에러 처리: AppError는 생성자에서 i18n.t()로 메시지 번역 → i18n이 초기화된 후에만 정확한 메시지 반환
  → app/_layout.tsx에서 '@/i18n' import가 최상단에 있으므로 문제 없음
- 에러 처리: catch 블록에서 error 타입을 `unknown`으로 변경 후 showErrorAlert에 전달
  → showErrorAlert 내부에서 instanceof AppError 체크로 코드 유무 자동 판별
- 에러 코드 추가 시: errors.json(ko+en) + error-codes.md + API/스토어에서 throw new AppError('CODE') 3곳 동시 수정 필수
- Setup 플로우 라우팅: hasCompletedSetup 체크가 라우팅 가드에서 최우선 → setup 미완료 시 auth/onboarding 라우팅 무시
  → completeSetup()의 Zustand set()은 동기이므로 router.replace 전에 가드가 새 값을 인식 → setup으로 되돌아오지 않음
- Setup vs Onboarding: setup은 로그인 전(디바이스 레벨, AsyncStorage), onboarding은 로그인 후(계정 레벨, user_metadata)
  → setup에서는 Supabase 호출 불가 (미로그인), onboarding에서는 user_metadata 사용
- 온보딩 알림 설정: 로컬 state로 모은 뒤 Step 3 완료 시 saveNotificationSettings()로 배치 저장
  → 개별 저장 시 user_metadata last-write-wins 문제 발생 (savePersona와 동일 패턴)
- expo-notifications WEEKLY trigger: weekday 값이 1=Sun..7=Sat (ISO와 다름)
  → 우리 컨벤션 0=Mon..6=Sun에서 변환: (day + 2) % 7 || 7
- 웹 알림 (webNotifications.ts): Notification API는 탭이 열려 있을 때만 동작
  → 30초 간격 폴링, lastFiredKey로 동일 시간대 중복 발사 방지
  → typeof Notification === 'undefined' 가드 필수 (SSR/Node 환경)
- 일일 기록 제한: useTodayEntry()가 로딩 중이면 LoadingState 표시 필수
  → 체크 완료 전에 UI 렌더링하면 새 기록 폼이 잠깐 보였다가 리다이렉트됨
- autoEdit 파라미터: useLocalSearchParams에서 string으로 전달됨
  → 'true' === 'true' 문자열 비교, autoEditApplied 플래그로 1회만 적용 (무한 루프 방지)
- 주간 회고 제한: getMonday()로 현재 주 월요일 계산 시 getDay()가 0(일요일)인 경우 -6 보정 필요
  → day === 0 ? -6 : 1 로 처리
```

---

## 📝 변경 로그

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-02-02 | v0.1 | 프로젝트 초기 셋업 — 문서 작성, MVP 범위 확정, Expo 전환, Phase R1~R2 완료 | Chris |
| 2026-02-03 | v0.2 | Phase R3.5~R4 — i18n, 설정+다크모드, 온보딩, 페르소나, 프로필, UX 폴리시, AI 문서화 | Chris |
| 2026-02-03 | v0.3 | Phase R4 계속 — ID 기반 인증 전환, 아이디/비밀번호 찾기, 계정 정보 수정 | Chris |
| 2026-02-04 | v0.4 | 리브랜딩 + 에러 코드 시스템 + 비밀번호 확인 (ReflectLog→Miriel, AppError 33코드, 회원가입 UX 개선) | Chris |
| 2026-02-04 | v0.5 | 초기 설정 플로우 (첫 실행 시 언어→테마→환영 3단계, setup i18n, 라우팅 가드 확장) | Chris |
| 2026-02-04 | v0.6 | 온보딩 리디자인 + 알림 확장 + 기록/회고 제한 + 웹 알림 | Chris |
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

#### i18n (다국어)
- i18next + react-i18next + expo-localization 설치, 시스템 로케일 자동 감지
- 10개 네임스페이스 × 2개 언어(ko/en) = 20 JSON 파일
- 전체 UI 문자열 (~30 파일) 한국어 하드코딩 → `t()` 함수 전환

#### 설정 + 다크 모드 + 개인정보
- settingsStore (Zustand): 테마/언어는 AsyncStorage, 계정별 데이터는 Supabase user_metadata
- 설정 화면: 언어/테마 SegmentedControl, 계정 정보, 개인정보 고지, 지원 링크(커뮤니티/문의/이용약관/개인정보처리방침)
- 다크 모드 전체 적용 (~30 파일): NativeWind `dark:` + React Navigation JS 조건부 스타일
- PrivacyNotice 컴포넌트 (배너/인라인), AI 출력 스키마 (ProcessedEntry)
- 개발자 문서 8개 (`docs/` 폴더)

#### 온보딩 + 페르소나
- 3스텝 온보딩 가이드 (빠른 기록 → AI 정리 → 리텐션 습관)
- 페르소나 수집 화면 (닉네임/성별/직업/관심사) — 온보딩 후 진입
- 데모 데이터 생성기 (22 Entry + 12 Summary + 15 Todo)

#### 탭 리팩토링 + 프로필
- 일간요약 + 주간회고 → 통합 "요약" 탭 (Daily/Weekly SegmentedControl 토글)
- 프로필 탭: 아바타 + 페르소나 칩 + 성취 현황 (스트릭/레벨/할일달성률/배지)
- 프로필 편집 화면: 아바타 업로드(expo-image-picker)/삭제, 페르소나 수정
- Write Today FAB (모바일 플로팅 버튼)
- 공유 컴포넌트 추출 (SegmentedControl, EditModal, TodoCompletionCard)

#### 인증 + 사용자 데이터
- 이메일 인증 안내 화면 (회원가입 → verify-email)
- 사용자 데이터 Supabase user_metadata 마이그레이션 (계정별 서버 저장)
- savePersona() 배치 저장 (updateUser 동시성 문제 해결)

#### UX 폴리시
- Enter-to-submit (로그인/회원가입/채팅), Shift+Enter 줄바꿈
- 다크모드 보완 (FontAwesome 아이콘, MasterDetail 디테일 패인 등 8파일)
- 탭바 높이/패딩 조정 (글자 잘림 해결), 헤더 border 제거
- 설정 EditModal 팝업 패턴

#### AI 기능 문서화
- `docs/ai-features.md`: Edge Function 4개 스펙, 파이프라인 다이어그램, 미구현 기능 목록

#### 로컬 푸시 알림
- expo-notifications + expo-device 설치, app.json 플러그인 설정
- `src/lib/notifications.ts`: 알림 서비스 모듈 (핸들러/채널/권한/스케줄/취소)
- settingsStore에 알림 3개 필드 + 3개 액션 추가 (user_metadata 저장)
- 설정 화면 Notifications 섹션 (Switch 토글 + TimePickerModal 시간 선택)
- `app/_layout.tsx`에서 앱 시작 시 알림 핸들러 초기화 + 저장된 설정 복원
- 웹에서는 알림 섹션 숨김 (Platform.OS !== 'web')

#### 이메일 인증 재전송
- `verify-email.tsx`: supabase.auth.resend() + 60초 쿨다운 타이머 + 성공/실패 Alert
- auth.json에 재전송 관련 i18n 키 6개 추가 (ko/en)

</details>

<details>
<summary>v0.3 상세 이력 (클릭하여 펼치기)</summary>

#### ID 기반 인증 전환
- 이메일 로그인 → username(아이디) 기반 로그인으로 전환
- `profiles` 테이블 신설 (username + phone, RLS, unique constraint, format check)
- SECURITY DEFINER RPC 함수 3개: `get_email_by_username`, `get_username_by_email`, `is_username_available`
- `authStore`: `signIn(username, password)` — RPC로 email 조회 후 signInWithPassword
- `authStore`: `signUp({ username, email, phone, password })` — 이메일 인증 ON/OFF 양쪽 지원
  - 이메일 인증 OFF: 즉시 profiles.insert → 자동 라우팅
  - 이메일 인증 ON: user_metadata에 pendingUsername/Phone 저장 → verify-email 이동 → 인증 후 첫 로그인 시 loadUserData에서 profiles 자동 생성
- 중복 이메일 감지: `identities.length === 0` 체크로 이미 등록된 이메일 에러 표시
- 회원가입 화면: 4개 필드 (username/email/phone/password), ref 체인, 유효성 검사

#### 아이디/비밀번호 찾기
- `find-id.tsx`: 이메일 입력 → `get_username_by_email` RPC → Alert으로 username 표시
- `find-password.tsx`: 아이디 또는 이메일 입력 → email 해석 → `resetPasswordForEmail` → 마스킹된 이메일 표시
- 로그인 화면에 "아이디 찾기 | 비밀번호 찾기" 링크 추가

#### 계정 정보 수정 (설정 화면)
- Account 섹션 확장: 아이디(읽기전용) / 닉네임 / 이메일 / 전화번호 / 비밀번호 변경 / 로그아웃
- `settingsStore`: `setPhone()` (profiles 테이블), `setEmail()` (auth.updateUser), `changePassword()` (auth.updateUser)
- `EditModal` 확장: `secureTextEntry` prop + async `onSave` (throw 시 모달 유지)

#### 프로필 데이터 연동
- `settingsStore.loadUserData(metadata, userId)`: user_metadata + profiles 테이블 병렬 로드
- `profile.tsx` / `edit-profile.tsx`: `displayName` fallback을 `nickname || username || '?'`로 변경
- 프로필 탭: 이메일 대신 `@username` 표시

#### i18n
- `auth.json` (ko/en): login/signup 섹션 username 기반 키로 교체, findId/findPassword 섹션 추가
- `settings.json` (ko/en): account 섹션에 username/phone/password/emailChanged 등 키 추가

</details>

<details>
<summary>v0.4 상세 이력 (클릭하여 펼치기)</summary>

#### 프로젝트 리브랜딩 (ReflectLog → Miriel)
- 전체 코드베이스에서 ReflectLog/reflectlog 를 Miriel/miriel로 일괄 변경 (18개 파일)
- `app.json`: name, slug, scheme 변경
- `package.json` / `package-lock.json`: 패키지 name 변경
- `login.tsx`: 로그인 화면 브랜드명
- `settings.tsx`: 지원 링크 URL 4개 (homepage/telegram/discord/x)
- `settingsStore.ts`: AsyncStorage 키 prefix (`@reflectlog/` → `@miriel/`)
- i18n: common.json(brand), auth.json(tagline), legal.json(이용약관/개인정보처리방침/이메일) — ko/en 모두
- docs: data-model.md, ai-features.md, dark-mode.md
- SQL: 001_initial_schema.sql 주석
- CLAUDE.md, README.md: 프로젝트 제목

#### 에러 코드 시스템
- `src/lib/errors.ts`: `AppError` 클래스 (code + i18n 자동 매핑) + `showErrorAlert()` 유틸리티
- `src/components/ui/ErrorDisplay.tsx`: 풀스크린 인라인 에러 컴포넌트 (아이콘 + 메시지 + 에러 코드)
- `src/i18n/locales/{ko,en}/errors.json`: 33개 에러 코드별 사용자 친화적 메시지 (한국어/영어)
- `src/i18n/index.ts`: `errors` 네임스페이스 등록
- `docs/error-codes.md`: CS 대응용 에러 코드 레퍼런스 문서
- API 레이어: `entry/api.ts`(7), `todo/api.ts`(5), `summary/api.ts`(3) → `AppError` 전환
- 스토어: `authStore.ts`(10), `settingsStore.ts`(3), `avatar.ts`(1) → `AppError` 전환
- UI: auth 5개 + settings + edit-profile + entries/new + EntryDetail → `showErrorAlert` 적용
- 인라인 에러: `todos.tsx`, `summary.tsx`, `[id].tsx` → `ErrorDisplay` 컴포넌트 전환

#### 회원가입 비밀번호 확인
- `signup.tsx`: 비밀번호 확인 필드 추가 (2회 입력 + 불일치 검증)
- `auth.json` (ko/en): `confirmPassword`, `confirmPasswordPlaceholder`, `alertPasswordMismatch` 키 추가

</details>

<details>
<summary>v0.5 상세 이력 (클릭하여 펼치기)</summary>

#### 초기 설정 플로우 (First-Time Setup)
- `app/(setup)/_layout.tsx`: Setup Stack 레이아웃 (headerShown: false)
- `app/(setup)/index.tsx`: 1단계 — 언어 선택 (한국어/English 카드, 시스템 감지 기본값, 선택 즉시 `setLanguage()` 호출로 실시간 전환)
- `app/(setup)/theme.tsx`: 2단계 — 테마 선택 (Light/Dark 카드, 선택 즉시 `setTheme()` 호출로 실시간 전환)
- `app/(setup)/welcome.tsx`: 3단계 — 환영 화면 (Miriel 브랜딩, "계정 만들기" primary + "이미 계정이 있어요" outlined 버튼)
- `src/i18n/locales/{ko,en}/setup.json`: setup 네임스페이스 번역 파일 (language/theme/welcome/next)
- `src/i18n/index.ts`: `setup` 네임스페이스 등록
- `src/stores/settingsStore.ts`: `hasCompletedSetup` 플래그 (AsyncStorage `@miriel/hasCompletedSetup`), `initialize()`에서 함께 읽기, `completeSetup()` 액션 추가, `clearUserData()`에서 리셋하지 않음
- `app/_layout.tsx`: 라우팅 가드에 setup 체크 최우선 추가, `(setup)` Stack.Screen 등록, AppShell 래핑에서 setup 제외

</details>

<details>
<summary>v0.6 상세 이력 (클릭하여 펼치기)</summary>

#### 온보딩 리디자인
- `app/(onboarding)/index.tsx`: 전체 리라이트 — 3스텝 인터랙티브 온보딩
  - Step 1: 성장 사이클 교육 (🔄 아침 할일 → 저녁 기록 → AI 정리 → 반복)
  - Step 2: 주간 회고 요일/시간 선택 (📅 7 칩 + TimePickerModal)
  - Step 3: 알림 시간 설정 + 권한 요청 (🔔 아침/저녁 시간 + 네이티브/웹 권한)
- `app/(onboarding)/persona.tsx`: 네비게이션 타겟 `/(tabs)` → `/(onboarding)/complete`로 변경
- `app/(onboarding)/complete.tsx`: 신규 — 설정 완료 축하 + 알림 요약 표시 + "기록 시작" CTA
- `app/(onboarding)/_layout.tsx`: `complete` 스크린 추가

#### settingsStore 확장
- `weeklyReviewDay` (0=Mon..6=Sun), `weeklyReviewTime` ("HH:mm") 필드 추가
- `setWeeklyReviewDay()`, `setWeeklyReviewTime()`: 개별 업데이트 + 리스케줄링
- `saveNotificationSettings()`: 온보딩에서 5개 필드 배치 저장 (user_metadata)
- `setNotificationsEnabled()`: 웹에서도 동작하도록 수정 (webNotifications 호출)
- `rescheduleAllNotifications()` 헬퍼: 플랫폼별 알림 일괄 재스케줄링

#### 알림 시스템 확장
- `src/lib/notifications.ts`: `scheduleAllNotifications()` — DAILY(아침/저녁) + WEEKLY(주간 회고) trigger
  - expo-notifications weekday 변환: (ourDay + 2) % 7 || 7
  - 기존 `scheduleNotifications()` 하위호환 유지
- `src/lib/webNotifications.ts`: 신규 — Web Notification API 래퍼
  - `requestWebPermission()`: 브라우저 알림 권한 요청
  - `scheduleWebNotifications()`: 30초 폴링, 아침/저녁/주간 시간 매칭 시 알림
  - `cancelWebNotifications()`: 인터벌 클리어
  - `showWebNotification()`: new Notification(title, { body })
- `app/_layout.tsx`: 앱 시작 시 알림 복원에 웹 분기 추가

#### 일일 기록 1회 제한
- `src/features/entry/hooks.ts`: `useTodayEntry()` 훅 — 오늘 날짜 entries 조회, 첫 번째 반환
- `app/entries/new.tsx`: todayEntry 존재 시 `router.replace(/entries/${id}?autoEdit=true)` 리다이렉트
- `app/entries/[id].tsx`: `autoEdit` 파라미터 지원 — 자동 편집 모드 진입 (1회만)

#### 주간 회고 1회 제한
- `app/(tabs)/summary.tsx`: `getMonday()` 유틸 + 이번 주 회고 존재 시 버튼 disabled + 라벨 변경

#### 설정 화면 업데이트
- `app/settings.tsx`: Notifications 섹션에 주간 회고 하위 섹션 추가 (요일/시간)
- `src/components/ui/DayPickerModal.tsx`: 신규 — 7개 요일 세로 리스트 선택 모달 (TimePickerModal 패턴)

#### i18n (8 파일)
- `onboarding.json` (ko/en): 스텝 내용 교체 + complete 섹션 + 알림/주간회고 키
- `settings.json` (ko/en): 주간 회고 섹션 + 요일 이름 (days/daysShort) + 알림 제목/본문
- `entry.json` (ko/en): 일일 제한 메시지 (alreadyRecordedToday, redirectingToEdit)
- `summary.json` (ko/en): 주간 제한 메시지 (alreadyGenerated, alreadyGeneratedDesc)

</details>

