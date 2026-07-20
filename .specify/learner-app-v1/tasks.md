# SABIficate Learner App v1 — Praxis Tasks

| Field | Value |
|---|---|
| **Feature** | SABIficate Learner App v1 |
| **Plan version** | 1.0.0 |
| **Status** | GATE-4 APPROVED |
| **Spec version** | 1.0.0 |
| **Constitution version** | 2.0.0 |
| **Date** | 2026-07-20 |

---

## Legend

- `[parallel]` = safe to run concurrently with other tasks in the same phase
- `depends: T-NNN` = must wait for T-NNN to merge before starting
- Every task begins with a **failing test** (TDD Iron Law)
- Every task runs in a **fresh worktree subagent** (Constitution SII)
- Every task passes **two-reviewer merge gate** before merging (Constitution SII)

---

## Phase 1: Auth and Onboarding Wiring

### T-001 — Registration Flow with NDPA Consent [parallel]

**Traces to:** FR-1 / AC-1.1, AC-1.2, AC-1.3

**Failing test to write first:**
File: `/workspace/app/src/__tests__/register.test.tsx`
```
- Render RegisterForm; uncheck essential consent; assert submit button has `disabled` attribute
- Render RegisterForm; check essential consent, fill valid fields, submit; mock API 201; assert redirect to /onboarding
- Render RegisterForm; submit with duplicate email; mock API 409; assert "Email already registered" displayed; assert name and password fields retain values
```

**Implementation summary:**
- In `src/components/auth/RegisterForm.tsx`: add explicit `disabled={!consentEducation}` attribute to the submit button (currently only JS-guarded). Ensure 409 error handler preserves form field values and displays inline error without clearing fields.
- Verify `server/auth/routes.ts` register endpoint returns 201 with tokens and handles duplicate email with 409.

**Done when:**
- All 3 tests pass
- Submit button is visually and semantically disabled when essential consent unchecked
- 409 duplicate email shows inline error preserving other fields
- 201 success redirects to `/onboarding`

**Isolation:** worktree `t-001-registration-ndpa`
**Depends:** none

---

### T-002 — Login, Rate Limiting, and Token Refresh [parallel]

**Traces to:** FR-1 / AC-1.4, AC-1.5, AC-1.6, AC-1.7

**Failing test to write first:**
File: `/workspace/app/src/__tests__/login-auth.test.tsx`
```
- Render LoginForm; fill correct credentials; mock API 200 with tokens; assert redirect to /dashboard
- Render LoginForm; mock API 429 with Retry-After header; assert "Too many attempts" message displayed
- Render LoginForm on mobile viewport; tap submit once; assert form submits on first tap (flushSync verification)
```
File: `/workspace/app/src/__tests__/api-client-refresh.test.tsx`
```
- Mock fetch: first call returns 401, refresh endpoint returns new token, retry succeeds with 200; assert original request retried with new token transparently
- Mock fetch: 401 then refresh also fails; assert redirect to /login
```

**Implementation summary:**
- Verify existing LoginForm handles 429 response and displays "Too many attempts" message. If not, add handler for 429 status in error display logic.
- Verify `src/lib/api/client.ts` 401-retry-with-refresh cycle. Ensure refresh failure redirects to login preserving current location for post-login redirect.
- Verify flushSync is applied to LoginForm submit handler (already done per plan context).

**Done when:**
- All 5 tests pass
- 429 displays "Too many attempts" with retry information
- Token refresh silently retries failed requests
- Refresh failure redirects to login
- First-tap submit works on mobile

**Isolation:** worktree `t-002-login-rate-refresh`
**Depends:** none

---

### T-003 — Persona Gateway and Calibration Wiring [parallel]

**Traces to:** FR-2 / AC-2.1, AC-2.2, AC-2.3

**Failing test to write first:**
File: `/workspace/app/src/__tests__/onboarding.test.tsx`
```
- Render Onboarding page; mock GET /api/v1/personas returning 7 personas; assert 7 persona cards rendered with name, description, and icon
- Click a persona card; mock calibration questions endpoint; assert 3-5 calibration questions rendered sequentially
- Answer all calibration questions; mock proficiency assignment response; assert redirect to /dashboard
- Assert proficiency level (foundational/working/applied) is persisted: mock POST includes level in request body
```

**Implementation summary:**
- Verify `src/app/pages/Onboarding.tsx` fetches personas from API and renders 7 cards. Verify seed data includes 7 personas with calibration questions for the `financial-literacy` vertical.
- Verify calibration flow posts answers and receives proficiency level assignment.
- Update `scripts/seed.ts` if fewer than 7 personas exist in seed data.

**Done when:**
- All 4 tests pass
- 7 persona cards display with name, description, icon
- Calibration questions appear after persona selection
- Proficiency level assigned and persisted on completion
- Redirect to dashboard after calibration

**Isolation:** worktree `t-003-persona-calibration`
**Depends:** none

---

## Phase 2: Core Learner Experience

### T-004 — Course Catalog with Search, Filters, and Tier Badges [parallel]

**Traces to:** FR-3 / AC-3.1, AC-3.2, AC-3.3, AC-3.4

**Failing test to write first:**
File: `/workspace/app/src/__tests__/course-catalog.test.tsx`
```
- Render CourseCatalog; mock API returning 10 courses; assert all course cards rendered with title, category, duration, proficiency level, and tier badge
- Type "negotiation" in search field; assert only courses with "negotiation" in title or description displayed (case-insensitive)
- Select "Leadership" category filter; assert only Leadership courses displayed; assert active filter visually indicated
- Render with user on Free tier; assert Professional-only course cards show lock icon and "Professional" badge
- Render with user on Professional tier; assert no lock icons displayed
```

**Implementation summary:**
- `src/components/catalog/CourseCard.tsx`: add `subscription_tier` display. Render lock icon (LockClosedIcon or similar) and "Professional" badge when course is `tier: 'professional'` and user is on Free tier. Accept `userTier` prop.
- `src/components/catalog/CourseCatalog.tsx`: pass user subscription status to CourseCard. Fetch user tier from auth context.
- `contracts/api/courses.ts`: add `subscription_tier` to `CourseSummary` type if missing.
- `server/services/courseService.ts`: include `subscription_tier` in course list query response.

**Done when:**
- All 5 tests pass
- Catalog displays all published courses with complete metadata
- Search filters by title and description (case-insensitive)
- Category filter narrows results with visual indication
- Lock icon and "Professional" badge on tier-restricted courses for Free users

**Isolation:** worktree `t-004-catalog-tier-badges`
**Depends:** none

---

### T-005 — Studio Publish-to-Learner Data Pipeline [parallel]

**Traces to:** FR-3 (supporting), FR-4 (supporting)

**Failing test to write first:**
File: `/workspace/app/server/__tests__/publish-pipeline.test.ts`
```
- Call studio publish endpoint for a track; assert course record created in `courses` table with `is_published = true`
- Assert modules and lessons created with `content_foundational`, `content_working`, `content_applied` fields populated
- Call GET /api/v1/courses; assert published course appears in catalog response
- Call GET /api/v1/courses; assert unpublished course does NOT appear in catalog response
```

**Implementation summary:**
- Audit `server/routes/studio.ts` publish stage to verify it writes to `courses`, `modules`, `lessons` tables with tiered content. If it only writes to authoring tables, add a migration step that copies published content to learner-facing tables.
- Verify `is_published` flag gates visibility in `server/services/courseService.ts` list query.
- Update `scripts/seed-courses.ts` to populate learner-facing courses with tiered content blocks for testing.

**Done when:**
- All 4 tests pass
- Studio publish writes to learner-facing tables
- Tiered content (foundational/working/applied) populated in lessons
- Only published courses appear in catalog API

**Isolation:** worktree `t-005-publish-pipeline`
**Depends:** none

---

### T-006 — Lesson Player Wiring: All Block Types and Proficiency

**Traces to:** FR-4 / AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5

**Failing test to write first:**
File: `/workspace/app/src/__tests__/quiz-block.test.tsx`
```
- Render QuizBlock with options; assert submit button exists and is disabled
- Select an option; assert submit button becomes enabled
- Select option and click submit; mock correct answer; assert "Correct" feedback with explanation displayed
- Select option and click submit; mock incorrect answer; assert "Incorrect" feedback with explanation displayed
```
File: `/workspace/app/src/__tests__/artifact-block.test.tsx`
```
- Render ArtifactPromptBlock; type 30 characters; assert submit button disabled; assert character count shows "30/50"
- Type 50 characters; assert submit button enabled
- Type 50+ characters and submit; mock API; assert artifact saved and block marked completed
```
File: `/workspace/app/src/__tests__/lesson-player-tier.test.tsx`
```
- Render LessonPlayer with user proficiency "foundational"; mock lesson API; assert TextBlock renders foundational content variant (not working or applied)
- Render LessonPlayer with user proficiency "applied"; assert applied content variant rendered
```

**Implementation summary:**
- `src/components/content/QuizBlock.tsx`: refactor from auto-submit-on-click to two-step flow. Add selection state (highlight chosen option), add explicit "Submit" button, disable button until option selected, show correct/incorrect feedback with explanation after submit.
- `src/components/content/ArtifactPromptBlock.tsx`: add 50-char minimum validation. Disable submit when `text.trim().length < 50`. Show character count (`${count}/50 characters minimum`). Show helper text below input.
- `src/app/pages/LessonPlayer.tsx`:
  - Fix tier: replace `user?.data_saver_mode` with `user?.proficiency_level` or fetch from persona endpoint.
  - Wire `onQuizSubmit` to `api.post('/learner/lessons/:lessonId/quiz', { block_id, selected_option })`.
  - Wire `onArtifactSubmit` to `api.post('/learner/lessons/:lessonId/artifacts', { block_id, response_text })`.
  - Wire `onScenarioComplete` to `api.post('/learner/lessons/:lessonId/scenarios', { block_id, decisions })`.
  - Wire `onProgressUpdate` to progress sync API.

**Done when:**
- All 8 tests pass
- QuizBlock uses two-step select-then-submit flow
- ArtifactPromptBlock enforces 50-char minimum with character count
- ScenarioBlock submissions wired to API
- LessonPlayer uses correct proficiency level for content tier resolution
- All block callbacks wired to real API endpoints

**Isolation:** worktree `t-006-lesson-player-wiring`
**Depends:** T-005 (needs published courses with tiered content for integration)

---

### T-007 — Block Progression and Tier Enforcement

**Traces to:** FR-4 / AC-4.6, AC-4.7

**Failing test to write first:**
File: `/workspace/app/src/__tests__/lesson-player-progression.test.tsx`
```
- Render LessonPlayer with 3 blocks [TextBlock, QuizBlock, ScenarioBlock]; complete TextBlock only; assert QuizBlock is active/interactive; assert ScenarioBlock is locked (disabled dots, visually dimmed, not interactive)
- Complete TextBlock and QuizBlock; assert ScenarioBlock becomes active
- Attempt to click locked ScenarioBlock dot; assert no navigation occurs
```
File: `/workspace/app/src/__tests__/tier-enforcement.test.tsx`
```
- Navigate to lesson URL for Professional course as Free-tier user; mock API 403; assert upgrade prompt displayed with link to /pricing
- Navigate to same lesson as Professional-tier user; mock API 200; assert lesson content rendered normally
```

**Implementation summary:**
- `src/components/course/LessonPlayer.tsx`: implement sequential lock. Track `completedBlockIndices` set. Dot buttons for `index > max(completedBlockIndices) + 1` are disabled and visually dimmed. "Next" button only advances when current block's completion callback has fired. Each block type signals completion: TextBlock on scroll/read, QuizBlock on submit, ScenarioBlock on final choice, ArtifactPromptBlock on submit.
- `src/app/pages/LessonPlayer.tsx`: on 403 API response, render upgrade CTA component with link to `/pricing` instead of generic error message.

**Done when:**
- All 5 tests pass
- Blocks beyond current + 1 are locked and visually dimmed
- "Next" only works after current block completed
- 403 on Professional course shows upgrade prompt linking to /pricing

**Isolation:** worktree `t-007-progression-tier`
**Depends:** T-006

---

### T-008 — Progress Tracking, Dashboard, and Credential Issuance

**Traces to:** FR-5 / AC-5.1, AC-5.2, AC-5.3; FR-8 / AC-8.1, AC-8.2, AC-8.3

**Failing test to write first:**
File: `/workspace/app/src/__tests__/dashboard.test.tsx`
```
- Render Dashboard; mock API with 2 in-progress courses (40%, 75%) and 1 completed; assert "In Progress" section shows 2 cards with correct percentages; assert "Completed" section shows 1 card
- Complete a block (mock progress update); assert progress percentage updates (e.g., 50% -> 75%)
- Mock user persona "Operations Manager" with incomplete Operations courses; assert "Recommended Next" section displays a matching course
```
File: `/workspace/app/server/__tests__/credential-issuance.test.ts`
```
- Call progress sync marking final lesson of a course as completed; assert credential record created in `credentials` table with type 'completion_badge', learner name, course title, completion date, unique ID
- Call progress sync for non-final lesson; assert no credential created
```
File: `/workspace/app/src/__tests__/credential-display.test.tsx`
```
- Render Profile with 2 earned credentials; assert CredentialList shows 2 cards with course title and date
- Click credential card; assert CredentialDetail shows full info and QR code
```

**Implementation summary:**
- `server/services/progressService.ts`: add `getRecommendedCourse(userId)` -- query `user_personas` for persona, find courses in matching category not enrolled, return first. Add credential issuance trigger: after progress sync, check if all lessons in course completed, if yes call `issueCredential()`.
- `server/routes/progress.ts`: add `recommended_course` to dashboard response or add `GET /api/v1/learner/recommended` endpoint.
- `src/app/pages/Dashboard.tsx`: render "Recommended Next" section from API response.
- `src/app/pages/LessonPlayer.tsx`: on `onLessonComplete`, if course fully complete, show completion modal/toast with link to credentials.
- `src/app/pages/Profile.tsx`: add navigation links to `/credentials` and `/pricing` (billing) sections.
- `contracts/api/progress.ts`: add `recommended_course` field to `LearnerDashboard` type.

**Done when:**
- All 6 tests pass
- Dashboard shows in-progress courses with percentages, completed courses, and recommended next course
- Progress percentage updates on block completion
- Credential auto-issued on course completion
- Credentials viewable in profile with QR codes
- Profile links to credentials and billing

**Isolation:** worktree `t-008-progress-dashboard-credentials`
**Depends:** T-006

---

## Phase 3: Offline, Data Saver, Verification, Payments

### T-009 — Offline Sync Hardening (Foreground-Only) [parallel]

**Traces to:** FR-6 / AC-6.1, AC-6.2, AC-6.3, AC-6.4

**Failing test to write first:**
File: `/workspace/app/src/__tests__/sync-engine.test.ts`
```
- Mock Dexie and fetch; simulate online->offline->online cycle; assert progress written to IndexedDB when offline
- Simulate app focus event with pending offline progress; assert sync POST fires within 5 seconds; assert sync-pending indicator clears on success
- Assert sync triggers on: visibilitychange (focus), navigation event, explicit refresh button tap
- Assert NO BackgroundSync or periodicSync registrations in service worker configuration
```
File: `/workspace/app/src/__tests__/offline-content.test.ts`
```
- Fetch lesson content while online; assert content written to Dexie `lessonContent` table
- Simulate offline (fetch rejects); navigate to previously loaded lesson; assert content loaded from Dexie cache
- Assert sync-pending indicator displayed when offline progress exists unsent
```

**Implementation summary:**
- `src/lib/sync/useSyncEngine.ts`: fix `SYNC_ENDPOINT` -- either create `POST /api/v1/progress/sync` batch endpoint or refactor to call existing per-lesson progress endpoints. Add content caching: after fetching lesson content, write blocks to Dexie.
- `src/lib/progress/db.ts`: add `lessonContent` table schema `{ id, lessonId, courseId, tier, blocks, cachedAt }`. Bump Dexie version to 2 with upgrade handler.
- `src/app/pages/LessonPlayer.tsx`: on successful API fetch, cache content to Dexie. On fetch failure (offline), read from Dexie cache. Show sync-pending indicator.
- `server/routes/progress.ts`: add `POST /api/v1/progress/sync` batch endpoint accepting array of progress updates.
- Service worker audit: remove any `BackgroundSync` or `periodicSync` registrations from Workbox config or `sw.js`.

**Done when:**
- All 7 tests pass
- Lesson content cached to IndexedDB on first load
- Offline progress saved to IndexedDB with sync-pending indicator
- Progress syncs on app focus/navigation/refresh (foreground only)
- No BackgroundSync or periodicSync in service worker
- Dexie schema migration from v1 to v2 works without data loss

**Isolation:** worktree `t-009-offline-sync`
**Depends:** T-006

---

### T-010 — Data Saver Mode Wiring [parallel]

**Traces to:** FR-7 / AC-7.1, AC-7.2, AC-7.3, AC-7.4

**Failing test to write first:**
File: `/workspace/app/src/__tests__/text-block-data-saver.test.tsx`
```
- Render TextBlock with markdown containing an image in `ultra_light` mode; assert no <img> elements rendered; assert alt text displayed as placeholder
- Render same TextBlock in `data_saver` mode; assert <img> rendered with width <= 480 or WebP srcset
- Render same TextBlock in `full` mode; assert <img> rendered at original quality with no compression attributes
- Change mode via profile settings selector; assert localStorage updated; assert DataSaverBadge text updates to match selected mode
```

**Implementation summary:**
- `src/components/content/TextBlock.tsx`: currently `renderReduced` strips images for both `data_saver` and `ultra_light`. Fix: `ultra_light` strips images (show alt text placeholder), `data_saver` renders images with `width="480"` and WebP format parameter, `full` renders original.
- Verify `src/components/ui/DataSaverBadge.tsx` reads from localStorage and updates on change.
- Verify profile settings mode selector writes to localStorage.

**Done when:**
- All 4 tests pass
- `ultra_light`: no images rendered, alt text shown as placeholder
- `data_saver`: images compressed (width <= 480px or WebP)
- `full`: images at original quality
- Mode selection persists in localStorage and DataSaverBadge reflects it

**Isolation:** worktree `t-010-data-saver`
**Depends:** none

---

### T-011 — Public Credential Verification Page [parallel]

**Traces to:** FR-9 / AC-9.1, AC-9.2

**Failing test to write first:**
File: `/workspace/app/src/__tests__/verify-page.test.tsx`
```
- Render VerifyPage with valid credentialId in route params; mock public API returning credential data; assert learner name, course title, completion date, and "Verified" visual marker displayed; assert no auth required (no login redirect)
- Render VerifyPage with invalid credentialId; mock API 404; assert "This credential could not be found" message displayed; assert no server error details exposed
```

**Implementation summary:**
- `src/components/credentials/VerifyPage.tsx`: change error message handling -- on 404 or not-found response, display "This credential could not be found" specifically (currently shows generic "Verification Error").
- `server/services/credentialService.ts`: in `verifyCredential`, return `{ valid: false }` for nonexistent IDs instead of throwing (or ensure the route handler catches and returns 404 with appropriate body).
- Verify route is accessible without JWT middleware (public endpoint).

**Done when:**
- Both tests pass
- Valid credential shows full details with "Verified" marker, no auth required
- Invalid credential shows "This credential could not be found" with no error details

**Isolation:** worktree `t-011-verify-page`
**Depends:** none

---

### T-012 — Paystack Subscription Flow [parallel]

**Traces to:** FR-10 / AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5

**Failing test to write first:**
File: `/workspace/app/src/__tests__/pricing-page.test.tsx`
```
- Render Pricing page; mock plans API; assert Free and Professional tiers displayed with feature comparison and pricing in NGN
- Click "Subscribe" on Professional tier; mock payment initialization; assert PaystackCheckout triggered with correct plan amount
- Render with authenticated Professional-tier user; assert SubscriptionStatus shows "Professional"
```
File: `/workspace/app/src/__tests__/billing-profile.test.tsx`
```
- Render Profile billing section; mock 3 invoices; assert InvoiceList displays 3 entries with date, amount (NGN), and status
```
File: `/workspace/app/server/__tests__/tier-enforcement.test.ts`
```
- Request Professional course content endpoint with Free-tier JWT; assert 403 returned
- Request same endpoint with Professional-tier JWT; assert 200 with content
```

**Implementation summary:**
- `src/app/pages/Pricing.tsx`: replace hardcoded plan data with `PlanSelector` component. Wire `onSelectPlan` to trigger `PaystackCheckout`. Show `SubscriptionStatus` for authenticated users.
- `src/app/pages/Profile.tsx`: add billing section with `SubscriptionStatus` and `InvoiceList` components.
- `server/routes/payments.ts`: add `GET /api/v1/learner/invoices` endpoint for individual learner payment history if only admin endpoint exists.
- Verify `PaystackCheckout` calls `POST /api/v1/payments/initialize` and opens Paystack modal.
- Verify paywall middleware returns 403 for Free-tier users on Professional courses (AC-10.5).

**Done when:**
- All 5 tests pass
- Pricing page shows real plan data from API with feature comparison
- Subscribe button opens Paystack checkout with correct NGN amount
- Successful payment updates subscription status
- Invoice history displayed in profile billing section
- Server returns 403 for Free-tier access to Professional courses

**Isolation:** worktree `t-012-paystack-subscription`
**Depends:** none

---

## Phase 4: Cross-Cutting Concerns

### T-013 — WCAG 2.2 AA Compliance and Audit Logging [parallel]

**Traces to:** P14 (Audit Logging), P16 (WCAG 2.2 AA)

**Failing test to write first:**
File: `/workspace/app/src/__tests__/a11y.test.tsx`
```
- Render AppShell; run axe-core; assert no WCAG AA violations; assert <main>, <nav>, <header> landmarks present
- Render LoginForm; run axe-core; assert all touch targets >= 44x44px; assert color contrast >= 4.5:1
- Render CourseCatalog; run axe-core; assert no violations
- Navigate between routes; assert focus moves to main content area (focus management)
```
File: `/workspace/app/server/__tests__/audit-log.test.ts`
```
- Call login endpoint; assert audit_log entry created with event_type 'login', user_id, IP, timestamp
- Call register endpoint; assert audit_log entry for 'register'
- Call login with wrong password 5x; assert 5 'login_failed' audit entries
- Issue credential (mock course completion); assert audit_log entry for 'credential_issued'
```

**Implementation summary:**
- `src/components/layout/AppShell.tsx`: verify `<main>`, `<nav>`, `<header>` semantic landmarks. Add if missing.
- `src/app/App.tsx`: add focus management on route change -- scroll to top and focus main content region.
- Color contrast audit across all text/background combinations. Fix any below 4.5:1.
- `server/auth/routes.ts`: after login/register/refresh/failed-attempt, insert into `audit_log` table.
- `server/services/credentialService.ts`: log credential issuance to `audit_log`.
- `server/routes/payments.ts`: log subscription changes to `audit_log`.

**Done when:**
- All 8 tests pass
- No axe-core WCAG AA violations on key pages
- Semantic landmarks present in AppShell
- Focus managed on route navigation
- Auth, credential, and subscription events written to `audit_log` table

**Isolation:** worktree `t-013-a11y-audit-log`
**Depends:** none

---

### T-014 — Input Validation Hardening and Performance Budget [parallel]

**Traces to:** P10 (Input Validation), Performance budget (TTI <5s, JS <170KB)

**Failing test to write first:**
File: `/workspace/app/server/__tests__/input-validation.test.ts`
```
- POST artifact submission with 15,000 character text; assert 400 rejected (max 10,000)
- POST scenario decision with 600-char choiceLabel; assert 400 rejected (max 500)
- POST registration with invalid email format; assert 400 rejected
- POST registration with password < 8 chars; assert 400 rejected
```
File: `/workspace/app/src/__tests__/perf-budget.test.ts`
```
- Import and analyze Vite build output manifest; assert critical-path JS chunks total < 170KB gzipped
- Assert Studio, AdminDashboard, ConceptCatalog are NOT in initial chunks (lazy-loaded)
```

**Implementation summary:**
- `server/routes/progress.ts`: add `.max(500)` to scenario decision `choiceLabel` and `feedback` Zod fields.
- `vite.config.ts`: add `build.rollupOptions.output.manualChunks` to split vendor, content-blocks, and studio into separate chunks. Studio must NOT be in critical path.
- Create `scripts/perf-budget.ts`: analyze build output manifest, assert total JS for initial route < 170KB gzipped. Run Lighthouse CI with 3G throttle profile to verify TTI < 5s.
- Verify all lazy-loaded routes (Studio, AdminDashboard, ConceptCatalog, CourseDetail, LessonPlayer, Credentials, Pricing) use `React.lazy()`.

**Done when:**
- All 4 input validation tests pass
- All 2 perf budget tests pass
- Scenario decision fields capped at 500 chars server-side
- Critical-path JS < 170KB gzipped
- Studio and admin code excluded from initial bundle
- Manual chunks configured in Vite

**Isolation:** worktree `t-014-validation-perf`
**Depends:** none

---

## Phase 5: E2E and Deploy

### T-015 — E2E Test Suite

**Traces to:** All FRs, all edge cases (E-1 through E-8)

**Failing test to write first:**
File: `/workspace/app/e2e/auth.spec.ts`
```
- Register new user with NDPA consent -> assert redirect to onboarding
- Register with duplicate email -> assert "Email already registered" inline error
- Login with valid credentials -> assert redirect to dashboard
- Login 6x with wrong password -> assert "Too many attempts" on 6th
```
File: `/workspace/app/e2e/onboarding.spec.ts`
```
- Select persona -> answer calibration questions -> assert redirect to dashboard with proficiency level assigned
```
File: `/workspace/app/e2e/catalog.spec.ts`
```
- Search "negotiation" -> assert filtered results
- Filter by category -> assert narrowed results
- Free-tier user sees lock on Professional courses
```
File: `/workspace/app/e2e/lesson.spec.ts`
```
- Complete TextBlock -> QuizBlock (select then submit) -> ScenarioBlock -> ArtifactPromptBlock (50+ chars)
- Verify sequential progression: locked blocks not clickable
- Verify progress percentage updates
```
File: `/workspace/app/e2e/credential.spec.ts`
```
- Complete all lessons in course -> assert credential issued
- Visit /verify/:id -> assert credential details displayed
- Visit /verify/invalid -> assert "could not be found"
```
File: `/workspace/app/e2e/payment.spec.ts`
```
- Navigate to pricing -> assert two tiers displayed
- Click subscribe -> assert Paystack checkout initiated (test mode)
```
File: `/workspace/app/e2e/offline.spec.ts`
```
- Load lesson online -> go offline -> assert lesson content still available
- Complete block offline -> go online -> assert progress synced
```

**Implementation summary:**
- Create `playwright.config.ts` with 3G throttle profile (`{ downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 768 * 1024 / 8, latency: 150 }`), mobile viewport (360x800), Chromium only.
- Create `e2e/setup.ts` with test fixtures and seed data helper (create test user, seed courses).
- Implement all 7 spec files covering the complete learner journey.
- Test against running dev server (`npm run dev`).

**Done when:**
- All E2E specs pass against running dev server
- 3G throttle profile applied
- Mobile viewport (360x800) used
- Complete learner journey covered: register -> onboard -> browse -> learn -> complete -> credential -> verify

**Isolation:** worktree `t-015-e2e-suite`
**Depends:** T-006, T-007, T-008, T-009 (needs all learner features wired)

---

### T-016 — Production Deployment

**Traces to:** All FRs (production readiness)

**No failing test** (operational task, not code).

**Pre-deploy checklist:**
1. `npm audit` -- no critical vulnerabilities
2. `NODE_ENV=production npx vite build` -- zero errors, zero warnings
3. `npx vitest run` -- all unit tests pass
4. `npx playwright test` -- all E2E tests pass
5. `node scripts/perf-budget.ts` -- performance budget passes
6. `package-lock.json` committed (SBOM requirement P15)
7. `.env` has production values: `DATABASE_URL`, `JWT_SECRET`, `PAYSTACK_SECRET_KEY`, `REDIS_URL`, `APP_BASE_URL`
8. Two-reviewer merge gate passed on all task branches

**Deploy command:**
```
curl -X POST http://172.17.0.1:3625/deploy/full \
  -H "Authorization: Bearer $DEPLOY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project":"sabificate"}'
```

**Post-deploy verification:**
- Hit `/api/v1/courses` from external browser -- assert 200 with course data
- Hit `/verify/test-id` from external browser -- assert verification page renders
- Register a test user, complete onboarding, browse catalog -- assert full flow works
- Check HTTPS and HSTS headers present

**Rollback:**
```
git revert HEAD && <same deploy command>
```

**Done when:**
- All pre-deploy gates pass
- Deploy webhook returns success
- Post-deploy verification passes
- Site accessible at `sabificate.forwardai.dev`

**Isolation:** interactive (human-triggered, not worktree subagent)
**Depends:** T-015 (all E2E tests must pass)

---

## Merge / Integration Order

```
Phase 1 (parallel):
  T-001 ──┐
  T-002 ──┤── merge to main (any order)
  T-003 ──┘

Phase 2a (parallel after Phase 1):
  T-004 ──┐
  T-005 ──┤── merge to main (any order)

Phase 2b (sequential):
  T-006 ─── depends: T-005 ─── merge to main
  T-007 ─── depends: T-006 ─── merge to main
  T-008 ─── depends: T-006 ─── merge to main (parallel with T-007)

Phase 3 (parallel after Phase 2):
  T-009 ──┐
  T-010 ──┤
  T-011 ──┤── merge to main (any order)
  T-012 ──┘

Phase 4 (parallel after Phase 3):
  T-013 ──┐── merge to main (any order)
  T-014 ──┘

Phase 5 (sequential after Phase 4):
  T-015 ─── depends: all above ─── merge to main
  T-016 ─── depends: T-015 ─── interactive deploy
```

---

## Constitution Gate Checklist (per task)

Before any task branch merges to main, verify:

- [ ] **Failing test written first** — test existed and failed before implementation code was written
- [ ] **All tests pass** — `npx vitest run` exits 0
- [ ] **No external API calls** — only Paystack (approved exception) hits external endpoints
- [ ] **Secrets in .env only** — no secrets in code, no `.env` committed
- [ ] **Input validation** — all user inputs validated server-side with Zod
- [ ] **Server-side authZ** — JWT verified on protected endpoints, tier checked for course access
- [ ] **Tenant isolation** — all DB queries scoped by `user_id`
- [ ] **WCAG 2.2 AA** — touch targets >= 44px, contrast >= 4.5:1, landmarks present
- [ ] **NDPA compliance** — essential consent required, consent recorded
- [ ] **No BackgroundSync** — service worker uses foreground-only sync
- [ ] **SBOM** — `package-lock.json` committed, `npm audit` clean
- [ ] **Two-reviewer gate** — two passing reviews before merge
- [ ] **Fresh worktree** — task ran in isolated worktree subagent

---

## Traceability

| FR | AC | Task ID | Task Summary |
|---|---|---|---|
| FR-1 | AC-1.1, AC-1.2, AC-1.3 | T-001 | Registration flow with NDPA consent |
| FR-1 | AC-1.4, AC-1.5, AC-1.7 | T-002 | Login, rate limiting, and first-tap fix |
| FR-1 | AC-1.6 | T-002 | Token refresh mechanism |
| FR-2 | AC-2.1, AC-2.2, AC-2.3 | T-003 | Persona gateway and calibration wiring |
| FR-3 | AC-3.1, AC-3.2, AC-3.3, AC-3.4 | T-004 | Course catalog with search, filters, and tier badges |
| FR-3 | — | T-005 | Studio publish-to-learner data pipeline |
| FR-4 | AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5 | T-006 | Lesson player wiring: all block types and proficiency |
| FR-4 | AC-4.6, AC-4.7 | T-007 | Block progression and tier enforcement |
| FR-5 | AC-5.1, AC-5.2, AC-5.3 | T-008 | Progress tracking, dashboard, and credential issuance |
| FR-6 | AC-6.1, AC-6.2, AC-6.3, AC-6.4 | T-009 | Offline sync hardening (foreground-only) |
| FR-7 | AC-7.1, AC-7.2, AC-7.3, AC-7.4 | T-010 | Data saver mode wiring |
| FR-8 | AC-8.1, AC-8.2, AC-8.3 | T-008 | Credential issuance on completion (combined with progress) |
| FR-9 | AC-9.1, AC-9.2 | T-011 | Public credential verification page |
| FR-10 | AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5 | T-012 | Paystack subscription flow |
| All | P14 | T-013 | Audit logging |
| All | P16 | T-013 | WCAG 2.2 AA compliance |
| All | P10 | T-014 | Input validation hardening |
| All | — | T-014 | Performance budget enforcement (TTI <5s, JS <170KB) |
| All | — | T-015 | E2E test suite (Playwright, 3G throttle profile) |
| All | — | T-016 | Production deployment via webhook |