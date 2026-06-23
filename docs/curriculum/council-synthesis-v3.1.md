# SABIficate Curriculum Tiering Architecture v3.1 -- Functional Specification

## 1. OVERVIEW AND SCOPE
### 1.1 Product Vision
- Mobile-first microlearning PWA for Nigerian working professionals
- Two-axis grid: Customer Tier (freemium, hiring, upskilling, premium) x Proficiency (foundational, working, applied)
- Free to learn, pay to certify monetization model

### 1.2 Current State
- 33 courses, React 19 + Vite 8 + Tailwind v4, Fastify API, pg-mem in-memory DB
- Auth (JWT/bcrypt), catalog, lesson player with 5-block content model, credentials, payments (Paystack), WhatsApp integration
- Service worker with offline caching, data saver mode
- CRITICAL BUG: Pipeline schema still uses beginner/intermediate/advanced while all other layers use foundational/working/applied

### 1.3 What Is Being Built (Scope)
- Phase 0: Pipeline terminology alignment
- Phase 1: Schema migration for new tables and columns
- Phase 2A: Paywall middleware and subscription enforcement
- Phase 2B: Tiered credential system with score aggregation, Ed25519 signing, PDF generation
- Phase 3: Persona gateway onboarding flow
- Phase 4: B2B compliance engine and admin dashboard enhancements
- Phase 5: Content pipeline alignment and SME review UI
- Phase 6: Offline-first tier awareness

### 1.4 What Is NOT Being Built (Deferred)
- Content Treatment Options B and C
- Five difficulty dimensions as tunable parameters
- Full Rasch adaptive placement
- TTS/audio rendering
- Blockchain credentials
- CONCEPT_ID link-vs-fork framework
- Assembly QA automation
- SeamlessHR integration
- Hiring portal with proctored assessments
- SCIM/SAML SSO
- pg-boss job queue

## 2. PERSONA GATEWAY
### 2.1 User Flow
- Post-registration trigger: Dashboard checks user_personas table, redirects to /onboarding if no persona exists
- Screen 1: "Which sounds like you?" -- 3-4 illustrated persona cards per vertical
- Screen 2: Single calibration question based on selected persona
- Screen 3: Resolved tier confirmation with manual override option
- Redirect to Dashboard with resolved tier applied

### 2.2 Data Model
- user_personas table: user_id (FK), vertical, persona_slug, proficiency_level, customer_tier, calibration_answer (JSONB), dimension_values (JSONB), resolved_tier, selected_at, synced_at
- personas table (already exists in migration): predefined persona definitions with SVG icons
- calibration_questions table (already exists): questions linked to personas with proficiency_map

### 2.3 Storage Strategy
- localStorage: immediate offline access
- Dexie v2 persona store: survives "Clear browsing data" on Chrome Android
- Server: POST /api/v1/learner/persona on connectivity
- Sync engine: persona data included in sync payload

### 2.4 Tier Resolution Algorithm
- Default: persona's default_proficiency
- Override: calibration question answer maps to specific tier via proficiency_map JSONB
- Manual: user can override on confirmation screen
- Result written to users.proficiency_level AND user_personas.resolved_tier

## 3. PROFICIENCY TIERS AND CONTENT DELIVERY
### 3.1 Tier Definitions
- Foundational: concrete examples, one concept at a time, templates provided, mechanism-level explanations
- Working: mixed concrete/abstract, 2-3 concepts per lesson, self-solve with hints, one caveat explored
- Applied: principle-first, larger conceptual leaps, open problems, tradeoff analysis

### 3.2 Content Column Mapping
- content_foundational JSONB column on lessons table
- content_working JSONB column on lessons table
- content_applied JSONB column on lessons table
- API: GET /api/v1/courses/:slug/content/:lessonId?tier=foundational (defaults to user's resolved_tier)

### 3.3 Content Block Types (5-block model, unchanged)
- text_block: difficulty_tier must be foundational|working|applied
- quiz_block: Bloom's level annotation, correct_answer index, explanation
- artifact_prompt_block: role-targeted writing prompt with rubric
- scenario_block: Nigerian-context decision tree with cultural notes
- (future) audio_block: deferred until TTS demand validated

## 4. CUSTOMER TIERS AND PAYWALL
### 4.1 Customer Tier Definitions
- Freemium (B2C): Free content access, completion badges only, no verified credentials
- Hiring (B2B): Employer-sponsored, assessment integrity, hiring-focused credentials
- Upskilling (B2B): Corporate training, compliance tracking, team records, ITF reporting
- Premium (B2C): Individual subscription, verified certificates, CPD tracking, unlimited credentials

### 4.2 Paywall Enforcement
- Fastify preHandler hook on /api/v1/courses/:slug/content/:lessonId
- Check: is lesson.is_free? If yes, serve without gate
- Check: does user have active subscription (current_period_end > NOW())? If yes, serve
- Check: is user in grace period? If yes, serve with degraded_access: true flag
- Else: return 402 Payment Required with plan selector redirect

### 4.3 Subscription Plans
- B2C Individual Monthly: NGN 2,500
- B2C Individual Annual: NGN 24,000 (2 months free)
- B2B Compliance Essentials: NGN 3,500/seat/month
- B2B Professional: NGN 5,500/seat/month
- B2B Enterprise: NGN 8,000/seat/month

### 4.4 Payment Methods
- Card (Visa/Mastercard) via Paystack
- Bank Transfer (promoted as default, 95%+ success rate)
- USSD (works on feature phones)
- B2B: Invoice-based with 30-day NET terms and 7.5% VAT

## 5. TIERED CREDENTIALS
### 5.1 Credential Tiers
- Completion Badge: auto-issued on course completion, no score gate, no payment, available to all tiers
- Verified Certificate: requires all lessons completed + assessment score >= 70% + payment (active subscription or NGN 3,000-5,000 one-time purchase)
- Team Record: auto-issued for corporate (upskilling) enrollments, includes organization name
- Professional Certificate: requires all above + professional body membership verification

### 5.2 Issuance Flow
- Completion Badge: triggered automatically by COURSE_COMPLETED event, no user action needed
- Verified Certificate: user requests via POST /api/v1/credentials/purchase, payment via Paystack, issuance on webhook success
- Team Record: triggered automatically when enrollment_type = 'corporate' and course completed
- Professional Certificate: manual verification step for professional body membership

### 5.3 Score Aggregation
- computeCourseAssessmentScore(userId, courseId): percentage of correct answers across all assessment_attempts for lessons in the course
- Stored as assessment_score on issued_credentials row
- Used to gate Verified Certificate and Professional Certificate issuance

### 5.4 PDF Certificate Generation
- Server-side via pdf-lib on Fastify route GET /api/v1/credentials/:id/pdf
- Template with SABIficate branding, watermark, border patterns
- Embeds: learner name, course title, certificate number, issue date, credential tier, CPD hours
- QR code encoding verification URL generated via qrcode npm package
- Ed25519 signature hash printed as footer for anti-forgery
- Co-branded certificates embed partner logo from credential_templates.co_brand_logo_url

### 5.5 Cryptographic Signing
- Ed25519 key pair generated via jose library's generateKeyPair('EdDSA')
- Private key stored as CREDENTIAL_SIGNING_KEY environment variable (JWK format)
- Public key published at GET /.well-known/jwks.json
- Credential JSON signed using CompactSign with EdDSA algorithm
- Proof field added to Open Badges 3.0 credential object
- Verification endpoint checks both database status AND cryptographic signature

### 5.6 CPD Credit Tracking
- cpd_credit_log table: one row per course completion per professional body
- ICAN requires 40 MCPD hours/year
- GET /api/v1/learner/cpd-summary: total hours, remaining, courses completed
- GET /api/v1/learner/cpd-export: PDF log for professional body portal submission

## 6. B2B ADMIN DASHBOARD
### 6.1 Dashboard Widgets (3-Widget MVP)
- Compliance Traffic Light: red/yellow/green per department per compliance requirement
- Completion Rates Table: course-level completion rates for the organization
- Top/Bottom Performers: ranked list by assessment score

### 6.2 Compliance Deadline Engine
- course_compliance_requirements table: links courses to regulatory deadlines
- GET /api/v1/admin/compliance/status: per-department compliance status
- Red: employees past deadline; Yellow: within 30 days; Green: compliant
- POST /api/v1/admin/compliance/requirements: create/update compliance deadlines

### 6.3 Department-Scoped Access
- department_admin role: sees only their team via org_id + department_id filter
- Extends existing adminService.ts getLearners() with department_id filter (already supported)
- No new tables needed, just role addition to users.role CHECK constraint

### 6.4 Free Pilot Flow
- POST /api/v1/admin/pilot/setup: creates organization with pilot status
- 10-seat allocation, 30-day expiry
- Access to free preview course + one compliance course
- After 30 days: pilot data becomes proof point for procurement committee
- Gated enrollment check: if org.pilot_status = 'expired' and no paid subscription, block new enrollments

### 6.5 ITF Levy Compliance Module
- ITF training investment summary: total spend per organization per fiscal year
- ITF certificate generator using issued_credentials infrastructure
- Payroll threshold calculator: input annual payroll, show if training spend exceeds 1%
- ITF skill category mappings linked to courses

### 6.6 Reporting
- Existing: ITF Form 7A CSV, CPD hours CSV
- New: Compliance status PDF (for WhatsApp delivery to HR directors)
- Delivery: WhatsApp Business API for weekly summaries, email for invoices and formal reports

## 7. CONTENT PIPELINE ALIGNMENT
### 7.1 Terminology Fix (Phase 0)
- Fix pipeline/schemas/contentSchema.ts DifficultyTierSchema: beginner|intermediate|advanced -> foundational|working|applied
- Update all pipeline agents that reference old tier names
- Update seed data files

### 7.2 Prompt Template Registry
- prompt_templates table: stage, bloom_level, tier, template_text, version, is_active
- Migrate hardcoded prompts from pipeline agents to database
- Plain string interpolation in TypeScript (defer mustache templating)

### 7.3 Citation Extraction
- CitationExtractor agent: post-processing step before validation
- Produces structured array: {claim, source_type, source_ref, confidence}
- Stored in citations JSONB column on lessons table
- Claims with confidence < 0.85 flagged for SME review

### 7.4 Cross-Variant Consistency Check
- Extension to validateLessonPackage in validationAgent.ts
- Topic coverage overlap: 80% key noun phrase overlap across tiers
- Terminology consistency: flag unexplained term differences
- Difficulty monotonicity: Flesch-Kincaid decreasing from foundational to applied

### 7.5 SME Review Page
- /app/src/app/pages/ContentReview.tsx
- Side-by-side view of three tier variants
- Source brief, Bloom's annotations, citations display
- Approve/Edit/Reject buttons with structured reason dropdown
- review_actions table for audit trail

## 8. OFFLINE-FIRST ARCHITECTURE
### 8.1 Dexie Schema v2
- Existing stores: lessonProgress, quizAnswers, syncQueue
- New store: persona (userId, customerTier, proficiencyLevel, calibrationAnswer, selectedAt, syncedAt)
- Migration from v1 to v2 via Dexie.version(2).stores() upgrade

### 8.2 Service Worker Cache Strategy
- Include customer_tier and proficiency_level in cache key for lesson content
- On tier change: invalidate lesson content cache entries
- Tier-aware content prefetching: only prefetch user's resolved_tier (not all three)

### 8.3 Subscription Status Caching
- Cache subscription expiry date in Dexie
- Check locally before making API calls
- Grace period banner shown from cached data when offline

### 8.4 Sync Engine Updates
- Include persona data in sync payload
- Sync persona on reconnection if selectedAt > syncedAt
- Handle conflict: server wins for customer_tier, client wins for proficiency_level override

## 9. DATA MODEL SUMMARY
### 9.1 New Tables
- user_personas, cpd_credit_log, course_compliance_requirements, credential_purchases, review_actions, prompt_templates

### 9.2 Modified Tables
- credential_templates: +credential_tier, +minimum_score, +price_ngn, +cpd_eligible
- issued_credentials: +credential_tier, +assessment_score, +cpd_hours_awarded
- payment_transactions: +purpose
- users: role CHECK expanded to include department_admin
- organizations: +customer_tier, +pilot_status, +pilot_expires_at
- lessons: +citations

### 9.3 Existing Tables (Unchanged)
- courses (concept_id already present), modules, enrollment, subscription_plans, subscriptions, invoices, dunning_attempts, seat_allocations, department_seat_allocations, whatsapp_subscriptions, whatsapp_messages, whatsapp_templates, bulk_enrollment_jobs, bulk_enrollment_errors, consent_records, learner_artifacts, learner_scenario_decisions, personas, calibration_questions, concept_catalog, authoring_tracks

## 10. REACT COMPONENT ARCHITECTURE
### 10.1 New Route Components (Lazy-Loaded)
- /onboarding -> Onboarding.tsx (no AppShell wrapper, 4-screen state machine)
- /admin/compliance -> ComplianceStatus.tsx (under admin route)
- /content/review/:lessonId -> ContentReview.tsx (SME review, lazy-loaded)

### 10.2 New Widget Components
- ComplianceTrafficLight.tsx: red/yellow/green per department (< 8KB gzipped)
- CompletionRatesTable.tsx: course completion rates table
- TopPerformersTable.tsx: top/bottom performers list
- PersonaCard.tsx: illustrated persona selection card for onboarding
- CalibrationQuestion.tsx: single calibration question with options
- TierConfirmation.tsx: resolved tier display with override option
- DegradedAccessBanner.tsx: grace period warning banner
- PaymentMethodSelector.tsx: card/bank transfer/USSD selection for Paystack

### 10.3 Modified Components
- Dashboard.tsx: add persona check redirect
- PaystackCheckout.tsx: add payment method selector, promote bank transfer
- CredentialDetail.tsx: replace client-side canvas hack with link to server PDF
- CredentialList.tsx: show credential_tier badge and CPD hours
- AdminDashboard.tsx: add 3 new widgets (compliance, completion rates, performers)

## 11. TESTING STRATEGY
### 11.1 Unit Tests
- computeCourseAssessmentScore: edge cases (no attempts, all correct, mixed)
- checkSubscriptionAccess middleware: active, grace period, expired, free lesson bypass
- credential tier gating: each tier's issuance rules
- persona tier resolution: default, calibration override, manual override

### 11.2 Integration Tests
- End-to-end credential purchase flow: initiate payment -> webhook -> credential issuance
- Persona gateway: complete onboarding -> verify user_personas row -> verify tier in lesson content API
- Paywall: enroll -> access content -> let subscription expire -> verify 402 -> verify grace period

### 11.3 Manual Verification
- PDF certificate visual QA across credential tiers
- Payment method selector UX on mobile Chrome (Nigeria's dominant browser)
- Offline persona selection and sync on reconnection
- Service worker cache invalidation on tier change


## ARCHITECTURE DECISIONS


1. **LOCK: Two-axis grid (Customer Tier x Proficiency) as the organizing principle. Customer tiers: freemium | hiring | upskilling | premium. Proficiency levels: foundational | working | applied. Already reflected in contracts/types/index.ts CustomerTier and DifficultyTier types, and in users table columns customer_tier and proficiency_level.**
   Rationale: Validated by Knewton, Coursera, and multiple African platforms. The alternative (single-axis difficulty) creates content explosion. The two-axis model enables Content Treatment Option A (same content, different wrapper) which is the only treatment sustainable for a 2-3 person team at 33+ courses.
   Confidence: 0.95

2. **LOCK: Rename DifficultyTier across the entire stack to foundational | working | applied. The database schema and contracts/types/index.ts already use the new names. The CRITICAL remaining gap is pipeline/schemas/contentSchema.ts which still uses beginner | intermediate | advanced on line 9-13. This must be fixed in Phase 0.**
   Rationale: The contract-first architecture makes this safe and the Zod validators on routes will catch any API contract violations immediately. The pipeline schema is the last holdout and will cause silent content delivery failures if AI-generated content uses beginner/intermediate/advanced while the database columns are content_foundational/content_working/content_applied.
   Confidence: 0.95

3. **LOCK: Three proficiency tiers (foundational | working | applied), not four or five. Content stored as three JSONB columns per lesson row (content_foundational, content_working, content_applied) rather than a normalized content_versions table.**
   Rationale: For a 2-3 person team with AI-assisted authoring, three depth cards per concept is the maximum sustainable authoring load. A fourth tier adds 33% authoring cost for marginal placement accuracy improvement. The column-per-tier pattern works at this scale (33 courses, ~200 lessons) and avoids join complexity that pg-mem handles poorly. Revisit at 500+ courses or when migrating to real PostgreSQL.
   Confidence: 0.85

4. **LOCK: Persona gateway as post-registration onboarding flow (2-3 screens), not during registration. Build as a lazy-loaded route component at /onboarding with React state machine (idle -> persona-select -> calibration -> placement-result -> redirect). Store in both localStorage and Dexie DB v2 with server sync on auth.**
   Rationale: Keeps registration friction unchanged. Self-identification outperforms self-assessed skill level in low-friction mobile environments. localStorage alone is cleared by 'Clear browsing data' on Chrome Android which Nigerian users frequently use to free storage. Dexie persists through that action. The /onboarding route avoids z-index conflicts with AppShell bottom nav and service worker update banner.
   Confidence: 0.92

5. **LOCK: Option A (same content, different wrapper) as default content treatment for all 33 courses. Defer Options B and C (segment-specific examples and genuinely different content).**
   Rationale: Only treatment a 2-3 person team can sustain across 33+ courses. Option B should be reserved for the first validated vertical (Financial Literacy) only after gathering user feedback. Option C is rare by design in the v3.1 spec.
   Confidence: 0.88

6. **LOCK: credential_tier as a VARCHAR column on both credential_templates and issued_credentials with CHECK constraint (completion_badge | verified_certificate | team_record | professional_certificate). Not a separate lookup table.**
   Rationale: Single JOIN query pattern. The four tiers are stable enough to be a CHECK constraint. Server-side PDF generation via pdf-lib (no Puppeteer). Ed25519 signing via jose npm library for compact 64-byte signatures. Skip blockchain entirely -- SABIficate controls both issuance and verification.
   Confidence: 0.95

7. **LOCK: Free to learn, pay to certify as primary monetization. Completion Badge auto-issued on course completion (no payment). Verified Certificate requires: all lessons completed + score >= 70% + payment (NGN 2,500-5,000 one-time or active subscription). Add purpose VARCHAR(30) column to payment_transactions for credential_purchase discriminator.**
   Rationale: Validated by Alison's 187% Africa growth. Matches Nigerian price sensitivity. Aligns with tiering architecture where Axis 1 controls exit credentials not content access. The code already has is_free on lessons and enrollment gating -- extend to credential-level gating.
   Confidence: 0.95

8. **LOCK: Paystack as sole payment gateway with redirect-based checkout. Add explicit payment method channel selection (card, bank_transfer, ussd) in initializeTransaction. Bank transfer should be the default/promoted option for Nigerian users.**
   Rationale: Paystack has 60%+ market share in Nigerian online payments, handles CBN compliance, supports NGN natively. Bank transfer has 95%+ success rates vs 75-85% for cards. Many Nigerian professionals hit the $20/month international card spending cap. Multiple gateways add complexity without meaningful coverage gain.
   Confidence: 0.9

9. **LOCK: B2C pricing at NGN 2,500/month or NGN 24,000/year (2 months free). Add per-certificate one-time payment option (NGN 3,000-5,000). B2B corporate pricing at three tiers: Compliance Essentials NGN 3,500/seat/month, Professional NGN 5,500/seat/month, Enterprise NGN 8,000/seat/month.**
   Rationale: B2C below NGN 5,000 psychological threshold. B2B priced for credibility in Nigerian corporate procurement -- L&D managers have authority for tools in NGN 5,000-10,000/seat/month range without board approval. Price anchoring against classroom alternatives (NGN 150K-800K per person per course) makes NGN 5,500/seat/month a bargain. Nigerian corporates expect to negotiate, so price high and offer volume discounts.
   Confidence: 0.85

10. **LOCK: Invoice-based billing for B2B with 30-day NET terms and 7.5% VAT. Keep proforma invoice + manual bank transfer as primary B2B payment flow. Do NOT build Paystack automated billing for corporate accounts.**
   Rationale: Nigerian corporate procurement requires purchase orders, bank transfers, and manual reconciliation. Paystack recurring billing works for B2C but is rejected by 80%+ of Nigerian corporate finance departments. The current invoiceService.ts with SAB-YYYY-NNNN numbering, VAT calculation, and HTML invoice generation is correct.
   Confidence: 0.95

11. **LOCK: Add department_admin role to users.role CHECK constraint alongside learner, corporate_admin, platform_admin. Department-scoped admin access using existing org_id + department_id on users table.**
   Rationale: Required for banks with 50+ departments where each department head reports on their own compliance independently. Simple role extension, no new tables needed.
   Confidence: 0.85

12. **LOCK: B2B dashboards as a separate lazy-loaded admin route (/admin/dashboard) with 3-widget MVP: (1) compliance traffic light by department, (2) completion rates table by course, (3) top/bottom performers list. Skip sparkline and heatmap.**
   Rationale: Data access patterns are fundamentally different from learner dashboard (aggregation over org vs individual progress). Sparkline and heatmap require time-series data collection infrastructure that does not yet exist. Nigerian HR directors check dashboards monthly at best -- complex visualizations add engineering cost without proportional value.
   Confidence: 0.8

13. **LOCK: Compliance deadline engine as a priority B2B feature. Add compliance_deadline DATE and regulatory_body VARCHAR to a new course_compliance_requirements table. Build GET /api/v1/admin/compliance/status returning red/yellow/green per department.**
   Rationale: Single most deal-closing feature for Nigerian B2B -- compliance deadline tracking. One new table, one new route, one React component. Roughly 2 days of work. This widget will close more deals than any other dashboard feature.
   Confidence: 0.9

14. **LOCK: CPD credit tracking as a separate cpd_credit_log table rather than denormalizing into issued_credentials. Enables efficient aggregation queries for ICAN annual summaries.**
   Rationale: ICAN requires 40 MCPD hours/year. Annual summaries across multiple courses need a dedicated table for queries like SUM(credit_hours) WHERE professional_body='ICAN' AND period_year=2026 without parsing credential metadata.
   Confidence: 0.9

15. **LOCK: Concept graph in PostgreSQL adjacency-list with concept_id as human-readable VARCHAR stable identifier (e.g., fin-lit-cash-flow). Add concepts table and concept_id column to courses table (already present in schema).**
   Rationale: PostgreSQL adjacency-list with prerequisite arrays is the right choice for a small team over a graph database. Human-readable concept IDs make the catalog browsable and debuggable. Risk of namespace collisions is manageable with a vertical prefix convention at current scale. Switch to UUID only if catalog exceeds 1000 concepts.
   Confidence: 0.75

16. **LOCK: Keep CSV bulk upload as the primary enrollment mechanism for B2B. Do NOT build SCIM, SAML SSO, or HRIS sync for Phase 1.**
   Rationale: Nigerian mid-market corporates (20-500 employees) use CSV and WhatsApp, not enterprise identity providers. SSO is a Phase 2 feature gated on landing a Tier-1 bank with 1,000+ seats.
   Confidence: 0.9

17. **LOCK: WhatsApp Business API as primary channel for B2B admin notifications (weekly compliance summaries, deadline warnings, enrollment confirmations). Email secondary, primarily for invoice delivery and formal compliance reports.**
   Rationale: Nigerian HR directors live on WhatsApp. The existing whatsapp_templates table supports this. Pre-approve templates for compliance_deadline_warning, weekly_summary, and enrollment_confirmation.
   Confidence: 0.85

18. **CONDITIONAL: concept_id as VARCHAR stable identifier rather than UUID (75% confidence). Switch to UUID if catalog exceeds 1000 concepts.**
   Rationale: Human-readable concept IDs (e.g., fin-lit-cash-flow) make the catalog browsable and debuggable for a small team. Namespace collision risk is manageable with vertical prefix convention at current scale.
   Confidence: 0.75

19. **DEFER: Five difficulty dimensions as explicit tunable parameters. Store dimensions JSONB in schema (already present as depth_dimensions on courses table) but continue using single resolved_tier in pipeline prompts.**
   Rationale: The dimensions are intellectually correct but operationally premature. The three proficiency tiers already encode these implicitly. Add when evidence shows single tier produces inconsistent difficulty within a proficiency level.
   Confidence: 0.7

20. **DEFER: Full adaptive placement using simplified Rasch model. The single calibration question in the persona gateway is sufficient for MVP.**
   Rationale: Rasch requires ~500 learners of assessment_attempts data to calibrate properly. The persona gateway with one calibration question provides sufficient initial placement. Add Rasch when data accumulates.
   Confidence: 0.65

21. **DEFER: TTS/audio rendering with Azure en-NG voices. Validated and cheap ($32 for 200 lessons) but not a launch blocker.**
   Rationale: Add when user feedback confirms demand. Does not block any other feature.
   Confidence: 0.9

22. **DEFER: Content Treatment Options B and C, Assembly QA automation (Flesch-Kincaid, Bloom's verb detection), CONCEPT_ID link-vs-fork framework, pg-boss job queue, SeamlessHR integration, hiring portal.**
   Rationale: All are premature optimizations or Phase 2 features. Option A suffices for launch. Assembly QA is refinement not prerequisite. pg-boss adds complexity without value at current 33-course scale. SeamlessHR could build competing LMS. Hiring portal is 6-8 weeks for zero immediate revenue.
   Confidence: 0.85


## API CONTRACTS


### POST /api/v1/learner/persona
Purpose: Store persona gateway selection from onboarding flow. Called after the 3-screen onboarding completes. Creates or updates user_personas row and updates users.proficiency_level and users.customer_tier.
Request: { vertical: string, persona_slug: string, proficiency_level: 'foundational' | 'working' | 'applied', customer_tier: 'freemium' | 'hiring' | 'upskilling' | 'premium', calibration_answer: { question_id: string, selected_option: number }, dimension_values?: { prior_knowledge: 1|2|3, abstraction: 1|2|3, pacing: 1|2|3, scaffolding: 1|2|3, depth_of_why: 1|2|3 } }
Response: { status: 'success', data: { resolved_tier: string, persona_slug: string, proficiency_level: string } }

### GET /api/v1/learner/persona
Purpose: Retrieve current persona selection for the authenticated user. Used by Dashboard to determine if onboarding redirect is needed.
Request: 
Response: { persona: { vertical: string, persona_slug: string, proficiency_level: string, customer_tier: string, resolved_tier: string, selected_at: string } | null }

### GET /api/v1/learner/cpd-summary
Purpose: Return CPD credit summary for a specific professional body and year. Used by learner CPD dashboard and CPD export.
Request: Query params: ?body=ICAN&year=2026
Response: { professional_body: string, period_year: number, total_hours: number, required_hours: number, remaining_hours: number, courses: [{ course_id: string, title: string, credit_hours: number, completed_at: string, certificate_number: string | null }] }

### GET /api/v1/learner/cpd-export
Purpose: Generate a CPD log PDF suitable for ICAN portal submission. Returns PDF binary.
Request: Query params: ?body=ICAN&year=2026&format=pdf
Response: Binary PDF (Content-Type: application/pdf, Content-Disposition: attachment)

### POST /api/v1/credentials/purchase
Purpose: Initiate a one-time payment for a specific credential (Verified Certificate or Professional Certificate). Creates a Paystack payment with purpose=credential_purchase.
Request: { credential_template_id: string, course_id: string }
Response: { authorization_url: string, access_code: string, reference: string, amount_ngn: number }

### GET /api/v1/credentials/:id/pdf
Purpose: Generate and return a PDF certificate using pdf-lib. Includes learner name, course title, certificate number, QR code, credential tier, CPD hours, and Ed25519 signature hash.
Request: 
Response: Binary PDF (Content-Type: application/pdf)

### GET /.well-known/jwks.json
Purpose: Public endpoint serving the Ed25519 public key in JWK format for offline credential verification. No auth required.
Request: 
Response: { keys: [{ kty: 'OKP', crv: 'Ed25519', x: string, kid: string, use: 'sig', alg: 'EdDSA' }] }

### GET /api/v1/admin/compliance/status
Purpose: Return compliance status per department for the admin's organization. Each course with a compliance_deadline shows red (past deadline), yellow (within 30 days), green (compliant) per department.
Request: 
Response: { requirements: [{ course_id: string, course_title: string, regulatory_body: string, deadline: string, departments: [{ department_id: string, department_name: string, total_employees: number, compliant: number, non_compliant: number, status: 'red' | 'yellow' | 'green' }] }] }

### POST /api/v1/admin/compliance/requirements
Purpose: Create or update a compliance requirement linking a course to a regulatory deadline for the admin's organization.
Request: { course_id: string, regulatory_body: string, compliance_deadline: string (ISO date), is_mandatory: boolean }
Response: { status: 'success', data: { id: string, course_id: string, regulatory_body: string, compliance_deadline: string } }

### POST /api/v1/admin/pilot/setup
Purpose: Self-serve pilot onboarding for L&D managers. Creates an organization with pilot status, 10-seat allocation, and 30-day expiry.
Request: { organization_name: string, industry: string, billing_contact_email: string }
Response: { status: 'success', data: { org_id: string, pilot_expires_at: string, seat_limit: 10, assigned_courses: string[] } }

### GET /api/v1/admin/dashboard/compliance-traffic-light
Purpose: Dedicated endpoint for the compliance traffic light widget. Returns aggregated red/yellow/green counts across all departments and compliance requirements.
Request: 
Response: { summary: { red: number, yellow: number, green: number }, by_department: [{ department_id: string, name: string, red: number, yellow: number, green: number }] }

### GET /api/v1/admin/dashboard/top-performers
Purpose: Return top and bottom 10 performers by assessment score for the organization.
Request: Query params: ?limit=10
Response: { top: [{ user_id: string, name: string, department: string, courses_completed: number, avg_score: number }], bottom: [{ user_id: string, name: string, department: string, courses_completed: number, avg_score: number }] }

### GET /api/v1/courses/:slug/content/:lessonId
Purpose: MODIFIED: Now includes subscription check via paywall middleware. Returns 402 if subscription expired and lesson is not free. During grace period, includes degraded_access: true in response. If no ?tier= query param, auto-selects from user_personas.resolved_tier.
Request: Query params: ?tier=foundational|working|applied (optional -- defaults to user's resolved_tier from persona)
Response: { id: string, title: string, module_id: string, course_id: string, sort_order: number, estimated_duration_minutes: number, blocks: ContentBlock[], prev_lesson_id: string | null, next_lesson_id: string | null, degraded_access?: boolean, grace_period_days_remaining?: number }

### POST /api/v1/credentials/issue
Purpose: MODIFIED: Now accepts credential_tier parameter. Gates issuance based on tier: completion_badge (auto, no gate), verified_certificate (score >= 70% + payment), team_record (auto for corporate enrollment), professional_certificate (score + payment + professional body verification).
Request: { user_id: string, course_id: string, credential_tier: 'completion_badge' | 'verified_certificate' | 'team_record' | 'professional_certificate', evidence_urls?: string[] }
Response: { id: string, certificate_number: string, credential_tier: string, assessment_score: number | null, cpd_hours_awarded: number | null, credential_json: object, verification_url: string, qr_code_url: string, status: string, issued_at: string }

### GET /api/v1/personas
Purpose: Return available personas for a given vertical. Used by the onboarding flow to populate persona cards.
Request: Query params: ?vertical=financial-literacy
Response: { personas: [{ id: string, slug: string, label: string, description: string, icon_svg: string | null, default_proficiency: string, default_customer_tier: string, calibration_questions: [{ id: string, question_text: string, options: { label: string, maps_to_tier: string }[] }] }] }

### GET /api/v1/content/review/:lessonId
Purpose: Fetch lesson content for SME review page. Returns all three tier variants side-by-side with citations and Bloom's annotations.
Request: 
Response: { lesson_id: string, title: string, content_foundational: { blocks: ContentBlock[] }, content_working: { blocks: ContentBlock[] }, content_applied: { blocks: ContentBlock[] }, citations: { claim: string, source_type: string, source_ref: string, confidence: number }[], review_history: { action: string, reviewer: string, reason: string | null, created_at: string }[] }

### POST /api/v1/content/review/:lessonId/action
Purpose: Submit an SME review action (approve, edit, reject) for a lesson.
Request: { action: 'approve' | 'edit' | 'reject', reason?: 'accuracy' | 'cultural-fit' | 'regulatory' | 'difficulty-mismatch' | 'other', edited_content?: { tier: string, blocks: ContentBlock[] } }
Response: { status: 'success', review_id: string }


## SCHEMA CHANGES

1. {'table': 'pipeline/schemas/contentSchema.ts (NOT a DB table -- critical code fix)', 'change': "Fix DifficultyTierSchema from z.enum(['beginner','intermediate','advanced']) to z.enum(['foundational','working','applied']). This is the terminology schism that causes silent content delivery failures. File: /workspace/app/pipeline/schemas/contentSchema.ts lines 9-13.", 'sql': "-- No SQL needed. This is a TypeScript code fix:\n-- OLD: export const DifficultyTierSchema = z.enum(['beginner','intermediate','advanced']);\n-- NEW: export const DifficultyTierSchema = z.enum(['foundational','working','applied']);"}
2. {'table': 'credential_templates', 'change': 'Add credential_tier, minimum_score, price_ngn, cpd_eligible columns', 'sql': "ALTER TABLE credential_templates\n  ADD COLUMN credential_tier VARCHAR(30) NOT NULL DEFAULT 'completion_badge'\n    CHECK (credential_tier IN ('completion_badge','verified_certificate','team_record','professional_certificate')),\n  ADD COLUMN minimum_score SMALLINT NOT NULL DEFAULT 0,\n  ADD COLUMN price_ngn INTEGER NOT NULL DEFAULT 0,\n  ADD COLUMN cpd_eligible BOOLEAN NOT NULL DEFAULT false;"}
3. {'table': 'issued_credentials', 'change': 'Add credential_tier, assessment_score, cpd_hours_awarded columns', 'sql': "ALTER TABLE issued_credentials\n  ADD COLUMN credential_tier VARCHAR(30) NOT NULL DEFAULT 'completion_badge'\n    CHECK (credential_tier IN ('completion_badge','verified_certificate','team_record','professional_certificate')),\n  ADD COLUMN assessment_score SMALLINT,\n  ADD COLUMN cpd_hours_awarded NUMERIC(4,1);"}
4. {'table': 'payment_transactions', 'change': 'Add purpose column to distinguish subscription payments from credential purchases', 'sql': "ALTER TABLE payment_transactions\n  ADD COLUMN purpose VARCHAR(30) NOT NULL DEFAULT 'subscription'\n    CHECK (purpose IN ('subscription','invoice','credential_purchase','one_time'));"}
5. {'table': 'users', 'change': 'Add department_admin to role CHECK constraint', 'sql': "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;\nALTER TABLE users ADD CONSTRAINT users_role_check\n  CHECK (role IN ('learner','department_admin','corporate_admin','platform_admin'));"}
6. {'table': 'organizations', 'change': 'Add customer_tier, pilot_status, pilot_expires_at columns for B2B tiering and pilot flow', 'sql': "ALTER TABLE organizations\n  ADD COLUMN customer_tier VARCHAR(20) DEFAULT 'b2b_hiring'\n    CHECK (customer_tier IN ('b2c_free','b2b_hiring','b2b_upskilling','premium')),\n  ADD COLUMN pilot_status VARCHAR(20) DEFAULT 'active'\n    CHECK (pilot_status IN ('active','expired','converted')),\n  ADD COLUMN pilot_expires_at TIMESTAMPTZ;"}
7. {'table': 'user_personas', 'change': 'CREATE new table for persona gateway data with server-side persistence', 'sql': 'CREATE TABLE user_personas (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  vertical VARCHAR(100) NOT NULL,\n  persona_slug VARCHAR(100) NOT NULL,\n  proficiency_level VARCHAR(20) NOT NULL DEFAULT \'foundational\'\n    CHECK (proficiency_level IN (\'foundational\',\'working\',\'applied\')),\n  customer_tier VARCHAR(20) NOT NULL DEFAULT \'freemium\'\n    CHECK (customer_tier IN (\'freemium\',\'hiring\',\'upskilling\',\'premium\')),\n  calibration_answer JSONB DEFAULT \'{}\',\n  dimension_values JSONB DEFAULT \'{"prior_knowledge":1,"abstraction":1,"pacing":1,"scaffolding":1,"depth_of_why":1}\',\n  resolved_tier VARCHAR(20) NOT NULL DEFAULT \'foundational\',\n  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  synced_at TIMESTAMPTZ,\n  UNIQUE(user_id)\n);\nCREATE INDEX idx_user_personas_user ON user_personas(user_id);'}
8. {'table': 'cpd_credit_log', 'change': 'CREATE new table for CPD credit tracking per professional body per year', 'sql': 'CREATE TABLE cpd_credit_log (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID NOT NULL REFERENCES users(id),\n  course_id UUID NOT NULL REFERENCES courses(id),\n  credential_id UUID REFERENCES issued_credentials(id),\n  professional_body VARCHAR(10) NOT NULL,\n  credit_hours NUMERIC(4,1) NOT NULL,\n  period_year SMALLINT NOT NULL,\n  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\nCREATE INDEX idx_cpd_credit_user_body ON cpd_credit_log(user_id, professional_body, period_year);'}
9. {'table': 'course_compliance_requirements', 'change': 'CREATE new table for compliance deadline tracking per course', 'sql': 'CREATE TABLE course_compliance_requirements (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  course_id UUID NOT NULL REFERENCES courses(id),\n  regulatory_body VARCHAR(50) NOT NULL,\n  compliance_deadline DATE NOT NULL,\n  is_mandatory BOOLEAN NOT NULL DEFAULT true,\n  applies_to_org_id UUID REFERENCES organizations(id),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\nCREATE INDEX idx_compliance_course ON course_compliance_requirements(course_id);\nCREATE INDEX idx_compliance_org ON course_compliance_requirements(applies_to_org_id);\nCREATE INDEX idx_compliance_deadline ON course_compliance_requirements(compliance_deadline);'}
10. {'table': 'credential_purchases', 'change': 'CREATE new table linking one-time certificate purchases to payment transactions', 'sql': "CREATE TABLE credential_purchases (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID NOT NULL REFERENCES users(id),\n  credential_template_id UUID NOT NULL REFERENCES credential_templates(id),\n  payment_transaction_id UUID REFERENCES payment_transactions(id),\n  amount_ngn INTEGER NOT NULL,\n  status VARCHAR(20) NOT NULL DEFAULT 'pending'\n    CHECK (status IN ('pending','paid','refunded')),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\nCREATE INDEX idx_credential_purchases_user ON credential_purchases(user_id);"}
11. {'table': 'review_actions', 'change': 'CREATE new table for SME content review workflow', 'sql': "CREATE TABLE review_actions (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  lesson_id UUID NOT NULL REFERENCES lessons(id),\n  reviewer_id UUID NOT NULL REFERENCES users(id),\n  action VARCHAR(20) NOT NULL CHECK (action IN ('approve','edit','reject')),\n  reason VARCHAR(50),\n  edited_content JSONB,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\nCREATE INDEX idx_review_actions_lesson ON review_actions(lesson_id);"}
12. {'table': 'prompt_templates', 'change': 'CREATE new table for storing pipeline prompt templates in database instead of hardcoded strings', 'sql': 'CREATE TABLE prompt_templates (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  stage VARCHAR(50) NOT NULL,\n  bloom_level VARCHAR(20),\n  tier VARCHAR(20),\n  template_text TEXT NOT NULL,\n  version INTEGER NOT NULL DEFAULT 1,\n  is_active BOOLEAN NOT NULL DEFAULT true,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\nCREATE INDEX idx_prompt_templates_stage ON prompt_templates(stage, is_active);'}
13. {'table': 'lessons', 'change': 'Add citations JSONB column for extracted citation data from AI-generated content', 'sql': "ALTER TABLE lessons ADD COLUMN citations JSONB DEFAULT '[]';"}
14. {'table': 'subscription_plans (seed data)', 'change': 'Insert three B2B corporate tiers and update B2C plans', 'sql': '-- B2C Plans\nINSERT INTO subscription_plans (name, type, price_ngn, billing_cycle, features, max_courses, is_active) VALUES\n  (\'Individual Monthly\', \'individual\', 2500, \'monthly\', \'["Unlimited courses","Verified certificates","CPD tracking"]\', NULL, true),\n  (\'Individual Annual\', \'individual\', 24000, \'annual\', \'["Unlimited courses","Verified certificates","CPD tracking","2 months free"]\', NULL, true);\n-- B2B Plans  \nINSERT INTO subscription_plans (name, type, price_ngn, billing_cycle, features, max_courses, is_active) VALUES\n  (\'Compliance Essentials\', \'corporate\', 3500, \'monthly\', \'["Compliance courses","ITF reports","Basic dashboard","Completion tracking"]\', NULL, true),\n  (\'Professional\', \'corporate\', 5500, \'monthly\', \'["All courses","CPD tracking","Verified certificates","Department analytics","Admin dashboard"]\', NULL, true),\n  (\'Enterprise\', \'corporate\', 8000, \'monthly\', \'["All courses","Co-branded credentials","API access","Dedicated support","Custom content"]\', NULL, true);'}


## RISK REGISTER


1. **Pipeline terminology schism: contentSchema.ts DifficultyTierSchema uses beginner|intermediate|advanced while all other layers use foundational|working|applied. Any AI-generated content will produce invalid JSONB that silently fails to match the database column names or fails Zod validation on API routes.**
   likelihood: 0.95
   impact: 0.9
   mitigation: Phase 0 fix: single atomic commit changing DifficultyTierSchema in pipeline/schemas/contentSchema.ts from z.enum(['beginner','intermediate','advanced']) to z.enum(['foundational','working','applied']). grep -r across entire codebase to catch any remaining references. This is a 30-minute fix that must happen before any other work.

2. **Paywall enforcement gap: the current getLessonContent() checks enrollment but NOT subscription status. Users can enroll once, let subscription lapse, and continue accessing all content forever. Free-forever loophole undermines the entire monetization model.**
   likelihood: 0.85
   impact: 0.85
   mitigation: Phase 2 Track A: Add Fastify preHandler hook that checks subscription status (current_period_end > NOW() or status = active) before serving non-free lesson content. During grace period (7 days), serve content with degraded_access flag. After grace period, return 402 Payment Required. Approximately 40 lines of middleware code in routes/courses.ts.

3. **Offline-first split-brain: Dexie schema and service worker cache know nothing about customer_tier or persona segments. A user who changes their proficiency tier sees stale cached content. A freemium user who goes offline could access cached premium-tier content.**
   likelihood: 0.7
   impact: 0.7
   mitigation: Phase 6: Upgrade Dexie to v2 with persona store. Include customer_tier and proficiency_level in service worker cache key for lesson content. Add tier-aware content prefetching that only prefetches for the user's resolved_tier. Cache subscription expiry date locally.

4. **Credential score aggregation has no implementation path: the current LessonPlayer completion model marks individual lessons as completed but there is no function to compute a course-level assessment score. Verified Certificate issuance at score >= 70% cannot work without this.**
   likelihood: 0.8
   impact: 0.75
   mitigation: Phase 2 Track B: Implement computeCourseAssessmentScore(userId, courseId) in progressService.ts. SQL: SELECT COUNT(*) FILTER (WHERE is_correct) * 100 / COUNT(*) FROM assessment_attempts WHERE user_id=$1 AND lesson_id IN (SELECT id FROM lessons WHERE course_id=$2). Gate Verified Certificate issuance on score >= 70 in the issueCredential flow.

5. **pg-mem compatibility limits: complex queries (WITH CTEs, window functions, LATERAL joins) may fail silently or produce incorrect results in pg-mem. The adminService.ts getOverview() already uses CTEs that pg-mem may struggle with at scale.**
   likelihood: 0.6
   impact: 0.65
   mitigation: Keep queries simple with separate count queries (as courseService.ts already does). For new compliance and dashboard endpoints, use multiple simple queries rather than single complex aggregations. Plan migration to real PostgreSQL when moving beyond pilot/development stage.

6. **Nigerian card payment failure rate: 15-25% of card transactions fail in Nigeria due to bank timeouts, insufficient funds, or the $20/month international spending cap on naira debit cards. This directly impacts subscription activation and credential purchase conversion.**
   likelihood: 0.75
   impact: 0.6
   mitigation: Promote bank transfer as default payment method in PaystackCheckout.tsx (95%+ success rate). Add USSD payment option for feature phone users. Pass channels parameter to Paystack initializeTransaction API. Show explicit payment method selector with bank transfer first.

7. **B2B sales cycle mismatch: Nigerian corporate procurement requires 3-6 months. If the product is not ready for paid usage when the first pilot converts, the deal dies. The pilot flow must be self-serve and immediate.**
   likelihood: 0.65
   impact: 0.7
   mitigation: Phase 4: Build the 10-user free pilot flow that lets L&D managers self-onboard without procurement. 30-day pilot with full reporting becomes the proof point for the procurement committee. Compliance deadline engine closes deals by demonstrating immediate regulatory value.

8. **Content pipeline generates inconsistent difficulty across tiers: the two-call approach (baseline + variant) can produce cross-variant terminology drift where the same concept uses different terms in foundational vs applied tiers without explanation.**
   likelihood: 0.5
   impact: 0.55
   mitigation: Phase 5: Add cross-variant consistency check to validationAgent.ts that verifies 80% key noun phrase overlap, flags unexplained terminology differences, and checks Flesch-Kincaid monotonicity. This is approximately 150 lines of pure TypeScript validation, no API calls needed.

9. **ICAN/CIPM/NBA regulatory approval dependency: if SABIficate's CPD credits are not recognized by professional bodies, the B2B value proposition for compliance training collapses. Regulatory body approval is outside engineering control.**
   likelihood: 0.5
   impact: 0.8
   mitigation: Build ITF levy compliance module first (ITF approval is simpler and more mechanical than professional body CPD recognition). Track CPD hours in the system so the data exists when approval is sought. Generate CPD export PDFs in the format professional bodies expect. Pursue ICAN approval as a business development activity in parallel with engineering work.

10. **Service worker update conflicts: the auto-updating service worker may serve stale lesson content from the previous cache when a user's proficiency tier changes, or may not properly invalidate cached content when the paywall status changes.**
   likelihood: 0.55
   impact: 0.5
   mitigation: Include proficiency_level and subscription_status in the cache key for lesson content. On persona change or subscription status change, invalidate the lesson content cache entries. Use the skipWaiting() and clients.claim() pattern already in the existing service worker. Add a version bump mechanism tied to tier changes.


## IMPLEMENTATION ORDER


### Phase 0: Terminology Fix (Pipeline Schema Alignment)
- Fix pipeline/schemas/contentSchema.ts DifficultyTierSchema from beginner|intermediate|advanced to foundational|working|applied
- Fix any remaining references in pipeline agents (lessonGenerator.ts, adaptiveVariantGenerator.ts, quizGenerator.ts) that may generate content using old tier names
- Update seed-courses.ts and course-data.json to use correct column names if they reference old names
- Run grep -r across codebase for any remaining beginner|intermediate|advanced references
- Validate that all content in the database has content blocks with difficulty_tier: foundational|working|applied (not beginner/intermediate/advanced)
Effort: 0.5 weeks
Dependencies: []

### Phase 1: Schema Migration (New Tables and Columns)
- ALTER credential_templates ADD credential_tier VARCHAR(30) CHECK, minimum_score SMALLINT DEFAULT 0, price_ngn INTEGER DEFAULT 0, cpd_eligible BOOLEAN DEFAULT false
- ALTER issued_credentials ADD credential_tier VARCHAR(30), assessment_score SMALLINT, cpd_hours_awarded NUMERIC(4,1)
- ALTER payment_transactions ADD purpose VARCHAR(30) DEFAULT 'subscription' CHECK (purpose IN ('subscription','invoice','credential_purchase','one_time'))
- ALTER users ADD role CHECK to include department_admin: CHECK (role IN ('learner','department_admin','corporate_admin','platform_admin'))
- ALTER organizations ADD customer_tier VARCHAR(20), pilot_status VARCHAR(20) DEFAULT 'active', pilot_expires_at TIMESTAMPTZ
- CREATE TABLE user_personas (id UUID PK, user_id UUID FK UNIQUE, vertical VARCHAR(100), persona_slug VARCHAR(100), proficiency_level VARCHAR(20), customer_tier VARCHAR(20), calibration_answer JSONB, dimension_values JSONB, resolved_tier VARCHAR(20), selected_at TIMESTAMPTZ, synced_at TIMESTAMPTZ)
- CREATE TABLE cpd_credit_log (id UUID PK, user_id UUID FK, course_id UUID FK, credential_id UUID FK, professional_body VARCHAR(10), credit_hours NUMERIC(4,1), period_year SMALLINT, logged_at TIMESTAMPTZ)
- CREATE TABLE course_compliance_requirements (id UUID PK, course_id UUID FK, regulatory_body VARCHAR(50), compliance_deadline DATE, is_mandatory BOOLEAN DEFAULT true, created_at TIMESTAMPTZ)
- CREATE TABLE credential_purchases (id UUID PK, user_id UUID FK, credential_template_id UUID FK, payment_transaction_id UUID FK, amount_ngn INTEGER, status VARCHAR(20), created_at TIMESTAMPTZ)
- CREATE TABLE review_actions (id UUID PK, lesson_id UUID FK, reviewer_id UUID FK, action VARCHAR(20) CHECK, reason VARCHAR(50), edited_content JSONB, created_at TIMESTAMPTZ)
- CREATE TABLE prompt_templates (id UUID PK, stage VARCHAR(50), bloom_level VARCHAR(20), tier VARCHAR(20), template_text TEXT, version INTEGER DEFAULT 1, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ)
- Add indexes on new tables
- Update TABLES constant in server/db/schema.ts with new table names
Effort: 1 weeks
Dependencies: ['Phase 0: Terminology Fix (Pipeline Schema Alignment)']

### Phase 2 Track A: Paywall Middleware and Subscription Enforcement
- Create Fastify preHandler hook checkSubscriptionAccess in courseService.ts that checks subscription status before serving non-free lesson content
- In getLessonContent(), after enrollment check, query subscriptions table for user (or their org), verify current_period_end > NOW() or status = active
- Call checkGracePeriod() from dunningService.ts during grace period -- serve content but inject degraded_access: true in response
- After grace period expiry, block non-free content and return 402 Payment Required with redirect to plan selector
- Add channels parameter to initializeTransaction() in paymentService.ts to support bank_transfer and ussd payment method selection
- Update PaystackCheckout.tsx to show three explicit payment method options: Card, Bank Transfer (promoted as default), USSD
- Seed subscription_plans with three B2B tiers: Compliance Essentials NGN 3,500, Professional NGN 5,500, Enterprise NGN 8,000
Effort: 1.5 weeks
Dependencies: ['Phase 1: Schema Migration (New Tables and Columns)']

### Phase 2 Track B: Credential Tiering and Score Aggregation
- Implement computeCourseAssessmentScore(userId, courseId) in progressService.ts: SELECT COUNT(*) FILTER (WHERE is_correct) * 100 / COUNT(*) FROM assessment_attempts WHERE user_id=$1 AND lesson_id IN (SELECT id FROM lessons WHERE course_id=$2)
- Update credentialService.ts issueCredential() to accept credential_tier parameter and gate issuance: Completion Badge auto-issued on course completion (no score/payment gate); Verified Certificate requires score >= 70% AND (active subscription OR credential_purchase payment); Team Record auto-issued for corporate enrollments; Professional Certificate requires all of above plus professional body verification
- Add credential_tier to the Credential interface in contracts/api/credentials.ts
- Implement credential purchase flow: POST /api/v1/credentials/purchase that creates a Paystack payment with purpose=credential_purchase, then issues credential on webhook success
- Create cpd_credit_log entry when issuing credentials for cpd_eligible courses
- Add GET /api/v1/learner/cpd-summary?body=ICAN&year=2026 endpoint returning total hours, courses completed, remaining hours
- Implement Ed25519 credential signing using jose library: generate key pair, store private key as CREDENTIAL_SIGNING_KEY env var, publish public key at GET /.well-known/jwks.json, sign credential in buildOpenBadge()
- Build server-side PDF certificate generation route GET /api/v1/credentials/:id/pdf using pdf-lib: load template, embed learner name/course title/certificate number/QR code/credential tier
Effort: 2 weeks
Dependencies: ['Phase 1: Schema Migration (New Tables and Columns)']

### Phase 3: Persona Gateway and Onboarding
- Build Onboarding route component at /app/src/app/pages/Onboarding.tsx as lazy-loaded route with 4 screens using React state machine: idle -> persona-select -> calibration -> placement-result -> redirect-to-dashboard
- Add /onboarding route to App.tsx (no AppShell wrapper, like login/register)
- Screen 1: Persona card selection with 3-4 SVG-illustrated cards per vertical (start with Financial Literacy vertical)
- Screen 2: Single calibration question based on selected persona (fetched from calibration_questions table or from static data)
- Screen 3: Confirmation showing resolved proficiency tier with option to override
- Store persona in localStorage AND Dexie DB v2 (new persona store: userId, customerTier, proficiencyLevel, calibrationAnswer, selectedAt, syncedAt)
- POST /api/v1/learner/persona endpoint to persist persona to user_personas table on server
- Redirect to /onboarding after first login if user_personas has no row for user (check in Dashboard component or via useAuth hook)
- Update getLessonContent API to auto-select tier from user's resolved_tier stored in user_personas when no explicit ?tier= query param is provided
- Add persona data to sync engine payload for offline persistence
Effort: 1.5 weeks
Dependencies: ['Phase 1: Schema Migration (New Tables and Columns)']

### Phase 4: B2B Compliance Engine and Admin Dashboard Enhancement
- Build compliance deadline engine: GET /api/v1/admin/compliance/status returning per-department counts of compliant vs non-compliant employees against each active deadline (red/yellow/green traffic light)
- Add ComplianceTrafficLight React component to AdminDashboard
- Add CompletionRatesTable widget showing completion rates by course for org
- Add TopBottomPerformers widget showing top/bottom performers list
- Implement department-scoped admin access: department_admin role sees only their team via existing org_id + department_id filter in adminService.ts
- Build 10-user free pilot flow: self-serve signup as corporate_admin, CSV upload up to 10 employees, assign to free preview course + one compliance course for 30 days
- Add pilot_status and pilot_expires_at columns check in enrollment flow
- Build ITF levy compliance module in adminService.ts: ITF training investment summary, ITF certificate generator, payroll threshold calculator
- Add whatsapp_templates for compliance_deadline_warning, weekly_summary, enrollment_confirmation
Effort: 2 weeks
Dependencies: ['Phase 1: Schema Migration (New Tables and Columns)']

### Phase 5: Content Pipeline Alignment and SME Review
- Move hardcoded prompts from pipeline agents to prompt_templates table
- Extend pipeline CLI with brief command that generates course briefs using foundational/working/applied tier names
- Build citation extraction step as post-processing function: CitationExtractor agent that produces structured {claim, source_type, source_ref, confidence} arrays, stored in citations JSONB on lessons table
- Build minimal SME review page at /app/src/app/pages/ContentReview.tsx: side-by-side view of three tier variants, source brief, Bloom's annotations, extracted citations, Approve/Edit/Reject buttons storing to review_actions table
- Add cross-variant consistency check to validationAgent.ts: topic coverage overlap (80% key noun phrase overlap), terminology consistency, difficulty monotonicity (Flesch-Kincaid decreasing from foundational to applied)
- Update Zod schemas in pipeline to include concept_id and citations fields
- Implement concept_catalog lookup in brief-to-generation flow: query existing concepts by name similarity, default to link decision
Effort: 2.5 weeks
Dependencies: ['Phase 0: Terminology Fix (Pipeline Schema Alignment)', 'Phase 1: Schema Migration (New Tables and Columns)']

### Phase 6: Offline-First Tier Awareness and Dexie Upgrade
- Upgrade Dexie schema to v2: add persona store with fields userId, customerTier, proficiencyLevel, calibrationAnswer, selectedAt, syncedAt
- Update service worker cache to include customer_tier and persona_slug in cache key for lesson content (prevents serving wrong tier content from cache)
- Add tier-aware content prefetching: when user enrolls, prefetch content for their resolved_tier only (not all three tiers) to save bandwidth
- Update sync engine to include persona data in sync payload
- Add degraded_access banner component that shows during grace period (injected via paywall middleware response)
- Add offline-first subscription status caching in Dexie: cache subscription expiry date and check locally before making API calls
Effort: 1.5 weeks
Dependencies: ['Phase 3: Persona Gateway and Onboarding', 'Phase 2 Track A: Paywall Middleware and Subscription Enforcement']


## DEFER LIST

- Content Treatment Options B and C (segment-specific examples and genuinely different content per customer tier) -- Option A (same content, different wrapper) is the default and sufficient for launch with 33 courses
- Five difficulty dimensions (prior knowledge, abstraction, pacing, scaffolding, depth-of-why) as separate tunable parameters -- the three proficiency tiers already encode these implicitly
- Full adaptive placement using simplified Rasch model -- the single calibration question in the persona gateway is sufficient for MVP; Rasch can be added when you have enough assessment_attempts data to calibrate (need ~500 learners)
- TTS/audio rendering with Azure en-NG voices -- validated and cheap ($32 for 200 lessons) but not a launch blocker; add when user feedback confirms demand
- Blockchain-based credential verification -- research conclusively says skip this; Ed25519 signing + QR is the right approach
- CONCEPT_ID catalog and link-vs-fork decision framework -- this is an authoring optimization that matters when you have 100+ courses, not at 33
- Assembly QA automation (Flesch-Kincaid scoring, Bloom's verb detection per tier) -- valuable but the 7-stage pipeline already has a validationAgent; QA automation is a refinement, not a prerequisite
- Cross-institutional information sharing features for B2B (JMLIT-style collaboration) -- this is a Phase 2 product feature after you have multiple B2B clients, not a platform infrastructure requirement