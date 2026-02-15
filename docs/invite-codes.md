# 가입 코드 관리

## 현재 상태

- **활성화 여부**: `api.miriel.app/health` 응답의 `invite_required` 필드로 확인
- 코드가 설정되어 있으면 회원가입 Step 1에 가입 코드 입력 필드가 자동 표시됨
- 코드가 없으면 누구나 자유롭게 가입 가능

## 명령어

모든 명령어는 `worker/` 디렉토리에서 실행합니다.

```bash
# 코드 설정 (단일)
echo "mycode" | npx wrangler secret put INVITE_CODES --name miriel-api

# 코드 설정 (복수 — 쉼표 구분)
echo "code1,code2,code3" | npx wrangler secret put INVITE_CODES --name miriel-api

# 가입 코드 비활성화 (누구나 가입 가능)
npx wrangler secret delete INVITE_CODES --name miriel-api
```

## 동작 방식

- 대소문자 구분 없음 (`ARKENSTONE` = `arkenstone`)
- 코드는 횟수 제한 없이 재사용 가능 (1회용 아님)
- 코드 변경 시 즉시 반영 (Worker 재배포 불필요)

## 주의사항

- 이 문서와 실제 코드 값은 외부에 공개하지 않음
- 코드 변경 시 기존 사용자에게는 영향 없음 (가입 시점에만 검증)
