# SABIficate Learner App v1 — Functional & Technical Specification

**Version:** 1.0
**Date:** 2026-07-20
**Authors:** Sanju (engineering), synthesized from Gbitse's catalogue + Mark's platform spec
**Status:** DRAFT — For partner review
**Repo:** `/workspace/app/`

---

## 1. Problem Statement

Nigerian SMEs, NGOs, and public agencies need workforce development in "AI-immune" competencies (judgment, negotiation, leadership, facilitation) but cannot afford traditional LMS solutions or multi-day workshops. Existing platforms (Coursera, LinkedIn Learning) are not localized for African corporate contexts, are bandwidth-hostile, and issue certificates of attendance rather than proof of capability.

SABIficate Learner App v1 delivers mobile-first, bandwidth-adaptive microlearning with artifact-based credentials. The learner downloads the PWA, selects a persona, gets placed at the right proficiency level, completes 10-15 minute courses with a capstone artifact, and earns credentials that carry real hiring signal.

## 2. Scope — What's In v1

### 2.1 Launch Audience

- **Primary:** B2C individual learners in Nigeria (freemium tier)
- **Secondary:** B2B corporate employees via org enrollment
- **v1 NOT in scope:** B2B hiring verification, premium tier, NCCE deployment

### 2.2 Content Scope

- 238 courses across 7 clusters / 21 domains (Gbitse's catalogue)
- Content generated via Curriculum Studio v1 (companion product)
- v1 launches with Cluster 1 (9 courses) + a sample from each other cluster (~30 courses total)
- Remaining courses backfilled over 90 days post-launch

### 2.3 Feature Scope

| Feature | v1 | Deferred |
|---------|:--:|:--------:|
| Auth (register/login/JWT) | Yes | |
| Persona gateway + calibration | Yes | |
| Course catalog (browse, search, filter) | Yes | |
| Lesson player (text, quiz, scenario, artifact prompt) | Yes | |
| Three proficiency levels (foundational/working/applied) | Yes | |
| Progress tracking + dashboard | Yes | |
| Offline sync (IndexedDB) | Yes | |
| Data saver modes (full/data_saver/ultra_light) | Yes | |
| Credential issuance (completion_badge) | Yes | |
| Public credential verification | Yes | |
| Paystack subscription (Free + Professional plans) | Yes | |
| Pricing page | Yes | |
| Profile management | Yes | |
| WhatsApp lesson delivery | | v1.1 |
| AI tutor chat | | v1.1 |
| Gamification (XP, streaks, leaderboards) | | v1.1 |
| Admin dashboard (B2B) | | v1.1 |
| Bulk enrollment (CSV) | | v1.1 |
| Verified/professional certificates | | v1.1 |
| Employer-witnessed confirmation | | v1.1 |
| Translation (Hausa, Yoruba, Igbo, Pidgin) | | v2 |

## 3. Functional Requirements

### FR-1: Authentication & Registration

**Description:** Email/password auth with NDPA-compliant consent collection.

**Acceptance Criteria:**
- AC-1.1: Register with email, password, first_name, last_name, optional phone_number
- AC-1.2: Three-tier consent selector (education_only / anonymized_aggregate / full_profile) with plain-language explanation
- AC-1.3: JWT access token (15-min expiry) + refresh token (7-day expiry)
- AC-1.4: Login with email/password, progressive rate limiting (1s → 2s → 4s lockout)
- AC-1.5: Session persists across browser restarts via refresh token
- AC-1.6: Logout clears all tokens and IndexedDB session data

**Existing code:** `LoginForm.tsx`, `RegisterForm.tsx`, `server/auth/*` — fully implemented with JWT, bcrypt, rate limiting. **Status: FUNCTIONAL** (fixed with native DOM fallback in v4).

### FR-2: Persona-Led Onboarding Gateway

**Description:** Learner picks a persona, answers one calibration question, gets placed at the right proficiency level.

**Acceptance Criteria:**
- AC-2.1: Display 7 personas with icon, label, description — single tap to select
- AC-2.2: After persona selection, show one calibration question with 3 options
- AC-2.3: Calibration answer resolves proficiency_level (foundational/working/applied) via proficiency_map
- AC-2.4: Display placement result with resolved persona + proficiency + customer_tier
- AC-2.5: "Start Learning" saves learner_persona to DB and marks onboarding_completed
- AC-2.6: Allow override toggle for proficiency level on result screen
- AC-2.7: Gateway completes in under 30 seconds for a B2C learner

**Existing code:** `Onboarding.tsx` (462 lines), `server/routes/personas.ts`, DB tables `personas`, `calibration_questions`, `learner_personas`. **Status: FIXED** (flushSync in v5, awaiting audit confirmation).

### FR-3: Course Catalog

**Description:** Browse, search, and filter available courses by cluster, domain, difficulty.

**Acceptance Criteria:**
- AC-3.1: Grid/list view of course cards with title, description, duration, difficulty badge, module count
- AC-3.2: Filter by category (cluster/domain), difficulty tier, professional body
- AC-3.3: Search by title/description with debounced input
- AC-3.4: Pagination (20 per page)
- AC-3.5: Course card shows enrollment status if enrolled
- AC-3.6: Tap card → course detail page with full description, module/lesson breakdown, enrollment CTA
- AC-3.7: Catalog loads in <3s on 3G connection

**Existing code:** `CourseCatalog.tsx`, `CourseCard.tsx`, `CourseDetail.tsx`, `server/routes/courses.ts`. Components exist; need wiring to real course data from Studio.

### FR-4: Lesson Player

**Description:** Render lesson content with four block types at the learner's proficiency level.

**Acceptance Criteria:**
- AC-4.1: Render TextBlock with formatted content
- AC-4.2: Render QuizBlock with options, instant feedback, explanation on answer
- AC-4.3: Render ScenarioBlock as decision tree — narrative, choices, branching feedback, optimal path indicator
- AC-4.4: Render ArtifactPromptBlock with role/industry context, prompt, and rubric criteria
- AC-4.5: Serve content at learner's resolved proficiency level (foundational/working/applied depth card)
- AC-4.6: Progress tracking per block (time spent, quiz answers, scenario decisions)
- AC-4.7: Lesson navigation (prev/next) with progress indicator
- AC-4.8: Lesson completion triggers progress sync to server
- AC-4.9: Each lesson is 10-15 minutes

**Existing code:** `LessonPlayer.tsx`, `TextBlock.tsx`, `QuizBlock.tsx`, `ScenarioBlock.tsx`, `ArtifactPromptBlock.tsx`, `ContentBlockRenderer.tsx`. All four block types implemented. Server routes exist. Needs real content from Studio.

### FR-5: Learner Dashboard

**Description:** Personal dashboard showing enrolled courses, progress, recent activity, and stats.

**Acceptance Criteria:**
- AC-5.1: Show enrolled courses with progress percentage and last activity
- AC-5.2: Quick-resume last active lesson (one tap)
- AC-5.3: Stats: courses enrolled, courses completed, total time spent, current streak
- AC-5.4: Recent activity feed (last 10 events)
- AC-5.5: Dashboard data syncs from IndexedDB when offline, reconciles on reconnect

**Existing code:** `Dashboard.tsx` (164 lines), `server/routes/progress.ts`, `progressService.ts`. Implemented with mock data; needs wiring to real progress.

### FR-6: Offline Sync

**Description:** Learner can access downloaded courses and track progress without internet.

**Acceptance Criteria:**
- AC-6.1: Download course content to IndexedDB for offline access
- AC-6.2: Track lesson progress locally (quiz answers, time spent, completion)
- AC-6.3: Sync progress to server on reconnect (batch of up to 20 items)
- AC-6.4: Conflict resolution: server timestamp wins for completion; local progress_percent wins if higher
- AC-6.5: Visual indicator showing sync status (synced / pending / offline)
- AC-6.6: Max 5 courses stored offline, 30-day auto-expiry

**Existing code:** `src/sync/` (Dexie IndexedDB engine), `SyncStatus.tsx`, `OfflineIndicator.tsx`. Sync engine exists; needs integration testing.

### FR-7: Data Saver Modes

**Description:** Three bandwidth tiers to serve learners on metered connections.

**Acceptance Criteria:**
- AC-7.1: Three modes: Full (all assets), Data Saver (text + compressed images), Ultra Light (text only)
- AC-7.2: Mode persists in profile, defaults to Data Saver for new users
- AC-7.3: Mode switch on Profile page takes effect immediately
- AC-7.4: Badge visible in header showing current mode
- AC-7.5: Critical JS bundle <170KB (performance budget)

**Existing code:** `DataSaverBadge.tsx`, Profile page mode switch, `DataSaverMode` enum. **Status: FIXED** (flushSync in v5).

### FR-8: Credential Issuance

**Description:** Issue completion badges when learner finishes a course.

**Acceptance Criteria:**
- AC-8.1: On course completion, auto-issue a `completion_badge` credential
- AC-8.2: Credential has stable verify URL (non-enumerable, HTTPS-only)
- AC-8.3: Credential page shows: course title, learner name, issue date, evidence basis
- AC-8.4: QR code on credential for mobile verification
- AC-8.5: Public verification page (no login required) shows credential validity
- AC-8.6: Honestly labeled: "completed and self-attested" (never "verified" for v1 badges)

**Existing code:** `CredentialList.tsx`, `CredentialDetail.tsx`, `QRCode.tsx`, `VerifyPage.tsx`, `server/routes/credentials.ts`, `credentialService.ts`. All components exist.

### FR-9: Payments & Subscription

**Description:** Paystack-powered subscription for Professional tier.

**Acceptance Criteria:**
- AC-9.1: Pricing page shows Free and Professional (₦2,500/mo) plans
- AC-9.2: Free plan: access to freemium lessons (configurable paywall_lesson_index per course)
- AC-9.3: Professional plan: full access to all courses, completion badges
- AC-9.4: Paystack checkout flow (card, bank transfer, USSD)
- AC-9.5: Subscription status visible on Profile page
- AC-9.6: Grace period on failed payment before access downgrade
- AC-9.7: VAT (7.5%) and Paystack fees (1.5% + ₦100) handled correctly

**Existing code:** `PlanSelector.tsx`, `PaystackCheckout.tsx`, `SubscriptionStatus.tsx`, `InvoiceList.tsx`, `server/routes/payments.ts`, `paymentService.ts`, `dunningService.ts`. Full implementation exists.

### FR-10: Profile Management

**Description:** View and manage account settings.

**Acceptance Criteria:**
- AC-10.1: Display user info (name, email, persona, proficiency level)
- AC-10.2: Switch data saver mode
- AC-10.3: View subscription status
- AC-10.4: Logout
- AC-10.5: No data download/export features (proprietary constraint)

**Existing code:** `Profile.tsx`. **Status: FIXED** (flushSync in v5).

## 4. Architecture

### 4.1 System Context

```
[Learner Phone] → [Cloudflare CDN] → [React PWA] → [Fastify API] → [PostgreSQL]
                                                  → [Redis (cache + BullMQ)]
```

### 4.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind | Already built, PWA-ready |
| Backend | Node.js + Fastify | Already built, low-latency |
| Database | PostgreSQL 16 | 46+ tables already defined |
| Cache/Queue | Redis 7 + BullMQ | Already integrated |
| Auth | JWT + bcrypt | Already implemented |
| Payments | Paystack | Already integrated |
| Sync | Dexie (IndexedDB) | Already implemented |
| CDN | Cloudflare Pro (Lagos PoP) | Already configured |
| Hosting | Hetzner CX33 (Nuremberg) | Already running |

### 4.3 Key Constraints

- **TTI <5s on 3G** — critical JS <170KB, data saver default
- **No data downloads** — no CSV/PDF export, no bulk data access
- **No agent protocol exposure** — proprietary AI pipeline not visible in learner UI
- **NDPA compliance** — three-tier consent, PII in Nigeria context
- **Foreground-first sync** — never depend on background for critical data (Transsion kills bg Chrome in 60-90s)

### 4.4 Data Model

Existing 46+ PostgreSQL tables. Key tables for Learner App:

- `users`, `organizations`, `departments` — identity
- `personas`, `calibration_questions`, `learner_personas` — onboarding gateway
- `courses`, `modules`, `lessons`, `lesson_content` — content delivery
- `enrollments`, `lesson_progress`, `quiz_answers` — learner state
- `credentials` — issuance
- `subscription_plans`, `subscriptions`, `payment_transactions` — payments

### 4.5 API Endpoints (Existing)

| Group | Routes | Status |
|-------|--------|--------|
| Auth | POST /register, /login, /refresh, /logout | Implemented |
| Personas | GET /personas, POST /learner-persona | Implemented |
| Courses | GET /courses, /courses/:slug | Implemented |
| Progress | POST /progress/sync, GET /dashboard | Implemented |
| Credentials | POST /credentials/issue, GET /verify/:id | Implemented |
| Payments | POST /subscribe, GET /plans, webhooks | Implemented |
| Compliance | GET /consent, POST /consent | Implemented |

## 5. What Exists vs. What Needs Building

### 5.1 Exists and Functional
- Auth (login/register) — fixed, working
- JWT with refresh tokens
- Rate limiting with progressive lockout
- Consent collection (3-tier)
- 7 personas with calibration questions (DB + API + UI)
- All 4 content block types (text, quiz, scenario, artifact)
- Lesson player with navigation
- Dashboard layout with mock data
- Catalog components (card, detail, list)
- Credential components (list, detail, QR, verify page)
- Payment components (plan selector, checkout, subscription status)
- Profile page with data saver switch
- Data saver modes (3-tier)
- IndexedDB sync engine (Dexie)
- Sync/offline indicators
- Bottom nav + top bar + app shell
- 30 static course templates

### 5.2 Exists but Needs Fixing / Wiring
- **P0:** Onboarding persona selection (flushSync fix in v5, needs audit) 
- **P0:** Profile data-mode switch (flushSync fix in v5, needs audit)
- Catalog → needs real course data from Studio pipeline
- Dashboard → needs wiring to real progress data
- Lesson player → needs real content at 3 proficiency levels
- Credential issuance → needs trigger on course completion
- Payment → needs Paystack API keys and production testing
- Offline sync → needs integration testing with real courses

### 5.3 Needs Building
- **Course content generation** — 30+ courses via Curriculum Studio (companion spec)
- **Database seeding** — real courses, modules, lessons with depth-variant content
- **Production deployment** — sabificate.com domain, proper nginx config, SSL
- **Performance optimization** — validate <5s TTI on 3G, bundle splitting
- **E2E testing** — complete user journey from register through credential
- **Error states** — network failure recovery, empty states, loading skeletons

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| React 19 click handler bug resurfaces | P0 — app unusable | flushSync pattern established; audit after each deploy |
| Service worker caching blocks updates | P0 — users stuck on old build | VitePWA removed, SW nuke in HTML, self-destructing SW deployed |
| Content not ready at launch | Major — empty catalog | Launch with 30-course subset, backfill over 90 days |
| Paystack integration issues in prod | Major — no revenue | Test with sandbox keys before go-live |
| 3G performance miss | Major — Nigerian users bounce | Performance budget enforced, data saver default |

## 7. Success Metrics (v1 Launch)

- 100 registered learners in first 30 days
- >60% onboarding completion rate
- >40% lesson completion rate (started → finished)
- <5s TTI on 3G connection
- 0 P0 bugs in production
- First paid subscriber within 60 days

## 8. Dependencies

- **Curriculum Studio v1** — produces the course content the Learner App delivers
- **Cloudflare** — CDN configured for sabificate.com
- **Paystack** — API keys for production
- **Domain** — sabificate.com (Mark has this)
