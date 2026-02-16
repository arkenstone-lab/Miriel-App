# Decision Log

Historical record of architectural and product decisions made during development.

> Moved from CLAUDE.md on 2026-02-16 for token optimization. Critical decisions that affect ongoing development are kept in CLAUDE.md under "Critical Design Decisions".

| Date | Decision | Rationale | Rejected Alternative |
|------|----------|-----------|---------------------|
| 2026-02-02 | Include todo feature in MVP | Stronger demo impact, practical appeal | Defer to later |
| 2026-02-02 | Include retention system (streaks + gamification) in MVP | Duolingo-style retention for product differentiation | Ship without retention |
| 2026-02-02 | Responsive web first (PC + mobile) | Cover both with responsive web instead of Android wrapper | Capacitor/TWA wrapper |
| 2026-02-02 | Expand to 10 screens (later reduced to 8) | Dashboard/onboarding/profile/settings for polished demo | Keep original 6 |
| 2026-02-02 | UI polish as top priority | Investor demo must look like a real product | Features first, UI later |
| 2026-02-02 | Switch to Expo (React Native) | Single codebase for PC+iOS+Android, native push, real app demo | Capacitor, keep responsive web |
| 2026-02-03 | Apply i18n (Korean + English) | Global demo readiness, English demo for investor pitch | Keep Korean hardcoded |
| 2026-02-03 | Settings as modal (not 6th tab) | 5 tabs already sufficient, settings accessed via sidebar gear icon | Add 6th tab |
| 2026-02-03 | Apply dark mode immediately | Enhances demo polish, low cost with NativeWind `dark:` pattern | Dark mode later |
| 2026-02-03 | Privacy notice + AI output schema together | Data safety visualization + structured AI output for reliability | One or the other |
| 2026-02-03 | Onboarding as `(onboarding)` route group | Follows Expo Router file-based routing pattern | Modal / conditional rendering |
| 2026-02-03 | Settings input via popup modal (EditModal) | More delightful UX than inline TextInput, reusable pattern | Keep inline input |
| 2026-02-03 | Merge daily/weekly summary into single "Summary" tab | Optimize tab count, SegmentedControl toggle for switching | Separate tabs |
| 2026-02-03 | Add Profile tab (5th tab) | User info + gamification + settings in one place | Keep settings modal only |
| 2026-02-03 | Write Today FAB (mobile only) | Better record entry accessibility, industry standard pattern | Tab bar + button only |
| 2026-02-03 | Extract SegmentedControl/EditModal as shared components | Used in both settings and profile, DRY principle | Keep inline in settings |
| 2026-02-03 | Migrate user data to user_metadata (server) | AsyncStorage is device-local; account switching leaks data | AsyncStorage + reset on logout |
| 2026-02-03 | Batch save persona data (savePersona) | Individual updateUser calls cause last-write-wins data loss | Per-field updateUser calls |
| 2026-02-03 | Remove "Other" from gender options | User request — simpler choices (male/female only) | Keep "Other" option |
| 2026-02-03 | Profile edit as separate modal screen (edit-profile) | Profile tab is read-only; editing is a distinct UX flow | Inline editing in profile tab |
| 2026-02-03 | Avatar stored in R2 + user_metadata URL | Same avatarUrl field works for future default avatar expansion | Base64 in user_metadata |
| 2026-02-03 | Support links in Settings > Support section | Settings is the app management hub | Profile tab / separate screen |
| 2026-02-03 | Local push notifications (expo-notifications) | Retention core — morning/evening check-in reminders | Server push (FCM/APNs) |
| 2026-02-03 | Notification settings in user_metadata | Persists across device switches | AsyncStorage |
| 2026-02-03 | Email verification resend + 60s cooldown | UX improvement for missed emails, cooldown prevents abuse | No resend option |
| 2026-02-03 | Switch to username-based auth | Standard login UX without email exposure | Keep email login |
| 2026-02-03 | Separate find-id / find-password screens | Different input requirements for each flow | Single "account recovery" screen |
| 2026-02-03 | Account settings in Settings > Account section | Natural location, EditModal reuse for consistent UX | Separate "account management" screen |
| 2026-02-03 | EditModal: add secureTextEntry + async onSave | Password masking needed; async allows modal to stay open on server error | Separate password modal |
| 2026-02-04 | Rebrand ReflectLog → Miriel | Brand decision before VC pitching and tester recruitment | Keep ReflectLog |
| 2026-02-04 | Error code system (AppError + i18n + CS docs) | CS efficiency — users can report error codes for instant diagnosis. 33 error codes | Error messages only (no codes) |
| 2026-02-04 | Error messages in separate `errors` i18n namespace | Per-error user-friendly messages + multilingual support | Hardcoded error messages |
| 2026-02-04 | Defer multi-theme until 3rd theme confirmed | Current `dark:` pattern sufficient. Token-based system planned when needed | Tokenize immediately |
| 2026-02-04 | First-time setup flow (3 steps before login) | Language/theme set before login screen for correct display | Skip straight to login |
| 2026-02-04 | hasCompletedSetup in AsyncStorage (device-level) | Persists across logouts (language/theme are device settings) | user_metadata (requires login) |
| 2026-02-04 | No "System" option in setup theme selection | Simpler 2 choices for first-time users; changeable later in settings | Light/Dark/System |
| 2026-02-04 | Redesign onboarding as growth cycle education + settings | Old 3-step was info-only; new 3-step completes actual settings to enter retention loop | Keep educational onboarding |
| 2026-02-04 | Batch save onboarding notification settings | Per-step saves cause user_metadata concurrency issues | Per-step immediate save |
| 2026-02-04 | Separate onboarding complete screen (complete.tsx) | Shows settings summary + natural "Start Recording" CTA | Jump directly to /(tabs) |
| 2026-02-04 | Weekly review day: 0=Mon..6=Sun convention | ISO 8601 aligned; more natural UX despite requiring JS getDay() conversion | JS getDay() convention (0=Sun) |
| 2026-02-04 | Web notifications via 30s polling (demo) | Service Worker + VAPID too complex for demo scope | Server push (VAPID) |
| 2026-02-04 | Daily record: 1/day limit, redirect to edit existing | Product philosophy of one focused daily record | Allow multiple records |
| 2026-02-04 | Weekly review: 1/week limit (Monday-based check) | Prevent duplicate generation; getMonday() calculates week start | Allow multiple generations |
| 2026-02-04 | DayPickerModal as shared component | Reuses TimePickerModal pattern; used in both onboarding and settings | Inline selection UI |
| 2026-02-04 | AI personalization in separate user_ai_preferences table | user_metadata already crowded; separate table for privacy + simpler CRUD | Add to user_metadata |
| 2026-02-04 | Client passes ai_context to AI routes (no server DB lookup) | Minimizes Worker route changes; client controls what info is shared | Worker queries DB directly |
| 2026-02-04 | EditModal: add multiline prop | Custom instructions need multi-line; consistent UX through component extension | Separate TextAreaModal |
| 2026-02-05 | Theme color: Indigo → Cyan | Cyan fits brand image; dark mode backgrounds use pure gray | Keep Indigo |
| 2026-02-05 | Auth screen errors as inline text | Alert popups break UX flow; inline lets users see error while editing input | Keep Alert |
| 2026-02-05 | Onboarding Step 3 main button triggers notification permission | Separate button is easy to ignore; main CTA drives higher conversion | Separate "allow" button |
| 2026-02-05 | Web notification permission always enabled at app level | Browser denial blocks re-request; demo polling doesn't need browser permission | Depend on browser permission |
| 2026-02-05 | Setup welcome screen: signOut before navigating to auth | Stale session causes routing guard to redirect auth → tabs | Navigate without session check |
| 2026-02-12 | ~~AI Provider abstraction (_shared/)~~ → Reverted | Reverted to 3637d4c inline pattern for stability | Keep _shared/ abstraction |
| 2026-02-12 | ~~Switch to Gemini 2.0 Flash~~ → Reverted to OpenAI | Reverted to trusted 3637d4c pattern with inline OpenAI | Keep Gemini |
| 2026-02-12 | Add monthly review (generate-monthly) | Completes daily→weekly→monthly reflection cycle | Only weekly |
| 2026-02-12 | monthlyReviewDay (1-28) for monthly review period | Not all users start at month beginning; user-configurable start date | Fixed 1st of month |
| 2026-02-12 | Monthly notification via DATE trigger (native) | expo-notifications lacks MONTHLY trigger; schedule next occurrence | N/A |
| 2026-02-12 | AI conversational check-in (chat route + callAIMultiTurn) | Static questions → AI context-based dynamic questions, 3-phase deep recording | Keep static questions |
| 2026-02-12 | Auto-generate daily summary (fire-and-forget on save) | No manual trigger needed; Summary tab auto-refreshes via React Query | Manual trigger |
| 2026-02-12 | Phase markers in raw_text ([Plan]/[Detail]/[Reflection]) | Helps summary AI understand entry structure; enables future per-phase analysis | Plain text only |
| 2026-02-12 | Static question fallback on chat AI failure | Recording continues even during AI outage | Show error and stop |
| 2026-02-14 | Restore 3637d4c inline pattern (remove _shared/) | Trusted AI expert work; inline with security hardening is more stable | Keep _shared/ abstraction |
| 2026-02-14 | Defer offline sync post-demo, rollback pattern only | Server-first + local fallback would be discarded in local-first rewrite → double work | Server-first + local fallback |
| 2026-02-15 | Multi-step signup (email → code → account) | US service standard UX; email verification prevents spam accounts | Single form |
| 2026-02-15 | Custom email verification codes (email_verifications table + 3 routes) | 6-digit code UX is mobile-friendly; verification_token for server-side validation | Supabase built-in email verification |
| 2026-02-15 | IP-based rate limit (10 requests/10min/IP) | Email-only limit can be bypassed with different emails | Email rate limit only |
| 2026-02-15 | Dual login: username + email | @ detected → email login; otherwise → username lookup. US standard | Username only |
| 2026-02-15 | Remove phone number from settings UI | Unnecessary in signup/settings; code retained for future restoration | Keep phone number |
| 2026-02-15 | Arkenstone Labs branding in email templates | Separate product (Miriel) and company (Arkenstone Labs) brands | Miriel only |
| 2026-02-15 | Separate logo-128.png (128px resize) | Original icon.png (2048px) too large for display | Use original directly |
| 2026-02-15 | Supabase → Cloudflare full migration | Supabase Edge Function auth issues (getUser 401) recurring + Cloudflare better at scale | Keep Supabase |
| 2026-02-15 | Custom JWT (Web Crypto HMAC-SHA256) | No external JWT library; native Workers API. Access 1h + refresh 30d rotation | @tsndr/cloudflare-worker-jwt |
| 2026-02-15 | bcryptjs 8 rounds | Workers free tier 10ms CPU limit; increase on Paid tier | PBKDF2 (Web Crypto) |
| 2026-02-15 | Merge todo extraction into generate-summary (single AI call) | Two calls → one call with todos in SUMMARY_PROMPT. Cost/speed improvement | Separate extract-todos call |
| 2026-02-15 | Daily summary regen limit: 3/day (summary_gen_count) | Prevent infinite regen + control OpenAI costs. Server returns 429 | No limit |
| 2026-02-15 | Todo Optimistic Update pattern | Immediate UI response on toggle/delete without waiting for server | Server response → cache invalidation only |
| 2026-02-15 | Invite code system (INVITE_CODES) | Restrict signups to testers; managed via wrangler secret | Open signup |
| 2026-02-15 | Alert.alert → ConfirmModal for delete confirmation | Alert.alert callbacks broken on web; window.confirm lacks UX quality → custom ConfirmModal | Keep window.confirm |
| 2026-02-15 | Use router.replace after entry deletion (not router.back) | router.back() returns to deleted entry URL → 404 → use router.replace('/(tabs)/timeline') | Keep router.back() |
| 2026-02-15 | useDeleteEntry: removeQueries instead of invalidateQueries | invalidateQueries returns stale cache before refetch → useTodayEntry returns deleted entry → autoEdit redirect bug | Keep invalidateQueries |
| 2026-02-15 | ConfirmModal uses inline styles (not NativeWind) | RN Modal renders outside NativeWind context → dark: classes don't work → isDark conditional inline styles | NativeWind dark: classes |
| 2026-02-15 | Chat AI language: use i18n.language | settingsStore.language initially null → 'en' fallback → Korean input gets English response. i18n.language always accurate | settingsStore.language |
| 2026-02-15 | Chat message limit handled client-side (MAX_MESSAGES) | Server 400 on exceeding 20 messages → infinite "tell me more" loop. Client auto-completes at limit | Server error only |
| 2026-02-15 | Comments required convention added | Why-focused comments on every code change for developer/AI agent context | Optional comments |
| 2026-02-16 | Smart entry navigation (useTodayEntry) | All "Write Today" buttons flash chat UI + leave modal when entry exists → check useTodayEntry and navigate to /entries/{id} directly. FAB/header icon changes (pencil/plus → eye) | Keep /entries/new redirect |
| 2026-02-16 | React Query staleTime: 5min + cache: 'no-store' | Production browser heuristic-caches API responses without Cache-Control header → stale data after mutations. staleTime: 5min reduces tab-switch requests; cache: 'no-store' (client + server) ensures fresh data when refetching | staleTime: 0 (refetch every mount) |
