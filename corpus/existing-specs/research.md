# SABIficate Existing Specs Reference

*Synthesized from pre-pivot documentation. Source: gbitse_functional_spec.md (v1.0, May 29 2026), gbitse_tech_spec.md (Round 7, May 29 2026), zonethree-learning-platform-analysis.md (June 2026).*

*Last updated: 2026-06-14*

---

## PIVOT CONTEXT

These specs were written before the founders made several binding decisions. Every section below must be read through this filter:

| Decision | Old Spec Assumed | Current Direction |
|----------|-----------------|-------------------|
| LMS platform | Moodle 5.0 (rated 5/10 feasibility) | NO Moodle. Custom PWA (React/Vite). |
| Content authoring | Articulate Storyline / SCORM / H5P | NO Storyline. AI-generated HTML/JS interactive content. |
| Content delivery model | Lecture-style courses (8-15 hours each) | Problem-driven microlearning. |
| Difficulty system | Single difficulty per course | Adaptive difficulty (beginner/intermediate/advanced). |
| Certification model | CPD hours + Open Badges 3.0 | Project-based certification with portfolio artifacts. |
| Frontend framework | Next.js 15 + React 19 | React + Vite PWA. |

**What this means for agents**: Any feature that references Moodle plugins, SCORM packages, Moodle XML, mbz files, PHP themes, or Moodle Web Services API must be rethought from scratch. The data model, API contracts, and most business logic remain valid. The content format and delivery mechanism are different.

---

## 1. FEATURE CATALOG (ALL 21 FEATURES)

### 1.1 Learner Experience (Features 1-6)

#### Feature 1: Mobile-First Course Browser and Player
- **Priority**: P0 (launch-blocking)
- **Pivot Status**: STILL RELEVANT -- core requirement. PWA approach unchanged.
- **Key ACs**: <3s load on 3G, PWA installable <25MB, course catalog with filters/search, progress sync across devices, touch-optimized (44px tap targets), Android 8+/iOS 14+ support.
- **Pivot Adjustments Needed**: Content player must support AI-generated HTML/JS interactives rather than video/SCORM. The "video quality switching" AC becomes less central; interactive content rendering and adaptive difficulty selection become primary. Course structure shifts from "modules with lessons" to "problem sets with difficulty tiers."
- **Data Model**: Course, Module, Lesson, LearnerProgress -- all reusable with minor schema changes (content_type enum needs updating).
- **API Contracts**: GET /api/v1/courses, GET /api/v1/courses/{slug}, GET /api/v1/learner/courses/{course_id}/progress, POST /api/v1/learner/lessons/{lesson_id}/progress -- all reusable.

#### Feature 2: Offline Course Download and Sync
- **Priority**: P1 (month 3)
- **Pivot Status**: STILL RELEVANT -- even more important with PWA-first approach.
- **Key ACs**: Download course/module/lesson, resume interrupted downloads, offline playback, quiz answers stored locally and submitted on reconnect, conflict resolution (server timestamp wins for completion; local progress_percent wins if higher), 30-day auto-expiry, Service Worker background sync.
- **Pivot Adjustments Needed**: Offline storage of HTML/JS interactives instead of video files. Likely simpler (smaller file sizes for interactive content vs. video). IndexedDB for structured offline data.
- **Data Model**: OfflinePackage, OfflineProgressQueue -- reusable.
- **API Contracts**: POST /api/v1/offline/download, POST /api/v1/offline/sync -- reusable.

#### Feature 3: AI Tutor Chat (Nigerian Regulatory Context)
- **Priority**: P1 (month 3)
- **Pivot Status**: STILL RELEVANT -- core differentiator.
- **Key ACs**: Floating chat button, Nigerian regulation citations (CBN/FIRS/SEC/NDIC), scoped to current course topic, conversation history persisted, <5s response time, generate practice quiz questions on demand, disclaims when uncertain, admin-managed knowledge base, usage caps (50/day free, unlimited corporate), all conversations logged.
- **Pivot Adjustments Needed**: Minimal. The RAG pipeline and AI layer are LMS-agnostic. Integration point changes from Moodle chat widget to React component.
- **Data Model**: TutorConversation, TutorMessage, TutorKnowledgeBase, TutorUsageLog -- all reusable.
- **API Contracts**: POST /api/v1/tutor/chat, GET /api/v1/tutor/conversations, POST /api/v1/tutor/quiz, POST /api/v1/admin/tutor/knowledge-base -- all reusable.

#### Feature 4: Gamification (Streaks, XP, Leaderboards, Badges)
- **Priority**: P1 (month 3)
- **Pivot Status**: STILL RELEVANT -- engagement mechanism unchanged.
- **Key ACs**: XP for lesson/module/course completion and quiz scores, daily streaks with freeze, leaderboards (global/org/cohort/course, weekly/all-time), system + custom badges, push notification + celebration animation on badge unlock, privacy-toggleable public profile.
- **XP Schedule**: Lesson complete 10 XP, module complete 50 XP, course complete 200 XP, quiz perfect score 25 XP bonus, daily streak 5 XP, AI tutor interaction 2 XP (max 10/day).
- **Pivot Adjustments Needed**: XP triggers may need re-mapping for microlearning format (problem completion vs. lesson completion). Adaptive difficulty could award bonus XP for harder problems.
- **Data Model**: XPTransaction, Streak, LeaderboardEntry (materialized view), Badge, BadgeAward -- all reusable.
- **API Contracts**: GET /api/v1/learner/gamification/summary, GET /api/v1/leaderboard, GET /api/v1/learner/badges -- all reusable.

#### Feature 5: WhatsApp Lesson Delivery and Reminders
- **Priority**: P1 (month 3)
- **Pivot Status**: STILL RELEVANT -- critical for Nigerian market (95% WhatsApp penetration).
- **Key ACs**: Opt-in via settings, daily micro-lesson (<300 words + 1-2 quiz questions via interactive buttons), quiz responses processed in-chat, streak reminders at preferred time, cohort announcements, STOP/HELP commands, WhatsApp Business API (not unofficial), Meta-approved templates, delivery receipts tracked, two-way AI tutor via WhatsApp reply.
- **Pivot Adjustments Needed**: Content format for micro-lessons shifts from lecture summaries to problem-driven prompts. WhatsApp quiz buttons can present adaptive-difficulty problems.
- **Data Model**: WhatsAppSubscription, WhatsAppMessage, WhatsAppTemplate -- all reusable.
- **API Contracts**: POST /api/v1/whatsapp/subscribe, POST /api/v1/whatsapp/verify, POST /api/v1/whatsapp/webhook, GET /api/v1/admin/whatsapp/analytics -- all reusable.

#### Feature 6: Bandwidth-Adaptive Media Playback
- **Priority**: P1 (month 3)
- **Pivot Status**: NEEDS RETHINKING -- less video-centric under new approach.
- **Key ACs (original)**: 5-tier delivery (HD video -> compressed video -> audio+slides -> text+images -> USSD text), bandwidth detection every 30s, seamless tier switching, data usage estimates, Data Saver mode, USSD integration.
- **Pivot Adjustments Needed**: With AI-generated HTML/JS interactives as primary content, the tier system shifts. Video is no longer the top tier. Tiers become: full interactive -> simplified interactive -> text+images -> USSD text. The bandwidth detection and data estimation logic remains valid. USSD fallback may be deprioritized.
- **Data Model**: LessonMedia, BandwidthLog, DataUsageLog -- need schema updates for interactive content tiers.
- **API Contracts**: GET /api/v1/lessons/{lesson_id}/media, POST /api/v1/bandwidth/report -- reusable with updated tier definitions.

### 1.2 Corporate Admin (Features 7-10)

#### Feature 7: Corporate Dashboard (ROI Metrics)
- **Priority**: P0 (launch-blocking)
- **Pivot Status**: STILL RELEVANT -- unchanged by pivot.
- **Key ACs**: <2s load, aggregate metrics (enrolled/active/completion rate/assessment scores/learning hours/credentials), ROI section with ITF levy tracking, drill-down by department/course/learner, time-series charts, export (PDF/CSV/scheduled email), compliance view (CPD deadlines, mandatory training), benchmarks ("your org vs. industry average"), organizational goals with tracking.
- **Data Model**: OrganizationDashboard (materialized view), DepartmentMetrics (materialized view), OrganizationGoal, ScheduledReport, ROIInput -- all reusable.
- **API Contracts**: GET /api/v1/admin/dashboard/overview, GET /api/v1/admin/dashboard/compliance, GET /api/v1/admin/dashboard/roi, POST /api/v1/admin/reports/schedule, GET /api/v1/admin/reports/download -- all reusable.

#### Feature 8: Bulk Learner Enrollment and Seat Management
- **Priority**: P0 (launch-blocking)
- **Pivot Status**: STILL RELEVANT -- unchanged by pivot.
- **Key ACs**: CSV upload (email, first_name, last_name, department, job_title, employee_id), validation with per-row errors, bulk course enrollment, seat pool management (allocate across departments, reclaim after 30 days inactivity), invitation emails, deactivate/transfer seats, audit log, API for HRIS integration, self-enrollment link with domain restriction.
- **Data Model**: SeatAllocation, DepartmentSeatAllocation, BulkEnrollmentJob, BulkEnrollmentError, SelfEnrollmentLink, EnrollmentAuditLog -- all reusable.
- **API Contracts**: POST /api/v1/admin/learners/bulk-upload, POST /api/v1/admin/learners/enroll, POST /api/v1/admin/seats/transfer, POST /api/v1/admin/self-enrollment-link, GET /api/v1/admin/seats/overview -- all reusable.

#### Feature 9: HRIS Integration (SSO, Auto-Provisioning)
- **Priority**: P2 (month 6)
- **Pivot Status**: STILL RELEVANT -- unchanged by pivot.
- **Key ACs**: SAML 2.0 + OIDC SSO, SCIM 2.0 provisioning, department/role mapping, attribute sync, SSO bypass for admin, integration health dashboard, pre-built connectors for SeamlessHR and HumanManager (top Nigerian HRIS), setup wizard.
- **Tiered Approach**: Tier 1 CSV (MVP) -> Tier 2 SCIM (5+ clients) -> Tier 3 Custom API (enterprise >$50K/yr).
- **Data Model**: HRISIntegration, HRISAttributeMapping, HRISSyncLog, SSOSession -- all reusable.
- **API Contracts**: All HRIS/SSO/SCIM endpoints -- reusable.

#### Feature 10: Compliance Reporting (CPD Hours, ITF Training Records)
- **Priority**: P0 (launch-blocking)
- **Pivot Status**: STILL RELEVANT -- critical for ITF reseller value prop.
- **Key ACs**: ITF Form 7A-compatible output, CPD reports per professional body (CIBN/ICAN/CITN) with membership numbers, date/department/course filters, automated CPD deadline tracking, digital certificates with QR verification, bulk certificate download (ZIP), ITF accreditation partner branding, compliance dashboard widget.
- **Pivot Adjustments Needed**: Certificate issuance shifts from course-completion to project-based certification with portfolio artifacts. CPD hour mapping may need recalibration for microlearning format.
- **Data Model**: CPDCredit, ITFTrainingRecord, Certificate, ComplianceAlert -- all reusable.
- **API Contracts**: All compliance endpoints -- reusable.

### 1.3 Content Management (Features 11-14)

#### Feature 11: AI-Assisted Course Authoring Tool
- **Priority**: P1 (month 3)
- **Pivot Status**: NEEDS MAJOR RETHINKING -- this is the biggest pivot area.
- **Original ACs**: SME uploads source materials (PDF/DOCX/PPTX/video transcript), AI generates course structure, lesson content, quiz questions, Nigerian-contextualized examples, accessibility content. Human review workflow. Version control. Quality scoring.
- **Pivot Adjustments**: Output format changes entirely. Instead of generating Moodle course packages (SCORM/mbz), the authoring pipeline must generate HTML/JS interactive content with adaptive difficulty tiers. The input side (SME uploads + AI structuring) is still valid. The output side (what gets generated) must produce problem-driven microlearning modules with beginner/intermediate/advanced variants, not lecture-style lessons.
- **Data Model**: CourseAuthoringProject, AuthoringSourceMaterial, ContentVersion, GeneratedQuiz, QualityScore -- reusable with schema adjustments.
- **API Contracts**: POST /api/v1/content/authoring/create, GET /api/v1/content/authoring/{project_id}/outline, POST /api/v1/content/authoring/{project_id}/generate-content, POST /api/v1/content/authoring/{project_id}/generate-quiz, POST /api/v1/content/review -- reusable with response format changes.

#### Feature 12: Open Badges 3.0 / W3C Verifiable Credential Issuance
- **Priority**: P1 (month 3)
- **Pivot Status**: NEEDS ADJUSTMENT -- shifts to project-based certification.
- **Original ACs**: Auto-issue on course completion, OB 3.0 JSON-LD, cryptographic signing (Ed25519/RSA), public verification page, LinkedIn sharing, credential wallet, revocation, co-branding, batch issuance.
- **Pivot Adjustments**: Credentials now issued for portfolio artifacts/project completion rather than (or in addition to) course completion. The credential evidence field should link to the learner's portfolio artifact, not just assessment scores. The issuance trigger changes from "completed all modules" to "submitted and reviewed portfolio project."
- **Data Model**: CredentialTemplate, IssuedCredential, CredentialShare, IssuerKey -- reusable with additional evidence fields.
- **API Contracts**: All credential endpoints -- reusable with minor adjustments to trigger conditions.

#### Feature 13: Cohort Management (Start Dates, Deadlines, Peer Pods)
- **Priority**: P0 (launch-blocking)
- **Pivot Status**: STILL RELEVANT -- core to CSR-sponsored delivery model.
- **Key ACs**: Create time-bound cohorts with start/end/enrollment dates, auto-assign peer pods (groups of 10), week-by-week schedule with module unlocks, deadline enforcement (hard/soft), pod discussions/leaderboards/activity feeds, pod facilitator role, cohort announcements, completion ceremony, waitlist management.
- **Data Model**: Cohort, CohortEnrollment, CohortSchedule, Pod, PodDiscussion, CohortAnnouncement -- all reusable.
- **API Contracts**: All cohort/pod endpoints -- reusable.

#### Feature 14: Multi-Language Content (English + Hausa/Yoruba/Igbo)
- **Priority**: P2 (month 6)
- **Pivot Status**: STILL RELEVANT -- unchanged by pivot.
- **Key ACs**: UI fully translated (Hausa/Yoruba/Igbo), per-course content translation opt-in, language switcher, AI-assisted translation with human review, bilingual side-by-side mode, AI tutor responds in selected language, WhatsApp in preferred language, certificates always in English, audio re-recorded by native speakers (not TTS).
- **Localization Reality Check (from ZoneThree analysis)**: Yoruba is tonal (AI fails on pitch/idioms). Igbo has 20+ non-mutually-intelligible dialects. Hausa is easiest (non-tonal). N-ATLAS v1 (Sept 2025) shows progress but not production-ready for educational content. Budget $300+/course for human QA. Launch English-only.
- **Data Model**: UITranslation, CourseTranslation, LessonTranslation, UserLanguagePreference -- all reusable.
- **API Contracts**: All translation endpoints -- reusable.

### 1.4 Payments and Billing (Features 15-17)

#### Feature 15: Payment Gateway (Paystack Primary, Flutterwave, USSD, Bank Transfer)
- **Priority**: P0 (launch-blocking)
- **Pivot Status**: STILL RELEVANT -- unchanged by pivot.
- **Key ACs**: Paystack primary (1.5% + NGN 100, capped NGN 2,000; educational rate 0.7% if approved), bank transfer via unique virtual account numbers, USSD payment, Flutterwave secondary (international/diaspora/mobile money), installment plans (2-4 monthly), corporate invoicing with manual reconciliation, payment confirmation within 60s (email+SMS+in-app), failed payment retry (24h, 72h, manual), refunds within 14 days, NGN primary with USD equivalent, promo/scholarship codes.
- **Risk Note (from tech spec)**: USSD payment flows have 15-25% failure rate. Must implement retry logic, bank transfer fallback, manual reconciliation, support chat.
- **Data Model**: PaymentTransaction, VirtualAccount, InstallmentPlan, Invoice, PromoCode, Refund -- all reusable.
- **API Contracts**: POST /api/v1/payments/initialize, POST /api/v1/payments/webhook/paystack, POST /api/v1/payments/webhook/flutterwave, GET /api/v1/payments/verify/{id}, POST /api/v1/admin/payments/refund, POST /api/v1/admin/invoices/generate, POST /api/v1/admin/invoices/{id}/mark-paid -- all reusable.

#### Feature 16: NIBSS Direct Debit for B2B Recurring Billing
- **Priority**: P1 (month 3)
- **Pivot Status**: STILL RELEVANT -- unchanged by pivot.
- **Key ACs**: Digital mandate signing, mandate management, configurable debit schedule (monthly/quarterly/annually), 7-day advance notification, partial debit handling, dual authorization for >NGN 5M, integration via licensed PSSP aggregator, audit trail.
- **Shortcut Option**: Use Paystack's direct debit product or Flutterwave's e-mandate API (saves 2-3 weeks dev).
- **Data Model**: DirectDebitMandate, DirectDebitSchedule, DirectDebitNotification -- all reusable.
- **API Contracts**: All direct debit endpoints -- reusable.

#### Feature 17: Subscription Management (Individual, Corporate, Cohort-Based)
- **Priority**: P0 (launch-blocking)
- **Pivot Status**: STILL RELEVANT -- unchanged by pivot.
- **Key ACs**: Three subscription types: Individual (per-learner monthly/quarterly/annual), Corporate Seat-Based (per-seat annual, quarterly billing), Cohort-Based (fixed price, time-bound). Tiers: Individual Free (3 courses)/Standard (NGN 6,500/quarter)/Premium (NGN 18,000/year); Corporate NGN 10K-24K/learner/year by volume; Cohort custom-quoted. Upgrade/downgrade with proration, 7-day grace period, contract management, usage-based overage, subscription analytics (MRR/churn/LTV).
- **Data Model**: SubscriptionPlan, Subscription, CohortAgreement, SubscriptionEvent -- all reusable.
- **API Contracts**: All subscription endpoints -- reusable.

### 1.5 Efiko Builders -- Entrepreneur Program (Features 18-21)

#### Feature 18: Application and Cohort Selection Flow
- **Priority**: P0 (launch-blocking for Efiko Builders)
- **Pivot Status**: STILL RELEVANT -- core program mechanic.
- **Key ACs**: Public application form (personal info, business info, motivation, supporting docs), sector tracks (Agritech/Creative-Digital/Retail-Commerce Year 1), auto eligibility check (age 22-40, 3+ months operating, NGN 50K-500K/mo revenue), status tracking pipeline (Submitted -> Under Review -> Interview -> Accepted/Waitlisted/Rejected), admin scoring rubric (business viability 30%, growth potential 25%, founder commitment 25%, sector fit 20%), bulk review interface, acceptance/rejection notifications (SMS+WhatsApp+email), application window management.
- **Data Model**: EfikoApplication, ApplicationScore, ApplicationWindow, ApplicationNotification -- all reusable.
- **API Contracts**: POST /api/v1/efiko/apply, GET /api/v1/efiko/application/{id}/status, GET /api/v1/admin/efiko/applications, POST /api/v1/admin/efiko/applications/{id}/score, POST /api/v1/admin/efiko/applications/{id}/decision -- all reusable.

#### Feature 19: Peer Pod Management (Groups of 10)
- **Priority**: P0 (launch-blocking for Efiko Builders)
- **Pivot Status**: STILL RELEVANT -- unchanged.
- **Key ACs**: Auto-grouping algorithm (sector -> geography -> gender/revenue balance), manual override (drag-and-drop), each pod gets WhatsApp group (auto-created via API) + in-app discussion + shared resource folder, weekly check-in prompts, peer feedback rounds, attendance tracking, pod facilitator dashboard, pod health metrics, pod merge capability if <6 members.
- **Data Model**: EfikoPod, EfikoPodMember, WeeklyCheckIn, PodMeeting, PodResource -- all reusable.
- **API Contracts**: All pod endpoints -- reusable.

#### Feature 20: Capstone Project Tracking (NGN 100K+ Revenue Target)
- **Priority**: P0 (launch-blocking -- the program's measurable outcome)
- **Pivot Status**: HIGHLY RELEVANT -- aligns perfectly with project-based certification pivot.
- **Key ACs**: Participant defines capstone (hypothesis, target customer, revenue target min NGN 100K, 16-week milestone plan), revenue logging with evidence (receipt photo/bank alert/mobile money/customer testimonial), facilitator verification of evidence, progress dashboard (running total vs. target, weekly chart, milestone checklist), mentor feedback (what worked/what to adjust/next experiment), peer review, final 5-minute video pitch + financial summary, graduation criteria (complete modules + capstone + NGN 100K verified revenue OR 50% revenue growth), program-level analytics.
- **Pivot Enhancement**: Capstone artifacts become the portfolio for project-based certification. This feature is the natural bridge to the new certification model.
- **Data Model**: CapstoneProject, CapstoneRevenue, CapstoneMilestone, CapstoneFeedback, CapstoneFinalPresentation -- all reusable.
- **API Contracts**: All capstone endpoints -- reusable.

#### Feature 21: Mentor Matching and Scheduling
- **Priority**: P1 (month 3)
- **Pivot Status**: STILL RELEVANT -- unchanged.
- **Key ACs**: Mentor profiles (sector expertise, experience, languages, availability, mentoring style, max mentees), matching algorithm (sector primary, geography secondary, language tertiary), match change within first 2 weeks, scheduling (30-minute slots from weekly availability windows), video call integration (Google Meet/Zoom auto-generated), async in-app messaging, session notes (discussion points, action items, next agenda), mentor dashboard, program manager oversight, post-session rating (1-5 stars).
- **Data Model**: Mentor, MentorMatch, MentoringSession, MentorAvailability, MentoringMessage -- all reusable.
- **API Contracts**: All mentoring endpoints -- reusable.

---

## 2. PRIORITY SUMMARY

| Priority | Feature # | Feature Name | Pivot Status |
|----------|-----------|-------------|--------------|
| **P0** | 1 | Mobile-First Course Browser/Player | Relevant (adjust content types) |
| **P0** | 7 | Corporate Dashboard (ROI Metrics) | Relevant (no changes) |
| **P0** | 8 | Bulk Enrollment & Seat Management | Relevant (no changes) |
| **P0** | 10 | Compliance Reporting (CPD/ITF) | Relevant (adjust cert triggers) |
| **P0** | 13 | Cohort Management | Relevant (no changes) |
| **P0** | 15 | Payment Gateway | Relevant (no changes) |
| **P0** | 17 | Subscription Management | Relevant (no changes) |
| **P0** | 18 | Efiko Application Flow | Relevant (no changes) |
| **P0** | 19 | Peer Pod Management | Relevant (no changes) |
| **P0** | 20 | Capstone Project Tracking | Highly relevant (aligns with pivot) |
| **P1** | 2 | Offline Download & Sync | Relevant (simpler with interactive content) |
| **P1** | 3 | AI Tutor Chat | Relevant (no changes) |
| **P1** | 4 | Gamification | Relevant (adjust XP triggers) |
| **P1** | 5 | WhatsApp Delivery | Relevant (adjust content format) |
| **P1** | 6 | Bandwidth-Adaptive Media | Needs rethinking (less video-centric) |
| **P1** | 11 | AI Course Authoring | Needs major rethinking (new output format) |
| **P1** | 12 | Open Badges 3.0 / VC | Adjust (project-based triggers) |
| **P1** | 16 | NIBSS Direct Debit | Relevant (no changes) |
| **P1** | 21 | Mentor Matching | Relevant (no changes) |
| **P2** | 9 | HRIS Integration | Relevant (no changes) |
| **P2** | 14 | Multi-Language Content | Relevant (no changes) |

**Features that need NO changes**: 7, 8, 9, 13, 14, 15, 16, 17, 18, 19, 21 (11 of 21)
**Features that need MINOR adjustments**: 1, 2, 3, 4, 5, 10, 12, 20 (8 of 21)
**Features that need MAJOR rethinking**: 6, 11 (2 of 21)

---

## 3. DATA MODEL (PLATFORM-AGNOSTIC -- REUSABLE)

The complete data model from the functional spec is organized into these entity groups. All entities use UUID primary keys and PostgreSQL with pgvector extension.

### Core User System
- **User**: id, email (unique), phone_number (E.164), password_hash (nullable for SSO), first_name, last_name, avatar_url, role (learner/corporate_admin/content_creator/mentor/platform_admin), org_id (FK), department_id (FK), employee_id, language_preference (en/ha/yo/ig), timezone (default Africa/Lagos), status (active/invited/suspended/deactivated), last_login_at, timestamps.
- **Organization**: id, name, legal_name, type (corporate/donor/government/ngo/reseller), industry, logo_url, website, itf_registration_number, cac_registration_number, primary_contact_user_id (FK), billing_email, billing_address_json, status, timestamps.
- **Department**: id, org_id (FK), name, parent_department_id (FK, for hierarchy), head_user_id (FK).

### Course and Content System
- **CourseCategory**: id, name, slug (unique), parent_id (FK), icon_url, sort_order.
- **Course**: id, title, slug (unique), description, thumbnail_url, category_id (FK), language, difficulty_level (beginner/intermediate/advanced), estimated_duration_minutes, credential_template_id (FK), price_ngn (nullable for free/sponsored), cpd_hours, professional_body (CIBN/ICAN/CITN/none), status (draft/published/archived), version, created_by (FK), published_at, timestamps.
- **Module**: id, course_id (FK), title, description, sort_order, is_locked_until_previous_complete, estimated_duration_minutes.
- **Lesson**: id, module_id (FK), title, content_type (video/audio/text/interactive/scorm/h5p -- **needs updating for pivot**), content_html, sort_order, duration_seconds, offline_available, timestamps.
- **LessonMedia**: id, lesson_id (FK), tier (1-5), media_type (video/audio/text/ussd -- **needs updating**), url, file_size_bytes, format, resolution, bitrate_kbps, transcript_url, subtitle_url.
- **Assessment**: id, lesson_id (FK), module_id (FK), course_id (FK), title, assessment_type (quiz/assignment/final_exam), passing_score_percent (default 70), time_limit_minutes, max_attempts (default 3), questions_json.
- **AssessmentAttempt**: id, assessment_id (FK), user_id (FK), answers_json, score_percent, passed, time_taken_seconds, attempt_number, submitted_at.

### Enrollment and Progress
- **Enrollment**: id, user_id (FK), course_id (FK), cohort_id (FK), org_id (FK), enrollment_type (self/corporate/cohort/sponsored), status (active/completed/dropped/expired), enrolled_at, completed_at, dropped_at, completion_percent (denormalized).
- **LearnerProgress**: id, user_id (FK), lesson_id (FK), enrollment_id (FK), status (not_started/in_progress/completed), progress_percent, time_spent_seconds, started_at, completed_at, last_accessed_at. Unique index on (user_id, lesson_id).

### Credentials and Badges
- **CredentialTemplate**: id, name, description, badge_image_url, achievement_type (course_completion/module_completion/program_completion/cpd), learning_outcomes_json, co_brand_org_id (FK), cpd_hours, professional_body, expiry_months, issuer_did, created_by (FK).
- **IssuedCredential**: id, template_id (FK), user_id (FK), course_id (FK), certificate_number (unique), credential_json (OB 3.0 JSON-LD), proof_json (digital signature), verification_url, qr_code_url, status (active/revoked/expired), issued_at, expires_at, revoked_at, revocation_reason.
- **Badge**: id, name, description, image_url, criteria_type (system/custom), criteria_json, org_id (FK).
- **BadgeAward**: id, user_id (FK), badge_id (FK), awarded_at. Unique on (user_id, badge_id).

### Gamification
- **XPTransaction**: id, user_id (FK), amount, source_type (lesson_complete/module_complete/course_complete/quiz_bonus/streak/tutor), source_id, created_at.
- **Streak**: id, user_id (FK), current_count, longest_count, last_activity_date, freeze_available, freeze_used_this_week.
- **LeaderboardEntry**: (materialized view, refreshed hourly) user_id, scope (global/org/cohort/course), scope_id, period (weekly/alltime), xp_total, rank.

### Payments and Billing
- **PaymentTransaction**: id, user_id (FK), org_id (FK), amount_ngn, amount_usd, currency (NGN/USD), payment_method (card/bank_transfer/ussd/installment/direct_debit), gateway (paystack/flutterwave/nibss/manual), gateway_reference, status (pending/success/failed/refunded/partially_refunded), promo_code_id (FK), metadata_json, created_at, confirmed_at.
- **Subscription**: id, user_id (FK), org_id (FK), plan_id (FK), status (trialing/active/past_due/suspended/cancelled), current_period_start/end, seats_purchased, seats_used, auto_renew, payment_method_id, cancelled_at, cancel_reason, timestamps.
- **SubscriptionPlan**: id, name, type (individual/corporate/cohort), tier (free/standard/premium/enterprise/custom), price_ngn, billing_cycle, seat_limit, course_access_scope (all/bundle/specific), features_json, status.
- **Invoice**: id, org_id (FK), invoice_number (unique), line_items_json, subtotal/tax/total_ngn, due_date, status, payment_transaction_id (FK), pdf_url, generated_by (FK), paid_at, timestamps.
- **DirectDebitMandate**: id, org_id (FK), bank_code, account_number_encrypted, account_name, mandate_reference (unique), amount_limit_ngn, frequency, start_date, status, nibss_mandate_id, signatories, timestamps.
- **PromoCode**: id, code (unique), discount_type (percent/fixed_amount), discount_value, max_uses, used_count, valid_from/until, applicable_course_ids_json, org_id (FK).

### Cohort and Pod System
- **Cohort**: id, name, description, type (csr_sponsored/corporate/efiko_builders/donor_funded), sponsor_org_id (FK), course_ids_json, start_date, end_date, enrollment_deadline, max_capacity, enrolled_count (denormalized), pod_size (default 10), deadline_policy (hard/soft), status (draft/enrolling/active/completed/archived), created_by (FK), timestamps.
- **Pod**: id, cohort_id (FK), name, sector_track, facilitator_user_id (FK), whatsapp_group_id, max_size (default 10), current_size (denormalized), status (forming/active/merged/completed).
- **CohortEnrollment**: id, cohort_id (FK), user_id (FK), pod_id (FK), status (enrolled/waitlisted/completed/dropped), waitlist_position, enrolled_at, completed_at.

### AI Tutor System
- **TutorConversation**: id, user_id (FK), course_id (FK), module_id (FK), message_count (denormalized), timestamps.
- **TutorMessage**: id, conversation_id (FK), role (user/assistant/system), content, citations_json, tokens_used, model_version, created_at.
- **TutorKnowledgeBase**: id, category_id (FK), document_title, document_url, status (processing/indexed/failed), chunk_count, uploaded_by (FK), uploaded_at, last_indexed_at.

### Efiko Builders
- **EfikoApplication**: id, user_id (FK), cohort_id (FK), personal_info_json, business_info_json, motivation_answers_json, documents_json, eligibility_check_passed, status (submitted/under_review/interview_scheduled/accepted/waitlisted/rejected), submitted_at, decided_at.
- **ApplicationScore**: id, application_id (FK), scorer_id (FK), business_viability (1-10), growth_potential (1-10), founder_commitment (1-10), sector_fit (1-10), total_weighted_score, comments, scored_at.
- **CapstoneProject**: id, user_id (FK), cohort_id (FK), hypothesis, target_customer_segment, revenue_target_ngn (default 100000), milestone_plan_json, mentor_id (FK), verified_revenue_total_ngn (denormalized), status (setup/active/submitted/graduated/failed), timestamps.
- **CapstoneRevenue**: id, capstone_id (FK), amount_ngn, description, evidence_type, evidence_url, customer_name, revenue_date, verification_status (pending/verified/flagged/rejected), verified_by (FK), verified_at, flag_reason.
- **Mentor**: id, user_id (FK), bio, sector_expertise_json, experience_years, languages_json, mentoring_style (directive/coaching/facilitative), max_mentees, current_mentees (denormalized), status (pending_approval/active/inactive).
- **MentorMatch**: id, mentor_id (FK), mentee_user_id (FK), cohort_id (FK), status (active/change_requested/ended), match_reason_json, matched_at, ended_at.
- **MentoringSession**: id, match_id (FK), scheduled_at, duration_minutes (default 30), meeting_url, status (scheduled/completed/cancelled/no_show), session_notes, action_items_json, mentee_rating (1-5), mentee_feedback, completed_at.

### Key Relationships
```
Organization 1--* User, Department, Subscription, Invoice, DirectDebitMandate, SeatAllocation
User 1--* Enrollment, LearnerProgress, IssuedCredential, PaymentTransaction, TutorConversation, XPTransaction, BadgeAward, WhatsAppSubscription, EfikoApplication, CapstoneProject
User 1--1 Streak
Course 1--* Module 1--* Lesson 1--* LessonMedia
Course 1--* Enrollment, CourseTranslation
Cohort 1--* CohortEnrollment, Pod, CohortSchedule
Enrollment *--1 User, Course; *--1 Cohort (optional)
CapstoneProject 1--* CapstoneRevenue, CapstoneFeedback, CapstoneMilestone
Mentor 1--* MentorMatch 1--* MentoringSession
```

---

## 4. API CONTRACTS SUMMARY

All API contracts from the functional spec are REST, versioned at /api/v1/. They are platform-agnostic and reusable regardless of LMS backend. Total distinct endpoints specified: ~75.

### Endpoint Groups

| Group | Base Path | Count | Pivot Impact |
|-------|-----------|-------|-------------|
| Course browsing | /api/v1/courses | 3 | Minor (add difficulty filter) |
| Learner progress | /api/v1/learner | 4 | Minor |
| Offline sync | /api/v1/offline | 2 | None |
| AI tutor | /api/v1/tutor | 4 | None |
| Gamification | /api/v1/learner/gamification, /api/v1/leaderboard | 3 | Minor (XP trigger mapping) |
| WhatsApp | /api/v1/whatsapp | 4 | Minor (content format) |
| Media/bandwidth | /api/v1/lessons/{id}/media, /api/v1/bandwidth | 3 | Moderate (tier redefinition) |
| Corporate dashboard | /api/v1/admin/dashboard | 4 | None |
| Bulk enrollment | /api/v1/admin/learners, /api/v1/admin/seats | 5 | None |
| HRIS/SSO/SCIM | /api/v1/admin/integrations, /api/v1/auth/sso, /api/v1/scim | 6 | None |
| Compliance | /api/v1/admin/compliance, /api/v1/certificates | 4 | Minor (cert triggers) |
| Content authoring | /api/v1/content | 5 | Moderate (output format) |
| Credentials | /api/v1/credentials | 5 | Minor |
| Cohort/pod | /api/v1/cohorts, /api/v1/admin/cohorts | 6 | None |
| Translations | /api/v1/lessons/{id}/content, /api/v1/admin/translations | 4 | None |
| Payments | /api/v1/payments | 5 | None |
| Direct debit | /api/v1/billing/direct-debit | 4 | None |
| Subscriptions | /api/v1/subscriptions, /api/v1/plans | 5 | None |
| Efiko applications | /api/v1/efiko/apply, /api/v1/admin/efiko | 5 | None |
| Efiko pods | /api/v1/efiko/pods, /api/v1/admin/efiko/pods | 5 | None |
| Capstone | /api/v1/efiko/capstone | 5 | None |
| Mentoring | /api/v1/efiko/mentoring | 7 | None |

---

## 5. HOSTING AND INFRASTRUCTURE (STILL APPLICABLE)

### Recommended Path: Hetzner + Cloudflare

This recommendation from the tech spec remains valid and aligns with the current dev container setup (Hetzner 5.161.236.61).

| Scale | Concurrent Users | Setup | Monthly Cost (Hetzner) |
|-------|-----------------|-------|----------------------|
| Launch | 100-500 | 1x CPX31 (4 vCPU, 8GB) + 1x CPX31 DB + 1x CPX11 Redis | ~$60 |
| Growth | 1,000-2,000 | 2x CPX41 (8 vCPU, 16GB) + LB + 1x CPX51 DB + Redis | ~$180 |
| Scale | 5,000-10,000 | 4x CPX41 + LB + Dedicated DB (32 vCPU, 64GB) + Redis cluster | ~$500 |
| Enterprise | 10,000-50,000 | 8-12x CPX41 + LB + 2x Dedicated DB + Redis cluster | ~$1,500 |

### CDN: Cloudflare
- Lagos PoP operational since 2018 (interconnected with IXPN and WAF-IX Lagos).
- Free tier handles most needs; Pro ($20/mo) adds WAF and image optimization.
- **Cloudflare R2** for S3-compatible media storage (zero egress fees -- critical for African users on metered connections).
- **Cloudflare Stream** for any video content (bandwidth-adaptive transcoding).
- Polish + Mirage for automatic image optimization on slow connections.

### Database Stack
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary DB | PostgreSQL 16 | All application data |
| Cache | Redis 7 | Session storage, rate limiting, materialized view refresh |
| Vector DB | pgvector extension on PostgreSQL | AI tutor RAG embeddings |
| Search | Meilisearch or PostgreSQL FTS | Course search, content discovery |
| Queue | Redis Streams or BullMQ | Async jobs: email, WhatsApp, badge issuance, AI processing |

### AWS Lagos Migration Trigger
Migrate from Hetzner to AWS Lagos Local Zone when revenue justifies it (>5,000 paying learners). AWS Lagos Local Zone provides single-digit ms latency. Until then, Cloudflare Lagos PoP handles edge caching (~40ms latency via submarine cables to Europe).

---

## 6. AI LAYER ARCHITECTURE (REUSABLE)

### AI Tutor RAG Pipeline

```
User Query (React Chat Widget / WhatsApp / API)
    |
    v
[API Gateway / Rate Limiter]
    |
    v
[Query Router] -- classifies intent:
    |-- Regulatory Q&A -> RAG Pipeline
    |-- Course Help -> Course-Context RAG
    |-- General Tutor -> Direct LLM
    |-- Course Authoring -> Authoring Pipeline
    |
    v
[RAG Pipeline]
    |-- Document Store (PostgreSQL + pgvector)
    |-- Embedding Model (text-embedding-3-small)
    |-- Retrieval (top-k chunks, re-ranked)
    |-- Context Assembly
    |
    v
[LLM Layer]
    |-- Primary: Claude Sonnet 4 (cost-optimized, fast)
    |-- Fallback: Claude Haiku 4 (cheapest, simple queries)
    |-- Complex: Claude Sonnet 4 with extended thinking
    |
    v
[Response + Citation]
```

### Nigerian Regulatory Knowledge Base Sources
- CIBN (Chartered Institute of Bankers of Nigeria)
- ICAN (Institute of Chartered Accountants of Nigeria)
- CITN (Chartered Institute of Taxation of Nigeria)
- CBN (Central Bank of Nigeria)
- SEC Nigeria
- FIRS (Federal Inland Revenue Service)

### Ingestion Pipeline
1. PDF/HTML extraction (PyMuPDF, BeautifulSoup)
2. Chunking (512-1024 token chunks with 128 token overlap)
3. Embedding (text-embedding-3-small at $0.02/1M tokens)
4. Storage in PostgreSQL + pgvector (HNSW index)
5. Metadata tagging (source, date, regulation number, topic)
6. Scheduled re-ingestion monthly

Estimated corpus: 2,000-5,000 documents, ~10M tokens, ~$0.20 to embed.

### AI Cost Per Learner

| Model | Per-Query Cost | Per-Learner/Month (20 queries) | At 1K Learners | At 10K Learners |
|-------|---------------|-------------------------------|----------------|-----------------|
| Claude Haiku 4 | $0.0045 | $0.09 | $90 | $900 |
| Claude Sonnet 4 | $0.0135 | $0.27 | $270 | $2,700 |

**Recommended blend**: Haiku 4 for 80% routine queries, Sonnet 4 for 20% complex regulatory analysis. Blended cost: ~$0.13/learner/month. With caching: ~$0.06-0.08/learner/month.

### AI Course Authoring Pipeline (NEEDS PIVOT UPDATE)

Original pipeline output was Moodle course packages. Updated pipeline must output:
- HTML/JS interactive content modules
- Adaptive difficulty variants (beginner/intermediate/advanced)
- Problem-driven exercises rather than lecture content
- Portfolio artifact prompts for project-based certification

The input side (SME content -> AI structuring using Bloom's taxonomy) remains valid.

---

## 7. COMPETITIVE LANDSCAPE

### Nigerian EdTech Market Context
- African EdTech market: $7.3B (2025), projected $19.2B by 2034 (CAGR 11.3%).
- Nigeria: 34% of Africa's top 50 EdTech companies. Market projected at $400M.
- 934+ EdTech startups in Nigeria alone. Space is crowded but fragmented.

### Direct Competitors (from functional spec analysis)

| Competitor | Target | Pricing | Nigeria Fit | Gbitse Advantage |
|------------|--------|---------|-------------|-----------------|
| Coursera for Business | Global enterprise L&D | $399/user/yr (NGN 600K+) | Low | 1/20th price, Nigerian regulatory content, Naira billing, offline-first |
| LinkedIn Learning | Global enterprise L&D | $379.88/seat/yr | Low | Structured programs vs. library, Nigerian credentials, ITF reporting |
| ALX/ALU | Young African professionals | $5/mo (Mastercard Foundation subsidized) | Moderate | B2B corporate vs. B2C individual, compliance/upskilling vs. career change |
| Decagon | Software engineering bootcamp | NGN 890K-1.6M | Low | Breadth (whole org) vs. depth (200 engineers/yr), 10x lower price |
| AltSchool Africa | Tech career launchers | ~$290 diploma | Moderate | B2B corporate vs. B2C individual, different buyer entirely |
| Utiva | Corporate tech training | Custom | High | Broader content (not tech-only), scalable on-demand vs. live instructor |
| Side Hustle/Terra | Nigerian youth skills | Free | Low | Platform vs. community, SLAs/dashboards/auditable credentials |
| HerVest Academy | Women in agriculture | Free/subsidized | Low | Potential implementation partner, not competitor |
| Jobberman Learning | Job seekers | Free (MF-backed) | Low | Post-hire development vs. pre-hire employability |

### Positioning Matrix

```
                        B2B Corporate L&D        B2C Individual
                    +-------------------------+-------------------+
    Nigerian        |                         |                   |
    Context &       |   ** GBITSE **          |   ALX, AltSchool, |
    Compliance      |   (ONLY PLAYER HERE)    |   Decagon, Utiva  |
                    |                         |   Side Hustle     |
                    +-------------------------+-------------------+
    Global          |   Coursera for Business |   Coursera,       |
    Content         |   LinkedIn Learning     |   LinkedIn        |
    (not localized) |                         |   Learning        |
                    +-------------------------+-------------------+
```

**Unique position**: Only platform combining B2B corporate L&D infrastructure + Nigerian-contextualized content + local payment/billing.

### Broader Landscape (from ZoneThree analysis)

| Platform | Relevance | Key Insight |
|----------|-----------|-------------|
| uLesson | Education delivery | $25.6M raised, 5M+ downloads, but video-heavy model hurt by 50% telecom tariff hike |
| Eneza Education | SMS/USSD learning | 12M+ learners on feature phones at $0.03/day. Proves low-bandwidth delivery scales |
| Kolibri | Offline-first open-source | 3M+ learners, 173 languages. Proves offline model but no livelihood bridge |
| ALX Africa / Sand Technologies | Education-to-employment | 347,100 graduates, 63% employed within 6 months. Closest ed-to-employment bridge |
| Andela | Talent intelligence | $264M revenue. Discrete-point assessment, not longitudinal behavioral profiling |
| Harambee (South Africa) | Non-traditional hiring metrics | AI/ML behavioral attributes identify 20% more suitable candidates |

### The African EdTech Graveyard (Cautionary)
- **Edukoya**: $3.5M raised, 80,000 students, shut down Feb 2025. Could not convert free to paying.
- **AptLearn**: 200,000 users, shut down 2026. $5-15/month unaffordable for 60% of Nigerians.
- **Zummit Africa**: Intake crashed from 80-90% to 30% when paid subscriptions introduced.
- **Pattern**: B2C monetization collapses at paywall. 82% of African learners lack home internet. African tech startup funding dropped 57% in H1 2024.
- **Survival traits**: B2B/institutional contracts, SMS/low-bandwidth delivery, workforce development with outcome-linked pricing.

### Competitive Moat Assessment: MODERATE
The behavioral database is methodologically genuine and compounds with scale. But Andela could instrument its AI Academy (15,000 learners) for longitudinal signals within 12-18 months. First-mover advantage matters; execution speed is critical.

---

## 8. TOP RISKS (FROM ZONETHREE ANALYSIS)

### Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| 1 | 18-24 month cash desert exhausts personal capital | HIGH | FATAL | LINGUA Africa application, fiscal sponsor within 30 days, founders maintain part-time consulting |
| 2 | B2B behavioral intelligence has no buyers (invented market) | HIGH | FATAL | Reframe as outcomes-fund implementation partner (EOF Nigeria). Conduct 10 real buyer conversations before building |
| 3 | Digital colonialism narrative kills foundation partnerships | MEDIUM | FATAL | Nigerian partner as legal owner/public face, in-country data storage, independent ethics board |
| 4 | NDPA enforcement action on behavioral profiling | MEDIUM | HIGH | DPIA before launch, DPO appointment, aggregate-intelligence-first architecture |
| 5 | AI courseware quality in Yoruba/Hausa/Igbo inadequate | HIGH | HIGH | Launch English-only, N-ATLAS + human review, LINGUA Africa for localization funding, $300+/course for QA |
| 6 | Team of 2-3 cannot cover 7 functional roles | HIGH | MEDIUM | Sequence ruthlessly. First 90 days: assessment tool + one grant application only |
| 7 | Well-funded competitor adds longitudinal profiling | MEDIUM | HIGH | Move fast. Focus on non-tech populations Andela filters out (98% rejection rate) |
| 8 | Free-to-B2B conversion fails (Edukoya pattern) | MEDIUM | HIGH | Never depend on B2C revenue. B2B-only via institutional partnerships |
| 9 | Naira depreciation inflates dollar-denominated costs | HIGH | LOW | Revenue in USD via international foundations/employers |
| 10 | Corruption and institutional capture | HIGH | MEDIUM | Nigerian education sector has ghost payrolls, TETFUND misappropriation, patronage demands |

### Kill Criteria (Stop If Any Occur)
1. LINGUA Africa application rejected AND no alternative grant secured within 9 months
2. 10 buyer conversations with NGOs/foundations/recruiters yield zero willingness-to-pay signals
3. 50-learner English-only pilot shows less than 30% weekly engagement after 8 weeks
4. NDPC issues guidance making aggregate behavioral intelligence commercially unviable
5. Personal capital commitment exceeds $75K without revenue line of sight

### Unresolved Questions Requiring Real-World Testing
1. Will any NGO program officer pay for aggregate behavioral intelligence from a new platform?
2. Can AI-generated English courseware pass SME review at >80% acceptance rate?
3. Will Nigerian learners opt into behavioral profiling at >75% when full service is available without it?
4. Can the free assessment tool generate >5% organic referral rate?
5. How does the platform navigate Nigerian institutional corruption?
6. Payment infrastructure for unbanked (49M unbanked adults), naira/dollar conversion, community agent commissions?
7. Political risk: 2027 elections, shifting telecom/data protection regulation.

---

## 9. FINANCIAL REFERENCE POINTS

### Infrastructure Costs (MVP to Scale)

| Scale | Users | Monthly (Hetzner) | Monthly (AWS) |
|-------|-------|-------------------|---------------|
| MVP | 100-500 | $19-79 | $350 |
| Growth | 1,000-2,000 | $180 | $800 |
| Scale | 5,000-10,000 | $500 | $2,500 |

### All-In Monthly Burn (Including Founders, Ops)
| Scale | Monthly Burn |
|-------|-------------|
| 100 users | $2,000-4,000 |
| 10,000 users | $5,000-8,000 |
| 100,000 users | $15,000-25,000 |

### Revenue Model
| Channel | Timeline to Revenue | Potential |
|---------|-------------------|-----------|
| Outcomes-fund implementation (EOF Nigeria) | 6-18 months | $50K-$500K/year |
| Corporate L&D subscriptions | 1-3 months (ITF reseller) | NGN 10K-24K/learner/year |
| Recruiting/staffing behavioral intelligence | 18-36 months | $500-$2K/placement |
| Entrepreneur identification for investors | 3+ years | Speculative (zero precedent) |

### Pricing Tiers (from spec)
- **Individual**: Free (3 courses), Standard NGN 6,500/quarter, Premium NGN 18,000/year
- **Corporate**: NGN 10K-24K/learner/year by volume
- **Cohort**: Custom-quoted per deal

### Grant Pipeline
| Program | Award | Deadline/Status |
|---------|-------|----------------|
| Microsoft LINGUA Africa | $450K cash + $1.05M compute | June 15, 2026 (immediate) |
| African Union IEA | $50K | Annual cycle |
| Microtraction (Lagos) | $100K for 7% equity | Pre-seed, no revenue req |
| Mastercard Foundation Fellowship | $60K equity-free | Requires growth-stage |
| Gates/ADQ AI EdTech Fund | $40M pool | Requires traction |
| Education Outcomes Fund Nigeria | Implementation contracts | Actively deploying in Lagos |

---

## 10. REGULATORY REQUIREMENTS (NDPA 2023)

### Binding Constraints
- **Section 37**: Right not to be subject to decisions based solely on automated processing. Employment screening, grant allocation, investor vetting all qualify. Requires human intervention, right to express viewpoint, right to contest.
- **DPIA**: Mandatory before deploying any AI system that profiles Nigerian residents at scale.
- **DPO**: Must be designated before launch.
- **Children under 18**: Parental/guardian consent with age verification required.
- **Cross-border transfers**: Permissible via Standard Contractual Clauses or Binding Corporate Rules. Data localization not legally mandated but strategically wise.
- **Enforcement is real**: Multichoice Nigeria fined N766.2M in July 2025.

### Compliance Architecture Recommendation
Sell aggregate behavioral intelligence (cohort-level data) that does not trigger Section 37. Individual profiles only where downstream client performs own human review step. Three-tier consent model: (a) education-only, (b) anonymized aggregate, (c) full profile with per-instance approval.

---

## 11. MARKETING/ACQUISITION INTELLIGENCE

### Channel Strategy (Ranked by Cost-Effectiveness)
1. **WhatsApp viral loops** ($0 marginal cost) -- assessment results as shareable artifacts, WhatsApp group communities
2. **Community/field agents** ($1-2/referral) -- Solar Sister model, graduates as ambassadors
3. **Church/faith-based partnerships** ($0 direct) -- RCCG skill centers, Deeper Life schools (promising but unproven at scale)
4. **Radio + SMS** ($50-200/week/station) -- 80% rural reach, weekly 15-min segments
5. **Institutional distribution** (zero CAC) -- EOF Nigeria, Tony Elumelu Foundation (265K annual applicants), university partnerships

### Acquisition Targets
- Month 1-2: 100 users via personal networks + 2 church partnerships ($500)
- Month 3-4: 400 users via 5-10 community agents + radio ($1,500)
- Month 5-6: 1,000 users via WhatsApp viral + 1 institutional partnership ($2,000)
- 6-month total: $4,000-5,000
- 12-month target: 5,000 users (requires at least one grant-funded institutional deployment)

### Device and Network Reality
- Sub-$150 smartphones grew 57% in Nigeria Q3 2025. Budget phones: 2GB RAM, 64GB storage (15-25GB effective).
- Mobile data: N431/GB ($0.27) post-tariff hike. MTN cheapest daily: N100 for 100MB.
- Broadband: 53.86% penetration (116.7M subs) but overwhelmingly mobile. Rural coverage: 30-43 daily fiber cuts.
- Transsion brands (Tecno, Infinix, itel) dominate with 60%+ market share.
- 33% mobile internet adoption gap between men and women.
- Audio content should be co-primary with text (oral culture dominates rural Nigeria).

---

*This document synthesizes ~16K words of functional spec, ~8K words of tech spec, and ~12K words of strategic analysis into a single reference for council and build agents. Source documents are read-only at /workspaces/refiner/docs/. For full API contract details, refer to the original functional spec.*
