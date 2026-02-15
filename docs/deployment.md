# Deployment Guide

## Architecture

```
miriel-dev (source code)
    |  bash scripts/deploy.sh
    v
  dist/ (static build output)
    |  git push --force
    v
miriel-live (GitHub repo, build artifacts only)
    |  auto-detected by Cloudflare Pages
    v
miriel.app (live site)
```

- **API (Worker)**: `api.miriel.app` — Cloudflare Worker (Hono.js), `npx wrangler deploy`로 별도 배포
- **Frontend (Pages)**: `miriel.app` — Cloudflare Pages, `miriel-live` 레포 push 시 자동 배포

## Frontend Deploy

```bash
bash scripts/deploy.sh
```

이 스크립트 하나로 빌드부터 배포까지 완료됩니다.

### 스크립트 동작 (4단계)

| Step | 명령 | 설명 |
|------|------|------|
| 1/4 | `npx expo export --platform web` | Expo Web 정적 빌드 → `dist/` 생성 |
| 2/4 | `mv node_modules → vendor` + `sed` | Cloudflare Pages가 `node_modules/` 경로를 무시하므로 `vendor/`로 이름 변경 + JS/HTML/CSS 내 참조 경로 일괄 치환 |
| 3/4 | `git init` + `git commit` | `dist/` 내부에 임시 git repo 생성, 전체 파일 커밋 |
| 4/4 | `git push --force` | `miriel-live` 레포에 force push → Cloudflare Pages 자동 감지 → 배포 |

### node_modules → vendor 패치가 필요한 이유

Expo의 Metro 번들러가 `@expo/vector-icons`, `@react-navigation` 등의 에셋(폰트, 아이콘)을 빌드할 때 `dist/assets/node_modules/...` 경로로 출력합니다. 그런데 Cloudflare Pages는 `node_modules/` 디렉토리를 무조건 무시하기 때문에, 해당 경로의 파일을 요청하면 SPA fallback(`index.html`)이 반환됩니다.

이 문제를 해결하기 위해 빌드 후:
1. `dist/assets/node_modules/` → `dist/assets/vendor/`로 디렉토리 이름 변경
2. JS 번들, HTML, CSS 파일 내의 `/assets/node_modules/` 참조를 `/assets/vendor/`로 치환

### 소요 시간

- Expo 빌드: ~2초
- 패치 + git + push: ~5초
- Cloudflare Pages 배포: ~30초 (자동, 스크립트 종료 후 진행)

## API (Worker) Deploy

프론트엔드와 별도로 배포합니다.

```bash
cd worker
npx wrangler deploy
```

### Secrets 관리

```bash
npx wrangler secret put JWT_SECRET      # JWT 서명 키
npx wrangler secret put OPENAI_API_KEY  # OpenAI API 키
npx wrangler secret put RESEND_API_KEY  # Resend 이메일 API 키
npx wrangler secret put INVITE_CODES    # 가입 코드 (쉼표 구분)
```

### D1 마이그레이션

스키마 변경 시:

```bash
cd worker
npx wrangler d1 migrations apply miriel-db        # production
npx wrangler d1 migrations apply miriel-db --local # local dev
```

## Repos

| Repo | Visibility | 용도 |
|------|-----------|------|
| `miriel-dev` | Private | 소스 코드 (개발) |
| `Miriel-App` | Public | 소스 코드 (공개 쇼케이스) |
| `miriel-live` | Private | 빌드 결과물 (Cloudflare Pages 연결) |

### Push 규칙

- 소스 코드 변경: `miriel-dev`에 push 후 `sync-showcase.sh`로 공개 레포 동기화
- 라이브 배포: `bash scripts/deploy.sh` (miriel-live에 자동 push)
- Worker 배포: `cd worker && npx wrangler deploy`

## 공개 레포 동기화

`miriel-dev`(private)에는 내부 전용 문서가 포함되어 있어 `Miriel-App`(public)에 직접 push하면 안 됩니다.

```bash
# develop 동기화
bash scripts/sync-showcase.sh

# main도 동기화
git checkout main && bash scripts/sync-showcase.sh && git checkout develop
```

### 동작 방식

1. `.showcase-exclude`에 나열된 파일을 git 히스토리 전체에서 제거 (`git filter-branch`)
2. 정리된 히스토리를 `Miriel-App`에 force push

### 내부 전용 파일 추가

`.showcase-exclude` 파일에 경로를 한 줄씩 추가합니다.

```
docs/invite-codes.md
docs/another-internal.md
```

`#`으로 시작하는 줄은 주석으로 무시됩니다.

## Troubleshooting

### 아이콘/폰트가 안 보임
- `dist/assets/vendor/` 경로에 `.ttf` 파일이 있는지 확인
- `curl -I https://miriel.app/assets/vendor/@expo/vector-icons/...ttf` → Content-Type이 `font/ttf`여야 정상
- `text/html`이 반환되면 `_redirects` 또는 node_modules→vendor 패치 문제

### Cloudflare Pages 배포 안 됨
- `miriel-live` 레포에 push가 됐는지 확인
- Cloudflare Dashboard > Pages > miriel에서 deployment 상태 확인

### Worker 배포 실패
- `npx wrangler whoami`로 인증 상태 확인
- `npx wrangler deploy` 에러 메시지 확인
