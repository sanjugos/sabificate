# SABIficate Learner App v1 — Praxis Spec

| Field | Value |
|---|---|
| **Feature** | SABIficate Learner App v1 |
| **Client** | SABIficate |
| **Status** | GATE-2 APPROVED |
| **Spec version** | 1.0.0 |
| **Constitution version** | 2.0.0 |
| **Author** | Claude Code (praxis-build) |
| **Date** | 2026-07-20 |

---

## §1 Problem & Outcome

### Problem

Nigerian SMEs and NGOs need workforce development in "AI-immune" competencies (negotiation, facilitation, applied ethics, stakeholder management) but cannot afford traditional LMS platforms. Existing solutions are not localized for African corporate contexts, consume excessive bandwidth on the metered mobile connections most Nigerian workers rely on, and issue certificates of attendance rather than proof of demonstrated capability. There is no mobile-first, offline-capable, credential-issuing microlearning platform serving this market.

### Desired Outcome

A production-ready, mobile-first PWA where Nigerian learners can:

- Register with NDPA-compliant consent and complete persona-led onboarding
- Browse, search, and filter a course catalog of 10-15 minute microlearning lessons
- Complete lessons with four interactive block types at three proficiency levels
- Earn artifact-based completion badges that are publicly verifiable
- Subscribe via Paystack (Free or Professional tier)
- Work offline with foreground-first sync on low-end Transsion devices
- Operate within strict bandwidth budgets (TTI <5s on 3G, critical JS <170KB)

### Non-goals

- WhatsApp lesson delivery (deferred to v1.1)
- AI tutor or adaptive learning engine
- Gamification (streaks, leaderboards, XP)
- Admin dashboard or bulk enrollment
- Verified or professional certificate tiers (completion_badge only in v1)
- Multi-language translation
- Data download or export features (proprietary constraint)
- Agent protocol exposure in the UI (proprietary constraint)

---

## §2 Users & Scenarios

### Primary Users

| User | Context | Device | Connection |
|---|---|---|---|
| **B2C individual learner** | Nigerian professional or job-seeker self-funding upskilling | Transsion (Tecno/Infinix/itel), budget Android | 3G/4G metered data, frequent drops |
| **B2B corporate employee** | Staff member whose employer purchased Professional subscriptions | Same device profile | Same connection profile, may have office Wi-Fi |

### Happy Path

1. Learner opens `sabificate.forwardai.dev` on mobile Chrome
2. PWA install prompt appears; learner adds to home screen
3. Learner taps "Register," provides name/email/password, reviews NDPA consent (3 tiers), and submits
4. Persona gateway presents 7 persona cards; learner selects one
5. 3-5 calibration questions determine starting proficiency level (foundational/working/applied)
6. Learner lands on dashboard showing recommended courses for their persona
7. Learner browses course catalog, filters by category, taps a course card
8. Course detail page shows description, duration, proficiency level, and "Start" button
9. Learner completes a lesson: reads TextBlock, answers QuizBlock, works through ScenarioBlock, submits ArtifactPromptBlock
10. Progress bar updates; on course completion, a completion_badge credential is issued
11. Learner views credential in profile, shares public verification URL
12. Learner subscribes to Professional tier via Paystack checkout
13. Learner goes offline mid-lesson; content loads from IndexedDB; progress syncs when connection returns

### Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| E-1 | Registration with duplicate email | Server returns 409; form shows "Email already registered" inline error |
| E-2 | Token expires mid-lesson | Silent refresh via refresh token; if refresh fails, redirect to login preserving lesson progress locally |
| E-3 | Network drops during Paystack checkout | Transaction status polled on reconnect; visual indicator of pending state |
| E-4 | Transsion kills background Chrome (60-90s) | Foreground-first sync; no reliance on service worker background sync |
| E-5 | Data saver mode toggled mid-session | Content re-renders with reduced assets (no images in ultra_light, compressed in data_saver) |
| E-6 | Learner attempts Professional-only course on Free tier | Course detail shows lock icon and upgrade CTA; lesson player blocked server-side |
| E-7 | Quiz submitted with no answer selected | Submit button disabled until selection made; client-side validation prevents empty submission |
| E-8 | Credential verification page accessed with invalid ID | 404-style page with clear message: "This credential could not be found" |

---

## §3 Functional Requirements

| ID | Requirement | Notes |
|---|---|---|
| **FR-1** | **Auth: Registration and Login.** The system shall allow learners to register with name, email, and password, present NDPA 3-tier consent (essential/functional/analytics) before account creation, issue JWT access + refresh token pairs, and support login with email/password. Password hashed with bcrypt (cost factor >= 10). Rate-limited to 5 login attempts per minute per IP. | Wire existing LoginForm/RegisterForm to Fastify auth routes. Fix React 19 click handler bugs (flushSync). |
| **FR-2** | **Persona Gateway and Calibration.** After registration, the system shall present 7 persona cards. On selection, the system delivers 3-5 calibration questions and assigns the learner a starting proficiency level (foundational, working, or applied). Selection and level are persisted to the user profile. | Wire existing Onboarding page to backend persona/calibration endpoints. |
| **FR-3** | **Course Catalog.** The system shall display a searchable, filterable catalog of published courses. Filters: category, proficiency level, duration, subscription tier. Search is case-insensitive substring match on title and description. Catalog data sourced from Studio publish pipeline output. | Wire existing CourseCatalog/CourseCard to real API data. Build publish-to-learner data pipeline. |
| **FR-4** | **Lesson Player.** The system shall render lessons composed of four block types: TextBlock, QuizBlock, ScenarioBlock, ArtifactPromptBlock. Each block type renders at the learner's assigned proficiency level (foundational/working/applied). Lessons are 10-15 minutes target duration. Sequential block progression (learner must complete current block before advancing). | Wire existing ContentBlockRenderer to lesson API. Proficiency-level content selection. |
| **FR-5** | **Progress Tracking and Dashboard.** The system shall track lesson completion percentage, course completion status, and time spent. Dashboard displays: courses in progress (with percentage), completed courses, next recommended course (based on persona). Progress persists across sessions via server sync and local IndexedDB. | Wire existing progress components to API. Implement recommendation logic. |
| **FR-6** | **Offline Sync.** The system shall cache course content and learner progress in IndexedDB via Dexie. Foreground-first sync strategy: sync triggers on app focus, navigation, and explicit pull-to-refresh. No reliance on service worker background sync (Transsion constraint). Conflict resolution: last-write-wins with server timestamp authority. | Harden existing Dexie sync engine. Foreground-only sync triggers. |
| **FR-7** | **Data Saver Modes.** The system shall support three bandwidth modes: full (all assets), data_saver (compressed images, deferred non-critical assets), ultra_light (text only, no images). Mode persists in local storage and is selectable from profile. Current mode displayed via DataSaverBadge. | Wire existing DataSaverBadge and mode selector. Conditional asset loading in content blocks. |
| **FR-8** | **Credential Issuance.** On course completion, the system shall issue a completion_badge credential containing: learner name, course title, completion date, unique credential ID. Credential viewable in learner profile via CredentialList/CredentialDetail. QR code generated for each credential. | Wire existing credential components to issuance API. Trigger on course completion. |
| **FR-9** | **Public Credential Verification.** The system shall expose a public `/verify/:credentialId` route that displays credential details without requiring authentication. Invalid IDs show a clear not-found message. Page includes anti-fraud visual markers. | Wire existing VerifyPage to public verification API endpoint. |
| **FR-10** | **Paystack Subscription.** The system shall offer two subscription tiers: Free (limited catalog) and Professional (full catalog). Payment via Paystack checkout. Subscription status checked server-side on protected course access. Plan selection, checkout, status display, and invoice history via existing payment components. | Wire existing PlanSelector/PaystackCheckout/SubscriptionStatus/InvoiceList to Paystack API. Server-side tier enforcement. |

---

## §4 Acceptance Criteria

### FR-1: Auth

**AC-1.1: Successful registration with NDPA consent**
GIVEN a visitor on the registration page
WHEN they enter a valid name, email, and password, toggle NDPA consent tiers (essential required, functional and analytics optional), and submit the form
THEN the system creates an account, returns a 201 status with JWT access and refresh tokens, and redirects to the persona gateway

**AC-1.2: Registration blocked without essential consent**
GIVEN a visitor on the registration page
WHEN they fill all fields but do not accept essential NDPA consent
THEN the submit button remains disabled and an inline message reads "Essential data consent is required"

**AC-1.3: Duplicate email rejection**
GIVEN a visitor on the registration page
WHEN they submit a registration with an email that already exists
THEN the server returns 409 and the form displays "Email already registered" without clearing other fields

**AC-1.4: Successful login**
GIVEN a registered learner on the login page
WHEN they enter correct email and password and submit
THEN the system returns JWT access and refresh tokens and redirects to the dashboard

**AC-1.5: Login rate limiting**
GIVEN an IP address that has made 5 failed login attempts in the last 60 seconds
WHEN a 6th login attempt is made from that IP
THEN the server returns 429 with a "Too many attempts" message and a Retry-After header

**AC-1.6: Token refresh**
GIVEN a learner with an expired access token and a valid refresh token
WHEN an authenticated API request is made
THEN the client automatically exchanges the refresh token for a new access token and retries the request without user intervention

**AC-1.7: Click handlers fire on first tap (React 19 fix)**
GIVEN a learner on the login page on a mobile device
WHEN they tap the "Sign In" button once
THEN the form submits on the first tap without requiring a second tap (flushSync applied to event handlers)

### FR-2: Persona Gateway and Calibration

**AC-2.1: Persona selection displayed after registration**
GIVEN a newly registered learner
WHEN they land on the onboarding page
THEN 7 persona cards are displayed, each with a name, description, and icon

**AC-2.2: Calibration questions presented after persona selection**
GIVEN a learner on the onboarding page
WHEN they select a persona card
THEN 3 to 5 calibration questions relevant to that persona are presented sequentially

**AC-2.3: Proficiency level assigned and persisted**
GIVEN a learner who has answered all calibration questions
WHEN the final question is submitted
THEN the system assigns a proficiency level (foundational, working, or applied), persists it to the user profile on the server, and redirects to the dashboard

### FR-3: Course Catalog

**AC-3.1: Catalog displays published courses**
GIVEN a learner on the catalog page
WHEN the page loads
THEN all published courses are displayed as cards with title, category, duration, proficiency level, and subscription tier badge

**AC-3.2: Search filters courses by title and description**
GIVEN a learner on the catalog page with 10+ courses loaded
WHEN they type "negotiation" in the search field
THEN only courses whose title or description contains "negotiation" (case-insensitive) are displayed

**AC-3.3: Category filter narrows results**
GIVEN a learner on the catalog page
WHEN they select "Leadership" from the category filter
THEN only courses in the "Leadership" category are displayed and the active filter is visually indicated

**AC-3.4: Free-tier learner sees lock on Professional courses**
GIVEN a learner on the Free subscription tier viewing the catalog
WHEN a Professional-only course card is rendered
THEN the card displays a lock icon and "Professional" tier badge

### FR-4: Lesson Player

**AC-4.1: TextBlock renders at assigned proficiency level**
GIVEN a learner with proficiency level "foundational" viewing a lesson
WHEN a TextBlock is rendered
THEN the foundational-level content variant is displayed (not working or applied)

**AC-4.2: QuizBlock requires selection before submission**
GIVEN a learner viewing a QuizBlock with multiple-choice options
WHEN no option is selected
THEN the submit button is disabled

**AC-4.3: QuizBlock shows feedback on submission**
GIVEN a learner viewing a QuizBlock who has selected an answer
WHEN they tap the submit button
THEN the system displays whether the answer is correct or incorrect with an explanation

**AC-4.4: ScenarioBlock presents branching choices**
GIVEN a learner viewing a ScenarioBlock
WHEN the block renders
THEN it displays a scenario description and two or more response options, and selecting an option advances to the consequence text

**AC-4.5: ArtifactPromptBlock accepts text submission**
GIVEN a learner viewing an ArtifactPromptBlock
WHEN they type a response (minimum 50 characters) and tap submit
THEN the artifact is saved, marked as completed, and the learner can advance to the next block

**AC-4.6: Sequential block progression enforced**
GIVEN a lesson with blocks [TextBlock, QuizBlock, ScenarioBlock]
WHEN the learner has only completed the TextBlock
THEN the QuizBlock is active and the ScenarioBlock is locked (not interactive, visually dimmed)

**AC-4.7: Professional course blocked for Free-tier learner**
GIVEN a learner on the Free subscription tier
WHEN they attempt to access a lesson in a Professional-only course via direct URL
THEN the server returns 403 and the client displays an upgrade prompt

### FR-5: Progress Tracking and Dashboard

**AC-5.1: Dashboard shows courses in progress**
GIVEN a learner who has started 2 courses and completed 1
WHEN they view the dashboard
THEN the "In Progress" section shows 2 course cards with completion percentages and the "Completed" section shows 1 course card

**AC-5.2: Progress percentage updates on block completion**
GIVEN a learner in a course with 4 blocks who has completed 2
WHEN they complete the 3rd block
THEN the progress percentage updates to 75% on both the lesson player progress bar and the dashboard card

**AC-5.3: Recommended course displayed**
GIVEN a learner with persona "Operations Manager" who has not completed all Operations courses
WHEN they view the dashboard
THEN a "Recommended Next" section displays a course relevant to their persona that they have not started

### FR-6: Offline Sync

**AC-6.1: Lesson content available offline**
GIVEN a learner who has previously loaded a course while online
WHEN the device loses network connectivity
THEN the learner can open the course and view lesson content from IndexedDB cache

**AC-6.2: Progress saved locally when offline**
GIVEN a learner working through a lesson while offline
WHEN they complete a block
THEN the progress is written to IndexedDB and a sync-pending indicator is displayed

**AC-6.3: Foreground sync on reconnection**
GIVEN a learner who completed 2 blocks while offline
WHEN the app regains focus with network connectivity
THEN local progress is synced to the server within 5 seconds and the sync-pending indicator clears

**AC-6.4: No background sync reliance**
GIVEN the application's service worker configuration
WHEN inspected
THEN no BackgroundSync or periodicSync registrations exist; all sync is triggered by foreground events (focus, navigation, explicit refresh)

### FR-7: Data Saver Modes

**AC-7.1: Mode selection persists**
GIVEN a learner on the profile/settings page
WHEN they select "Ultra Light" data saver mode
THEN the selection is stored in localStorage and the DataSaverBadge updates to show "Ultra Light"

**AC-7.2: Ultra light mode suppresses images**
GIVEN a learner in ultra_light mode viewing a TextBlock that contains an image
WHEN the block renders
THEN no `<img>` elements are rendered; image placeholders show alt text only

**AC-7.3: Data saver mode compresses images**
GIVEN a learner in data_saver mode viewing a TextBlock that contains an image
WHEN the block renders
THEN images are loaded with reduced quality parameters (width <= 480px or WebP compressed)

**AC-7.4: Full mode renders all assets**
GIVEN a learner in full mode viewing a TextBlock that contains an image
WHEN the block renders
THEN images are rendered at original quality with no compression applied

### FR-8: Credential Issuance

**AC-8.1: Completion badge issued on course completion**
GIVEN a learner who has completed all blocks in all lessons of a course
WHEN the final block is submitted
THEN a completion_badge credential is created with learner name, course title, completion date, and unique credential ID

**AC-8.2: Credential visible in profile**
GIVEN a learner who has earned 2 completion badges
WHEN they navigate to the credentials section of their profile
THEN CredentialList displays 2 credential cards with course title and completion date

**AC-8.3: Credential detail shows QR code**
GIVEN a learner viewing their credential list
WHEN they tap on a credential card
THEN CredentialDetail displays the full credential information and a QR code encoding the public verification URL

### FR-9: Public Credential Verification

**AC-9.1: Valid credential displays verification page**
GIVEN a visitor (not logged in) with a valid credential URL `/verify/:credentialId`
WHEN they open the URL
THEN the page displays learner name, course title, completion date, and a "Verified" visual marker without requiring authentication

**AC-9.2: Invalid credential shows not-found message**
GIVEN a visitor with an invalid credential URL `/verify/nonexistent-id`
WHEN they open the URL
THEN the page displays "This credential could not be found" with no server error exposed

### FR-10: Paystack Subscription

**AC-10.1: Plan selection displays two tiers**
GIVEN a learner on the subscription page
WHEN the page loads
THEN PlanSelector displays Free and Professional tiers with feature comparison and pricing

**AC-10.2: Paystack checkout initiates for Professional**
GIVEN a learner on the Free tier who selects Professional
WHEN they tap "Subscribe"
THEN PaystackCheckout opens the Paystack payment modal with the correct plan amount in NGN

**AC-10.3: Successful payment updates subscription status**
GIVEN a learner who completes Paystack checkout successfully
WHEN the payment webhook confirms the transaction
THEN SubscriptionStatus updates to "Professional" and previously locked courses become accessible

**AC-10.4: Invoice history displayed**
GIVEN a learner on the Professional tier with 3 past payments
WHEN they navigate to billing in their profile
THEN InvoiceList displays 3 invoice entries with date, amount, and status

**AC-10.5: Server-side tier enforcement**
GIVEN a learner on the Free tier
WHEN a request is made to the lesson content endpoint for a Professional-only course
THEN the server returns 403 regardless of any client-side manipulation

---

## §5 Constitution Compliance

### §I Core Rules

- [x] **No external API calls** — All logic runs on own server; no third-party APIs except §III exceptions below
- [x] **Secrets in .env only** — JWT_SECRET, DATABASE_URL, PAYSTACK_SECRET_KEY, REDIS_URL stored in `.env`, never committed
- [x] **Interactive-only deploys** — Production deploy via curl webhook, never automated in CI

### §II Process Rules

- [x] **Spec-gate before code** — This spec is the gate; no implementation begins until GATE-2 APPROVED
- [x] **TDD Iron Law** — Every AC maps to a failing test written before implementation code
- [x] **Fresh subagent per task** — Each T-xxx task runs in an isolated subagent/worktree
- [x] **Two-reviewer merge gate** — No task branch merges to main without two passing reviews

### §II-B Security Controls

- [x] **P10: Input validation** — All user inputs validated server-side (email format, password strength, text length limits on artifact submissions)
- [x] **P11: Server-side authZ** — JWT verified on every protected endpoint; subscription tier checked server-side for course access (AC-4.7, AC-10.5)
- [x] **P12: TLS** — All traffic over HTTPS; HSTS header set
- [x] **P13: Tenant isolation** — Learners can only access their own progress, credentials, and profile data; no cross-user data leakage
- [x] **P14: Audit logging** — Auth events (login, register, token refresh, failed attempts), subscription changes, and credential issuance logged with timestamp and user ID
- [x] **P15: SBOM** — `package-lock.json` committed; `npm audit` run before each release
- [x] **P16: WCAG 2.2 AA** — Color contrast >= 4.5:1, touch targets >= 44x44px, screen reader landmarks, focus management on navigation
- [x] **P17: AI governance** — Not applicable to learner app v1 (no AI features in learner-facing experience; Claude API used only in Studio pipeline, which is a separate spec)
- [x] **P18: NDPA compliance** — 3-tier consent (essential/functional/analytics) collected at registration; essential consent required; consent choices auditable

### §III Exceptions Used

| Exception | API | Justification |
|---|---|---|
| Exception 2 | Paystack API | Payment processing for Professional tier subscriptions; no alternative for Nigerian Naira payments |

---

## §6 Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-1 | What is the exact course count for v1 launch? Full 238-course catalog or a curated subset? | Affects catalog performance testing and data pipeline scope | Product |
| OQ-2 | Should calibration allow re-taking to change proficiency level, or is first assignment permanent for v1? | Affects FR-2 implementation and onboarding UX | Product |
| OQ-3 | What is the Paystack Professional tier price in NGN? | Blocks AC-10.2 test fixture creation | Business |
| OQ-4 | What is the minimum artifact length for ArtifactPromptBlock (currently spec'd at 50 chars)? | Affects AC-4.5 validation logic | Curriculum |
| OQ-5 | Should credential QR codes encode the full URL or a short-code that redirects? | Affects QR density and scanning reliability on low-res screens | Engineering |
| OQ-6 | Is the publish-to-learner data pipeline a one-time seed or a continuous sync from Studio? | Affects FR-3 architecture and caching strategy | Engineering |

---

## §7 Traceability

| FR | AC | Task ID | Task Summary |
|---|---|---|---|
| FR-1 | AC-1.1, AC-1.2, AC-1.3 | T-xxx | Registration flow with NDPA consent |
| FR-1 | AC-1.4, AC-1.5 | T-xxx | Login with rate limiting |
| FR-1 | AC-1.6 | T-xxx | Token refresh mechanism |
| FR-1 | AC-1.7 | T-xxx | React 19 click handler fix (flushSync) |
| FR-2 | AC-2.1, AC-2.2, AC-2.3 | T-xxx | Persona gateway and calibration wiring |
| FR-3 | AC-3.1, AC-3.2, AC-3.3 | T-xxx | Course catalog with search and filters |
| FR-3 | AC-3.4 | T-xxx | Tier-aware catalog display |
| FR-3 | — | T-xxx | Studio publish-to-learner data pipeline |
| FR-4 | AC-4.1, AC-4.2, AC-4.3 | T-xxx | Lesson player: TextBlock and QuizBlock |
| FR-4 | AC-4.4, AC-4.5 | T-xxx | Lesson player: ScenarioBlock and ArtifactPromptBlock |
| FR-4 | AC-4.6, AC-4.7 | T-xxx | Block progression and tier enforcement |
| FR-5 | AC-5.1, AC-5.2, AC-5.3 | T-xxx | Progress tracking and dashboard |
| FR-6 | AC-6.1, AC-6.2, AC-6.3, AC-6.4 | T-xxx | Offline sync hardening (foreground-only) |
| FR-7 | AC-7.1, AC-7.2, AC-7.3, AC-7.4 | T-xxx | Data saver mode wiring |
| FR-8 | AC-8.1, AC-8.2, AC-8.3 | T-xxx | Credential issuance on completion |
| FR-9 | AC-9.1, AC-9.2 | T-xxx | Public credential verification page |
| FR-10 | AC-10.1, AC-10.2 | T-xxx | Paystack plan selection and checkout |
| FR-10 | AC-10.3, AC-10.4, AC-10.5 | T-xxx | Subscription status, invoices, server-side enforcement |
| All | — | T-xxx | Performance budget enforcement (TTI <5s, JS <170KB) |
| All | — | T-xxx | E2E test suite (Playwright, 3G throttle profile) |
| All | — | T-xxx | Production deployment via webhook |