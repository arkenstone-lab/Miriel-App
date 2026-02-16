# Changelog

Historical record of all version changes. Moved from CLAUDE.md on 2026-02-16.

## Version Summary

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | v0.1 | Project setup, MVP scope, Expo migration, Phase R1-R2 complete |
| 2026-02-03 | v0.2 | i18n, settings + dark mode, onboarding, persona, profile, UX polish |
| 2026-02-03 | v0.3 | Username-based auth, find-id/password, account settings |
| 2026-02-04 | v0.4 | Rebranding (ReflectLog → Miriel), error code system, signup UX |
| 2026-02-04 | v0.5 | First-time setup flow (language → theme → welcome) |
| 2026-02-04 | v0.6 | Onboarding redesign, notification system, daily/weekly limits |
| 2026-02-04 | v0.7 | AI personalization (user_ai_preferences) |
| 2026-02-05 | v0.8 | Cyan theme, inline errors, onboarding/setup UX improvements |
| 2026-02-12 | v0.9 | Monthly review, AI conversational check-in, auto daily summary |
| 2026-02-14 | v0.10 | Restore 3637d4c architecture (OpenAI inline, remove _shared/) |
| 2026-02-15 | v0.11 | Multi-step signup, email verification, password reset, dual login |
| 2026-02-15 | v0.12 | Supabase → Cloudflare full migration (D1 + Workers/Hono + R2 + Custom JWT) |
| 2026-02-15 | v0.13 | Todo+Summary merge, daily 3x limit, invite code, optimistic updates |

---

## Completed Feature Checklist

All phases are complete. Only remaining tasks are: EAS Build, Expo Web build, and demo video recording.

### Phase R1: Expo Project Setup ✅
- Expo project creation (Expo Router + NativeWind + TypeScript)
- Supabase integration (client setup, Auth) → later migrated to Cloudflare
- Common layout (tab navigation, header)
- Business logic migration (types, queries, AI prompts)
- API migration to Edge Functions → later migrated to Cloudflare Workers

### Phase R2: Core Screens ✅
- Record screen (chatbot input + quick input mode + auto-tagging/todo extraction)
- Timeline (entry list + date grouping + desktop 2-panel)
- Daily summary + evidence links (per-sentence Evidence Chip)
- Weekly review + evidence links (shared SummaryDetailView)
- Todo list (filter tabs + source entry links + desktop 2-panel)
- Common UI component library (Button, Card, Badge, EmptyState, LoadingState)
- Responsive layout (Sidebar + MasterDetail + bottom tab auto-switch)
- DB migration (sentences_data JSONB column)
- Entry detail (edit/delete + related todos/summaries)

### Phase R3: Retention + Dashboard ✅
- Dashboard (home) — streaks, recent summaries, quick record
- Streak system (consecutive record tracking + visual display)
- Gamification (level/badge — basic version)
- In-app reminder banner (CTA when no record today)

### Phase R3.5: i18n ✅
- i18next + react-i18next + expo-localization
- Translation infrastructure (10 namespaces × 2 languages)
- All UI strings converted from Korean hardcoding to t() functions (~30 files)
- System locale auto-detection

### Phase R3.7: Settings + Dark Mode + Privacy ✅
- Settings store (Zustand + AsyncStorage)
- Settings screen (language, theme, account, privacy)
- Dark mode applied to all ~30 files
- React Navigation header/tab bar dark mode (JS conditional styles)
- Privacy notice component (banner/inline modes)
- AI output schema (ProcessedEntry type + normalization)

### Phase R4: Polish + Submission ✅ (except deploy tasks)
- Onboarding (3-step interactive: growth cycle → weekly review config → notifications)
- Demo data seeding (22 Entry + 12 Summary + 15 Todo)
- Dark mode refinements (MasterDetail, dashboard mobile, chat, FontAwesome icons)
- UX improvements (Enter-to-submit, nickname, tab bar fix, header height)
- Tab navigation refactoring (unified Summary tab with Daily/Weekly/Monthly toggle)
- Profile tab (user info, gamification, settings, privacy, logout)
- Write Today FAB (mobile floating button)
- Shared component extraction (SegmentedControl, EditModal)
- Persona collection screen (nickname, gender, occupation, interests)
- User data migration to user_metadata (server-side storage)
- Profile edit screen (avatar upload/delete, persona editing)
- Email verification screen + resend with 60s cooldown
- Username-based auth (dual login: username + email)
- Find ID / Find password screens
- Account settings (email/phone/password change)
- Rebranding (ReflectLog → Miriel)
- Error code system (AppError + 33 codes + i18n + CS docs)
- First-time setup flow (language → theme → welcome, pre-login)
- Onboarding redesign (growth cycle → weekly review → notifications + complete screen)
- Notification system (native push + web polling + weekly/monthly triggers)
- Daily record 1/day limit + weekly review 1/week limit
- AI personalization (user_ai_preferences table + settings UI + ai_context injection)
- Theme color change (Indigo → Cyan)
- Inline error display (auth screens)
- AI Provider: OpenAI GPT-4o direct calls (6 routes, security hardening)
- Monthly review (generate-monthly + Monthly toggle + 1/month limit)
- AI conversational check-in (chat route, 3-phase Plan→Detail→Reflection)
- Daily summary auto-generation (fire-and-forget on entry save)
- Multi-step signup redesign (email verification code, 3 steps + IP rate limit)
- Password reset screen + change password modal
- Email templates (Arkenstone Labs branding)
- Supabase → Cloudflare full migration (D1 + Workers/Hono + R2 + Custom JWT)
- Chat draft auto-save + leave warning + restore banner
- Todo+Summary merge (single AI call + summary_gen_count 3/day limit)
- Todo Optimistic Update
- Invite code system (INVITE_CODES)
- Logout modal fix (dismiss before signOut)

---

## Detailed Version History

<details>
<summary>v0.1 — Project Setup (2026-02-02)</summary>

1. **Docs & Design**: Initial CLAUDE.md, MVP scope (Do/Don't), Todo feature inclusion decision
2. **Tech decisions**: Expo (React Native) migration, responsive web → cross-platform single codebase, 10→8 screens
3. **Phase R1**: Expo Router + NativeWind + TypeScript setup, Supabase integration, tab navigation, business logic migration, 4 Edge Functions
4. **Phase R2**:
   - Responsive layout system (Desktop sidebar + 2-panel / Mobile bottom tabs)
   - Common UI components (Button, Card, Badge, EmptyState, LoadingState)
   - Timeline: date grouping (SectionList) + Desktop MasterDetail
   - Record screen: chatbot/quick input mode, auto-tagging, auto-todo extraction
   - Entry detail: edit/delete, related todos/summaries
   - Daily summary + weekly review: per-sentence evidence links (EvidenceChip), shared SummaryDetailView
   - Todo list: all/active/done filter tabs, source Entry links
   - DB migration: sentences_data JSONB column

</details>

<details>
<summary>v0.2 — i18n, Settings, Dark Mode, Profile (2026-02-03)</summary>

#### i18n
- i18next + react-i18next + expo-localization, system locale auto-detection
- 10 namespaces × 2 languages = 20 JSON files
- All UI strings (~30 files) converted from Korean hardcoding to t() functions

#### Settings + Dark Mode + Privacy
- settingsStore (Zustand): theme/language in AsyncStorage, account data in user_metadata
- Settings screen: language/theme SegmentedControl, account info, privacy notice, support links
- Dark mode applied (~30 files): NativeWind `dark:` + React Navigation JS conditional styles
- PrivacyNotice component (banner/inline), AI output schema (ProcessedEntry)
- 8 developer docs (`docs/` folder)

#### Onboarding + Persona
- 3-step onboarding guide (quick record → AI organize → retention habits)
- Persona collection screen (nickname/gender/occupation/interests)
- Demo data generator (22 Entry + 12 Summary + 15 Todo)

#### Tab Refactoring + Profile
- Daily/weekly summary → unified "Summary" tab (SegmentedControl toggle)
- Profile tab: avatar + persona chips + achievements (streak/level/todo completion/badges)
- Profile edit screen: avatar upload (expo-image-picker)/delete, persona editing
- Write Today FAB (mobile floating button)
- Shared component extraction (SegmentedControl, EditModal, TodoCompletionCard)

#### Auth + User Data
- Email verification screen (signup → verify-email)
- User data migration to user_metadata (per-account server storage)
- savePersona() batch save (fixed updateUser concurrency issue)

#### UX Polish
- Enter-to-submit (login/signup/chat), Shift+Enter newline
- Dark mode fixes (FontAwesome icons, MasterDetail detail pane, etc.)
- Tab bar height/padding fix (text clipping), header border removal
- Settings EditModal popup pattern

#### Push Notifications
- expo-notifications + expo-device setup
- `src/lib/notifications.ts`: notification service module
- Settings screen Notifications section (Switch toggle + TimePickerModal)
- Email verification resend + 60s cooldown timer

</details>

<details>
<summary>v0.3 — Username Auth, Account Management (2026-02-03)</summary>

#### Username-based Auth
- Email login → username-based login
- `profiles` table (username + phone, RLS, unique constraint, format check)
- SECURITY DEFINER RPC functions: get_email_by_username, get_username_by_email, is_username_available
- authStore: signIn(username, password), signUp({ username, email, phone, password })

#### Find ID / Find Password
- find-id.tsx: email input → RPC → display username
- find-password.tsx: username or email → resetPasswordForEmail → masked email display

#### Account Settings
- Account section: username (readonly) / nickname / email / phone / password change / logout
- EditModal: secureTextEntry + async onSave support

</details>

<details>
<summary>v0.4 — Rebranding + Error Codes (2026-02-04)</summary>

#### Rebranding (ReflectLog → Miriel)
- All codebase references changed (18 files): app.json, package.json, login, settings, settingsStore, i18n, docs, SQL

#### Error Code System
- `src/lib/errors.ts`: AppError class (code + i18n auto-mapping) + showErrorAlert utility
- `src/components/ui/ErrorDisplay.tsx`: fullscreen inline error component
- 33 error codes with user-friendly messages (ko/en)
- API layer + stores + UI all converted to AppError

#### Signup
- Password confirmation field added (dual input + mismatch validation)

</details>

<details>
<summary>v0.5 — First-Time Setup (2026-02-04)</summary>

- `app/(setup)/`: 3-step setup (language → theme → welcome)
- setup i18n namespace (ko/en)
- settingsStore: hasCompletedSetup flag (AsyncStorage, device-level)
- Routing guard: setup check takes highest priority

</details>

<details>
<summary>v0.6 — Onboarding Redesign + Notifications (2026-02-04)</summary>

#### Onboarding
- 3-step interactive: growth cycle education → weekly review day/time → notification settings + permission
- Complete screen: settings summary + "Start Recording" CTA

#### Notification System
- scheduleAllNotifications: DAILY (morning/evening) + WEEKLY (review) triggers
- Web Notification API wrapper (30s polling, lastFiredKey dedup)
- DayPickerModal shared component

#### Limits
- Daily record: 1/day (redirect to edit existing via autoEdit param)
- Weekly review: 1/week (Monday-based check, button disabled)

</details>

<details>
<summary>v0.7 — AI Personalization (2026-02-04)</summary>

- user_ai_preferences table (RLS + updated_at trigger)
- Features: summary style, focus areas (6 options), custom instructions, share persona toggle
- 4 Edge Functions modified to accept ai_context parameter
- Client API functions updated with aiContext parameter
- EditModal multiline prop added
- Settings UI: AI Personalization section

</details>

<details>
<summary>v0.8 — Theme + UX (2026-02-05)</summary>

- Theme color: Indigo → Cyan + Dark Gray (38 Tailwind files + 16 JS hex files)
- Auth screen errors: Alert → inline text (5 screens)
- Real-time password mismatch validation
- Onboarding Step 3: main button directly triggers notification permission
- Web notifications: app-level always enabled
- Setup welcome: signOut to clear stale sessions
- Home tab: settings gear icon in mobile header

</details>

<details>
<summary>v0.9 — Monthly Review + AI Chat (2026-02-12)</summary>

- Monthly review: generate-monthly Edge Function + Monthly toggle + 1/month limit
- monthlyReviewDay setting (1-28) + DATE trigger notification
- AI conversational check-in: chat Edge Function + callAIMultiTurn + 3-phase (Plan→Detail→Reflection)
- Daily summary auto-generation (fire-and-forget on entry save)
- raw_text phase markers ([Plan]/[Detail]/[Reflection])
- Chat AI failure → static question fallback

</details>

<details>
<summary>v0.10 — Architecture Restoration (2026-02-14)</summary>

- Reverted to 3637d4c inline pattern (removed _shared/ abstraction)
- OpenAI GPT-4o direct calls restored (removed Gemini)
- 6 Edge Functions: consistent inline callOpenAI + prompts + security
- CORS whitelist, prompt injection filter, input length limits, entry_ids validation

</details>

<details>
<summary>v0.11 — Signup Redesign + Auth (2026-02-15)</summary>

- Multi-step signup: email → verification code → account creation
- email_verifications table + 3 Edge Functions (send-code, verify-code, validate-token)
- IP-based rate limit (10 req/10min/IP)
- Password reset screen (reset-password.tsx)
- Change password modal (current/new/confirm 3 fields)
- Find-id Edge Function integration (send-find-id-email)
- Email templates: Arkenstone Labs branding + verification code template
- Phone number UI removed from settings (code retained)
- Dual login: username + email (@ detection)

</details>

<details>
<summary>v0.12 — Supabase → Cloudflare Migration (2026-02-15)</summary>

- Full migration: D1 (SQLite) + Cloudflare Workers (Hono.js) + R2 + Custom JWT
- Custom JWT: Web Crypto HMAC-SHA256, access 1h + refresh 30d rotation
- bcryptjs 8 rounds (Workers free tier CPU limit)
- All client code migrated: apiFetch/apiPublicFetch replacing Supabase client
- @supabase/supabase-js and CLI fully removed

</details>

<details>
<summary>v0.13 — Todo+Summary Merge + Polish (2026-02-15)</summary>

- Todo extraction merged into generate-summary (single AI call)
- summary_gen_count: daily 3x limit + 429 response
- Entry detail "Regenerate Summary" button (limit display + remaining count)
- Todo Optimistic Update (useUpdateTodo/useDeleteTodo instant + rollback)
- Invite code system (INVITE_CODES wrangler secret + conditional signup UI)
- Logout modal fix (dismiss → signOut sequence)
- Chat draft auto-save + leave warning + restore banner

</details>
