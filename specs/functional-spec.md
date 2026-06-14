# SABIficate Functional Specification -- Phase 1 MVP

**Version:** 2.0
**Date:** 2026-06-14
**Status:** DRAFT -- Pending founder working session review
**Source authority:** Council Synthesis (2026-06-14), updated from v1.0 functional spec (2026-05-29)

---

## 0. Scope and Constraints

This spec covers the **12 Phase 1 MVP features** (council synthesis Section 4, Phase 1 table). Phase 1 supports exactly ONE use case: a corporate L&D manager at one existing Efiko client (target: Fidelity Bank or FCMB) assigns 5-10 employees to complete courses, tracks their completion, and receives an ITF-compatible report.

**Stack:** React 19.2 + Vite 6.x + Tailwind CSS v4 PWA. PostgreSQL 16 (split: Hetzner Nuremberg for application data, Nigerian-hosted instance for PII). Redis 7 for cache/queue/session. Cloudflare Pro + Workers at edge.

**Target devices:** Tecno Spark 30, Infinix Hot 50, Samsung A06. Android 8+. Chrome 90+. 2G/3G/4G on MTN, GLO, Airtel.

**Not in scope:** AI Tutor Chat, HRIS integration, gamification, cohort/pod management, Efiko Builders program, multi-language content, NIBSS direct debit, AI course authoring admin UI, full corporate dashboard with ROI metrics. See Section 10 for deferred feature assignments.

---

## 1. Feature Specifications

### 1.1 Mobile-First Lesson Player

**Description:** Renders structured JSON content (text blocks, quizzes, artifact prompts, scenarios) in a touch-optimized mobile player. Supports three adaptive difficulty tiers per course. Handles the full lesson lifecycle: content display, embedded quiz completion, artifact prompt presentation, and progress saving.

**User Stories:**
- As a learner, I can open a lesson and read content formatted for my phone screen so that I can learn during a commute or break.
- As a learner, I can select my difficulty tier (Beginner/Intermediate/Advanced) so that content matches my language sophistication level.
- As a learner, I can answer embedded quiz questions and receive immediate feedback with explanations so that I can confirm my understanding before proceeding.
- As a learner, I can view an artifact prompt at the end of a lesson and understand what deliverable I need to produce.
- As a learner, I can resume a lesson from where I left off, even if I close the app.

**Acceptance Criteria:**
- Lesson loads in under 3 seconds on measured 3G connection.
- All tap targets are minimum 44px.
- Content renders correctly on 360px-wide screens (Tecno Spark 30 viewport).
- Quiz feedback displays immediately after answer submission without server round-trip (correct answer stored in content JSON, validated client-side, then synced).
- Difficulty tier selection persists per-course. Learner can switch tiers mid-course; progress carries over (quiz scores reset for new tier).
- Lesson content renders from JSON content schema (see Section 3) -- no raw HTML from AI pipeline.
- Progress saved at sub-lesson granularity: each quiz answer, each block viewed. IndexedDB write on every state change.
- Main entry chunk under 50KB compressed. Lesson player lazy-loaded. Largest vendor chunk under 120KB.

**Data Model Entities:** Course, Module, Lesson (with content_json JSONB), LearnerProgress, AssessmentAttempt

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/courses/{slug} | Get course with modules and lesson metadata |
| GET | /api/v1/lessons/{id}/content | Get lesson content JSON for specified difficulty tier (query param: `tier=beginner\|intermediate\|advanced`) |
| POST | /api/v1/learner/lessons/{lesson_id}/progress | Save lesson progress (block_index, time_spent_seconds, status) |
| POST | /api/v1/learner/assessments/{assessment_id}/attempt | Submit quiz attempt (answers_json, score_percent, time_taken_seconds) |

---

### 1.2 User Authentication

**Description:** OAuth 2.0 with PKCE flow for the PWA client. Email/password registration and login with bcrypt hashing. JWT access tokens validated at Cloudflare Workers edge. Supports corporate admin and learner roles.

**User Stories:**
- As a new user, I can register with email and password so that I can access the platform.
- As a returning user, I can log in and have my session persist for 7 days so that I do not need to re-authenticate daily.
- As a corporate admin, I can optionally enable TOTP 2FA on my account to protect organizational data.
- As a learner invited by my corporate admin, I can register via an invitation link that pre-fills my organization and department.

**Acceptance Criteria:**
- PKCE flow mandatory for all auth (no implicit grant).
- Password hashing: bcrypt, cost factor 12.
- JWT access tokens: 15-minute expiry. Refresh tokens: httpOnly secure cookie, 7-day expiry.
- Rate limiting: 5 failed login attempts per 15 minutes, progressive lockout (1min, 5min, 15min, 1hr).
- Edge JWT validation at Cloudflare Workers (avoids 110ms origin round-trip on authenticated requests).
- Registration requires: email, password (min 8 chars, at least 1 number), first_name, last_name, phone_number (E.164 format).
- Invitation flow: corporate admin generates link, new user clicks link, registration form pre-populates org_id and department_id.
- Password reset via email with time-limited token (1 hour expiry).
- No SSO in Phase 1. No social login. No passkey/biometric.

**Data Model Entities:** User, Organization, Department, RefreshToken

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Create user account |
| POST | /api/v1/auth/login | Authenticate, return JWT + refresh token |
| POST | /api/v1/auth/refresh | Exchange refresh token for new JWT |
| POST | /api/v1/auth/logout | Invalidate refresh token |
| POST | /api/v1/auth/forgot-password | Send password reset email |
| POST | /api/v1/auth/reset-password | Reset password with token |
| POST | /api/v1/auth/register/invite/{token} | Register via corporate invitation link |
| POST | /api/v1/auth/2fa/setup | Enable TOTP 2FA (corporate admin only) |
| POST | /api/v1/auth/2fa/verify | Verify TOTP code during login |

---

### 1.3 Course Catalog

**Description:** Browse and search available courses. Filter by difficulty level, category, professional body, and estimated duration. Shows course metadata including CPD hours, credential information, and completion statistics for the learner's organization.

**User Stories:**
- As a learner, I can browse courses by category so that I find content relevant to my role.
- As a learner, I can search courses by title or keyword so that I find specific training quickly.
- As a learner, I can filter by difficulty level so that I see courses appropriate for my expertise.
- As a learner, I can see which courses my organization has assigned to me.
- As a corporate admin, I can see aggregate completion rates per course across my organization.

**Acceptance Criteria:**
- Catalog page loads in under 2 seconds on measured 3G.
- Search uses PostgreSQL full-text search (GIN index). Results ranked by relevance.
- Filters: difficulty_level (beginner/intermediate/advanced), category_id, professional_body (CIBN/ICAN/CITN/none), estimated_duration range, free/paid.
- Course cards show: title, category, difficulty, estimated duration, CPD hours, thumbnail (lazy-loaded, max 30KB), completion percentage (if enrolled).
- "My Courses" tab shows enrolled courses with progress bars.
- "Assigned" badge on courses assigned by corporate admin.
- Pagination: 20 courses per page, infinite scroll.
- Empty state with clear messaging when no courses match filters.

**Data Model Entities:** Course, CourseCategory, Enrollment

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/courses | List courses with search, filter, pagination (query params: q, category_id, difficulty, professional_body, duration_min, duration_max, page, per_page) |
| GET | /api/v1/courses/categories | List all course categories |
| GET | /api/v1/learner/courses | List learner's enrolled courses with progress |
| GET | /api/v1/learner/courses/assigned | List courses assigned by corporate admin |

---

### 1.4 Learner Progress Tracking

**Description:** Tracks lesson completion, quiz scores, time spent, and artifact submission status per learner per course. Provides progress visualization. Syncs progress across devices when online.

**User Stories:**
- As a learner, I can see my overall completion percentage for each enrolled course.
- As a learner, I can see which lessons I have completed, which I am working on, and which I have not started.
- As a learner, I can see my quiz scores for completed assessments.
- As a learner, I can resume any course from where I left off.
- As a corporate admin, I can see progress for each learner in my organization.

**Acceptance Criteria:**
- Progress tracked at lesson level: not_started, in_progress, completed.
- Completion percentage calculated as (completed_lessons / total_lessons) * 100, denormalized on Enrollment.
- Quiz scores stored per attempt. Best score displayed. Maximum 3 attempts per quiz.
- Time spent tracked per lesson (client-side timer, synced on progress save).
- "Continue where I left off" button on course detail page, links to last incomplete lesson.
- Progress sync: when online, POST progress immediately (foreground-first). Conflict resolution: server timestamp wins for completion status; local progress_percent wins if higher.
- Corporate admin can view per-learner progress via admin API (see Feature 1.6).

**Data Model Entities:** LearnerProgress, Enrollment, AssessmentAttempt

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/learner/courses/{course_id}/progress | Get detailed progress for a course (all lessons, quiz scores, time spent) |
| POST | /api/v1/learner/lessons/{lesson_id}/progress | Update lesson progress |
| GET | /api/v1/learner/dashboard | Get learner summary (courses in progress, total time, credentials earned) |

---

### 1.5 Foreground-First Offline Sync

**Description:** Three-tier offline strategy optimized for Transsion devices (HiOS/XOS kill background Chrome within 60-90 seconds). App shell precached via Workbox service worker. Structured offline data in Dexie.js over IndexedDB. User-initiated content downloads with Naira cost estimates.

**User Stories:**
- As a learner, I can install the app via Add-to-Home-Screen and have the app shell available offline.
- As a learner, I can download specific courses for offline study and see the estimated data cost in Naira before downloading.
- As a learner, I can complete quizzes while offline and have my answers saved locally.
- As a learner, I can see a visible sync status indicator showing whether my progress is saved to the server.
- As a learner on a Tecno/Infinix phone, I do not lose quiz answers when my phone kills Chrome in the background.

**Acceptance Criteria:**

*Tier 1 -- App Shell (Workbox Service Worker):*
- Precache app shell on service worker install: under 200KB compressed total.
- Service worker file under 15KB (runtime caching configuration externalized).
- Cache health check on each app open: detect and recover from HiOS cache-clearing.
- NO course content precached on install. All content downloads are user-initiated.
- A2HS prompt on second visit with offline benefit messaging.

*Tier 2 -- Structured Offline Data (Dexie.js + IndexedDB):*
- All quiz answers written to IndexedDB immediately on submission.
- Lesson progress (block_index, time_spent) written to IndexedDB on every state change.
- Reserved 5MB IndexedDB partition for sync data (quiz answers, progress) -- never consumed by course content downloads.
- IndexedDB writes designed to survive unclean shutdown (no multi-step transactions for critical data).

*Tier 3 -- User-Initiated Content Downloads:*
- Download button per course with estimated file size and Naira cost (calculated at current data rate: NGN 4.31/MB post-tariff).
- Background Fetch API with progress indicator for large downloads.
- Hard download caps based on available device storage (query StorageManager API).
- LRU eviction of completed course content when storage is low. Sync data partition is never evicted.
- Storage dashboard showing per-course offline storage usage and manual delete per course.

*Foreground-First Sync:*
- When app is in foreground and online: POST quiz results and progress immediately. Visible sync status indicator in app header (synced/syncing/pending/offline).
- Background Sync registration as SECONDARY strategy only. Assume it will be killed on Transsion devices.
- "Unsaved work" indicator when answers are queued in IndexedDB but not yet synced.
- Conflict resolution: server timestamp wins for completion; local progress_percent wins if higher.

*Network Timeouts:*
- Adaptive timeouts based on rolling 5-request throughput average: 3s on measured 4G, 8s on measured 3G, 15s on measured 2G.
- Do NOT use the Network Information API for bandwidth detection (unreliable).

**Data Model Entities:** LearnerProgress, AssessmentAttempt, OfflineProgressQueue (client-side Dexie.js schema)

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/sync/progress | Batch sync offline progress records (array of lesson progress + quiz attempts) |
| GET | /api/v1/courses/{course_id}/offline-package | Get course content package for offline storage (all lessons, all tiers for selected difficulty) |
| GET | /api/v1/sync/status | Check server-side last_synced_at for current user |

**Dexie.js Client Schema (IndexedDB):**
```
offlineProgress: ++id, lessonId, enrollmentId, status, progressPercent, timeSpentSeconds, blockIndex, syncStatus, updatedAt
offlineQuizAttempts: ++id, assessmentId, answersJson, scorePercent, timeTakenSeconds, attemptNumber, syncStatus, submittedAt
offlineCourseContent: courseId, tier, contentJson, downloadedAt, lastAccessedAt, sizeBytes
syncQueue: ++id, endpoint, method, payload, createdAt, retryCount
```

---

### 1.6 Basic Corporate Admin

**Description:** Simplified corporate administration for the pilot. CSV bulk enrollment of learners. Per-learner progress view. Aggregate completion metrics by course and department. No ROI calculation, no time-series charts, no benchmarks (those are Phase 1b).

**User Stories:**
- As a corporate admin, I can upload a CSV of employees to enroll them in the platform.
- As a corporate admin, I can see a list of all enrolled learners with their completion status per course.
- As a corporate admin, I can see aggregate completion rates by course and by department.
- As a corporate admin, I can assign specific courses to individual learners or departments.
- As a corporate admin, I can deactivate a learner who has left the organization.
- As a corporate admin, I can generate invitation links for individual learners.

**Acceptance Criteria:**
- CSV upload format: email (required), first_name (required), last_name (required), department (optional), job_title (optional), employee_id (optional).
- CSV validation: per-row error reporting (invalid email, duplicate email, missing required fields). Partial success allowed (valid rows enrolled, invalid rows returned as error list).
- Maximum CSV size: 500 rows per upload.
- Learner list view: sortable by name, department, enrollment date, completion percentage. Filterable by department, course, completion status.
- Per-learner detail: list of enrolled courses with completion %, quiz scores, last active date.
- Aggregate metrics: total enrolled, total active (active in last 7 days), average completion rate, completion rate by course, completion rate by department.
- Course assignment: admin selects course(s) and learner(s) or department, creates enrollment records. Learners receive email notification.
- Deactivation: sets user status to deactivated, revokes active sessions, preserves historical data.
- Admin dashboard loads in under 2 seconds.
- All admin actions logged to audit trail (EnrollmentAuditLog).

**Data Model Entities:** Organization, Department, User, Enrollment, LearnerProgress, BulkEnrollmentJob, BulkEnrollmentError, EnrollmentAuditLog

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/admin/learners/bulk-upload | Upload CSV, validate, create user accounts and enrollments |
| GET | /api/v1/admin/learners | List learners with filters (department, course, status, search) |
| GET | /api/v1/admin/learners/{user_id}/progress | Get per-learner progress across all courses |
| POST | /api/v1/admin/learners/enroll | Assign courses to learners/departments |
| PATCH | /api/v1/admin/learners/{user_id}/status | Activate or deactivate learner |
| POST | /api/v1/admin/learners/invite | Generate invitation link for individual learner |
| GET | /api/v1/admin/dashboard/overview | Aggregate metrics (enrolled, active, completion rates by course and department) |
| GET | /api/v1/admin/audit-log | List admin actions with filters |

---

### 1.7 ITF Form 7A Export and CPD Hours Report

**Description:** Generate ITF-compatible training records and CPD hours reports for corporate compliance. The ITF (Industrial Training Fund) requires employers to submit Form 7A documenting employee training. Professional bodies (CIBN, ICAN, CITN) require CPD hour tracking.

**User Stories:**
- As a corporate admin, I can export an ITF Form 7A-compatible training record for my organization.
- As a corporate admin, I can generate a CPD hours report per employee for submission to professional bodies.
- As a corporate admin, I can filter reports by date range, department, and course.
- As a learner, I can view my accumulated CPD hours by professional body.

**Acceptance Criteria:**
- ITF Form 7A export fields: employee name, employee ID, department, training title, training provider (SABIficate/co-brand), start date, end date, duration (hours), assessment score, completion status.
- Export formats: CSV and PDF.
- PDF report includes organization header, date range, summary statistics, and per-employee detail table.
- CPD hours calculated from course metadata (cpd_hours field on Course entity). Only awarded on course completion (100% lesson completion + passing quiz scores).
- CPD report grouped by professional body (CIBN/ICAN/CITN).
- Per-learner CPD summary accessible to the learner in their profile.
- Report generation is async for large organizations (>50 employees). Job status polling endpoint.
- Reports include only completed training, not in-progress.

**Data Model Entities:** Course (cpd_hours, professional_body fields), Enrollment, LearnerProgress, ITFTrainingRecord (generated view), CPDCredit

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/admin/reports/itf-form-7a | Generate ITF Form 7A report (params: date_from, date_to, department_id) |
| POST | /api/v1/admin/reports/cpd | Generate CPD hours report (params: date_from, date_to, professional_body, department_id) |
| GET | /api/v1/admin/reports/{job_id}/status | Check report generation status |
| GET | /api/v1/admin/reports/{job_id}/download | Download generated report (CSV or PDF) |
| GET | /api/v1/learner/cpd-summary | Get learner's CPD hours by professional body |

---

### 1.8 Paystack Payment Integration

**Description:** Individual subscription billing via Paystack Subscriptions API. Corporate invoice generation for B2B seat licenses. No Flutterwave, no USSD, no mobile money, no NIBSS in Phase 1.

**User Stories:**
- As an individual learner, I can subscribe to a paid plan using my debit/credit card via Paystack.
- As an individual learner, I can view my subscription status and next billing date.
- As an individual learner, I can cancel my subscription (takes effect at end of billing period).
- As a corporate admin, I can request a proforma invoice for seat licenses.
- As a platform admin, I can mark an invoice as paid after confirming bank transfer.

**Acceptance Criteria:**

*Individual Subscriptions:*
- Paystack Subscriptions API (managed by Paystack) for individual recurring billing.
- Subscription tiers: Free (3 courses, no credential issuance), Standard (NGN 6,500/quarter, all courses), Premium (NGN 18,000/year, all courses + priority support).
- Paystack Inline JS SDK lazy-loaded (not in main bundle).
- Payment confirmation within 60 seconds (Paystack webhook + polling fallback).
- Webhook endpoint validates Paystack signature (HMAC SHA-512).
- Failed payment: Paystack does NOT auto-retry. Phase 1 sends email notification only. Full dunning engine deferred to Phase 1b.
- 7-day grace period on failed renewal: learner retains access but sees "Payment failed" banner with card update link.
- Promo/scholarship codes: percentage or fixed discount, max uses, date range, applicable course restriction.

*Corporate Invoicing:*
- Corporate admin requests proforma invoice specifying number of seats and billing period.
- Invoice generated with: organization details, line items, Nigerian VAT (7.5%), total in NGN, due date (NET 30), bank transfer details.
- Invoice PDF generated and emailed to billing_email.
- Platform admin marks invoice as paid with payment reference, creating PaymentTransaction record.
- No automated bank reconciliation in Phase 1.

*Paystack for Schools:*
- Apply for Paystack education discount (0.7% capped at NGN 1,500) during Phase 0. If approved, configure reduced rate.
- Standard Paystack rate (1.5% + NGN 100 capped at NGN 2,000) as fallback.

**Data Model Entities:** SubscriptionPlan, Subscription, PaymentTransaction, Invoice, PromoCode

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/plans | List available subscription plans |
| POST | /api/v1/subscriptions/initialize | Initialize Paystack subscription (returns Paystack authorization_url) |
| POST | /api/v1/payments/webhook/paystack | Paystack webhook receiver (charge.success, subscription.create, subscription.not_renew, subscription.disable) |
| GET | /api/v1/learner/subscription | Get current subscription status |
| POST | /api/v1/learner/subscription/cancel | Cancel subscription (end of period) |
| POST | /api/v1/learner/promo-code/apply | Validate and apply promo code |
| POST | /api/v1/admin/invoices/generate | Generate proforma invoice for corporate seats |
| GET | /api/v1/admin/invoices | List invoices for organization |
| GET | /api/v1/admin/invoices/{id}/pdf | Download invoice PDF |
| PATCH | /api/v1/admin/invoices/{id}/mark-paid | Mark invoice as paid with payment reference |

---

### 1.9 WhatsApp Micro-Lesson Delivery

**Description:** Daily micro-lesson delivery via WhatsApp Business API. Each session: problem statement, 300-word lesson, 2 quiz questions via interactive buttons, artifact prompt. Streak reminders. This is a P0 parallel delivery channel, not just notifications.

**User Stories:**
- As a learner, I can opt in to receive daily lessons via WhatsApp.
- As a learner, I can complete a micro-lesson entirely within WhatsApp without opening the PWA.
- As a learner, I can answer quiz questions using WhatsApp interactive buttons and get immediate feedback.
- As a learner, I can set my preferred delivery time for daily lessons.
- As a learner, I can reply STOP to unsubscribe from WhatsApp delivery.

**Acceptance Criteria:**
- WhatsApp Business API via approved BSP (360dialog, Gupshup, or similar). No unofficial API.
- Meta-approved message templates for: daily lesson, quiz question, quiz feedback, streak reminder, streak broken, artifact prompt. All templates pre-approved before launch.
- Daily lesson flow:
  1. Problem statement (template message)
  2. 300-word lesson body (template message, max 1024 chars per message -- split across 2 messages if needed)
  3. Quiz question 1 with interactive buttons (max 3 buttons per message)
  4. Feedback on answer
  5. Quiz question 2 with interactive buttons
  6. Feedback on answer
  7. Artifact prompt with deep link to PWA for submission
- Streak reminders: sent at learner's preferred time if no lesson completed today. Customizable time (default 8:00 AM WAT).
- STOP/HELP commands processed within 60 seconds.
- All WhatsApp quiz responses recorded as AssessmentAttempt records, synced to learner progress.
- Delivery receipts tracked (sent, delivered, read).
- WhatsApp opt-in requires explicit NDPA-compliant consent (separate from platform consent).
- Cost budget: ~NGN 25-50 per conversation session (Meta conversation-based pricing).
- Webhook processes inbound messages within 5 seconds.

**Data Model Entities:** WhatsAppSubscription, WhatsAppMessage, WhatsAppTemplate, ConsentRecord (WhatsApp-specific consent)

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/whatsapp/subscribe | Opt in to WhatsApp delivery (requires phone number, preferred time, consent) |
| DELETE | /api/v1/whatsapp/subscribe | Opt out of WhatsApp delivery |
| PATCH | /api/v1/whatsapp/subscribe | Update preferred delivery time |
| POST | /api/v1/whatsapp/webhook | Inbound webhook from WhatsApp BSP (message received, delivery status) |
| GET | /api/v1/admin/whatsapp/analytics | WhatsApp delivery metrics (sent, delivered, read, quiz response rates) |

---

### 1.10 Course Content Production (15-20 Courses via AI Pipeline)

**Description:** 15-20 courses produced via AI content generation pipeline. 10 generic business skills courses, 5-10 Nigeria-specific regulatory/professional courses. Each course has 3 adaptive difficulty variants. Pipeline runs via CLI/scripts in Phase 1 (no admin UI).

**User Stories:**
- As a learner, I can access at least 15 courses covering business skills and Nigerian professional topics.
- As a learner, I can choose my difficulty tier and receive appropriately adapted content for any course.
- As an SME (Gbitse), I can provide a course brief and receive AI-generated lesson drafts for review.
- As an SME, I can review and approve/reject/edit AI-generated content before publication.

**Acceptance Criteria:**

*Content Volume:*
- Minimum 15 courses at launch. Target 20.
- 10 generic business skills: presentations, communication, leadership, project management, financial literacy, negotiation, time management, email writing, meeting facilitation, customer service.
- 5-10 Nigeria-specific: CBN regulatory compliance, ICAN standards overview, CIPM HR frameworks, ITF compliance, Nigerian corporate governance, anti-money laundering (Nigerian context).
- Each course: 5-8 lessons, each 10-15 minutes.
- Each lesson: text content, 3-5 quiz questions, 1 artifact prompt.
- Each course: 3 complete adaptive variants (beginner/intermediate/advanced).

*Pipeline (CLI):*
- Input: SME brief (learning objectives, target audience, key concepts, Nigerian context notes).
- Multi-agent pipeline: lesson_generator, quiz_generator, adaptive_variant_generator, validation_agent, artifact_prompt_generator.
- Output: JSON content schema (see Section 3).
- AI model: Claude Sonnet 4.6 via Batch API (50% discount). Cost per course: $0.05-0.10 via Batch API.
- SME review workflow: AI generates -> Gbitse reviews -> approve/reject/request-edits per lesson.

*Quality Gates:*
- Day 25 velocity test: generic business 60%+ SME acceptance rate, Nigeria-specific 40%+ acceptance rate.
- Every quiz item tagged with Bloom's taxonomy level. Minimum 40% at application/analysis level (not just recall).
- Nigerian Business Context Library (50+ vetted scenarios) used as RAG corpus for generation prompts.

*Three-Tier SME Review:*
1. Automated validation agent checks: factual consistency, Bloom's level distribution, difficulty tier consistency, Nigerian context presence.
2. Lightweight review (10-15 min checklist) by Gbitse for 80% of courses.
3. Deep review for 20% sample (Nigeria-specific regulatory content).

**Data Model Entities:** Course, Module, Lesson, CourseCategory

**API Endpoints:** None (pipeline is CLI-based in Phase 1). Content loaded directly into PostgreSQL via migration scripts or admin seed process.

---

### 1.11 Data Saver Mode and Three-Tier Content Delivery

**Description:** Data saver mode is the DEFAULT experience for all new users. Three selectable content delivery tiers to minimize data costs. Active tier displayed in app header.

**User Stories:**
- As a learner on a metered data plan, I can use the platform without worrying about unexpected data charges.
- As a learner, I can switch between Full, Data Saver, and Ultra Light modes based on my current network situation.
- As a learner, I can see which data mode I am currently using in the app header.
- As a learner, I can see estimated data usage before loading a lesson.

**Acceptance Criteria:**

*Three Tiers:*
| Tier | Default | Description | Max Lesson Size |
|------|---------|-------------|-----------------|
| Full Experience | No | All content: images, diagrams, rich formatting, embedded media | 500KB |
| Data Saver | YES (default for new users) | Compressed images (WebP, max 50KB each), no auto-loading media, simplified formatting | 150KB |
| Ultra Light | No | Text-only with minimal formatting. No images. | 50KB |

- Tier selection persists in user preferences (localStorage + server sync).
- Active tier badge displayed in app header (e.g., green dot = Full, yellow = Data Saver, grey = Ultra Light).
- Estimated data usage displayed on course download screen and lesson load screen (calculated from content_json size per tier).
- Data Saver as default: new user accounts created with content_tier = 'data_saver'. Changeable in settings.
- Content JSON stores all three tier variants per lesson. Client requests appropriate tier.
- Images lazy-loaded with intersection observer. Placeholder shown until user scrolls to image.
- No auto-play of any media. All media requires explicit user tap.

**Data Model Entities:** User (content_tier preference), Lesson (content_json with per-tier variants)

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| PATCH | /api/v1/learner/preferences | Update content tier and other preferences |
| GET | /api/v1/learner/preferences | Get current preferences |

Note: Content tier is passed as query parameter on existing lesson content endpoint (GET /api/v1/lessons/{id}/content?tier=beginner&content_tier=data_saver).

---

### 1.12 Basic Credential Issuance

**Description:** Issue Open Badges 3.0 credentials on course completion. Ed25519 cryptographic signing. QR code verification page. Portfolio artifact link as evidence. Co-branding infrastructure ready for institutional partners (configuration change, not code change).

**User Stories:**
- As a learner, I can earn a verifiable credential when I complete a course.
- As a learner, I can share my credential via a public verification URL.
- As a learner, I can download my credential as a PDF certificate with QR code.
- As an employer, I can scan a QR code on a certificate and verify it is authentic.
- As a learner, I can link my portfolio artifact to my credential as evidence of competence.

**Acceptance Criteria:**
- Credential issued automatically when: all lessons completed + all quizzes passed (score >= 70%) + artifact prompt acknowledged (artifact submission tracked but not graded in Phase 1).
- Credential format: Open Badges 3.0 JSON-LD with W3C Verifiable Credentials alignment.
- Cryptographic signing: Ed25519. Issuer key pair generated at platform setup, stored encrypted.
- Credential JSON includes: achievementName, description, criteria, issuer, issuanceDate, evidence (array with artifact URL if submitted), recipient (hashed email).
- Co-branding fields in CredentialTemplate: co_brand_org_id, co_brand_logo_url, co_brand_signatory. Ready for configuration when institutional partner signs. NOT populated in Phase 1 unless partnership secured.
- Public verification page: /verify/{certificate_number} -- displays credential details, verification status (valid/revoked/expired), issuer information, evidence links.
- QR code generated per credential, encodes verification URL.
- PDF certificate: downloadable, includes QR code, credential details, issuer branding (and co-brand if configured).
- Credential revocation: platform admin can revoke with reason. Verification page reflects revoked status.
- No credential wallet in Phase 1. No LinkedIn sharing automation. Learner can manually share verification URL.

**Data Model Entities:** CredentialTemplate, IssuedCredential, IssuerKey

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/credentials/issue | Issue credential for completed course (triggered automatically or by admin) |
| GET | /api/v1/learner/credentials | List learner's earned credentials |
| GET | /api/v1/credentials/verify/{certificate_number} | Public verification endpoint (no auth required) |
| GET | /api/v1/learner/credentials/{id}/pdf | Download credential as PDF |
| POST | /api/v1/admin/credentials/{id}/revoke | Revoke credential with reason |

---

## 2. Adaptive Placement Quiz

The platform uses a 2-dimensional adaptive placement quiz to assign difficulty tiers per course:

**Dimension 1: Domain Knowledge**
- Assesses learner's existing knowledge of the course topic.
- 5-8 questions per course domain, pulled from quiz_block items tagged at Bloom's levels 1-4.
- Scoring: 0-40% = beginner, 41-70% = intermediate, 71-100% = advanced.

**Dimension 2: Language Sophistication**
- Assesses learner's comfort with business/technical English vocabulary.
- 5 questions: presented with a business concept, select the description that best matches their understanding.
- Three versions of each concept description at beginner/intermediate/advanced language levels.
- Learner selects which version they found clearest -- this indicates their language tier.

**Placement Logic:**
- Final tier = lower of the two dimensions. A learner with advanced domain knowledge but beginner language sophistication gets beginner-tier content (language is the bottleneck).
- Placement stored per course, per learner. Can be retaken.
- First-time platform users see placement quiz before first course enrollment.
- Test-out capability: if placement quiz scores advanced on both dimensions, learner can skip directly to assessment and earn credential without completing lessons.

**Data Model:**
- PlacementAttempt: id, user_id (FK), course_id (FK, nullable for language-only assessment), domain_score_percent, language_tier (beginner/intermediate/advanced), assigned_tier, attempted_at.

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/placement/quiz/{course_id} | Get placement quiz questions for course |
| POST | /api/v1/placement/quiz/{course_id}/submit | Submit placement quiz, receive tier assignment |
| GET | /api/v1/learner/placement/{course_id} | Get current placement for course |

---

## 3. JSON Content Schema

All lesson content is stored as JSON with typed blocks. The AI pipeline outputs this schema. The React lesson player renders it. This separation ensures content is independent of presentation.

### Block Types

```typescript
type ContentBlock =
  | TextBlock
  | QuizBlock
  | ArtifactPromptBlock
  | ScenarioBlock;

interface Lesson {
  id: string;                    // UUID
  module_id: string;             // UUID
  title: string;
  difficulty_tier: "beginner" | "intermediate" | "advanced";
  content_tier: "full" | "data_saver" | "ultra_light";
  estimated_duration_minutes: number;
  blocks: ContentBlock[];
  version: number;
  created_at: string;            // ISO 8601
}

// --- Text Block ---
interface TextBlock {
  type: "text_block";
  id: string;                    // UUID, for progress tracking
  content: string;               // Markdown
  difficulty_tier: "beginner" | "intermediate" | "advanced";
  images?: TextImage[];          // Only present in "full" and "data_saver" tiers
  key_terms?: KeyTerm[];         // Highlighted vocabulary
}

interface TextImage {
  url: string;                   // Cloudflare R2 URL
  alt: string;
  width: number;
  height: number;
  size_bytes: number;
  caption?: string;
}

interface KeyTerm {
  term: string;
  definition: string;
  tier: "beginner" | "intermediate" | "advanced";
}

// --- Quiz Block ---
interface QuizBlock {
  type: "quiz_block";
  id: string;                    // UUID, used as assessment_id
  question: string;
  question_type: "multiple_choice" | "true_false";
  options: QuizOption[];
  correct_answer_index: number;
  explanation: string;           // Shown after answer
  bloom_level: 1 | 2 | 3 | 4 | 5 | 6;
  // 1=Remember, 2=Understand, 3=Apply, 4=Analyze, 5=Evaluate, 6=Create
  difficulty_tier: "beginner" | "intermediate" | "advanced";
  points: number;                // Default 10
}

interface QuizOption {
  text: string;
  feedback?: string;             // Optional per-option feedback for wrong answers
}

// --- Artifact Prompt Block ---
interface ArtifactPromptBlock {
  type: "artifact_prompt_block";
  id: string;                    // UUID
  prompt: string;                // What the learner should produce
  target_role: string;           // e.g., "HR Manager", "Financial Analyst"
  industry_vertical: string;     // e.g., "Banking", "Oil & Gas"
  career_level: "junior" | "mid" | "senior";
  deliverable_format: string;    // e.g., "Email draft", "Slide deck outline", "Memo"
  example_output?: string;       // Optional example of good output
  evaluation_criteria: string[]; // What constitutes good work
}

// --- Scenario Block ---
interface ScenarioBlock {
  type: "scenario_block";
  id: string;                    // UUID
  scenario: string;              // The situation description
  company_type: string;          // e.g., "Tier 1 Bank", "Fintech Startup", "FMCG"
  regulatory_body?: string;      // e.g., "CBN", "SEC", "ICAN"
  cultural_notes?: string;       // Nigerian workplace context
  question: string;              // What should the learner do?
  options?: ScenarioOption[];    // Optional multiple-choice response
  discussion_points?: string[];  // For open-ended reflection
}

interface ScenarioOption {
  text: string;
  is_recommended: boolean;
  rationale: string;
}
```

### Content Tier Rules

| Field / Behavior | Full | Data Saver | Ultra Light |
|-------------------|------|------------|-------------|
| TextBlock.images | Included (original) | Included (WebP, max 50KB) | Excluded |
| TextBlock.content | Full Markdown | Full Markdown | Plain text, no formatting |
| QuizBlock | Full | Full | Full |
| ArtifactPromptBlock.example_output | Included | Included | Excluded |
| ScenarioBlock.cultural_notes | Included | Included | Excluded |

### Storage

- Lesson content stored in PostgreSQL `lessons.content_json` as JSONB.
- Each adaptive variant (beginner/intermediate/advanced) x each content tier (full/data_saver/ultra_light) = up to 9 content packages per lesson, stored as independent records.
- In Phase 1, content tiers are generated at build time by the pipeline, not computed at request time.

---

## 4. Data Model

### 4.1 Overview

The data model is organized into 10 entity groups. Changes from the original 8-group spec are noted.

**Split-database architecture (council decision 2.4):**
- **Hetzner Nuremberg (application database):** Course, Module, Lesson, CourseCategory, Organization, Department, SubscriptionPlan, Subscription, PaymentTransaction, Invoice, PromoCode, CredentialTemplate, IssuedCredential, IssuerKey, WhatsAppTemplate, BulkEnrollmentJob, BulkEnrollmentError, EnrollmentAuditLog, PlacementAttempt.
- **Nigerian-hosted instance (PII database):** User, LearnerProgress, AssessmentAttempt, Enrollment, WhatsAppSubscription, WhatsAppMessage, ConsentRecord, CPDCredit. Also TutorConversation and TutorMessage in Phase 2.

Cross-database references use UUID foreign keys. Application database stores user_id (UUID) without storing PII. Nigerian database stores user records with all PII fields.

All entities use UUID primary keys. All timestamps in UTC. All monetary values stored as integer (kobo for NGN, cents for USD) to avoid floating-point issues.

### 4.2 Entity Definitions

#### Core User System

**User** (Nigerian PII database)
```
id: UUID PRIMARY KEY
email: VARCHAR(255) UNIQUE NOT NULL
phone_number: VARCHAR(20) -- E.164 format
password_hash: VARCHAR(255) -- bcrypt, cost factor 12. Nullable for future SSO.
first_name: VARCHAR(100) NOT NULL
last_name: VARCHAR(100) NOT NULL
avatar_url: VARCHAR(500)
role: ENUM('learner', 'corporate_admin', 'platform_admin') NOT NULL
org_id: UUID -- FK to Organization (cross-database reference)
department_id: UUID -- FK to Department (cross-database reference)
employee_id: VARCHAR(100) -- corporate employee identifier
language_preference: VARCHAR(5) DEFAULT 'en'
timezone: VARCHAR(50) DEFAULT 'Africa/Lagos'
content_tier: ENUM('full', 'data_saver', 'ultra_light') DEFAULT 'data_saver'
status: ENUM('active', 'invited', 'suspended', 'deactivated') DEFAULT 'invited'
last_login_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

**Organization** (Hetzner application database)
```
id: UUID PRIMARY KEY
name: VARCHAR(255) NOT NULL
legal_name: VARCHAR(255)
type: ENUM('corporate', 'government', 'ngo') NOT NULL
industry: VARCHAR(100)
logo_url: VARCHAR(500)
itf_registration_number: VARCHAR(50)
cac_registration_number: VARCHAR(50)
billing_email: VARCHAR(255)
billing_address_json: JSONB
primary_contact_user_id: UUID -- references User.id (cross-database)
status: ENUM('active', 'suspended', 'inactive') DEFAULT 'active'
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

**Department** (Hetzner application database)
```
id: UUID PRIMARY KEY
org_id: UUID NOT NULL -- FK to Organization
name: VARCHAR(255) NOT NULL
parent_department_id: UUID -- FK to Department (self-referential hierarchy)
head_user_id: UUID -- references User.id (cross-database)
created_at: TIMESTAMP DEFAULT NOW()
```

**RefreshToken** (Hetzner application database)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- references User.id
token_hash: VARCHAR(255) NOT NULL -- SHA-256 of refresh token
expires_at: TIMESTAMP NOT NULL
revoked_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
```

#### Course and Content System

**CourseCategory** (Hetzner)
```
id: UUID PRIMARY KEY
name: VARCHAR(255) NOT NULL
slug: VARCHAR(255) UNIQUE NOT NULL
parent_id: UUID -- FK to CourseCategory
icon_url: VARCHAR(500)
sort_order: INTEGER DEFAULT 0
```

**Course** (Hetzner)
```
id: UUID PRIMARY KEY
title: VARCHAR(255) NOT NULL
slug: VARCHAR(255) UNIQUE NOT NULL
description: TEXT
thumbnail_url: VARCHAR(500)
category_id: UUID -- FK to CourseCategory
difficulty_level: ENUM('beginner', 'intermediate', 'advanced') -- default starting level
estimated_duration_minutes: INTEGER
credential_template_id: UUID -- FK to CredentialTemplate
price_ngn: INTEGER -- in kobo, NULL for free/sponsored courses
cpd_hours: DECIMAL(4,1)
professional_body: ENUM('CIBN', 'ICAN', 'CITN', 'CIPM', 'none') DEFAULT 'none'
status: ENUM('draft', 'published', 'archived') DEFAULT 'draft'
version: INTEGER DEFAULT 1
created_by: UUID -- references User.id
published_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

**Module** (Hetzner)
```
id: UUID PRIMARY KEY
course_id: UUID NOT NULL -- FK to Course
title: VARCHAR(255) NOT NULL
description: TEXT
sort_order: INTEGER NOT NULL
is_locked_until_previous_complete: BOOLEAN DEFAULT true
estimated_duration_minutes: INTEGER
```

**Lesson** (Hetzner)
```
id: UUID PRIMARY KEY
module_id: UUID NOT NULL -- FK to Module
title: VARCHAR(255) NOT NULL
content_json: JSONB NOT NULL -- JSON Content Schema (Section 3)
difficulty_tier: ENUM('beginner', 'intermediate', 'advanced') NOT NULL
content_tier: ENUM('full', 'data_saver', 'ultra_light') NOT NULL
sort_order: INTEGER NOT NULL
estimated_duration_minutes: INTEGER
offline_available: BOOLEAN DEFAULT true
version: INTEGER DEFAULT 1
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()

-- Composite unique: (module_id, sort_order, difficulty_tier, content_tier)
```

Note: Each lesson has up to 9 rows (3 difficulty tiers x 3 content tiers). The client requests the specific combination via query parameters.

#### Enrollment and Progress

**Enrollment** (Nigerian PII database)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- FK to User
course_id: UUID NOT NULL -- references Course.id (cross-database)
org_id: UUID -- references Organization.id (cross-database)
enrollment_type: ENUM('self', 'corporate_assigned', 'sponsored') NOT NULL
assigned_difficulty_tier: ENUM('beginner', 'intermediate', 'advanced')
status: ENUM('active', 'completed', 'dropped', 'expired') DEFAULT 'active'
enrolled_at: TIMESTAMP DEFAULT NOW()
completed_at: TIMESTAMP
dropped_at: TIMESTAMP
completion_percent: DECIMAL(5,2) DEFAULT 0 -- denormalized

-- Unique index: (user_id, course_id)
```

**LearnerProgress** (Nigerian PII database)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- FK to User
lesson_id: UUID NOT NULL -- references Lesson.id (cross-database)
enrollment_id: UUID NOT NULL -- FK to Enrollment
status: ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started'
progress_percent: DECIMAL(5,2) DEFAULT 0
block_index: INTEGER DEFAULT 0 -- last viewed block
time_spent_seconds: INTEGER DEFAULT 0
started_at: TIMESTAMP
completed_at: TIMESTAMP
last_accessed_at: TIMESTAMP
synced_at: TIMESTAMP -- last successful server sync

-- Unique index: (user_id, lesson_id)
```

**AssessmentAttempt** (Nigerian PII database)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- FK to User
quiz_block_id: VARCHAR(255) NOT NULL -- quiz_block.id from content JSON
lesson_id: UUID NOT NULL -- references Lesson.id
enrollment_id: UUID NOT NULL -- FK to Enrollment
answers_json: JSONB NOT NULL -- [{question_id, selected_index, correct}]
score_percent: DECIMAL(5,2) NOT NULL
passed: BOOLEAN NOT NULL -- score_percent >= 70
time_taken_seconds: INTEGER
attempt_number: INTEGER NOT NULL
source: ENUM('pwa', 'whatsapp') DEFAULT 'pwa'
submitted_at: TIMESTAMP DEFAULT NOW()
synced_at: TIMESTAMP

-- Index: (user_id, quiz_block_id, attempt_number)
```

**PlacementAttempt** (Hetzner -- no PII, stores only user_id and scores)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- references User.id
course_id: UUID -- NULL for platform-wide language assessment
domain_score_percent: DECIMAL(5,2)
language_tier: ENUM('beginner', 'intermediate', 'advanced')
assigned_tier: ENUM('beginner', 'intermediate', 'advanced') NOT NULL
attempted_at: TIMESTAMP DEFAULT NOW()
```

#### Credentials

**CredentialTemplate** (Hetzner)
```
id: UUID PRIMARY KEY
name: VARCHAR(255) NOT NULL
description: TEXT
badge_image_url: VARCHAR(500)
achievement_type: ENUM('course_completion', 'program_completion', 'cpd') NOT NULL
learning_outcomes_json: JSONB -- array of strings
co_brand_org_id: UUID -- FK to Organization. NULL until institutional partner signs.
co_brand_logo_url: VARCHAR(500)
co_brand_signatory: VARCHAR(255) -- name and title of co-signing authority
cpd_hours: DECIMAL(4,1)
professional_body: ENUM('CIBN', 'ICAN', 'CITN', 'CIPM', 'none')
expiry_months: INTEGER -- NULL for non-expiring credentials
issuer_did: VARCHAR(255)
created_by: UUID
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

**IssuedCredential** (Hetzner -- credential JSON contains no PII; recipient is hashed email)
```
id: UUID PRIMARY KEY
template_id: UUID NOT NULL -- FK to CredentialTemplate
user_id: UUID NOT NULL -- references User.id
course_id: UUID NOT NULL -- FK to Course
certificate_number: VARCHAR(50) UNIQUE NOT NULL -- e.g., SAB-2026-000001
credential_json: JSONB NOT NULL -- OB 3.0 JSON-LD
proof_json: JSONB NOT NULL -- Ed25519 signature
verification_url: VARCHAR(500) NOT NULL
qr_code_url: VARCHAR(500)
evidence_url: VARCHAR(500) -- link to portfolio artifact
status: ENUM('active', 'revoked', 'expired') DEFAULT 'active'
issued_at: TIMESTAMP DEFAULT NOW()
expires_at: TIMESTAMP
revoked_at: TIMESTAMP
revocation_reason: TEXT
```

**IssuerKey** (Hetzner -- encrypted at rest)
```
id: UUID PRIMARY KEY
algorithm: VARCHAR(50) DEFAULT 'Ed25519'
public_key: TEXT NOT NULL
private_key_encrypted: TEXT NOT NULL -- AES-256-GCM encrypted
key_id: VARCHAR(255) UNIQUE NOT NULL
status: ENUM('active', 'rotated', 'revoked') DEFAULT 'active'
created_at: TIMESTAMP DEFAULT NOW()
rotated_at: TIMESTAMP
```

#### Payments and Billing

**SubscriptionPlan** (Hetzner)
```
id: UUID PRIMARY KEY
name: VARCHAR(100) NOT NULL -- e.g., "Free", "Standard", "Premium"
type: ENUM('individual', 'corporate') NOT NULL
tier: ENUM('free', 'standard', 'premium', 'enterprise') NOT NULL
price_kobo: INTEGER NOT NULL -- NGN in kobo (0 for free)
billing_cycle: ENUM('monthly', 'quarterly', 'annually') NOT NULL
course_access_scope: ENUM('limited', 'all') NOT NULL -- 'limited' for free tier
course_limit: INTEGER -- NULL for unlimited, 3 for free tier
credential_issuance: BOOLEAN DEFAULT true -- false for free tier
features_json: JSONB
status: ENUM('active', 'inactive') DEFAULT 'active'
created_at: TIMESTAMP DEFAULT NOW()
```

**Subscription** (Hetzner)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- references User.id
org_id: UUID -- references Organization.id (for corporate)
plan_id: UUID NOT NULL -- FK to SubscriptionPlan
paystack_subscription_code: VARCHAR(255) -- Paystack's subscription identifier
paystack_email_token: VARCHAR(255) -- for subscription management
status: ENUM('active', 'past_due', 'cancelled', 'expired') DEFAULT 'active'
current_period_start: TIMESTAMP
current_period_end: TIMESTAMP
seats_purchased: INTEGER -- for corporate plans
seats_used: INTEGER DEFAULT 0 -- for corporate plans
auto_renew: BOOLEAN DEFAULT true
cancelled_at: TIMESTAMP
cancel_reason: TEXT
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

**PaymentTransaction** (Hetzner)
```
id: UUID PRIMARY KEY
user_id: UUID -- references User.id
org_id: UUID -- references Organization.id
subscription_id: UUID -- FK to Subscription
invoice_id: UUID -- FK to Invoice (for corporate payments)
amount_kobo: INTEGER NOT NULL -- NGN in kobo
currency: VARCHAR(3) DEFAULT 'NGN'
payment_method: ENUM('card', 'bank_transfer', 'manual') NOT NULL
gateway: ENUM('paystack', 'manual') DEFAULT 'paystack'
gateway_reference: VARCHAR(255) -- Paystack reference
paystack_authorization_code: VARCHAR(255) -- for recurring charges
status: ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending'
promo_code_id: UUID -- FK to PromoCode
metadata_json: JSONB NOT NULL DEFAULT '{}'
  -- Schema constraints for metadata_json:
  -- Required: { "source": "pwa"|"whatsapp"|"admin", "ip_country": string }
  -- Optional: { "card_last4": string, "card_bank": string, "card_type": string,
  --             "paystack_event_id": string, "manual_reference": string,
  --             "reconciled_by": UUID, "reconciled_at": ISO8601 }
  -- Validated by CHECK constraint or application-level validation
failure_reason: TEXT
created_at: TIMESTAMP DEFAULT NOW()
confirmed_at: TIMESTAMP
```

**Invoice** (Hetzner)
```
id: UUID PRIMARY KEY
org_id: UUID NOT NULL -- FK to Organization
invoice_number: VARCHAR(50) UNIQUE NOT NULL -- e.g., INV-2026-000001
line_items_json: JSONB NOT NULL
  -- [{description, quantity, unit_price_kobo, total_kobo}]
subtotal_kobo: INTEGER NOT NULL
vat_rate: DECIMAL(4,2) DEFAULT 7.50 -- Nigerian VAT
vat_kobo: INTEGER NOT NULL
total_kobo: INTEGER NOT NULL
currency: VARCHAR(3) DEFAULT 'NGN'
due_date: DATE NOT NULL
status: ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft'
payment_transaction_id: UUID -- FK to PaymentTransaction
pdf_url: VARCHAR(500)
generated_by: UUID -- references User.id
sent_at: TIMESTAMP
paid_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

**PromoCode** (Hetzner)
```
id: UUID PRIMARY KEY
code: VARCHAR(50) UNIQUE NOT NULL
discount_type: ENUM('percent', 'fixed_kobo') NOT NULL
discount_value: INTEGER NOT NULL -- percentage (0-100) or kobo amount
max_uses: INTEGER
used_count: INTEGER DEFAULT 0
valid_from: TIMESTAMP NOT NULL
valid_until: TIMESTAMP NOT NULL
applicable_plan_ids: UUID[] -- NULL = all plans
created_by: UUID
created_at: TIMESTAMP DEFAULT NOW()
```

**DunningAttempt** (Hetzner -- Phase 1b, schema defined now for forward compatibility)
```
id: UUID PRIMARY KEY
subscription_id: UUID NOT NULL -- FK to Subscription
payment_transaction_id: UUID -- FK to PaymentTransaction (the failed charge)
attempt_number: INTEGER NOT NULL -- 1, 2, 3
scheduled_at: TIMESTAMP NOT NULL -- 24h, 72h, 7d after failure
executed_at: TIMESTAMP
channel: ENUM('email', 'sms', 'whatsapp') NOT NULL
status: ENUM('scheduled', 'sent', 'delivered', 'clicked', 'payment_recovered', 'expired')
card_update_url: VARCHAR(500) -- deep link for card update
created_at: TIMESTAMP DEFAULT NOW()
```
Note: DunningAttempt table is created in Phase 1 migration but populated only in Phase 1b when the dunning engine ships.

#### WhatsApp System

**WhatsAppSubscription** (Nigerian PII database)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- FK to User
phone_number: VARCHAR(20) NOT NULL -- E.164
preferred_time: TIME DEFAULT '08:00' -- WAT
status: ENUM('active', 'paused', 'stopped') DEFAULT 'active'
consent_record_id: UUID NOT NULL -- FK to ConsentRecord
opted_in_at: TIMESTAMP DEFAULT NOW()
stopped_at: TIMESTAMP
```

**WhatsAppMessage** (Nigerian PII database)
```
id: UUID PRIMARY KEY
subscription_id: UUID NOT NULL -- FK to WhatsAppSubscription
template_id: UUID -- FK to WhatsAppTemplate (NULL for inbound)
direction: ENUM('outbound', 'inbound') NOT NULL
message_type: ENUM('lesson', 'quiz', 'feedback', 'reminder', 'artifact_prompt', 'command', 'reply')
content_json: JSONB NOT NULL -- message payload
bsp_message_id: VARCHAR(255) -- BSP's message identifier
status: ENUM('queued', 'sent', 'delivered', 'read', 'failed') DEFAULT 'queued'
failure_reason: TEXT
lesson_id: UUID -- references Lesson.id if this is a lesson delivery
sent_at: TIMESTAMP
delivered_at: TIMESTAMP
read_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
```

**WhatsAppTemplate** (Hetzner)
```
id: UUID PRIMARY KEY
name: VARCHAR(100) NOT NULL -- Meta template name
category: ENUM('MARKETING', 'UTILITY') NOT NULL
language: VARCHAR(10) DEFAULT 'en'
body_template: TEXT NOT NULL -- with {{variable}} placeholders
button_type: ENUM('none', 'quick_reply', 'call_to_action')
buttons_json: JSONB -- button definitions
meta_template_id: VARCHAR(255) -- Meta's template ID after approval
status: ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft'
created_at: TIMESTAMP DEFAULT NOW()
```

#### Compliance and Consent

**ConsentRecord** (Nigerian PII database)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- FK to User
consent_type: ENUM('platform_tos', 'data_processing', 'whatsapp_delivery', 'marketing_email', 'anonymized_analytics') NOT NULL
version: INTEGER NOT NULL -- consent text version
granted: BOOLEAN NOT NULL
granted_at: TIMESTAMP
revoked_at: TIMESTAMP
ip_address: VARCHAR(45)
user_agent: TEXT
consent_text_hash: VARCHAR(64) -- SHA-256 of the consent text shown to user

-- No unique constraint: user can grant/revoke same consent type multiple times (audit trail)
-- Query latest record per (user_id, consent_type) for current status
```

Three-tier consent model per council and NDPA requirements:
1. **platform_tos + data_processing**: Required for account creation. Cannot use platform without these.
2. **whatsapp_delivery**: Required for WhatsApp lesson delivery. Separate opt-in with clear data flow explanation.
3. **anonymized_analytics**: Optional. Opt-out does not degrade platform experience.

**CPDCredit** (Nigerian PII database)
```
id: UUID PRIMARY KEY
user_id: UUID NOT NULL -- FK to User
course_id: UUID NOT NULL -- references Course.id
enrollment_id: UUID NOT NULL -- FK to Enrollment
professional_body: ENUM('CIBN', 'ICAN', 'CITN', 'CIPM') NOT NULL
cpd_hours: DECIMAL(4,1) NOT NULL
earned_at: TIMESTAMP DEFAULT NOW() -- date of course completion
membership_number: VARCHAR(100) -- learner's professional body membership number

-- Unique index: (user_id, course_id, professional_body)
```

#### Admin and Audit

**BulkEnrollmentJob** (Hetzner)
```
id: UUID PRIMARY KEY
org_id: UUID NOT NULL -- FK to Organization
uploaded_by: UUID NOT NULL -- references User.id
filename: VARCHAR(255)
total_rows: INTEGER NOT NULL
successful_rows: INTEGER DEFAULT 0
failed_rows: INTEGER DEFAULT 0
status: ENUM('processing', 'completed', 'failed') DEFAULT 'processing'
course_ids: UUID[] -- courses to enroll into
created_at: TIMESTAMP DEFAULT NOW()
completed_at: TIMESTAMP
```

**BulkEnrollmentError** (Hetzner)
```
id: UUID PRIMARY KEY
job_id: UUID NOT NULL -- FK to BulkEnrollmentJob
row_number: INTEGER NOT NULL
email: VARCHAR(255)
error_type: ENUM('invalid_email', 'duplicate', 'missing_required', 'other')
error_message: TEXT
created_at: TIMESTAMP DEFAULT NOW()
```

**EnrollmentAuditLog** (Hetzner)
```
id: UUID PRIMARY KEY
org_id: UUID NOT NULL -- FK to Organization
actor_user_id: UUID NOT NULL -- references User.id
action: ENUM('bulk_upload', 'individual_enroll', 'course_assign', 'deactivate', 'reactivate', 'invite')
target_user_id: UUID -- references User.id
details_json: JSONB
created_at: TIMESTAMP DEFAULT NOW()
```

### 4.3 Entity Relationship Summary

```
Organization 1--* Department
Organization 1--* Subscription, Invoice
Organization 1--* BulkEnrollmentJob, EnrollmentAuditLog

User 1--* Enrollment
User 1--* LearnerProgress, AssessmentAttempt
User 1--* PlacementAttempt
User 1--* IssuedCredential
User 1--* PaymentTransaction
User 1--* WhatsAppSubscription
User 1--* ConsentRecord
User 1--* CPDCredit

Course 1--* Module 1--* Lesson
Course *--1 CourseCategory
Course *--1 CredentialTemplate
Course 1--* Enrollment

Enrollment 1--* LearnerProgress
Enrollment 1--* AssessmentAttempt
Enrollment 1--* CPDCredit

Subscription *--1 SubscriptionPlan
Subscription 1--* PaymentTransaction
Subscription 1--* DunningAttempt

WhatsAppSubscription 1--* WhatsAppMessage
WhatsAppSubscription *--1 ConsentRecord
```

### 4.4 Database Indexes

Critical indexes for Phase 1 query patterns:

```sql
-- Course catalog browsing
CREATE INDEX idx_courses_category ON courses(category_id) WHERE status = 'published';
CREATE INDEX idx_courses_search ON courses USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_courses_difficulty ON courses(difficulty_level) WHERE status = 'published';

-- Learner progress (hot path)
CREATE UNIQUE INDEX idx_learner_progress_unique ON learner_progress(user_id, lesson_id);
CREATE INDEX idx_learner_progress_enrollment ON learner_progress(enrollment_id);

-- Enrollment lookups
CREATE UNIQUE INDEX idx_enrollment_unique ON enrollments(user_id, course_id);
CREATE INDEX idx_enrollment_org ON enrollments(org_id);

-- Corporate admin queries
CREATE INDEX idx_users_org ON users(org_id) WHERE status = 'active';
CREATE INDEX idx_users_department ON users(department_id);

-- Payment lookups
CREATE INDEX idx_payments_user ON payment_transactions(user_id);
CREATE INDEX idx_payments_status ON payment_transactions(status, created_at);
CREATE INDEX idx_payments_gateway_ref ON payment_transactions(gateway_reference);

-- Credential verification
CREATE UNIQUE INDEX idx_credential_cert_num ON issued_credentials(certificate_number);

-- WhatsApp delivery
CREATE INDEX idx_whatsapp_sub_status ON whatsapp_subscriptions(status, preferred_time);
```

---

## 5. Wireframe Descriptions

### 5.1 Lesson Player

**Layout:** Single-column, full-width on mobile. No sidebar. Fixed bottom navigation bar.

**Header (fixed, 48px):**
- Back arrow (returns to course module list)
- Lesson title (truncated to 1 line)
- Data tier indicator (colored dot: green/yellow/grey)
- Sync status icon (checkmark = synced, spinner = syncing, clock = pending, cloud-off = offline)

**Content Area (scrollable):**
- Blocks render sequentially in order from content_json.blocks array.
- TextBlock: Markdown rendered to HTML. Images lazy-loaded with aspect-ratio placeholder. Key terms highlighted with tap-to-reveal definition tooltip.
- QuizBlock: Question text, option buttons (full-width, 48px height, 8px gap). On selection: selected option highlights green (correct) or red (incorrect). Explanation text slides in below. "Next" button appears. No re-selection after answer.
- ArtifactPromptBlock: Card with colored left border. Prompt text, target role badge, deliverable format tag. "I'll do this" acknowledgment button (tracked, not graded in Phase 1). Link to upload artifact (future).
- ScenarioBlock: Scenario text in a card with company_type and regulatory_body badges. Question below. If multiple-choice: option buttons styled same as QuizBlock. If discussion: free-text response area (saved locally, not submitted in Phase 1).

**Bottom Navigation Bar (fixed, 56px):**
- Progress bar (thin, top of nav bar) showing lesson completion.
- Previous block / Next block navigation arrows.
- Lesson index (e.g., "3 of 7") tappable to show block overview.

**Difficulty Tier Selector:**
- Appears on course detail page, not during lesson.
- Three radio buttons: Beginner / Intermediate / Advanced.
- Current placement highlighted. "Retake placement quiz" link below.

### 5.2 Course Catalog

**Layout:** Top search bar, filter chips, scrollable course card grid (single column on mobile).

**Search Bar (sticky, top):**
- Search icon + text input. Debounced search (300ms delay).
- Cancel button appears when focused.

**Filter Chips (horizontal scroll below search):**
- "All" (default selected), then one chip per category.
- Tapping a chip filters the list. Multiple chips can be selected.
- Additional filters available via "Filter" icon that opens bottom sheet: difficulty, professional body, duration range, free/paid.

**Tab Bar (below filters):**
- "Browse" | "My Courses" | "Assigned"
- "Assigned" tab shows badge count if there are unstarted assigned courses.

**Course Card:**
- Thumbnail (lazy-loaded, 16:9 aspect ratio, max 30KB in data saver mode).
- Course title (max 2 lines).
- Category tag.
- Difficulty badge (color-coded: green/amber/red).
- Duration estimate (e.g., "45 min").
- CPD hours if > 0 (e.g., "2 CPD hrs").
- Progress bar if enrolled (with percentage).
- "Assigned" badge if corporate-assigned.
- Tap navigates to course detail page.

**Empty State:**
- When no courses match search/filters: illustration + "No courses found" + suggestion to adjust filters.

### 5.3 Corporate Admin Dashboard

**Layout:** Desktop-optimized (responsive, but primary use case is laptop/desktop). Sidebar navigation on desktop, bottom nav on mobile.

**Sidebar (desktop) / Bottom Nav (mobile):**
- Dashboard (overview)
- Learners
- Reports
- Settings

**Dashboard Overview:**
- Top row: 4 metric cards (Total Enrolled, Active This Week, Avg Completion Rate, Credentials Earned). Each card shows number + trend arrow (vs previous period).
- Completion by Course: horizontal bar chart. Each bar = one course. Shows enrolled vs completed count.
- Completion by Department: horizontal bar chart. Each bar = one department.
- Recent Activity: list of last 10 enrollment/completion events (e.g., "Adaeze Okafor completed Business Presentations - 2 hours ago").

**Learners Tab:**
- Table: Name, Department, Courses Enrolled, Avg Completion, Last Active.
- Search by name or email.
- Filter by department, completion status.
- Bulk actions: Assign Course, Export CSV.
- Click row to see per-learner detail (course list with per-course completion, quiz scores).

**Reports Tab:**
- Two report types: ITF Form 7A, CPD Hours.
- Date range picker, department filter, professional body filter (for CPD).
- "Generate Report" button. Loading indicator. Download button (CSV/PDF) when ready.

### 5.4 WhatsApp Learning Flow

**Message Sequence (one session = one micro-lesson):**

```
[SABIficate] 8:00 AM
+----------------------------------------+
| Good morning, Chioma!                  |
|                                        |
| Today's lesson: Writing Clear Emails   |
|                                        |
| THE PROBLEM: Your manager says your    |
| emails are "too long and unclear."     |
| Three colleagues asked you to          |
| "summarize" your last update email.    |
|                                        |
| Here's how to fix it in 3 steps...     |
+----------------------------------------+

[SABIficate] 8:00 AM
+----------------------------------------+
| STEP 1: Lead with the action.          |
| Don't start with background. Start     |
| with what you need from the reader.    |
|                                        |
| BAD: "Following our discussion last    |
| Tuesday about the Q3 budget review..." |
|                                        |
| GOOD: "Please approve the Q3 budget    |
| by Friday. Details below."             |
|                                        |
| STEP 2: One email = one topic.         |
| If you have 3 things to discuss,       |
| send 3 emails. Subject lines should    |
| tell the reader exactly what to        |
| expect.                                |
|                                        |
| STEP 3: Use bullet points.             |
| If your paragraph has more than        |
| 3 sentences, break it into bullets.    |
+----------------------------------------+

[SABIficate] 8:01 AM
+----------------------------------------+
| QUIZ: Your MD asks for a project       |
| update. Which opening is best?         |
|                                        |
| [A] "I wanted to update you on..."]    |
| [B] "Project X is on track for the     |
|      March deadline. Two risks below."]|
| [C] "As per our last meeting..."]      |
+----------------------------------------+
   [A]    [B]    [C]         <-- interactive buttons

[Chioma taps B]

[SABIficate] 8:02 AM
+----------------------------------------+
| Correct! Option B leads with the       |
| key information. The MD knows the      |
| status immediately without reading     |
| further.                               |
+----------------------------------------+

[SABIficate] 8:02 AM
+----------------------------------------+
| QUIZ 2: You need to email your team    |
| about a deadline change AND a new      |
| client meeting. What should you do?    |
|                                        |
| [A] Write one detailed email           |
| [B] Send two separate emails           |
| [C] Mention both in the subject line   |
+----------------------------------------+
   [A]    [B]    [C]

[Chioma taps B]

[SABIficate] 8:03 AM
+----------------------------------------+
| Correct! One email, one topic. This    |
| makes it easier for your team to       |
| find information later and respond     |
| to each point.                         |
+----------------------------------------+

[SABIficate] 8:03 AM
+----------------------------------------+
| YOUR TASK: Rewrite this email using    |
| today's 3 steps. Open SABIficate to    |
| submit your rewrite:                   |
|                                        |
| "Hi team, following our meeting last   |
| week I wanted to let you know that     |
| the client has moved the deadline      |
| to March 15 and also we need to        |
| prepare the Q2 forecast by Friday      |
| so please send me your numbers."       |
|                                        |
| [Open SABIficate]  <-- deep link       |
+----------------------------------------+

[SABIficate] 8:03 AM
+----------------------------------------+
| Score: 2/2                             |
| Streak: 5 days                         |
| Tomorrow: "Running Effective Meetings" |
+----------------------------------------+
```

**Key WhatsApp UX rules:**
- Maximum 1,024 characters per message body. Split into multiple messages if needed.
- Maximum 3 interactive buttons per message. For 4+ options, use list message.
- No images in micro-lessons (WhatsApp image delivery is unreliable on 2G and costs learner data).
- Deep link to PWA for artifact submission (WhatsApp cannot handle file uploads to the platform).
- Session completes in under 5 minutes.
- STOP and HELP commands processed at any point in the flow.

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Lesson player initial load: under 3 seconds on measured 3G.
- Repeat load (cached): under 1 second.
- API response time (p95): under 500ms from Cloudflare edge.
- Main entry chunk: under 50KB compressed.
- Largest vendor chunk: under 120KB compressed.
- Admin dashboard: under 2 seconds to interactive.

### 6.2 Security
- OWASP Top 10 compliance.
- All API endpoints authenticated except: /auth/register, /auth/login, /credentials/verify/{id}, /plans.
- CORS restricted to platform domain(s).
- Rate limiting on all endpoints (default: 100 requests/minute per user, 5/minute on auth endpoints).
- Input validation on all endpoints (JSON Schema validation for request bodies).
- SQL injection prevention via parameterized queries (no string concatenation in SQL).
- XSS prevention via React's default escaping + CSP headers.
- CSRF protection via SameSite cookies + CSRF token for state-changing operations.
- Paystack webhook signature validation (HMAC SHA-512).

### 6.3 Privacy (NDPA Compliance)
- PII tables hosted in Nigeria (see Section 4.1 split-database architecture).
- ConsentRecord table tracks all consent grants/revocations with full audit trail.
- Three-tier consent model: platform_tos, data_processing (required); whatsapp_delivery (optional); anonymized_analytics (optional).
- Right to data export: learner can request full data export (JSON).
- Right to deletion: learner can request account deletion. PII purged from Nigerian database. Anonymized records retained in application database for aggregate reporting.
- No PII sent to Claude API in any phase. Anonymized session tokens and course metadata only.

### 6.4 Accessibility
- WCAG 2.1 AA compliance for core flows (lesson player, catalog, auth).
- Minimum font size: 16px body text.
- Color contrast ratio: minimum 4.5:1.
- All images have alt text (from content JSON TextImage.alt field).
- Keyboard navigable (for desktop use by corporate admins).
- Touch targets: minimum 44x44px.

### 6.5 Monitoring
- Application error tracking (Sentry or equivalent).
- Uptime monitoring with alerting.
- Paystack webhook delivery monitoring.
- WhatsApp message delivery rate monitoring.
- Sync failure rate monitoring (offline progress that fails to sync within 24 hours).

---

## 7. GLO ISP Fallback Architecture

Globacom (12.34% market share, 22.5M subscribers) has documented connection timeout issues with Cloudflare-proxied servers.

**Architecture:**
- Primary domain: `app.sabificate.com` -- Cloudflare Pro (orange cloud).
- Fallback domain: `glo.sabificate.com` -- Cloudflare DNS-only (grey cloud), direct to Hetzner CX23 (~$4/month) running Nginx reverse proxy.
- Cloudflare Worker on primary domain: detects GLO users via AS number lookup (AS37148 and related), issues 302 redirect to fallback domain.
- Fallback serves identical application. No Cloudflare WAF or CDN on fallback (direct connection).
- Monitoring: track redirect rate and fallback domain performance. Review quarterly. GLO connectivity expected to improve by mid-2028.

---

## 8. Background Job Queue

BullMQ on Redis for async processing. Phase 1 job types:

| Job Type | Trigger | Priority | Retry Policy |
|----------|---------|----------|--------------|
| SendEmail | Registration, password reset, enrollment notification, invoice | High | 3 retries, exponential backoff |
| GenerateInvoicePDF | Admin creates invoice | Medium | 2 retries |
| GenerateReport | Admin requests ITF/CPD report | Medium | 2 retries |
| WhatsAppDailyLesson | Cron job at learner's preferred time | High | 3 retries, 5-minute delay |
| WhatsAppStreakReminder | Cron job, 1 hour after preferred lesson time if no activity | Low | 1 retry |
| ProcessPaystackWebhook | Paystack webhook received | Critical | 5 retries, exponential backoff |
| SyncProgressBatch | Learner foreground sync | High | 3 retries |
| IssueCredential | Course completion detected | Medium | 3 retries |
| BulkEnrollmentProcess | Admin CSV upload | Medium | No retry (partial success allowed) |

---

## 9. Environment and Configuration

### 9.1 Environment Variables

```
# Database
DATABASE_URL=postgresql://...       # Hetzner application DB
PII_DATABASE_URL=postgresql://...   # Nigerian PII DB
REDIS_URL=redis://...

# Auth
JWT_SECRET=<256-bit random>
JWT_ISSUER=sabificate.com
BCRYPT_COST_FACTOR=12
REFRESH_TOKEN_EXPIRY_DAYS=7

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...

# WhatsApp BSP
WHATSAPP_BSP_API_URL=https://...
WHATSAPP_BSP_API_KEY=...
WHATSAPP_PHONE_NUMBER_ID=...

# Cloudflare
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=sabificate-content

# AI Pipeline (CLI only, not in web app)
ANTHROPIC_API_KEY=sk-ant-...

# App
APP_URL=https://app.sabificate.com
NODE_ENV=production
LOG_LEVEL=info
```

### 9.2 Infrastructure Costs (Phase 1)

| Item | Monthly Cost |
|------|-------------|
| Hetzner CX33 (app server, 4 vCPU, 8GB) | ~$16 |
| Hetzner CX23 (GLO fallback) | ~$4 |
| Nigerian PostgreSQL hosting (Layer3Cloud or MainOne) | ~$30-50 |
| Cloudflare Pro | $20 |
| Cloudflare Workers | $5 |
| WhatsApp BSP (360dialog or Gupshup) | ~$50-100 |
| Email delivery (Resend or similar) | ~$10 |
| Domain and SSL | ~$2 |
| **Total** | **~$137-207/month** |

---

## 10. Deferred Features and Phase Assignments

| Feature | Original Spec # | Phase | Notes |
|---------|----------------|-------|-------|
| Full corporate dashboard (ROI metrics, time-series, benchmarks) | 7 (full) | 1b | Basic admin (1.6) covers pilot needs |
| Dunning engine (webhook retry 24h/72h/7d, SMS + WhatsApp nudges, card update deep links) | 15 (partial) | 1b | Email-only notification in Phase 1 |
| Subscription management (upgrade/downgrade, proration, analytics) | 17 (full) | 1b | Basic subscribe/cancel in Phase 1 |
| Storage dashboard (per-course offline storage, manual delete, Naira cost estimates) | 6 (partial) | 1b | Basic download/delete in Phase 1 |
| Gamification (streaks, XP, leaderboards, badges) | 4 | 1b | Not needed for corporate pilot |
| Real-device testing report | N/A | 1b | Formal test on Tecno/Infinix/Samsung with MTN/GLO/Airtel |
| AI Tutor Chat (Haiku, course-scoped, Nigerian regulatory citations) | 3 | 2 | No learner-facing AI in Phase 1 |
| Cohort management (time-bound cohorts, pod assignment, schedule) | 13 | 2 | Premature complexity for pilot |
| Efiko Builders program (application, pods, capstone, mentoring) | 18-21 | 2 | Separate program, not B2B pilot |
| HRIS integration Tier 1 (SeamlessHR connector, SAML SSO) | 9 | 2 | CSV enrollment suffices for pilot |
| B2B invoicing system (proforma, VAT, PDF, reconciliation) | 15 (partial) | 2 | Basic manual invoice in Phase 1 |
| WhatsApp full learning experience (multi-lesson pathways, credential issuance) | 5 (full) | 2 | Basic daily push in Phase 1 |
| Behavioral data collection and learning analytics | N/A | 2 | Requires Tier 2 consent and anonymization pipeline |
| Credential co-branding with institutional partner | 12 (partial) | 2 | Infrastructure ready in Phase 1; activation requires signed partnership |
| Multi-language UI (Hausa first) | 14 | 2 | Launch English-only |
| Government payment via Remita (TSA) | 15 (partial) | 2 | Only if government clients in pipeline |
| NIBSS direct debit for large B2B | 16 | 2 | Paystack suffices for Phase 1 corporate billing |
| AI course authoring admin UI | 11 | 2 | CLI/scripts in Phase 1 |

---

## 11. Open Questions for Founding Working Session

1. **Nigerian hosting provider selection:** Layer3Cloud Lagos or MainOne for PII database? Need reliability assessment and cost quotes.
2. **WhatsApp BSP selection:** 360dialog vs Gupshup vs Cloud API direct. Cost comparison needed.
3. **Paystack for Schools application:** Has Gbitse initiated contact? Timeline for approval?
4. **Corporate pilot target:** Confirmed Fidelity Bank or FCMB? Named L&D contact?
5. **Fallback if Nigerian hosting unreliable:** Accept single-database on Hetzner with Standard Contractual Clauses? Narrative risk with DFI investors is real but manageable.
6. **Subscription pricing confirmation:** Free (3 courses) / Standard (NGN 6,500/quarter) / Premium (NGN 18,000/year) -- are these validated against Nigerian professional willingness-to-pay?
7. **DPO candidate:** Named individual by Day 40. Contracted role or founder?
8. **Content verticals for pilot:** Which 5-10 Nigeria-specific courses will Gbitse brief for the Day 25 velocity test?

---

*This spec is derived from the council synthesis (2026-06-14) and the original functional spec (2026-05-29). It reflects the council's radical scope reduction from 21 features to 12 Phase 1 deliverables. A developer should be able to implement from this document. The spec should be updated after the Day 25 velocity test results and founding working session decisions.*
