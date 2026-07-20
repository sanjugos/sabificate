# SABIficate Codebase Readiness Assessment — Pre-Build Audit

- Container: 512d85960490
- Domain: docs
- Opened: 2026-07-20
- Status: OPEN

## Question / Scope

What already exists in the SABIficate codebase and what gaps remain before v1 launch? Assessment performed 2026-07-20 prior to praxis swarm build.

## Codebase Inventory (as of 2026-07-20)

### Frontend (React 19 + Vite 8 + Tailwind)

**14 route pages:**
Dashboard, Catalog, CourseDetail, LessonPlayer, Login, Register, Onboarding, Profile, Credentials, PublicVerify, Pricing, AdminDashboard, CurriculumStudio, WhitePaper

**44+ components across 10 domains:**
- auth: LoginForm, RegisterForm, RequireRole
- layout: AppShell, BottomNav, TopBar, DataSaverBadge, OfflineIndicator, SyncStatus
- catalog: CourseCatalog, CourseCard, CourseDetail
- content: TextBlock, QuizBlock, ScenarioBlock, ArtifactPromptBlock, ContentBlockRenderer
- course: CourseProgress, LessonNav, LessonPlayer
- credentials: CredentialList, CredentialDetail, QRCode, VerifyPage
- payments: PlanSelector, PaystackCheckout, SubscriptionStatus, InvoiceList
- admin: AdminDashboard, CSVUpload, ReportExport
- studio: SetupStage, IntakeStage, DecomposeStage, BriefStage, GenerateStage, ReviewStage, PublishStage, StageTracker, TrustClaimsPanel, ConceptCatalog
- ui: DegradedAccessBanner

### Backend (Fastify + PostgreSQL)

**8+ API route groups with full endpoint listing:**
- auth: register, login, refresh, logout
- courses: list, detail by slug
- progress: sync, dashboard
- payments: subscribe, plans, webhooks
- credentials: issue, verify
- admin: bulk enrollment, learner management, compliance reports
- studio: 16+ endpoints for 7-stage pipeline
- personas: list, create learner persona
- compliance: consent CRUD
- whatsapp: send, templates, conversations

**Services:** courseService, progressService, paymentService, credentialService, dunningService, invoiceService, adminService, curriculumAI (616 lines with Claude SDK)

### Database (PostgreSQL 16)

**46+ tables** across 2 migrations:
- Identity: users, organizations, departments, consent_records, refresh_tokens
- Content: courses, modules, lessons, lesson_content
- Learner state: enrollments, lesson_progress, quiz_answers
- Personas: personas, calibration_questions, learner_personas
- Credentials: credentials (4 types)
- Payments: subscription_plans, subscriptions, payment_transactions, invoices, dunning_attempts
- Admin: bulk_enrollment_jobs, bulk_enrollment_errors
- Studio: authoring_tracks, concept_catalog, trust_claims, assembly_reviews, generation_jobs, language_readiness, review_actions
- WhatsApp: whatsapp_subscriptions, whatsapp_messages, whatsapp_templates

**Seed data:** 2 organizations, 5 users, 3 subscription plans, 7 personas with calibration questions, 30 static course templates

### Infrastructure

- Hosted: Hetzner CX33 (4 vCPU, 8GB, 80GB NVMe, Nuremberg)
- CDN: Cloudflare Pro (Lagos PoP)
- Domain: sabificate.forwardai.dev (POC), sabificate.com (production, Mark owns)
- Deploy: curl webhook to 172.17.0.1:3625
- Test stack: vitest 4.1.8 + @testing-library/react 16.3.2

## Readiness by Product

### Learner App v1 — ~80% built

| Area | Status | Gap |
|------|--------|-----|
| Auth | FUNCTIONAL | Fixed with native DOM fallback (v4) |
| Onboarding | FIXED (needs audit) | flushSync applied (v5), awaiting re-audit |
| Profile | FIXED (needs audit) | flushSync applied (v5) |
| Catalog | SCAFFOLDED | Components exist, need real course data from Studio |
| Lesson player | IMPLEMENTED | All 4 block types work, need real content |
| Dashboard | SCAFFOLDED | Layout exists with mock data, needs real progress API |
| Offline sync | IMPLEMENTED | Dexie engine exists, needs integration test |
| Data saver | IMPLEMENTED | 3 modes work |
| Credentials | SCAFFOLDED | Components exist, need course completion trigger |
| Payments | SCAFFOLDED | All components exist, need Paystack prod keys + test |
| Performance | UNTESTED | Need to validate <5s TTI on 3G |
| E2E testing | MISSING | No end-to-end user journey tests |

### Curriculum Studio v1 — ~70% built

| Area | Status | Gap |
|------|--------|-----|
| Track CRUD | IMPLEMENTED | Setup, list, get, update all work |
| Stage tracker | IMPLEMENTED | 7-stage visual progression |
| Decomposition | IMPLEMENTED | Claude AI + mock, concept catalog search |
| Brief generation | IMPLEMENTED | Claude AI + mock |
| Course generation | IMPLEMENTED | Async jobs, 3 depth levels |
| Trust claims | PARTIALLY WIRED | Table + panel exist, verification workflow needs wiring |
| Assembly review | PARTIALLY WIRED | 4-category schema exists, UI needs integration |
| Publish transform | NOT BUILT | Critical gap: authoring_tracks → courses/modules/lessons |
| Revision loop | NOT BUILT | SME feedback → re-generation |
| Auth gate | NOT WIRED | Studio accessible to any logged-in user |
| Prompt tuning | NEEDED | Align with Gbitse's four-axis engine |
| Track templates | NOT BUILT | 238 catalogue entries as intake starting points |

## Critical Path

1. **Studio publish transform** (Studio) — without this, no content flows to the Learner App
2. **Real course content** (Studio) — run 30 courses through the pipeline
3. **Catalog wiring** (Learner) — connect to real published courses
4. **E2E testing** (Both) — validate complete user journeys
5. **Production deployment** — sabificate.com domain, Paystack prod keys

## Verdict
_On close run: corpus-close codebase-readiness-assessment <GO|CONDITIONAL_GO|NO_GO> <confidence%>_
