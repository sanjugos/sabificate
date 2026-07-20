# SABIficate Learner App v1 — Praxis Plan

| Field | Value |
|---|---|
| **Feature** | SABIficate Learner App v1 |
| **Spec version** | 1.0.0 |
| **Status** | GATE-3 APPROVED |

---

## S1 Architecture Overview

### Components and services

The app is a monolith in `/workspace/app/` with three layers:

| Layer | Runtime | Key paths |
|---|---|---|
| **Frontend** | React 19 SPA (Vite 8 build) | `src/app/pages/`, `src/components/`, `src/lib/` |
| **API server** | Fastify 5 (Node 20+) | `server/routes/`, `server/services/`, `server/auth/`, `server/middleware/` |
| **Database** | PostgreSQL 15 | `migrations/001_initial_schema.sql`, `migrations/002_curriculum_studio.sql` |
| **Queue** | BullMQ (Redis-backed, dev mock) | `server/queue/`, `server/dev/redis-mock.ts` |
| **Offline store** | Dexie 4 (IndexedDB) | `src/lib/progress/db.ts`, `src/lib/sync/useSyncEngine.ts` |

**What already works (routes registered, UI rendered, services implemented):**

- Auth: register, login, refresh, logout, password-reset, rate-limiting, NDPA consent, flushSync click fix
- Personas: list by vertical, select + calibrate, persist to user_personas
- Courses: list with pagination/filter/search, get by slug with modules/lessons, enroll, categories
- Lesson content: tier-resolved content delivery, paywall middleware, free/paid distinction
- Progress: sync endpoint, dashboard, course progress, quiz submission, artifact submission, scenario submission
- Credentials: issue, list, detail, PDF, public verify, CPD summary, purchase flow
- Payments: initialize, Paystack webhook, verify, subscription status, plans, invoices, dunning
- Studio: full 7-stage pipeline (separate from learner v1 scope)
- Frontend: all 14 pages, 44+ components, content block renderers, offline sync engine, data saver modes

**What is NOT wired / has known gaps (the delta):**

1. **LessonPlayer page**: `onProgressUpdate`, `onQuizSubmit`, `onLessonComplete` are all no-op callbacks (`() => {}`)
2. **LessonPlayer page**: tier comes from `user?.data_saver_mode` (wrong field) instead of `user?.proficiency_level` or persona
3. **LessonPlayer page**: no offline content caching -- only reads from API, never writes to Dexie
4. **LessonPlayer page**: no artifact/scenario submission wired to API
5. **Dashboard**: no "Recommended Next" course for persona
6. **CourseCatalog**: falls back to static data (`STATIC_COURSES`) but has no subscription tier badge or lock icon
7. **CourseDetail page**: needs to check and display subscription tier lock + upgrade CTA
8. **Credential issuance**: no trigger from course completion flow (credential issuance is an API endpoint but nothing calls it on completion)
9. **Profile page**: no link to credentials or billing sections
10. **Pricing page**: hardcoded plan data, not wired to Paystack checkout flow
11. **ArtifactPromptBlock**: no 50-char minimum validation (AC-4.5)
12. **QuizBlock**: auto-submits on option click (no separate submit button to disable, violates AC-4.2 intent -- but current UX is a valid single-tap interaction; spec says "submit button disabled," requires a two-step select-then-submit flow)
13. **Offline sync**: sync endpoint URL is `/api/v1/progress/sync` but no such route exists in progress.ts (sync engine posts to a nonexistent endpoint)
14. **Service worker**: needs audit for no-BackgroundSync reliance (AC-6.4)
15. **RegisterForm**: essential consent checkbox is pre-checked (should still work, but AC-1.2 requires submit blocked if unchecked -- currently validated in JS)
16. **Performance budget**: no enforcement tooling for TTI <5s, JS <170KB critical path
17. **No E2E tests**: only 1 unit test exists (`login.test.tsx`)

### Data model

PostgreSQL schema across 46+ tables in two migrations. Key tables for learner flow: `users`, `user_personas`, `calibration_questions`, `personas`, `courses`, `course_categories`, `modules`, `lessons`, `enrollment`, `learner_progress`, `assessment_attempts`, `credentials`, `credential_templates`, `subscriptions`, `subscription_plans`, `payment_transactions`, `consent_records`, `audit_log`.

### Runtime boundaries

- Frontend: static files served by Vite dev server or Fastify static plugin in production
- API: Fastify listening on configured port, proxied via Vite in dev
- Database: PostgreSQL connection via `server/db/index.ts`
- Offline: Dexie IndexedDB in browser, foreground-sync to API on visibility change

---

## S2 Tech Stack and Dependencies

### Current stack (no changes needed)

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.x |
| Frontend framework | React | 19 |
| Build tool | Vite | 8 |
| CSS | Tailwind CSS | 4.x |
| Routing | react-router-dom | 7.x |
| Backend | Fastify | 5.x |
| Database | PostgreSQL | 15+ |
| ORM/Query | Raw `pg` via `server/db/index.ts` | -- |
| Auth | JWT (jsonwebtoken) + bcrypt | -- |
| Offline storage | Dexie | 4.x |
| Queue | BullMQ + ioredis | -- |
| Payment | Paystack API | -- |
| Test | vitest + @testing-library/react + @testing-library/jest-dom | -- |

### New dependencies (all dev-only except where noted)

| Package | Purpose | Runtime? |
|---|---|---|
| `@playwright/test` | E2E testing with 3G throttle profile | dev |
| `vite-plugin-pwa` | If not already configured, for SW manifest control | prod (already present via workbox) |
| `lighthouse` (CI) | Performance budget enforcement | dev |

No new runtime dependencies. The existing stack covers all spec requirements.

---

## S3 Approach

### High-level task sequence

The work is organized into 21 tasks across 5 phases. Each task runs in a fresh worktree subagent per Constitution SII. Tasks within a phase can run in parallel where noted.

#### Phase 1: Foundation wiring (T-001 through T-004) -- Parallelizable

These four tasks wire existing frontend components to existing backend APIs with no new backend code.

**T-001: Registration flow with NDPA consent**
- AC: 1.1, 1.2, 1.3
- Delta: RegisterForm already works. Verify: (a) submit disabled when essential consent unchecked (already enforced client-side, add disabled attribute to submit button when `!consentEducation`), (b) 409 duplicate email shows inline error preserving other fields (already implemented), (c) 201 response redirects to `/onboarding` (already happens via `useAuth` redirect).
- Files to change: `src/components/auth/RegisterForm.tsx` (add `disabled={!consentEducation}` to submit button)
- Tests: `src/__tests__/register.test.tsx` -- render RegisterForm, verify submit disabled when essential unchecked, verify error display on 409

**T-002: Login with rate limiting**
- AC: 1.4, 1.5, 1.7
- Delta: Login already works. Verify: (a) 429 rate-limit response shows "Too many attempts" (already handled by error display), (b) flushSync click handler fix already applied. Add test coverage.
- Files to change: None (verify only)
- Tests: `src/__tests__/login-rate-limit.test.tsx` -- verify 429 error display, verify first-tap submit

**T-003: Token refresh mechanism**
- AC: 1.6
- Delta: `src/lib/api/client.ts` already implements 401-retry-with-refresh. Verify the cycle works end-to-end. Add test for silent retry.
- Files to change: None (verify only)
- Tests: `src/__tests__/api-client-refresh.test.tsx` -- mock fetch, verify 401 triggers refresh then retry

**T-004: Persona gateway and calibration wiring**
- AC: 2.1, 2.2, 2.3
- Delta: Onboarding page already fetches personas, presents calibration, submits selection. Fully wired. Verify 7 personas displayed (depends on seed data). Ensure seed script populates 7 personas.
- Files to change: `scripts/seed.ts` (verify 7 personas for `financial-literacy` vertical)
- Tests: `src/__tests__/onboarding.test.tsx` -- render with mocked API, verify persona cards, calibration flow, redirect to dashboard

#### Phase 2: Core learner experience (T-005 through T-010) -- Partially parallelizable

**T-005: Course catalog with search, filters, and tier badges** (parallel with T-006)
- AC: 3.1, 3.2, 3.3, 3.4
- Delta: CourseCatalog works with both API and static fallback. Missing: (a) subscription tier badge on cards, (b) lock icon for Professional-only courses on Free-tier users.
- Files to change:
  - `src/components/catalog/CourseCard.tsx` -- add `subscription_tier` prop, render lock icon + "Professional" badge when `tier === 'professional'` and user is free-tier
  - `src/components/catalog/CourseCatalog.tsx` -- pass user subscription status to CourseCard
  - `contracts/api/courses.ts` -- add `subscription_tier` to `CourseSummary` type
  - `server/services/courseService.ts` -- join `subscription_plans` or add `subscription_tier` column to courses query
- Tests: `src/__tests__/course-catalog.test.tsx` -- verify search filter, category filter, lock icon on Professional course

**T-006: Studio publish-to-learner data pipeline** (parallel with T-005)
- AC: supports FR-3
- Delta: Studio pipeline (SetupStage through PublishStage) exists but no publish step writes to the `courses`/`modules`/`lessons` tables that the learner catalog reads. Need to verify the publish endpoint in `server/routes/studio.ts` writes to learner-facing tables, or build a migration step.
- Files to change:
  - `server/routes/studio.ts` -- verify publish stage writes `is_published = true` and populates `content_foundational`, `content_working`, `content_applied` in lessons table
  - `scripts/seed-courses.ts` -- ensure seed script populates learner-facing courses with tiered content blocks for testing
- Tests: `server/__tests__/publish-pipeline.test.ts` -- verify published track appears in `/api/v1/courses`

**T-007: Lesson player -- TextBlock and QuizBlock wiring**
- AC: 4.1, 4.2, 4.3
- Delta: (a) LessonPlayer page passes wrong tier (`user?.data_saver_mode` instead of proficiency level). (b) QuizBlock auto-submits on click -- need two-step select + submit per AC-4.2. (c) `onQuizSubmit` and `onProgressUpdate` are no-ops.
- Files to change:
  - `src/app/pages/LessonPlayer.tsx`:
    - Fix tier: fetch user persona from `/learner/persona` or use `user?.proficiency_level`
    - Wire `onProgressUpdate` to call progress sync API via `api.post('/learner/lessons/:lessonId/progress', ...)`
    - Wire `onQuizSubmit` to call quiz API
    - Wire `onLessonComplete` to trigger credential check
  - `src/components/content/QuizBlock.tsx`:
    - Change from auto-submit-on-click to two-step: select option (highlight), then tap "Submit" button. Submit button disabled until option selected.
  - `src/components/course/LessonPlayer.tsx`:
    - Pass `onArtifactSubmit` and `onScenarioComplete` callbacks through
- Tests: `src/__tests__/quiz-block.test.tsx` -- verify submit disabled until selection, verify feedback on submit

**T-008: Lesson player -- ScenarioBlock and ArtifactPromptBlock wiring**
- AC: 4.4, 4.5
- Delta: (a) ArtifactPromptBlock has no minimum character validation (50 chars). (b) Artifact and scenario submissions are not posted to the API from LessonPlayer page.
- Files to change:
  - `src/components/content/ArtifactPromptBlock.tsx`:
    - Add 50-char minimum: disable submit when `text.trim().length < 50`, show character count and helper text
  - `src/app/pages/LessonPlayer.tsx`:
    - Wire `onArtifactSubmit` callback to `api.post('/learner/lessons/:lessonId/artifacts', { block_id, response_text })`
    - Wire `onScenarioComplete` callback to `api.post('/learner/lessons/:lessonId/scenarios', { block_id, decisions })`
- Tests: `src/__tests__/artifact-block.test.tsx` -- verify submit disabled under 50 chars, verify submit calls API

**T-009: Block progression and tier enforcement**
- AC: 4.6, 4.7
- Delta: (a) LessonPlayer shows all blocks navigable via dot pagination -- need to lock unvisited blocks past current. (b) Server already returns 402/403 for tier-blocked content; client already redirects to pricing on 402 and shows error on 403. Verify 403 shows upgrade prompt.
- Files to change:
  - `src/components/course/LessonPlayer.tsx`:
    - Sequential lock: dot buttons for index > currentMaxReached are disabled/dimmed. "Next" button only advances when current block is "completed" (text read, quiz answered, scenario done, artifact submitted).
    - Track per-block completion state
  - `src/app/pages/LessonPlayer.tsx`:
    - On 403 response, show upgrade CTA linking to `/pricing` instead of generic error
- Tests: `src/__tests__/lesson-player-progression.test.tsx` -- verify locked blocks, verify 403 shows upgrade prompt

**T-010: Progress tracking and dashboard**
- AC: 5.1, 5.2, 5.3
- Delta: Dashboard already displays enrolled courses with progress. Missing: "Recommended Next" section.
- Files to change:
  - `server/services/progressService.ts`:
    - Add `getRecommendedCourse(userId)` function: query user_personas for persona_slug, find courses in matching category not yet enrolled, return first
  - `server/routes/progress.ts`:
    - Add recommended course to dashboard response, or add separate `GET /api/v1/learner/recommended` endpoint
  - `src/app/pages/Dashboard.tsx`:
    - Render "Recommended Next" section from dashboard API response
    - Contracts update: add `recommended_course` field to `LearnerDashboard` type
- Tests: `src/__tests__/dashboard.test.tsx` -- verify in-progress courses render with percentages, verify recommended course renders

#### Phase 3: Offline, data saver, credentials (T-011 through T-015) -- Parallelizable

**T-011: Offline sync hardening (foreground-only)**
- AC: 6.1, 6.2, 6.3, 6.4
- Delta: (a) Sync engine posts to `/api/v1/progress/sync` but that endpoint does not exist. Need to either create it or change the sync engine to use the existing `/api/v1/learner/lessons/:lessonId/progress` endpoint. (b) Lesson content not cached to IndexedDB on load. (c) Service worker must not register BackgroundSync.
- Files to change:
  - `src/lib/sync/useSyncEngine.ts`:
    - Change `SYNC_ENDPOINT` to post to existing per-lesson progress endpoints, or batch-sync via a new server route
    - Add content caching: after fetching lesson content, write blocks to a new Dexie `lessonContent` table
  - `src/lib/progress/db.ts`:
    - Add `lessonContent` table: `{ id, lessonId, courseId, tier, blocks, cachedAt }`
    - Bump Dexie version to 2
  - `src/app/pages/LessonPlayer.tsx`:
    - On successful API fetch, cache content to Dexie
    - On fetch failure (offline), read from Dexie cache
    - Show sync-pending indicator when offline progress exists
  - Service worker file (likely `public/sw.js` or Workbox config): audit for no `BackgroundSync` or `periodicSync` registrations
  - Server route: add `POST /api/v1/progress/sync` batch endpoint if batch sync is preferred over individual calls
- Tests:
  - `src/__tests__/sync-engine.test.ts` -- mock Dexie, verify foreground sync triggers
  - `src/__tests__/offline-content.test.ts` -- verify content cached to IndexedDB, verify fallback read

**T-012: Data saver mode wiring**
- AC: 7.1, 7.2, 7.3, 7.4
- Delta: All three modes already work in TextBlock. DataSaverBadge exists. Profile page has mode selector. Need to verify: (a) ultra_light suppresses `<img>` in all content blocks, not just TextBlock. (b) data_saver compresses images. (c) Mode persists in localStorage.
- Files to change:
  - `src/components/content/TextBlock.tsx`:
    - Verify `renderReduced` strips images (it does: `html.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')`)
    - For data_saver mode, images should be compressed not stripped -- currently stripped. Fix: render images with `width="480"` and WebP `srcset`
  - `src/components/content/ScenarioBlock.tsx`, `ArtifactPromptBlock.tsx`:
    - These don't render images, so no change needed
- Tests: `src/__tests__/text-block-data-saver.test.tsx` -- render TextBlock with image content in each mode, verify img presence/absence

**T-013: Credential issuance on course completion**
- AC: 8.1, 8.2, 8.3
- Delta: Credential issuance API exists (`POST /api/v1/credentials/issue`) but nothing calls it when a course is completed. Need to trigger issuance when all lessons in a course reach `completed` status.
- Files to change:
  - `server/services/progressService.ts`:
    - In `syncProgress`, after updating progress: check if all lessons in the course are now completed. If yes, call `issueCredential(userId, courseId, 'completion_badge')`.
    - Import `issueCredential` from `credentialService`
  - `src/app/pages/LessonPlayer.tsx`:
    - On `onLessonComplete`, show a "Course Complete" modal or toast if this was the last lesson, with link to credentials page
  - Profile page: add navigation links to credentials and billing
- Files to change (Profile links):
  - `src/app/pages/Profile.tsx`: add links to `/credentials` and `/pricing`
- Tests: `server/__tests__/credential-issuance.test.ts` -- verify credential created when final lesson completed

**T-014: Public credential verification page**
- AC: 9.1, 9.2
- Delta: VerifyPage component and public API endpoint both exist and work. Need to verify: (a) invalid ID shows "This credential could not be found" (currently shows generic "Verification Error"). (b) Page accessible without auth.
- Files to change:
  - `src/components/credentials/VerifyPage.tsx`:
    - Change error message for 404/not-found to "This credential could not be found" specifically
  - `server/services/credentialService.ts`:
    - In `verifyCredential`, return `{ valid: false }` (not throw) for nonexistent credential IDs
- Tests: `src/__tests__/verify-page.test.tsx` -- verify valid credential displays, verify invalid shows "could not be found"

**T-015: Paystack plan selection and checkout**
- AC: 10.1, 10.2, 10.3, 10.4, 10.5
- Delta: (a) Pricing page uses hardcoded plan data instead of PlanSelector component. (b) PlanSelector fetches from API but Pricing page does not use it. (c) PaystackCheckout component exists but is not invoked from any page. (d) SubscriptionStatus and InvoiceList components exist but are not mounted anywhere. (e) Server-side tier enforcement already works via paywall middleware.
- Files to change:
  - `src/app/pages/Pricing.tsx`:
    - Replace hardcoded plans with PlanSelector component
    - Wire `onSelectPlan` to trigger PaystackCheckout
    - Add SubscriptionStatus display for authenticated users
  - `src/app/pages/Profile.tsx`:
    - Add billing section with SubscriptionStatus and InvoiceList components
  - `src/components/payments/PaystackCheckout.tsx`:
    - Verify it calls `POST /api/v1/payments/initialize` and redirects to Paystack authorization_url
  - `src/components/payments/SubscriptionStatus.tsx`:
    - Verify it calls `GET /api/v1/subscriptions/current`
  - `src/components/payments/InvoiceList.tsx`:
    - Wire to list user payment history (may need a learner-facing invoice endpoint vs current admin-only endpoint)
  - `server/routes/payments.ts`:
    - Add `GET /api/v1/learner/invoices` endpoint for individual learner payment history (currently only admin endpoint exists)
- Tests: `src/__tests__/pricing-page.test.tsx` -- verify plans load, verify subscribe button triggers checkout

#### Phase 4: Cross-cutting concerns (T-016 through T-019) -- Parallelizable

**T-016: Performance budget enforcement**
- AC: TTI <5s on 3G, critical JS <170KB
- Delta: No performance tooling exists.
- Files to change:
  - `vite.config.ts`: add `build.rollupOptions.output.manualChunks` to split vendor, content-blocks, and studio into separate chunks (studio must not be in critical path)
  - Create `scripts/perf-budget.ts`: run Lighthouse CI against built app with 3G throttle, assert TTI <5s and total JS for initial route <170KB
  - Audit lazy-loading: Studio, AdminDashboard, ConceptCatalog are already lazy. Verify CourseDetail, LessonPlayer, Credentials, Pricing are lazy (they are). Dashboard is lazy. Good.
- Tests: `scripts/perf-budget.ts` (not unit test -- CI integration script)

**T-017: WCAG 2.2 AA compliance pass**
- AC: P16
- Delta: Touch targets already >= 44px (`min-h-[44px]` on buttons). Need to verify: focus management on route changes, screen reader landmarks, color contrast >= 4.5:1.
- Files to change:
  - `src/components/layout/AppShell.tsx`: ensure `<main>`, `<nav>`, `<header>` landmarks present
  - `src/app/App.tsx`: add focus management on route change (scroll-to-top, focus main content)
  - Audit all text colors against backgrounds for 4.5:1 contrast
- Tests: automated axe-core scan in `src/__tests__/a11y.test.tsx`

**T-018: Audit logging**
- AC: P14
- Delta: Auth events are logged via console. Need structured audit logging to `audit_log` table.
- Files to change:
  - `server/auth/routes.ts`: after login/register/refresh/failed-attempt, insert into `audit_log` table with event_type, user_id, ip, timestamp
  - `server/services/credentialService.ts`: log credential issuance events
  - `server/routes/payments.ts`: log subscription change events
  - Migration: verify `audit_log` table exists in migration 001 (it does based on TABLES constant)
- Tests: `server/__tests__/audit-log.test.ts` -- verify login creates audit entry

**T-019: Input validation hardening**
- AC: P10
- Delta: Server-side Zod validation exists on all routes. Verify: (a) artifact text max length (10000 chars already enforced). (b) Email format validated. (c) Password strength enforced. All already done. Edge case: verify text length limit on scenario decisions.
- Files to change: `server/routes/progress.ts` -- add `.max(500)` to scenario decision `choiceLabel` and `feedback` fields
- Tests: `server/__tests__/input-validation.test.ts` -- verify oversized payloads rejected

#### Phase 5: E2E and deploy (T-020 through T-021) -- Sequential

**T-020: E2E test suite**
- Files to create:
  - `e2e/setup.ts` -- test fixtures, seed data helper
  - `e2e/auth.spec.ts` -- register, login, rate-limit, token refresh
  - `e2e/onboarding.spec.ts` -- persona selection, calibration, tier assignment
  - `e2e/catalog.spec.ts` -- search, filter, tier badge
  - `e2e/lesson.spec.ts` -- block progression, quiz, artifact, scenario
  - `e2e/credential.spec.ts` -- completion badge, verify page
  - `e2e/payment.spec.ts` -- plan selection, checkout redirect
  - `e2e/offline.spec.ts` -- content cache, offline progress, foreground sync
  - `playwright.config.ts` -- 3G throttle profile, mobile viewport (360x800)
- Tests: Playwright E2E against running dev server

**T-021: Production deployment**
- No code changes. Interactive deploy via webhook.
- Pre-deploy checklist:
  1. `npm audit` -- no critical vulnerabilities
  2. `npm run build` -- zero errors, zero warnings
  3. Performance budget script passes
  4. All E2E tests pass
  5. `package-lock.json` committed (SBOM)
  6. `.env` has production values for `DATABASE_URL`, `JWT_SECRET`, `PAYSTACK_SECRET_KEY`, `REDIS_URL`, `APP_BASE_URL`
- Deploy command: `curl -X POST http://172.17.0.1:3625/deploy/full -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"project":"sabificate"}'`
- Rollback: `git revert HEAD && <same deploy command>`
- Post-deploy verification: hit `/api/v1/courses` and `/verify/test-id` from external browser

### Test strategy

| Level | Framework | What |
|---|---|---|
| Unit (component) | vitest + @testing-library/react | Each AC has at least one test. Components tested in isolation with mocked API. |
| Unit (server) | vitest | Service functions tested against pg-mem or mocked query. |
| Integration | vitest | API routes tested via Fastify inject. |
| E2E | Playwright | Happy path + edge cases against running app. 3G throttle profile. |
| Performance | Lighthouse CI | TTI <5s, JS <170KB on critical path. |
| Accessibility | axe-core via vitest | WCAG 2.2 AA automated checks. |

**TDD Iron Law**: Every AC maps to a test file. Test is written first, verified failing, then implementation makes it pass. Test files named by AC group (e.g., `register.test.tsx` covers AC-1.1 through AC-1.3).

---

## S4 Deploy Plan

| Field | Value |
|---|---|
| **Target** | `sabificate.forwardai.dev` (Hetzner, `5.161.236.61`) |
| **Command** | `curl -X POST http://172.17.0.1:3625/deploy/full -H "Authorization: Bearer $DEPLOY_TOKEN" -H "Content-Type: application/json" -d '{"project":"sabificate"}'` |
| **Rollback** | Revert to previous commit: `git revert HEAD`, then re-run deploy webhook |
| **Interactive-only** | Confirmed. Deploy is triggered by human via curl. No CI automation. |

### Pre-deploy gates

1. All unit tests pass: `npx vitest run`
2. All E2E tests pass: `npx playwright test`
3. Build succeeds: `NODE_ENV=production npx vite build`
4. `npm audit` shows no critical vulnerabilities
5. Performance budget passes: `node scripts/perf-budget.ts`
6. Two-reviewer merge gate passed on all task branches

---

## S5 Constitution Re-check

### SI Core Rules

- [x] **No external API calls** -- All logic runs on own Fastify server. Only external call is Paystack API (approved exception SII).
- [x] **Secrets in .env only** -- `JWT_SECRET`, `DATABASE_URL`, `PAYSTACK_SECRET_KEY`, `REDIS_URL` all in `.env`, `.env` in `.gitignore`.
- [x] **Interactive-only deploys** -- Deploy via curl webhook, human-triggered. No CI deploy automation.

### SII Process Rules

- [x] **Spec-gate before code** -- Spec is GATE-2 APPROVED. Plan is this document, GATE-3 APPROVED.
- [x] **TDD Iron Law** -- Every task writes tests before implementation. Vitest for unit, Playwright for E2E.
- [x] **Fresh subagent per task** -- Each T-xxx task runs in a fresh git worktree with isolated subagent.
- [x] **Two-reviewer merge gate** -- No task branch merges without two passing reviews.

### SII-B Security Controls

- [x] **P10 Input validation** -- Zod schemas on all server routes. Artifact text capped at 10,000 chars, 50-char minimum. Email/password validated.
- [x] **P11 Server-side authZ** -- JWT verified on all protected endpoints. Paywall middleware checks subscription tier.
- [x] **P12 TLS** -- HTTPS enforced at reverse proxy. HSTS header set.
- [x] **P13 Tenant isolation** -- All queries scoped by `user_id`. No cross-user data access.
- [x] **P14 Audit logging** -- Auth events, credential issuance, subscription changes logged to `audit_log` table (T-018).
- [x] **P15 SBOM** -- `package-lock.json` committed. `npm audit` in pre-deploy checklist.
- [x] **P16 WCAG 2.2 AA** -- Touch targets >= 44px, contrast audit, landmarks, focus management (T-017).
- [x] **P17 AI governance** -- N/A for learner app (Claude API only in Studio pipeline).
- [x] **P18 NDPA compliance** -- 3-tier consent at registration, essential required, consent recorded in `consent_records` table.

---

## S6 Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Paystack test mode does not accurately replicate webhook behavior for NGN transactions | Medium | Medium | Use Paystack test keys with documented test card numbers. Manually verify webhook flow in staging before production deploy. |
| R-2 | Performance budget (<170KB JS, <5s TTI on 3G) may be hard to meet with current bundle | Medium | High | Code-split aggressively: Studio, admin, and content-block components are already lazy-loaded. Measure early in Phase 2. If over budget, tree-shake unused content blocks or defer non-critical CSS. |
| R-3 | Dexie schema migration (adding `lessonContent` table) could break existing IndexedDB data on returning users | Low | Medium | Increment Dexie version to 2 with proper upgrade handler. Test upgrade path from v1 schema. |
| R-4 | Seed data may not include 7 personas with calibration questions, breaking onboarding tests | Medium | Low | Verify seed script before Phase 1 tasks begin. Add missing personas to seed if needed. |
| R-5 | Studio publish pipeline may not write tiered content (content_foundational/working/applied) to lessons table | Medium | High | Audit studio.ts publish endpoint in T-006. If publish does not write tiered content, build a migration script to populate from authoring_tracks. |
| R-6 | Background sync may be registered by Workbox default config despite foreground-only intent | Low | Medium | Audit Workbox config and service worker for BackgroundSync/periodicSync registrations in T-011. Remove if found. |
| R-7 | QuizBlock UX change (from single-tap to select-then-submit) may feel slower to users | Low | Low | Keep the interaction snappy: highlight selection immediately, submit button is prominent and close to options. A/B test post-launch if feedback indicates friction. |

---

## S7 Open Questions

| # | Question | Impact | Owner | Plan Default |
|---|---|---|---|---|
| OQ-1 | What is the exact course count for v1 launch? Full 238-course catalog or a curated subset? | Affects seed data, performance testing, catalog UX | Product | Default: seed with the 30 static course templates already in codebase. Add more via Studio publish pipeline. |
| OQ-2 | Should calibration allow re-taking to change proficiency level, or is first assignment permanent for v1? | Affects onboarding UX -- the current code uses `ON CONFLICT DO UPDATE` which allows re-selection | Product | Default: allow re-take (current behavior). Persona selection can be changed from profile. |
| OQ-3 | What is the Paystack Professional tier price in NGN? | Blocks payment test fixtures and Pricing page display | Business | Default: use NGN 2,500/month as shown in current Pricing page hardcoded data. |
| OQ-4 | What is the minimum artifact length for ArtifactPromptBlock (currently spec'd at 50 chars)? | Affects validation logic in T-008 | Curriculum | Default: 50 characters as spec'd. |
| OQ-5 | Should credential QR codes encode the full URL or a short-code that redirects? | Affects QR density and scanning reliability on low-res screens | Engineering | Default: full URL (`https://sabificate.forwardai.dev/verify/:id`). Short-code adds a redirect hop and a new endpoint. |
| OQ-6 | Is the publish-to-learner data pipeline a one-time seed or a continuous sync from Studio? | Affects T-006 architecture | Engineering | Default: Studio publish writes directly to learner-facing tables (courses/modules/lessons). This is a one-time write per publish action, not continuous sync. The `is_published` flag gates visibility. |
| OQ-7 | Should the sync batch endpoint (`POST /api/v1/progress/sync`) be implemented as a new route, or should the sync engine be refactored to call individual per-lesson endpoints? | Affects T-011 complexity | Engineering | Default: implement batch sync endpoint. It is simpler for the client and reduces HTTP requests on reconnect. |