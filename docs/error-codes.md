# Error Codes Reference

This document lists all error codes used in the Miriel app.
When a user reports an error code, look it up below to identify the cause and resolution.

> Error format: `(Error code: AUTH_001)`

---

## AUTH — Authentication

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| AUTH_001 | 아이디를 찾을 수 없습니다 | Username not found | Non-existent username used for login | Verify username, suggest Find ID |
| AUTH_002 | 아이디 조회 중 오류 | Failed to look up username | Server RPC call failure | Retry, check server status if persistent |
| AUTH_003 | 비밀번호가 올바르지 않습니다 | Incorrect password | Password mismatch | Verify password, suggest Find Password |
| AUTH_004 | 아이디 중복 확인 중 오류 | Failed to check username availability | Username check query failure during signup | Retry, check server status if persistent |
| AUTH_005 | 이미 사용 중인 아이디 | Username already taken | Username already registered | Suggest different username |
| AUTH_006 | 회원가입 중 오류 | Sign up failed | auth.signUp call failure | Retry, verify email format, possible rate limit |
| AUTH_007 | 회원가입에 실패 | Sign up failed | Signup succeeded but user ID is null | Retry, escalate to dev team if persistent |
| AUTH_008 | 이미 등록된 이메일 | Email already registered | Duplicate email signup attempt | Suggest login or different email |
| AUTH_009 | 프로필 생성 실패 | Failed to create profile | Profiles table INSERT failure | Retry, check DB if persistent |
| AUTH_010 | 로그아웃 실패 | Failed to sign out | auth.signOut call failure | Restart app |
| AUTH_011 | 아이디 조회 실패 | Failed to find username | Find ID RPC lookup failure | Verify email, retry |
| AUTH_012 | 계정 조회 실패 | Failed to find account | Find Password account lookup failure | Verify username/email, retry |
| AUTH_013 | 재설정 이메일 전송 실패 | Failed to send reset email | resetPasswordForEmail call failure | Verify email, retry |
| AUTH_014 | 인증 이메일 재전송 실패 | Failed to resend verification | auth.resend call failure (possible rate limit) | Wait 60 seconds and retry |
| AUTH_015 | 아이디 안내 이메일 전송 실패 | Failed to send username email | send-find-id-email Edge Function failure | Retry |
| AUTH_016 | 새 비밀번호 설정 실패 | Failed to set new password | auth.updateUser password change failure | Retry |
| AUTH_017 | 이메일 인증 미확인 | Email verification not confirmed | validate-email-token failed or token expired | Re-verify email |
| AUTH_018 | 인증 코드 전송 실패 | Failed to send verification code | send-verification-code Edge Function failure | Retry |
| AUTH_019 | 인증 코드 불일치 | Invalid verification code | Wrong code entered | Check code, retry |
| AUTH_020 | 인증 코드 만료 | Verification code expired | Code older than 10 minutes | Request new code |
| AUTH_021 | 유효하지 않은 가입 코드 | Invalid invite code | Wrong or missing invite code during signup | Verify invite code |
| AUTH_022 | 로그인 시도가 너무 많습니다 | Too many login attempts | 5+ failed logins per identifier per 15 minutes | Wait 15 minutes before retrying |

---

## ENTRY — Entries

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| ENTRY_001 | 기록 목록을 불러오지 못함 | Failed to load entries | Entry list SELECT query failure | Retry, check network |
| ENTRY_002 | 기록을 불러오지 못함 | Failed to load entry | Entry detail query failure (possibly deleted) | Check if entry exists, retry |
| ENTRY_003 | 로그인이 필요합니다 | Need to be logged in | Entry creation attempted without auth | Re-login |
| ENTRY_004 | 기록 저장 실패 | Failed to save entry | Entries INSERT failure | Retry, check network |
| ENTRY_005 | 기록 수정 실패 | Failed to update entry | Entries UPDATE failure | Retry |
| ENTRY_006 | 기록 삭제 실패 | Failed to delete entry | Entries DELETE failure | Retry |
| ENTRY_007 | 자동 태깅 실패 | Auto-tagging failed | Tagging Edge Function call failure | Entry is saved; AI feature temporarily unavailable |
| ENTRY_008 | 입력이 너무 깁니다 | Input is too long | Entry text exceeds 20,000 characters | Reduce text length and retry |

---

## TODO — Todos

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| TODO_001 | 할 일 목록을 불러오지 못함 | Failed to load todos | Todos SELECT query failure | Retry, check network |
| TODO_002 | 관련 할 일을 불러오지 못함 | Failed to load related todos | Entry-specific todo query failure | Retry |
| TODO_003 | 할 일 수정 실패 | Failed to update todo | Todos UPDATE failure | Retry |
| TODO_004 | 할 일 삭제 실패 | Failed to delete todo | Todos DELETE failure | Retry |
| TODO_005 | 자동 할 일 추출 실패 | Auto todo extraction failed | extract-todos Edge Function call failure | Entry is saved; AI feature temporarily unavailable |

---

## SUMMARY — Summaries

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| SUMMARY_001 | 요약 목록을 불러오지 못함 | Failed to load summaries | Summaries SELECT query failure | Retry, check network |
| SUMMARY_002 | 일간 요약 생성 실패 | Failed to generate daily summary | generate-summary Edge Function failure | Retry, check that entries exist for the day |
| SUMMARY_003 | 주간 요약 생성 실패 | Failed to generate weekly summary | generate-weekly Edge Function failure | Retry, check that entries exist for the week |
| SUMMARY_004 | 월간 요약 생성 실패 | Failed to generate monthly summary | generate-monthly Edge Function failure | Retry, check that entries exist for the period |

---

## SETTINGS — Settings

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| SETTINGS_001 | 이메일 변경 실패 | Failed to change email | Email update failure | Verify email format, check for duplicates |
| SETTINGS_002 | 전화번호 변경 실패 | Failed to change phone | Phone number update failure | Retry, verify format |
| SETTINGS_003 | 설정 저장 실패 | Failed to save settings | user_metadata update failure | Retry, check network |
| SETTINGS_004 | 비밀번호 변경 실패 | Failed to change password | Password update failure | Retry |

---

## PROFILE — Profile

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| PROFILE_001 | 이미지 업로드 실패 | Failed to upload image | Storage upload failure | Check file size/format, check network, retry |
| PROFILE_002 | 프로필 저장 실패 | Failed to save profile | user_metadata update failure | Retry |
| PROFILE_003 | 이미지 크기가 2MB 초과 | Image exceeds 2 MB | Selected image over 2MB | Select smaller image or compress |
| PROFILE_004 | 권한이 없습니다 | Permission denied | Auth user / request user mismatch | Re-login, escalate if persistent |

---

## AIPREF — AI Preferences

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| AIPREF_001 | AI 설정을 불러올 수 없습니다 | Unable to load AI preferences | user_ai_preferences query failure | Check network, refresh |
| AIPREF_002 | AI 설정 저장에 실패했습니다 | Failed to save AI preferences | user_ai_preferences upsert failure | Check network, retry |

---

## CHAT — AI Chat

| Code | User Message (KO) | User Message (EN) | Cause | Resolution |
|------|-------------------|-------------------|-------|------------|
| CHAT_001 | AI 대화 응답을 받지 못했습니다 | Failed to get AI chat response | Chat Edge Function call failure | Check network, refresh. Auto-fallback to static questions is enabled |

---

## General Support Guide

### When a user reports an error code
1. Look up the code in the tables above to identify the **cause**
2. Follow the **resolution** steps
3. If unresolved, collect the following information:
   - Error code
   - Timestamp
   - Device / OS
   - Screenshot (if available)
4. Escalate to the development team

### Common Resolutions
- **Network errors**: Check internet connection, restart app
- **Auth errors**: Sign out and sign back in
- **Server errors**: Wait 5-10 minutes and retry
- **Recurring errors**: Uninstall and reinstall the app

### No Error Code Displayed
- Older app versions may not display error codes
- Suggest updating to the latest version and retrying
