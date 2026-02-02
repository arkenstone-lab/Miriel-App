# ReflectLog

내가 쓴 기록을 바탕으로, AI가 근거 링크가 있는 회고를 정리해주는 저널

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (이메일/비밀번호)
- **AI**: OpenAI API (GPT-4o) - 요약/태깅용 (없으면 mock fallback)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사하여 `.env.local`을 만들고 값을 채워주세요.

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=<Supabase 프로젝트 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
OPENAI_API_KEY=<OpenAI API 키 (선택사항)>
```

> Supabase credentials는 팀 내부 채널을 통해 공유받으세요.
> OpenAI API 키가 없어도 mock 태깅/요약으로 동작합니다.

### 3. DB 스키마 설정

Supabase 대시보드 > SQL Editor에서 아래 파일을 실행해주세요.

```
supabase/migrations/001_initial_schema.sql
```

### 4. Supabase Auth 설정

Supabase 대시보드 > Authentication > Providers > Email에서 **Confirm email**을 OFF로 설정해주세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── auth/          # 로그인, 회원가입, OAuth 콜백
│   ├── entries/       # 타임라인, 새 기록, 기록 상세
│   ├── summary/       # 일간 요약
│   ├── weekly/        # 주간 회고
│   ├── todos/         # 할 일 목록
│   └── api/           # entries, summaries, tagging, todos
├── features/
│   ├── entry/         # Entry 타입, API, hooks, 컴포넌트
│   ├── summary/       # Summary 타입, API, hooks, 컴포넌트
│   └── todo/          # Todo 타입, API, hooks, 컴포넌트
├── lib/
│   ├── supabase/      # 클라이언트/서버/미들웨어 유틸
│   ├── openai.ts      # AI 태깅/요약/할일 추출 (mock fallback 포함)
│   └── constants.ts   # 체크인 질문
├── components/        # Providers, Header
└── stores/            # Zustand (챗봇 상태)
```

## 주요 기능

- **챗봇 기록 작성**: 아침/저녁 체크인 질문으로 3분 안에 기록 완성
- **자동 태깅**: 프로젝트/사람/이슈 자동 추출 (AI 또는 mock)
- **일간 요약**: AI가 하루 기록을 3문장 요약 + 근거 링크
- **주간 회고**: 한 주 핵심 3~5개 포인트 + 근거 링크
- **할 일 추출**: 기록에서 action item 자동 추출 + 완료 관리
