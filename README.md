# ReflectLog

내가 쓴 기록을 바탕으로, AI가 '근거 링크'가 있는 회고를 정리해주는 저널

## 기술 스택

- **Framework**: Expo (React Native) + Expo Router + TypeScript
- **스타일링**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (이메일/비밀번호)
- **AI**: OpenAI API (GPT-4o) - 요약/태깅/할일 추출
- **상태관리**: React Query (서버 상태) + Zustand (클라이언트 상태)
- **플랫폼**: PC(웹) + iOS + Android 단일 코드베이스

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 채워주세요.

```
EXPO_PUBLIC_SUPABASE_URL=<Supabase 프로젝트 URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
```

> Supabase credentials는 팀 내부 채널을 통해 공유받으세요.
> OpenAI API 키는 Supabase Edge Functions의 환경변수로 설정합니다.

### 3. DB 스키마 설정

Supabase 대시보드 > SQL Editor에서 아래 파일을 순서대로 실행해주세요.

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_sentences_data.sql
```

### 4. Supabase Auth 설정

Supabase 대시보드 > Authentication > Providers > Email에서 **Confirm email**을 OFF로 설정해주세요.

### 5. 개발 서버 실행

```bash
# 플랫폼 선택 메뉴 (w: 웹, i: iOS, a: Android)
npx expo start

# 또는 직접 플랫폼 지정
npx expo start --web
npx expo start --ios
npx expo start --android
```

## 프로젝트 구조

```
app/                              # Expo Router (파일 기반 라우팅)
├── _layout.tsx                   # 루트 레이아웃 (인증 분기)
├── (auth)/                       # 인증 화면
│   ├── login.tsx                 # 로그인
│   └── signup.tsx                # 회원가입
├── (tabs)/                       # 탭 네비게이션 (메인 앱)
│   ├── _layout.tsx               # 탭 설정 (4개 탭)
│   ├── index.tsx                 # 타임라인
│   ├── summary.tsx               # 일간 요약
│   ├── weekly.tsx                # 주간 회고
│   └── todos.tsx                 # 할 일 목록
└── entries/                      # 기록 상세/작성
    ├── new.tsx                   # 새 기록 (챗봇 + 빠른 입력)
    └── [id].tsx                  # 기록 상세 (편집/삭제)

src/
├── components/
│   ├── layout/                   # 반응형 레이아웃
│   │   ├── AppShell.tsx          # 앱 래퍼 (사이드바/탭 자동 전환)
│   │   ├── MasterDetailLayout.tsx # Desktop 2패널 레이아웃
│   │   └── SidebarNav.tsx        # Desktop 사이드바 네비게이션
│   ├── ui/                       # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingState.tsx
│   ├── EntryCard.tsx             # 타임라인 카드
│   ├── EntryDetail.tsx           # 기록 상세 뷰
│   ├── SummaryDetailView.tsx     # 요약 상세 (일간/주간 공유)
│   ├── EvidenceChip.tsx          # 근거 링크 칩
│   └── TodoItem.tsx              # 할 일 아이템
├── features/                     # 기능별 API + hooks
│   ├── entry/                    # 기록 (types, api, hooks)
│   ├── summary/                  # 요약 (types, api, hooks)
│   └── todo/                     # 할 일 (types, api, hooks)
├── hooks/
│   └── useResponsiveLayout.ts    # 반응형 분기 (isDesktop/isMobile)
├── lib/
│   ├── supabase.ts               # Supabase 클라이언트 초기화
│   └── constants.ts              # 체크인 질문 상수
└── stores/
    ├── authStore.ts              # 인증 상태 (Zustand)
    └── chatStore.ts              # 챗봇 상태 (Zustand)

supabase/
├── migrations/                   # DB 스키마
│   ├── 001_initial_schema.sql    # entries, summaries, todos + RLS
│   └── 002_add_sentences_data.sql # summaries에 sentences_data JSONB 추가
└── functions/                    # Edge Functions (Deno)
    ├── tagging/                  # 자동 태깅 (프로젝트/사람/이슈 추출)
    ├── generate-summary/         # 일간 요약 생성 + 문장별 근거 링크
    ├── generate-weekly/          # 주간 회고 생성 + 근거 링크
    └── extract-todos/            # 할 일 자동 추출
```

## 주요 기능

- **챗봇 기록 작성**: 아침/저녁 체크인 질문으로 3분 안에 기록 완성 + 빠른 입력 모드
- **자동 태깅**: 프로젝트/사람/이슈 자동 추출 (AI)
- **일간 요약**: AI가 하루 기록을 요약 + 문장별 근거 링크(EvidenceChip)
- **주간 회고**: 한 주 핵심 3~5개 포인트 + 근거 링크
- **할 일 추출**: 기록에서 action item 자동 추출 + 완료 관리 + 근거 Entry 링크
- **반응형 레이아웃**: Desktop(사이드바 + 2패널) / Mobile(하단 탭) 자동 전환
- **기록 관리**: 기록 상세 보기, 편집, 삭제 + 관련 할일/요약 표시

## 반응형 레이아웃

| 환경 | 네비게이션 | 레이아웃 |
|------|-----------|---------|
| Desktop (1024px+) | 좌측 사이드바 | MasterDetail 2패널 |
| Mobile (~1023px) | 하단 탭 바 | 단일 패널 (풀 스크린) |
