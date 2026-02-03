# Error Codes Reference (CS 대응용)

이 문서는 Miriel 앱에서 사용되는 모든 에러 코드를 정리한 CS 대응용 레퍼런스입니다.
사용자가 오류 코드를 전달하면, 아래 표에서 코드를 검색하여 원인과 해결 방법을 안내하세요.

> 에러 형식: `(오류 코드: AUTH_001)` / `(Error code: AUTH_001)`

---

## AUTH — 인증 관련

| 코드 | 사용자 메시지 (KO) | 사용자 메시지 (EN) | 원인 | CS 해결 방법 |
|------|-------------------|-------------------|------|-------------|
| AUTH_001 | 아이디를 찾을 수 없습니다 | Username not found | 존재하지 않는 아이디로 로그인 시도 | 아이디 확인 요청, 아이디 찾기 안내 |
| AUTH_002 | 아이디 조회 중 오류 | Failed to look up username | 서버 RPC 호출 실패 | 재시도 안내, 지속 시 서버 상태 확인 |
| AUTH_003 | 비밀번호가 올바르지 않습니다 | Incorrect password | 비밀번호 불일치 | 비밀번호 확인, 비밀번호 찾기 안내 |
| AUTH_004 | 아이디 중복 확인 중 오류 | Failed to check username availability | 회원가입 시 아이디 중복 확인 쿼리 실패 | 재시도 안내, 지속 시 서버 상태 확인 |
| AUTH_005 | 이미 사용 중인 아이디 | Username already taken | 이미 등록된 아이디로 가입 시도 | 다른 아이디 사용 안내 |
| AUTH_006 | 회원가입 중 오류 | Sign up failed | auth.signUp 호출 실패 | 재시도 안내, 이메일 형식 확인, rate limit 가능 |
| AUTH_007 | 회원가입에 실패 | Sign up failed | 가입은 됐으나 유저 ID가 null | 재시도 안내, 지속 시 개발팀 에스컬레이션 |
| AUTH_008 | 이미 등록된 이메일 | Email already registered | 동일 이메일로 재가입 시도 | 로그인 안내 또는 다른 이메일 사용 |
| AUTH_009 | 프로필 생성 실패 | Failed to create profile | profiles 테이블 INSERT 실패 | 재시도, 지속 시 DB 확인 필요 |
| AUTH_010 | 로그아웃 실패 | Failed to sign out | auth.signOut 호출 실패 | 앱 재시작 안내 |
| AUTH_011 | 아이디 조회 실패 | Failed to find username | 아이디 찾기에서 RPC 조회 실패 | 이메일 주소 확인, 재시도 안내 |
| AUTH_012 | 계정 조회 실패 | Failed to find account | 비밀번호 찾기에서 계정 조회 실패 | 아이디/이메일 확인, 재시도 안내 |
| AUTH_013 | 재설정 이메일 전송 실패 | Failed to send reset email | resetPasswordForEmail 호출 실패 | 이메일 주소 확인, 재시도 안내 |
| AUTH_014 | 인증 이메일 재전송 실패 | Failed to resend verification | auth.resend 호출 실패 (rate limit 가능) | 60초 후 재시도 안내 |

---

## ENTRY — 기록 관련

| 코드 | 사용자 메시지 (KO) | 사용자 메시지 (EN) | 원인 | CS 해결 방법 |
|------|-------------------|-------------------|------|-------------|
| ENTRY_001 | 기록 목록을 불러오지 못함 | Failed to load entries | 기록 목록 SELECT 쿼리 실패 | 재시도, 네트워크 확인 안내 |
| ENTRY_002 | 기록을 불러오지 못함 | Failed to load entry | 기록 상세 조회 실패 (삭제된 기록 가능) | 기록 삭제 여부 확인, 재시도 안내 |
| ENTRY_003 | 로그인이 필요합니다 | Need to be logged in | 미인증 상태에서 기록 생성 시도 | 재로그인 안내 |
| ENTRY_004 | 기록 저장 실패 | Failed to save entry | entries INSERT 실패 | 재시도, 네트워크 확인 안내 |
| ENTRY_005 | 기록 수정 실패 | Failed to update entry | entries UPDATE 실패 | 재시도 안내 |
| ENTRY_006 | 기록 삭제 실패 | Failed to delete entry | entries DELETE 실패 | 재시도 안내 |
| ENTRY_007 | 자동 태깅 실패 | Auto-tagging failed | Edge Function 'tagging' 호출 실패 | 기록은 저장됨, AI 기능 일시 불가 안내 |

---

## TODO — 할 일 관련

| 코드 | 사용자 메시지 (KO) | 사용자 메시지 (EN) | 원인 | CS 해결 방법 |
|------|-------------------|-------------------|------|-------------|
| TODO_001 | 할 일 목록을 불러오지 못함 | Failed to load todos | todos SELECT 쿼리 실패 | 재시도, 네트워크 확인 안내 |
| TODO_002 | 관련 할 일을 불러오지 못함 | Failed to load related todos | 특정 기록의 할 일 조회 실패 | 재시도 안내 |
| TODO_003 | 할 일 수정 실패 | Failed to update todo | todos UPDATE 실패 | 재시도 안내 |
| TODO_004 | 할 일 삭제 실패 | Failed to delete todo | todos DELETE 실패 | 재시도 안내 |
| TODO_005 | 자동 할 일 추출 실패 | Auto todo extraction failed | Edge Function 'extract-todos' 호출 실패 | 기록은 저장됨, AI 기능 일시 불가 안내 |

---

## SUMMARY — 요약 관련

| 코드 | 사용자 메시지 (KO) | 사용자 메시지 (EN) | 원인 | CS 해결 방법 |
|------|-------------------|-------------------|------|-------------|
| SUMMARY_001 | 요약 목록을 불러오지 못함 | Failed to load summaries | summaries SELECT 쿼리 실패 | 재시도, 네트워크 확인 안내 |
| SUMMARY_002 | 일간 요약 생성 실패 | Failed to generate daily summary | Edge Function 'generate-summary' 호출 실패 | 재시도, 오늘 기록이 있는지 확인 안내 |
| SUMMARY_003 | 주간 요약 생성 실패 | Failed to generate weekly summary | Edge Function 'generate-weekly' 호출 실패 | 재시도, 해당 주 기록이 있는지 확인 안내 |

---

## SETTINGS — 설정 관련

| 코드 | 사용자 메시지 (KO) | 사용자 메시지 (EN) | 원인 | CS 해결 방법 |
|------|-------------------|-------------------|------|-------------|
| SETTINGS_001 | 이메일 변경 실패 | Failed to change email | auth.updateUser email 변경 실패 | 이메일 형식 확인, 중복 이메일 여부 확인 |
| SETTINGS_002 | 전화번호 변경 실패 | Failed to change phone | profiles 테이블 phone UPDATE 실패 | 재시도, 형식 확인 안내 |
| SETTINGS_003 | 비밀번호는 6자 이상 | Password must be 6+ chars | 6자 미만 비밀번호 입력 | 6자 이상 비밀번호 입력 안내 |
| SETTINGS_004 | 비밀번호 변경 실패 | Failed to change password | auth.updateUser password 변경 실패 | 재시도 안내 |

---

## PROFILE — 프로필 관련

| 코드 | 사용자 메시지 (KO) | 사용자 메시지 (EN) | 원인 | CS 해결 방법 |
|------|-------------------|-------------------|------|-------------|
| PROFILE_001 | 이미지 업로드 실패 | Failed to upload image | Supabase Storage 업로드 실패 | 파일 크기/형식 확인, 네트워크 확인, 재시도 안내 |
| PROFILE_002 | 프로필 저장 실패 | Failed to save profile | user_metadata 업데이트 실패 | 재시도 안내 |

---

## 일반 대응 가이드

### 사용자가 에러 코드를 전달했을 때
1. 위 표에서 코드를 찾아 **원인** 확인
2. **CS 해결 방법**에 따라 안내
3. 해결되지 않으면 다음 정보 수집:
   - 에러 코드
   - 발생 시각
   - 사용 기기/OS
   - 스크린샷 (가능하면)
4. 개발팀에 에스컬레이션

### 공통 해결 방법
- **네트워크 오류**: 인터넷 연결 확인, 앱 재시작
- **인증 오류**: 로그아웃 후 재로그인
- **서버 오류**: 잠시 후 재시도 (5~10분)
- **반복 오류**: 앱 삭제 후 재설치

### 에러 코드가 없는 경우
- 앱 버전이 오래된 경우 에러 코드가 표시되지 않을 수 있습니다
- 최신 버전 업데이트 안내 후 재시도 요청
