# Analytics & Retention Tracking

## Overview

서버사이드 이벤트 트래킹 + 프론트엔드 `app_open` 트래킹 + 관리자 조회 API로 구성된 경량 analytics 시스템. VC 피칭에 필요한 DAU/WAU/MAU, 코호트 리텐션(D1/D7/D30), 활성화율, 기능 사용률 지표를 제공한다.

**설계 원칙**: 핵심 기능에 절대 영향 없음 (non-blocking `waitUntil()`, silent failure)

---

## 인증

모든 관리자 조회 엔드포인트는 `ANALYTICS_SECRET` 기반 인증이 필요하다.

```
# Query parameter 방식
GET /analytics/overview?secret=YOUR_SECRET

# Header 방식
GET /analytics/overview
X-Analytics-Secret: YOUR_SECRET
```

- 로컬: `.dev.vars`의 `ANALYTICS_SECRET`
- 프로덕션: `npx wrangler secret put ANALYTICS_SECRET`

---

## 엔드포인트

### GET /analytics/overview

총 유저, 활성화율, DAU/WAU/MAU 스냅샷.

```bash
curl "https://api.miriel.app/analytics/overview?secret=SECRET"
```

```json
{
  "total_users": 150,
  "activated_users": 89,
  "activation_rate": 59,
  "dau": 23,
  "wau": 67,
  "mau": 89,
  "date": "2026-02-18"
}
```

| 필드 | 의미 |
|------|------|
| `total_users` | 가입한 전체 유저 수 |
| `activated_users` | 엔트리를 1개 이상 작성한 유저 수 |
| `activation_rate` | activated / total × 100 (%) |
| `dau` | 오늘 이벤트가 1건 이상 있는 유저 수 |
| `wau` | 최근 7일 이벤트가 있는 유저 수 |
| `mau` | 최근 30일 이벤트가 있는 유저 수 |

---

### GET /analytics/dau?days=30

DAU 시계열 데이터. `days` 파라미터로 기간 조절 (최대 90일).

```bash
curl "https://api.miriel.app/analytics/dau?secret=SECRET&days=14"
```

```json
{
  "days": 14,
  "series": [
    { "date": "2026-02-05", "dau": 12, "wau_approx": 45 },
    { "date": "2026-02-06", "dau": 15, "wau_approx": 52 },
    ...
  ]
}
```

| 필드 | 의미 |
|------|------|
| `dau` | 해당 날짜의 일간 활성 유저 수 |
| `wau_approx` | 해당 날짜 기준 7일간 DAU 합산 (근사치) |

> `wau_approx`는 정확한 distinct count가 아닌 일별 DAU 합산이므로, 같은 유저가 여러 날 접속하면 중복 카운트된다. 추세 파악용으로 사용.

---

### GET /analytics/retention

주간 코호트별 D1/D7/D30 리텐션.

```bash
curl "https://api.miriel.app/analytics/retention?secret=SECRET"
```

```json
{
  "cohorts": [
    {
      "week": "2026-02-03",
      "cohort_size": 25,
      "d1": 18, "d7": 12, "d30": 7,
      "d1_rate": 72, "d7_rate": 48, "d30_rate": 28
    },
    {
      "week": "2026-02-10",
      "cohort_size": 30,
      "d1": 22, "d7": 15, "d30": 0,
      "d1_rate": 73, "d7_rate": 50, "d30_rate": 0
    }
  ]
}
```

| 필드 | 의미 |
|------|------|
| `week` | 코호트 기준 주 시작일 (월요일) |
| `cohort_size` | 해당 주에 가입한 유저 수 |
| `d1` / `d1_rate` | 가입 다음 날 다시 접속한 유저 수 / 비율(%) |
| `d7` / `d7_rate` | 가입 7일 후 접속한 유저 수 / 비율(%) |
| `d30` / `d30_rate` | 가입 30일 후 접속한 유저 수 / 비율(%) |

> D30은 가입 후 30일이 지나야 유의미한 값이 나온다. 그 전까지는 0.

**VC 피칭 시 읽는 법**:
- D1 > 40%: 첫 경험이 좋음 (onboarding 성공)
- D7 > 20%: 주간 습관 형성 가능성
- D30 > 10%: 제품-시장 적합(PMF) 시그널

---

### GET /analytics/funnel

가입 → 활성화 → 리텐션 → 파워유저 퍼널 + 기능별 사용자 수.

```bash
curl "https://api.miriel.app/analytics/funnel?secret=SECRET"
```

```json
{
  "funnel": {
    "signup": 150,
    "activated": 89,
    "retained": 34,
    "power_users": 12
  },
  "features": {
    "entry_created": 85,
    "summary_viewed": 72,
    "summary_generated": 65,
    "weekly_generated": 28,
    "monthly_generated": 8,
    "chat_message": 45,
    "tagging": 60,
    "todo_completed": 38
  }
}
```

**퍼널 단계 정의**:

| 단계 | 조건 |
|------|------|
| `signup` | 가입 완료 |
| `activated` | 엔트리 1개 이상 작성 |
| `retained` | 3일 이상 활동 기록 (서로 다른 날짜) |
| `power_users` | 최근 7일 이벤트 10건 이상 |

**기능 사용률**: 해당 기능을 1회 이상 사용한 unique 유저 수 (전체 기간 누적).

---

### POST /analytics/track

클라이언트(프론트엔드)에서 `app_open` 이벤트를 전송. authMiddleware 필요.

```bash
curl -X POST "https://api.miriel.app/analytics/track" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"app_open"}'
```

- `app_open` 이벤트만 허용 (다른 이벤트는 400)
- 프론트엔드 `_layout.tsx`에서 하루 1회 자동 전송 + foreground 복귀 시 재전송

---

## 추적 이벤트 목록

| 이벤트 | 발생 시점 | 위치 |
|--------|----------|------|
| `signup` | 회원가입 완료 | `routes/auth.ts` |
| `login` | 로그인 성공 | `routes/auth.ts` |
| `app_open` | 앱 열기 / foreground 복귀 | `app/_layout.tsx` → `POST /analytics/track` |
| `entry_created` | 엔트리 생성 | `routes/entries.ts` |
| `entry_updated` | 엔트리 수정 | `routes/entries.ts` |
| `entry_deleted` | 엔트리 삭제 | `routes/entries.ts` |
| `summary_viewed` | 요약 목록 조회 | `routes/summaries.ts` |
| `summary_generated` | 일간 요약 생성 | `routes/ai.ts` |
| `weekly_generated` | 주간 리뷰 생성 | `routes/ai.ts` |
| `monthly_generated` | 월간 리뷰 생성 | `routes/ai.ts` |
| `chat_message` | AI 채팅 응답 | `routes/ai.ts` |
| `tagging` | 자동 태깅 실행 | `routes/ai.ts` |
| `todo_completed` | 할 일 완료 처리 | `routes/todos.ts` |

---

## DB 스키마

```sql
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event TEXT NOT NULL,
  properties TEXT DEFAULT '{}',   -- JSON, 이벤트별 추가 데이터
  created_at TEXT NOT NULL
);

-- 인덱스
idx_ae_user_created  (user_id, created_at)  -- 유저별 이벤트 조회
idx_ae_event_created (event, created_at)    -- 이벤트별 시계열
idx_ae_created       (created_at)           -- 오래된 데이터 정리용
```

- `user_id`에 FK 없음 — 계정 삭제 후에도 집계용 orphan 이벤트 허용
- 계정 삭제 시 해당 유저의 `analytics_events`도 함께 삭제됨

---

## 배포 체크리스트

```bash
# 1. 마이그레이션 적용
cd worker && npx wrangler d1 migrations apply miriel-db --remote

# 2. Worker 배포
npx wrangler deploy

# 3. Secret 설정 (최초 1회)
npx wrangler secret put ANALYTICS_SECRET

# 4. 프론트엔드 빌드/배포
cd .. && scripts/deploy.sh
```

---

## 데이터 정리 (향후)

90일 이상 오래된 이벤트 정리가 필요할 경우:

```sql
DELETE FROM analytics_events WHERE created_at < date('now', '-90 days');
```

`idx_ae_created` 인덱스가 이 쿼리를 효율적으로 지원한다.
