# SABIficate PRAXIS Build Plan

**Document Type:** Sprint Decomposition for Multi-Agent Build
**Covers:** Phase 0 Pre-Sprint Deliverables + Phase 1 MVP PRAXIS Sprint (Day 25-75)
**Method:** PRAXIS (Parallel Sprint Execution) with Claude Code Agent Swarm
**Last Updated:** 2026-06-14

---

## 1. PRAXIS Sprint Structure

### What PRAXIS Is

PRAXIS is a parallel build methodology where multiple Claude Code agents work simultaneously on independent modules of the same codebase. Each agent operates in an isolated git worktree -- a full copy of the repository on a separate branch -- so agents never block each other and never produce mid-work merge conflicts.

A single developer (Sanju) acts as the coordinator, managing decomposition, reviewing interface contracts, sequencing merges, and resolving conflicts when branches converge.

### How a PRAXIS Sprint Works in Practice

**Step 1: Decomposition.** The coordinator breaks the MVP into modules with minimal coupling. Each module has a defined boundary: its own directory structure, its own database migrations, its own API routes, its own frontend components. The interfaces between modules are specified as contracts (TypeScript types, API schemas, database table structures) before any agent starts building.

**Step 2: Interface Contracts.** Before agents launch, the coordinator commits a `contracts/` directory to `main` containing:
- Shared TypeScript type definitions (`contracts/types/`)
- Database schema SQL files (`contracts/schema/`)
- API route stubs with request/response types (`contracts/api/`)
- Shared constants, enums, and configuration (`contracts/shared/`)

Every agent's worktree inherits these contracts. Agents build TO the contracts, not around them.

**Step 3: Parallel Build.** Each agent gets:
- A git worktree (`git worktree add ../worktree-module-X module-X`)
- A CLAUDE.md file scoped to its module (what to build, which contracts to implement, which directories to own, which directories are off-limits)
- A test harness scoped to its module
- No awareness of other agents' implementation details -- only the shared contracts

**Step 4: Continuous Testing.** Each agent runs its own unit tests. A separate testing pass validates contract compliance: does Module B's API client match Module D's API server? Do Module C's database migrations produce the schema Module B expects?

**Step 5: Sequential Merge.** Modules merge to `main` in dependency order:
1. Foundation modules first (schema, auth, PWA shell)
2. Dependent modules second (course player, API server, payments)
3. Integration modules last (WhatsApp, credentials, offline sync)

Each merge triggers the full test suite. Conflicts are resolved by the coordinator before the next merge proceeds.

**Step 6: Integration Testing.** After all modules merge, end-to-end tests validate cross-module flows: user registers, browses catalog, starts a course, completes a quiz, progress syncs, payment processes, credential issues.

### PRAXIS Performance Expectations

| Metric | Traditional (1 dev) | PRAXIS (6-8 agents) |
|--------|---------------------|---------------------|
| Parallel workstreams | 1 | 6-8 |
| Daily output | 200-400 lines | 1,500-3,000+ lines |
| Sprint velocity | 1x | 5-8x |
| Context switching | High (human fatigue) | Zero (agents maintain full context) |
| Merge overhead | None | ~20% of coordinator time |

**Net effect:** The 7-week Phase 1 window (Day 25-75) is sufficient for a scope that would otherwise require 3-4 months with a single developer, because the build-intensive weeks (Weeks 1-6) use parallel agents for the heavy lifting, reserving Week 7 for integration and testing.

---

## 2. Module Decomposition for Phase 1 MVP

The 12 Phase 1 features decompose into 8 parallel build modules. Each module maps to one agent worktree.

### Module A: PWA Shell and Routing

**Covers:** Feature 1.11 (Data Saver Mode), partial Feature 1.1, partial Feature 1.5
**Owner Directory:** `src/app/`, `src/components/layout/`, `src/lib/pwa/`, `public/`

**Deliverables:**
- Vite 6.x project initialization with React 19.2
- Tailwind CSS v4 configuration with Nigerian mobile-optimized defaults (44px minimum tap targets, high-contrast text)
- PWA manifest (`manifest.webmanifest`) with SABIficate branding, theme colors, display: standalone
- Service worker via Workbox `generateSW` -- app shell precache ONLY (no course content precaching)
  - Precache budget: under 200KB compressed
  - Service worker file: under 15KB
  - Runtime caching configuration externalized
- React Router v7 with code-split routes (`React.lazy()` for every route)
  - `/` -- Landing/dashboard
  - `/courses` -- Catalog browse
  - `/courses/:slug` -- Course detail
  - `/courses/:slug/lessons/:lessonId` -- Lesson player
  - `/admin` -- Corporate admin (lazy-loaded)
  - `/profile` -- User profile and settings
  - `/credentials` -- Credential portfolio
  - `/verify/:credentialId` -- Public QR verification (unauthenticated)
- Layout components: `AppShell`, `BottomNav`, `TopBar`, `OfflineIndicator`, `SyncStatus`, `DataSaverBadge`
- Data saver mode system:
  - Three tiers: Full Experience, Data Saver (DEFAULT for all new users), Ultra Light (text-only, under 50KB/lesson)
  - Active mode displayed in app header
  - User-selectable via settings
  - `useDataSaverMode()` hook for components to query current tier
- Connection-aware module (`src/lib/network/`):
  - Adaptive timeouts based on rolling 5-request throughput average (3s on 4G, 8s on 3G, 15s on 2G)
  - NOT using unreliable Network Information API
  - `useNetworkStatus()` hook exposing: `isOnline`, `effectiveType`, `measuredThroughput`
- Cache health check on every app open (detects and recovers from HiOS/XOS cache-clearing)
- Performance budgets enforced:
  - Main entry chunk: under 50KB compressed
  - Largest vendor chunk: under 120KB compressed
  - Paystack SDK, admin dashboard, AI tutor chat: lazy-loaded, not in critical path

**Does NOT include:** Course content rendering (Module B), authentication UI (Module C), API integration (Module D)

---

### Module B: Course Player and Content Renderer

**Covers:** Feature 1.1 (Lesson Player), Feature 1.4 (Progress Tracking writes), partial Feature 1.11
**Owner Directory:** `src/components/course/`, `src/components/content/`, `src/lib/content/`, `src/lib/progress/`

**Deliverables:**
- JSON content schema renderer -- a React component library that renders typed content blocks:
  - `TextBlock` -- renders `text_block` with markdown, supports `difficulty_tier` enum (beginner/intermediate/advanced)
  - `QuizBlock` -- renders `quiz_block` (question, options, correct_answer, explanation, bloom_level), handles answer selection, immediate feedback, explanation reveal
  - `ArtifactPromptBlock` -- renders `artifact_prompt_block` (target_role, industry_vertical, career_level), provides text area for artifact submission, file upload placeholder
  - `ScenarioBlock` -- renders `scenario_block` with Nigerian context fields (company_type, regulatory_body, cultural_notes), interactive decision tree
- Content container component (`LessonPlayer`) that:
  - Receives a lesson's JSON content array and renders blocks in sequence
  - Supports adaptive difficulty selection (user picks tier, content blocks filter by `difficulty_tier`)
  - Tracks scroll position and block completion
  - Handles quiz submission inline (validates answer, shows explanation, records result)
- Lesson navigation:
  - Previous/next lesson within a module
  - Module progress bar (completed/total lessons)
  - Course-level progress overview
- Progress tracking writes to Dexie.js (IndexedDB):
  - Every quiz answer saved immediately to IndexedDB (sub-lesson granularity)
  - Lesson completion status written on last block viewed
  - Time spent tracked per lesson
  - Progress data structured for sync (Module H handles the actual sync engine)
  - `useProgress(lessonId)` hook for components to read/write progress
- Data saver tier awareness:
  - Full Experience: all content blocks rendered with rich formatting
  - Data Saver: images lazy-loaded with placeholders, reduced typography
  - Ultra Light: text blocks only, quiz blocks simplified, no images

**Does NOT include:** Service worker caching (Module A), API sync (Module D/H), authentication gating (Module C)

---

### Module C: User Auth and Database

**Covers:** Feature 1.2 (Authentication), database schema foundation
**Owner Directory:** `src/lib/auth/`, `src/components/auth/`, `server/auth/`, `server/db/`, `migrations/`

**Deliverables:**
- PostgreSQL schema (split-database architecture):
  - **Hetzner database (application tables):**
    - `organizations` -- corporate accounts
    - `departments` -- org hierarchy
    - `courses`, `modules`, `lessons` -- content structure
    - `course_categories` -- taxonomy
    - `subscription_plans`, `subscriptions` -- billing
    - `payment_transactions` -- payment records
    - `invoices` -- B2B invoicing
    - `credential_templates`, `issued_credentials` -- badge definitions and issuance
    - `enrollment` -- course enrollment records
    - `seat_allocations`, `department_seat_allocations` -- B2B seat management
    - `bulk_enrollment_jobs`, `bulk_enrollment_errors` -- CSV upload processing
    - `whatsapp_subscriptions`, `whatsapp_messages`, `whatsapp_templates` -- WhatsApp state
    - `dunning_attempts` -- payment retry tracking
  - **PII tables (flagged for Nigerian host migration):**
    - `users` -- email, phone_number, first_name, last_name, password_hash, avatar_url
    - `learner_progress` -- per-lesson progress
    - `assessment_attempts` -- quiz answers and scores
    - `sessions` -- active sessions
    - Flag: these tables have a `-- NDPA: PII TABLE - Nigerian host` comment and are structured for future extraction to a separate PostgreSQL instance on Layer3Cloud Lagos or MainOne
- Migration system (using node-pg-migrate or similar):
  - Numbered migrations with up/down
  - Seed data for development (test users, sample courses)
- User registration and login:
  - OAuth 2.0 + PKCE flow (mandatory for public PWA client)
  - Email/password registration with bcrypt (cost factor 12)
  - Login returns JWT access token (15-min expiry) + httpOnly secure refresh token (7-day expiry)
  - Refresh token rotation on use
- JWT middleware (`server/auth/middleware.ts`):
  - Validates JWT on every authenticated API request
  - Extracts user ID, role, org_id from token claims
  - Role-based access: `learner`, `corporate_admin`, `platform_admin`
- Rate limiting:
  - 5 failed login attempts per 15 minutes per IP
  - Progressive lockout (5 min, 15 min, 1 hour)
  - Rate limit headers in responses
- Session management:
  - Active session list per user
  - Revoke individual sessions
  - Revoke all sessions (password change)
- Consent management:
  - Three-tier consent model: (a) education-only, (b) anonymized aggregate, (c) full profile
  - Consent recorded with timestamp, version, and scope
  - Consent withdrawal supported
  - Granular consent for WhatsApp notifications (required by NDPA)
- Redis 7 integration for:
  - Session store (refresh token lookup)
  - Rate limit counters
  - Cache layer (course catalog, user profile)

**Does NOT include:** Cloudflare Workers edge validation (infrastructure task), TOTP 2FA (Phase 1b)

---

### Module D: API Server and Course Catalog

**Covers:** Feature 1.3 (Course Catalog), Feature 1.4 (Progress API), Feature 1.6 (Corporate Admin), Feature 1.7 (ITF Export)
**Owner Directory:** `server/api/`, `server/routes/`, `server/services/`, `src/components/catalog/`, `src/components/admin/`

**Deliverables:**
- Fastify API server (chosen over Express for 2-3x throughput on low-spec hosting):
  - JSON schema request/response validation via Fastify's built-in schema compiler
  - Structured logging (pino)
  - CORS configuration for PWA origin
  - Health check endpoint (`GET /api/v1/health`)
  - API versioning at `/api/v1/`
- Course catalog endpoints:
  - `GET /api/v1/courses` -- list with pagination, filter by category/difficulty/search query
  - `GET /api/v1/courses/:slug` -- full course detail with module/lesson structure
  - `GET /api/v1/courses/:slug/content/:lessonId` -- lesson content JSON (authenticated, checks enrollment)
  - `GET /api/v1/categories` -- category tree for filter UI
- Learner progress API:
  - `GET /api/v1/learner/courses/:courseId/progress` -- aggregate progress for enrolled course
  - `POST /api/v1/learner/lessons/:lessonId/progress` -- update lesson progress (accepts Dexie.js sync payload)
  - `POST /api/v1/learner/assessments/:assessmentId/submit` -- submit quiz answers, return score
  - `GET /api/v1/learner/dashboard` -- learner home (enrolled courses, recent activity, streaks)
- Corporate admin API:
  - `POST /api/v1/admin/learners/bulk-upload` -- CSV enrollment (email, first_name, last_name, department, job_title, employee_id), returns validation report with per-row errors
  - `GET /api/v1/admin/dashboard/overview` -- aggregate metrics: enrolled, active, completion rate, avg assessment scores, total learning hours
  - `GET /api/v1/admin/dashboard/learners` -- per-learner progress table with search/filter
  - `GET /api/v1/admin/dashboard/courses` -- per-course completion rates
  - `POST /api/v1/admin/reports/itf` -- generate ITF Form 7A-compatible training record export (CSV)
  - `POST /api/v1/admin/reports/cpd` -- generate CPD hours report by professional body
  - `GET /api/v1/admin/seats/overview` -- seat allocation summary (purchased, used, available)
- Frontend components:
  - `CourseCatalog` -- browse/search/filter grid with course cards
  - `CourseDetail` -- course overview, module list, enrollment CTA
  - `AdminDashboard` -- basic metrics, learner table, CSV upload, report generation
  - `ITFExport` -- form to configure and download ITF/CPD reports
- BullMQ job queue (on Redis) for:
  - CSV enrollment processing (async, returns job ID for polling)
  - Report generation (async, returns download URL)
  - Scheduled report delivery (email)

**Does NOT include:** Payment processing (Module F), WhatsApp delivery (Module G), credential issuance (Module H)

---

### Module E: AI Content Pipeline

**Covers:** Feature 1.10 (Course Production via AI Pipeline)
**Owner Directory:** `pipeline/`, `pipeline/agents/`, `pipeline/schemas/`, `pipeline/cli/`

**Deliverables:**
- 5-stage multi-agent generation pipeline, each stage implemented as a separate module with its own prompt template and validation:

  **Stage 1: `lesson_generator`**
  - Input: SME brief (topic, learning objectives, target audience, Nigerian context notes from the Business Context Library)
  - Output: JSON array of `text_block` items for 3 adaptive difficulty tiers (beginner/intermediate/advanced)
  - Prompt template includes: Bloom's taxonomy level targets, Nigerian business scenario requirements, word count constraints (under 300 words per block for WhatsApp compatibility)
  - Model: Claude Sonnet 4.6 via Batch API

  **Stage 2: `quiz_generator`**
  - Input: Lesson content JSON from Stage 1
  - Output: JSON array of `quiz_block` items (3-5 per lesson, each with question/options/correct_answer/explanation/bloom_level)
  - Enforces: minimum 40% application/analysis items (Bloom's levels 3-4), Nigerian regulatory citations where applicable
  - Model: Claude Sonnet 4.6 via Batch API

  **Stage 3: `adaptive_variant_generator`**
  - Input: Lesson content from Stage 1
  - Output: 3 independent content packages per lesson (beginner/intermediate/advanced) -- NOT lexical substitution on a shared template
  - Each variant is a complete standalone lesson with its own examples, scenarios, and quiz items
  - Model: Claude Sonnet 4.6 via Batch API

  **Stage 4: `artifact_prompt_generator`**
  - Input: Course topic, target audience, lesson content
  - Output: JSON `artifact_prompt_block` for each lesson -- a workplace artifact the learner must produce (e.g., "Draft a CBN compliance memo for your bank's risk committee")
  - Includes: target_role, industry_vertical, career_level, rubric for self-assessment
  - Workplace realism rubric enforced in prompt
  - Model: Claude Sonnet 4.6 via Batch API

  **Stage 5: `validation_agent`**
  - Input: Complete course package (all lessons, quizzes, variants, artifact prompts)
  - Output: Validation report with pass/fail per item, flagged issues, confidence scores
  - Validates: JSON schema conformance, Bloom's taxonomy distribution, difficulty tier completeness, Nigerian context accuracy flags, content length constraints, quiz answer correctness
  - Model: Claude Sonnet 4.6 (standard API, not Batch -- needs immediate response)

- JSON schema validation (Zod or Ajv):
  - Strict schema definitions for every content block type
  - Pipeline fails fast on schema violations
  - Schema files shared with Module B (content renderer) via `contracts/schemas/content.ts`

- Batch API integration:
  - Stages 1-4 use Claude Batch API for 50% cost reduction
  - Batch submission with polling for completion
  - Error handling: retry failed items, log permanently failed items for SME manual creation
  - Cost tracking per pipeline run (tokens used, estimated cost)

- CLI tool (`pipeline/cli/index.ts`):
  - `sabificate-pipeline generate --brief <path> --output <path>` -- run full pipeline from SME brief to course package
  - `sabificate-pipeline validate --course <path>` -- run validation agent on existing course
  - `sabificate-pipeline import --course <path> --db <connection>` -- import validated course into PostgreSQL
  - `sabificate-pipeline status --batch <id>` -- check Batch API job status
  - Progress output with estimated time remaining

- Nigerian Business Context Library integration:
  - Pipeline reads from `corpus/nigerian-context/` directory
  - Scenarios, terminology glossary, regulatory references injected into prompt context
  - Negative examples list (things NOT to say/assume about Nigerian business culture) included in system prompt

**Does NOT include:** Course serving (Module D), content rendering (Module B), admin UI for pipeline (Phase 1b)

---

### Module F: Payments and Subscriptions

**Covers:** Feature 1.8 (Paystack Integration)
**Owner Directory:** `server/payments/`, `server/webhooks/`, `src/components/payments/`, `src/lib/payments/`

**Deliverables:**
- Paystack integration:
  - **B2C Individual Subscriptions** via Paystack Subscriptions API (managed by Paystack):
    - Plan creation for each subscription tier (Free/Standard NGN 6,500 quarterly/Premium NGN 18,000 annually)
    - Subscription initialization with customer email
    - Paystack-hosted checkout redirect (no card data touches our servers)
    - Webhook handler for subscription events: `subscription.create`, `subscription.disable`, `subscription.not_renew`, `charge.success`, `charge.failed`
  - **B2B Corporate Recurring Charges** via stored `authorization_code`:
    - After initial card payment, store authorization_code for future charges
    - Recurring charge endpoint for corporate seat billing
    - Webhook handler for charge events
  - **Manual invoicing** for large corporate and government deals:
    - Invoice generation with Nigerian VAT calculation (7.5% VAT)
    - PDF generation (using pdfkit or similar)
    - Invoice status tracking (draft/sent/paid/overdue)
    - Bank transfer reconciliation workflow

- Webhook security:
  - Paystack signature validation on every webhook (SHA-512 HMAC)
  - Idempotency: webhook events processed exactly once (event ID stored in Redis with 24h TTL)
  - Retry-safe: webhooks are idempotent, Paystack retries on non-200

- Dunning engine (basic version -- full version in Phase 1b):
  - Webhook-driven detection of `charge.failed` events
  - Retry schedule: 24 hours, 72 hours, 7 days after initial failure
  - Notification triggers: email on each retry, WhatsApp nudge at 72h and 7d (uses WhatsApp template from Module G)
  - Card update deep link generation
  - 7-day grace period with degraded access (can view but not start new courses)
  - `PaymentTransaction` table writes for every attempt
  - `DunningAttempt` table: `payment_transaction_id`, `attempt_number`, `scheduled_at`, `executed_at`, `result`, `notification_sent`

- Frontend components:
  - `PricingTable` -- displays subscription tiers with NGN pricing
  - `CheckoutButton` -- initiates Paystack checkout flow
  - `PaymentHistory` -- lists past transactions
  - `InvoiceList` -- corporate admin view of invoices
  - `SubscriptionManager` -- current plan, upgrade/downgrade, cancel

- Paystack for Schools application tracking:
  - If approved: switch to 0.7% fee capped at NGN 1,500 (vs. standard 1.5% + NGN 100 capped at NGN 2,000)
  - Fee tier configurable via environment variable

**Does NOT include:** NIBSS direct debit (Phase 2), Flutterwave (not at launch), USSD payments (not at launch), mobile money (not at launch)

---

### Module G: WhatsApp Integration

**Covers:** Feature 1.9 (WhatsApp Micro-Lesson Delivery)
**Owner Directory:** `server/whatsapp/`, `src/components/whatsapp/`

**Deliverables:**
- WhatsApp Business API integration:
  - API client module for the WhatsApp Cloud API (Meta-hosted)
  - Authentication with permanent access token
  - Phone number registration and verification
  - Message sending (text, interactive buttons, template messages)
  - Webhook receiver for incoming messages and delivery receipts

- Micro-lesson delivery flow:
  - Daily lesson push at user's preferred time (configurable, default 9:00 WAT)
  - Lesson format: problem statement (under 50 words) + 300-word micro-lesson + 2 quiz questions via interactive reply buttons
  - Quiz response handling: process button replies, record answer, send immediate feedback (correct/incorrect + explanation)
  - Artifact prompt delivery: after quiz, send artifact prompt with instructions
  - Lesson sequencing: track which lesson in which course the learner is on, advance on completion

- Interactive button quizzes:
  - WhatsApp interactive message with up to 3 reply buttons per question
  - Multi-question flow: ask question 1, wait for reply, send feedback, ask question 2
  - Timeout handling: if no reply within 24 hours, send gentle reminder
  - Score recording: quiz results written to the same progress tables as PWA quiz results

- Template messages (must be pre-approved by Meta):
  - `daily_lesson` -- daily micro-lesson delivery
  - `quiz_result` -- quiz completion with score
  - `streak_reminder` -- streak maintenance nudge
  - `course_complete` -- course completion congratulations + credential link
  - `dunning_reminder` -- payment retry notification (coordinates with Module F)
  - `enrollment_welcome` -- corporate enrollment welcome message
  - Template management: submit templates for approval via API, track approval status

- Conversation state management:
  - Redis-backed state machine per user: `idle`, `lesson_delivered`, `awaiting_quiz_1`, `awaiting_quiz_2`, `lesson_complete`
  - State transitions triggered by incoming messages
  - Conversation timeout: reset to `idle` after 24 hours of no response
  - `STOP` command: unsubscribe from WhatsApp delivery, update consent record
  - `HELP` command: send help text with available commands

- WhatsApp subscription management:
  - `POST /api/v1/whatsapp/subscribe` -- opt-in to WhatsApp delivery (requires NDPA consent)
  - `POST /api/v1/whatsapp/unsubscribe` -- opt-out
  - `GET /api/v1/admin/whatsapp/analytics` -- delivery rates, response rates, quiz completion rates
  - Subscription preferences: preferred time, preferred days, course selection

- Rate limiting and cost management:
  - WhatsApp Business API conversation-based pricing (~$0.05-0.10 per conversation session)
  - Daily message cap per user (configurable)
  - Bulk send throttling to avoid API rate limits
  - Cost tracking per user per month

**Does NOT include:** Two-way AI tutor via WhatsApp (Phase 2), WhatsApp group auto-creation for pods (Phase 2)

---

### Module H: Credentials and Offline Sync

**Covers:** Feature 1.12 (Credentials), Feature 1.5 (Offline Sync)
**Owner Directory:** `server/credentials/`, `src/lib/sync/`, `src/lib/offline/`, `src/components/credentials/`, `src/components/sync/`

**Deliverables:**

**Credential Issuance (Open Badges 3.0):**
- Credential template management:
  - `CredentialTemplate` CRUD (platform admin)
  - Co-branding fields ready from Day 1: `co_brand_org_id`, `co_brand_logo_url`, `co_brand_signatory` (configuration change when institutional partner signs, not code change)
  - Professional body fields: `cpd_hours`, `professional_body` (CIBN/ICAN/CITN)
- Credential issuance:
  - Auto-issue on course completion (all lessons completed + final quiz passed at 70%+)
  - Also issued for portfolio artifact submission (if artifact_prompt completed)
  - Open Badges 3.0 JSON-LD credential format
  - Ed25519 cryptographic signing (issuer key management)
  - Unique certificate_number generation
  - `POST /api/v1/credentials/issue` -- internal endpoint triggered by progress completion
  - `GET /api/v1/credentials/:id` -- retrieve credential JSON
  - `GET /api/v1/learner/credentials` -- list all earned credentials
- QR verification page:
  - `GET /verify/:credentialId` -- public unauthenticated page
  - Displays: credential details, issuer, date, verification status (valid/revoked/expired)
  - QR code generation (via qrcode library) linking to verification URL
  - Shareable to LinkedIn, email, WhatsApp
- Portfolio artifact linking:
  - Credential `evidence` field points to learner's submitted artifact URL
  - Artifact storage in Cloudflare R2 (zero egress fees)
  - Portfolio view: list of credentials with linked artifacts

**Foreground-First Sync Engine:**
- Dexie.js (IndexedDB) as client-side database:
  - Tables: `pendingProgress`, `pendingQuizAnswers`, `downloadedLessons`, `syncQueue`
  - Schema versioning for future migrations
  - Reserved 5MB partition for sync data -- never consumed by course downloads
- Sync strategy (foreground-first):
  - PRIMARY: POST progress data immediately while app is in foreground
  - Visible sync status indicator in app header: "Syncing...", "All saved", "X items pending"
  - Sync on app open (cache health check + push any pending items)
  - Sync on network reconnection (online event listener)
  - SECONDARY: Background Sync API registration as opportunistic fallback (will be killed by HiOS within 60-90 seconds)
  - Conflict resolution: server timestamp wins for completion status; local progress_percent wins if higher
- Offline indicators:
  - Global offline banner when navigator.onLine is false
  - Per-lesson offline availability indicator (downloaded vs. not)
  - "Unsaved work" badge when pendingProgress or pendingQuizAnswers has items
  - Sync retry with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Storage management dashboard:
  - Per-course offline storage usage display
  - Manual delete for downloaded courses
  - Naira cost estimates for course downloads (based on measured file size and current data pricing ~N431/GB)
  - Total storage used vs. available (navigator.storage.estimate())
  - LRU eviction of completed courses when storage is low
  - Download initiation with progress indicator and size warning

**Does NOT include:** Background Fetch API for large downloads (Phase 1b), full storage dashboard polish (Phase 1b)

---

## 3. Interface Contracts Between Modules

All contracts are committed to `main` in the `contracts/` directory before any agent worktree begins. Agents implement TO these contracts. Changes to contracts require coordinator approval and a rebase of affected worktrees.

### 3.1 Database Schema (Shared -- Module C owns, all modules reference)

Module C creates and owns all database migrations. Other modules reference table structures but do not create tables directly.

**Table ownership and cross-module access:**

| Table | Owner | Read By | Write By |
|-------|-------|---------|----------|
| `users` | C | All | C (registration), D (profile updates) |
| `organizations` | C | D, F | C (registration), D (admin) |
| `departments` | C | D | D (admin) |
| `courses` | C (schema) | B, D, E, G, H | D (CRUD), E (pipeline import) |
| `modules` | C (schema) | B, D | D (CRUD), E (import) |
| `lessons` | C (schema) | B, D, G | D (CRUD), E (import) |
| `enrollment` | C (schema) | B, D, G, H | D (enrollment API) |
| `learner_progress` | C (schema) | B, D, G, H | D (sync API), B (via D) |
| `assessment_attempts` | C (schema) | D, H | D (submit API) |
| `subscription_plans` | C (schema) | D, F | F (plan management) |
| `subscriptions` | C (schema) | D, F | F (subscription lifecycle) |
| `payment_transactions` | C (schema) | D, F | F (payment processing) |
| `invoices` | C (schema) | D, F | F (invoice generation) |
| `dunning_attempts` | C (schema) | F | F (dunning engine) |
| `credential_templates` | C (schema) | D, H | H (template CRUD) |
| `issued_credentials` | C (schema) | D, H | H (issuance) |
| `whatsapp_subscriptions` | C (schema) | D, G | G (subscription management) |
| `whatsapp_messages` | C (schema) | G | G (message logging) |
| `seat_allocations` | C (schema) | D | D (admin API) |
| `sessions` | C | C | C (auth) |

### 3.2 API Endpoint Contracts

Each endpoint is defined as a TypeScript interface in `contracts/api/`. The interface specifies request params, request body, response body, and error shapes.

**Module D exposes (other modules consume):**

```typescript
// contracts/api/courses.ts
interface CourseListRequest {
  query?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  page?: number;
  limit?: number; // default 20, max 100
}

interface CourseListResponse {
  courses: CourseSummary[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface CourseSummary {
  id: string; // UUID
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: { id: string; name: string; slug: string };
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  cpd_hours: number | null;
  professional_body: 'CIBN' | 'ICAN' | 'CITN' | null;
  lesson_count: number;
  module_count: number;
}

// contracts/api/progress.ts
interface ProgressSyncPayload {
  lesson_id: string;
  status: 'in_progress' | 'completed';
  progress_percent: number; // 0-100
  time_spent_seconds: number;
  quiz_answers?: QuizAnswer[];
  synced_at: string; // ISO 8601
  client_id: string; // unique per-device ID for conflict resolution
}

interface QuizAnswer {
  quiz_block_id: string;
  selected_option: number;
  is_correct: boolean;
  answered_at: string; // ISO 8601
}

interface ProgressSyncResponse {
  accepted: boolean;
  server_progress: {
    lesson_id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percent: number;
    completed_at: string | null;
  };
  conflicts?: ProgressConflict[];
}

interface ProgressConflict {
  field: string;
  client_value: unknown;
  server_value: unknown;
  resolution: 'server_wins' | 'client_wins';
}
```

**Module C exposes (auth endpoints):**

```typescript
// contracts/api/auth.ts
interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string; // E.164 format
  consent: {
    education_only: boolean; // required true
    anonymized_aggregate: boolean;
    full_profile: boolean;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string; // JWT, 15-min expiry
  token_type: 'Bearer';
  expires_in: number; // seconds
  user: UserProfile;
}
// Refresh token set as httpOnly secure cookie

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'learner' | 'corporate_admin' | 'platform_admin';
  org_id: string | null;
  department_id: string | null;
  language_preference: 'en';
  data_saver_mode: 'full' | 'data_saver' | 'ultra_light';
}
```

**Module F exposes (payment endpoints):**

```typescript
// contracts/api/payments.ts
interface InitializePaymentRequest {
  plan_id: string;
  payment_type: 'subscription' | 'invoice';
}

interface InitializePaymentResponse {
  authorization_url: string; // Paystack checkout URL
  access_code: string;
  reference: string;
}

interface PaystackWebhookEvent {
  event: string;
  data: Record<string, unknown>;
}

// Internal event emitted by Module F, consumed by Module G for dunning WhatsApp messages
interface PaymentFailedEvent {
  user_id: string;
  transaction_id: string;
  attempt_number: number;
  next_retry_at: string | null;
}
```

**Module H exposes (credential endpoints):**

```typescript
// contracts/api/credentials.ts
interface IssueCredentialRequest {
  user_id: string;
  course_id: string;
  evidence_urls?: string[];
}

interface Credential {
  id: string;
  certificate_number: string;
  credential_json: object; // Open Badges 3.0 JSON-LD
  verification_url: string;
  qr_code_url: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string;
}
```

### 3.3 Event and Webhook Contracts

Modules communicate asynchronously via BullMQ job queues on Redis. Each event type has a defined payload schema.

**Event bus (BullMQ queues):**

| Queue Name | Producer | Consumer | Payload |
|------------|----------|----------|---------|
| `enrollment.created` | D | G, F | `{ user_id, course_id, org_id, enrollment_type }` |
| `lesson.completed` | D | H (credential check) | `{ user_id, lesson_id, course_id, completion_percent }` |
| `course.completed` | D | H (credential issuance) | `{ user_id, course_id, final_score }` |
| `payment.failed` | F | G (dunning WhatsApp) | `PaymentFailedEvent` |
| `payment.succeeded` | F | D (unlock access) | `{ user_id, subscription_id, plan_id }` |
| `credential.issued` | H | G (notification) | `{ user_id, credential_id, course_title }` |
| `whatsapp.quiz.completed` | G | D (progress write) | `ProgressSyncPayload` |
| `pipeline.course.ready` | E | D (import) | `{ course_package_path, validation_report }` |
| `csv.enrollment.uploaded` | D | D (async processing) | `{ job_id, file_path, org_id, admin_user_id }` |

### 3.4 Component Prop Interfaces (Frontend)

Shared component interfaces live in `contracts/components/`.

```typescript
// contracts/components/lesson-player.ts
interface LessonPlayerProps {
  lesson: LessonContent;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  onProgressUpdate: (progress: ProgressUpdate) => void;
  onQuizSubmit: (answer: QuizAnswer) => void;
  onLessonComplete: () => void;
  dataSaverMode: 'full' | 'data_saver' | 'ultra_light';
  isOffline: boolean;
}

interface LessonContent {
  id: string;
  title: string;
  module_id: string;
  course_id: string;
  sort_order: number;
  blocks: ContentBlock[];
  next_lesson_id: string | null;
  prev_lesson_id: string | null;
}

type ContentBlock =
  | { type: 'text_block'; id: string; content: string; difficulty_tier: DifficultyTier }
  | { type: 'quiz_block'; id: string; question: string; options: string[]; correct_answer: number; explanation: string; bloom_level: BloomLevel }
  | { type: 'artifact_prompt_block'; id: string; prompt: string; target_role: string; industry_vertical: string; career_level: string; rubric: string[] }
  | { type: 'scenario_block'; id: string; scenario: string; company_type: string; regulatory_body: string; cultural_notes: string; decision_tree: DecisionNode[] };

type DifficultyTier = 'beginner' | 'intermediate' | 'advanced';
type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
```

### 3.5 State Management Contracts (Dexie.js vs. Server)

| Data | Primary Store | Secondary Store | Sync Direction |
|------|--------------|-----------------|----------------|
| User profile | Server (PostgreSQL) | Client (localStorage) | Server -> Client on login |
| Course catalog | Server (PostgreSQL) | Client (service worker cache) | Server -> Client on browse |
| Lesson content | Server (PostgreSQL) | Client (Dexie.js) on explicit download | Server -> Client on download |
| Quiz answers (in progress) | Client (Dexie.js) | Server (PostgreSQL) | Client -> Server on foreground sync |
| Lesson progress | Client (Dexie.js) | Server (PostgreSQL) | Client -> Server on foreground sync |
| Completed credentials | Server (PostgreSQL) | Client (Dexie.js) | Server -> Client on issuance |
| Subscription status | Server (PostgreSQL) | Client (JWT claims) | Server -> Client on token refresh |
| WhatsApp preferences | Server (PostgreSQL) | N/A | Server only |
| Payment history | Server (PostgreSQL) | N/A | Server only |

**Conflict resolution rules:**
- `lesson.status` (completed): server wins (prevents re-completion exploits)
- `lesson.progress_percent`: client wins if higher (never lose progress)
- `quiz_answers`: append-only (both sides keep all answers, latest attempt is canonical)
- `enrollment.status`: server wins (admin can revoke)

---

## 4. Sprint Timeline (Day 25-75)

### Prerequisites (complete before Day 25)

All Phase 0 deliverables (Section 7) must pass the Phase 0 Gate. Additionally:
- Git repository initialized with project structure
- `contracts/` directory committed to `main` with all interface definitions from Section 3
- CI pipeline configured (GitHub Actions: lint, type check, test, build)
- Development environment documented (Node.js version, PostgreSQL setup, Redis setup)
- Hetzner CX33 server provisioned with PostgreSQL 16 and Redis 7
- Cloudflare Pro configured with DNS pointing to Hetzner
- Paystack test account created with test API keys
- WhatsApp Business API access approved (Meta Business verification)

### Week 1-2 (Day 25-39): Foundation Sprint

**Launch Modules A, C, E in parallel.** These have zero dependencies on each other.

```
Day 25-39 Timeline:
                                          
Module A (PWA Shell)      ████████████████  [14 days]
Module C (Auth + DB)      ████████████████  [14 days]  
Module E (AI Pipeline)    ████████████████  [14 days]

Coordinator:              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  contract review, merge prep
```

**Module A delivers by Day 39:**
- PWA shell running locally with all routes, layout components, offline indicator
- Service worker with app shell precaching
- Data saver mode toggle functional
- Performance budgets passing in CI

**Module C delivers by Day 39:**
- All database tables created with migrations
- Auth flow functional (register, login, JWT, refresh, logout)
- Rate limiting active
- Consent management recording
- Redis session store operational

**Module E delivers by Day 39:**
- All 5 pipeline agents functional
- CLI tool running end-to-end from SME brief to validated course JSON
- At least 5 courses generated and validated (from Day 25 velocity test corpus)
- Batch API integration working

**Merge sequence (Day 38-39):**
1. Module C merges first (schema is the foundation)
2. Module A merges second (no schema dependency, but benefits from auth types)
3. Module E merges third (standalone pipeline, references schema for import format)

### Week 3-4 (Day 39-53): Application Sprint

**Launch Modules B, D, F in parallel.** These depend on A and C being merged.

```
Day 39-53 Timeline:

Module B (Course Player)  ████████████████  [14 days]
Module D (API + Catalog)  ████████████████  [14 days]
Module F (Payments)       ████████████████  [14 days]

Coordinator:              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  integration checkpoints
Module E (Content Gen)    ░░░░░░░░░░░░░░░░  continuous: generating 15-20 courses
```

**Module B delivers by Day 53:**
- All content block renderers functional
- Lesson player with difficulty selection
- Quiz submission with Dexie.js writes
- Progress tracking hooks
- Data saver tier rendering

**Module D delivers by Day 53:**
- Fastify server running with all endpoints
- Course catalog browse/search/filter
- Learner progress API with sync support
- Corporate admin: CSV upload, basic dashboard, ITF export
- BullMQ job processing

**Module F delivers by Day 53:**
- Paystack checkout flow (test mode)
- Webhook handlers for subscription events
- Basic dunning engine (retry schedule + notifications)
- Invoice generation with VAT
- Payment tables populated on successful transactions

**Merge sequence (Day 52-53):**
1. Module D merges first (API is the integration backbone)
2. Module B merges second (connects to D's API)
3. Module F merges third (hooks into D's user/subscription models)

### Week 5-6 (Day 53-67): Integration Sprint

**Launch Modules G and H. Begin integration testing.**

```
Day 53-67 Timeline:

Module G (WhatsApp)       ████████████████  [14 days]
Module H (Creds + Sync)   ████████████████  [14 days]

Integration Testing:      ░░░░░░░████████  [starts Day 60]
Module E (Content Gen):   ░░░░░░░░░░░░░░░  continuous: 15-20 courses target
```

**Module G delivers by Day 67:**
- WhatsApp Business API integration functional
- Daily lesson delivery flow
- Interactive button quizzes
- Template messages submitted and (ideally) approved
- Conversation state management
- Subscription management

**Module H delivers by Day 67:**
- Credential issuance on course completion
- QR verification page
- Portfolio artifact linking
- Foreground-first sync engine
- Storage management dashboard
- Offline indicator UI

**Merge sequence (Day 66-67):**
1. Module H merges first (sync engine is infrastructure)
2. Module G merges second (WhatsApp needs progress write path from H's sync)

### Week 7 (Day 67-75): Hardening Sprint

**No new modules. Full integration testing, device testing, bug fixes.**

```
Day 67-75 Timeline:

Integration Testing:      ████████████████  [8 days]
Device Testing:           ░░░░████████████  [starts Day 69]
Bug Fixes:                ░░░░░░░░████████  [as found]
Content Finalization:     ████████████████  [final 15-20 courses imported]
Corporate Pilot Prep:     ████████████████  [user accounts, enrollment, training)
```

**Deliverables by Day 75:**
- All 8 modules merged and passing full test suite
- 15-20 courses imported and playable
- End-to-end flows validated on physical devices
- Corporate pilot accounts created and enrollment CSV processed
- WhatsApp templates approved and delivery tested
- Paystack production keys configured (or test mode confirmed for pilot)

### Dependency Graph

```
                     contracts/ (pre-sprint)
                           |
              +------------+------------+
              |            |            |
           Module A     Module C     Module E
           (PWA Shell)  (Auth+DB)   (Pipeline)
              |            |            |
              +-----+------+            |
                    |                   |
              +-----+------+           |
              |     |      |           |
           Module B Module D Module F  |
           (Player) (API)   (Pay)      |
              |     |      |           |
              +-----+------+           |
                    |                   |
              +-----+------+           |
              |            |           |
           Module G     Module H       |
           (WhatsApp)   (Creds+Sync)   |
              |            |           |
              +-----+------+-----------+
                    |
              Integration Testing
                    |
              Device Testing
                    |
              Phase 1 Gate (Day 75)
```

---

## 5. Testing Strategy

### 5.1 Unit Tests Per Module

**Frontend (Jest + React Testing Library):**
- Module A: route rendering, layout component rendering, data saver mode toggle, network status hook
- Module B: each content block renderer (text, quiz, artifact, scenario), difficulty filtering, progress hook writes
- Module F: pricing table rendering, checkout flow initiation, payment history display
- Module H: credential display, QR code generation, sync status indicator, storage dashboard calculations

**Backend (Vitest):**
- Module C: password hashing, JWT generation/validation, rate limiting, consent recording, migration up/down
- Module D: API endpoint request/response validation, CSV parsing, pagination, search queries, ITF report generation
- Module F: Paystack webhook signature verification, dunning schedule calculation, invoice VAT calculation, idempotency checks
- Module G: WhatsApp message formatting, conversation state transitions, template rendering, rate limit enforcement
- Module H: OB 3.0 credential JSON generation, Ed25519 signing, certificate number generation

**Pipeline (Vitest):**
- Module E: JSON schema validation, prompt template rendering, Batch API response parsing, content block type checking, Bloom's taxonomy distribution enforcement

**Coverage targets:**
- Module C (auth, payments, credentials): 90%+ line coverage (security-critical)
- Module D (API): 80%+ line coverage
- All other modules: 70%+ line coverage

### 5.2 Integration Tests (Module Boundary Contracts)

Run after each merge to validate cross-module contracts:

| Test | Validates | Modules |
|------|-----------|---------|
| Auth -> API | JWT from C accepted by D's middleware | C + D |
| Player -> API | Content blocks from D render in B's player | B + D |
| Progress sync | Dexie.js writes from B sync via D's API | B + D + H |
| Payment -> Access | Successful payment in F unlocks courses in D | D + F |
| CSV -> Enrollment | CSV upload in D creates users in C and sends WhatsApp in G | C + D + G |
| Quiz -> Credential | Quiz completion in B (via D) triggers credential in H | B + D + H |
| WhatsApp -> Progress | Quiz answer in G writes progress via D | D + G |
| Dunning -> WhatsApp | Payment failure in F sends WhatsApp via G | F + G |
| Pipeline -> Catalog | Course from E imports into D and renders in B | B + D + E |

### 5.3 End-to-End Tests (Playwright for PWA Flows)

**Critical user flows tested with Playwright:**

1. **Learner Registration Flow:** Landing page -> Register -> Email verify -> Consent -> Dashboard
2. **Course Discovery Flow:** Dashboard -> Catalog -> Filter by category -> Course detail -> Enroll
3. **Learning Flow:** Enrolled course -> Lesson player -> Read content -> Answer quiz -> See feedback -> Next lesson -> Complete course
4. **Adaptive Difficulty Flow:** Lesson player -> Select "Advanced" -> Content changes -> Quiz difficulty increases
5. **Offline Learning Flow:** Go offline -> Open cached lesson -> Answer quiz -> See "pending sync" indicator -> Go online -> Sync completes
6. **Payment Flow:** Pricing page -> Select plan -> Paystack checkout (test mode) -> Redirect back -> Access unlocked
7. **Corporate Admin Flow:** Admin login -> CSV upload -> See learner progress -> Download ITF report
8. **Credential Flow:** Complete course -> Receive credential -> View credential -> Share QR code -> Verify via QR URL

**Playwright configuration:**
- Mobile viewport (360x800 -- Tecno Spark 30 screen size)
- Slow 3G network throttling for performance validation
- Service worker interception for offline simulation

### 5.4 Device Testing Protocol

**Target devices (physical hardware required):**

| Device | Price Point | Market Share Context | OS | Browser |
|--------|-------------|---------------------|-----|---------|
| Tecno Spark 30 | ~$100 | Tecno = 27.16% market share | HiOS 14 (Android 14) | Chrome |
| Infinix Hot 50 | ~$90 | Infinix = 17.33% market share | XOS 14 (Android 14) | Chrome |
| Samsung Galaxy A06 | ~$110 | Samsung = 22.67% market share | One UI Core (Android 14) | Chrome + Samsung Internet |

**SIM cards for network testing:**

| Carrier | Market Share | Known Issues |
|---------|-------------|--------------|
| MTN | 38.4% | Generally reliable with Cloudflare |
| GLO | 12.34% | Documented Cloudflare connectivity issues -- test grey-cloud fallback |
| Airtel | 27.5% | Generally reliable |

**Device test protocol (run on each device x each carrier = 9 combinations):**

1. **First visit on 3G:** Navigate to URL. Measure time to interactive. Must be under 3 seconds.
2. **A2HS install:** Trigger Add to Home Screen. Verify PWA opens standalone. Verify app icon on home screen.
3. **App shell load:** Close and reopen from home screen. Must load under 1 second (cached).
4. **Course download:** Download a course for offline use. Verify download progress indicator. Verify Naira cost estimate displays.
5. **Offline quiz:** Turn on airplane mode. Open downloaded course. Complete a quiz. Verify "pending sync" indicator shows.
6. **Background kill test (Tecno/Infinix only):** With quiz answers pending, lock screen for 2 minutes. Verify HiOS/XOS has not cleared the service worker cache. Unlock, verify pending answers are still in IndexedDB.
7. **Foreground sync:** Turn off airplane mode. Verify sync completes within 10 seconds. Verify "All saved" indicator.
8. **Payment flow:** Complete Paystack checkout flow on mobile. Verify redirect back to app works.
9. **WhatsApp integration:** Receive a WhatsApp lesson. Tap quiz button. Verify response registers.
10. **Low battery test (Tecno/Infinix):** Reduce battery below 20%. Verify Smart Power Saver does not break the app when in foreground.
11. **Data saver mode:** Toggle Data Saver mode. Verify content re-renders with reduced media. Verify Ultra Light shows text only.
12. **Storage pressure:** Fill device storage to under 500MB free. Verify storage dashboard warns. Verify LRU eviction works.

### 5.5 Performance Budget Validation in CI

**GitHub Actions CI checks on every PR:**

| Metric | Budget | Tool |
|--------|--------|------|
| Main JS bundle (compressed) | Under 50KB | `bundlesize` or custom Vite plugin |
| Largest vendor chunk (compressed) | Under 120KB | `bundlesize` |
| Total initial CSS (compressed) | Under 15KB | Tailwind output analysis |
| Service worker file | Under 15KB | File size check |
| Lighthouse Performance score (mobile) | 90+ | `lhci` |
| Lighthouse PWA score | 100 | `lhci` |
| Time to Interactive (simulated 3G) | Under 3s | `lhci` |
| TypeScript strict mode | Zero errors | `tsc --noEmit` |
| ESLint | Zero errors | `eslint` |

---

## 6. Merge Strategy

### Branch Naming

Each module works on a branch named `module/<letter>-<name>`:
- `module/a-pwa-shell`
- `module/b-course-player`
- `module/c-auth-database`
- `module/d-api-catalog`
- `module/e-ai-pipeline`
- `module/f-payments`
- `module/g-whatsapp`
- `module/h-credentials-sync`

### Merge Sequence and Process

Merges happen at the end of each sprint phase (Weeks 1-2, 3-4, 5-6) in dependency order as specified in the Sprint Timeline. The process for each merge:

**1. Pre-merge validation (agent completes before signaling ready):**
- All module-specific unit tests pass
- TypeScript compiles with zero errors in strict mode
- ESLint passes with zero errors
- No hardcoded secrets, API keys, or credentials in code
- Module respects directory ownership (no writes to other modules' directories)

**2. Coordinator review:**
- Coordinator (Sanju) reviews the diff for contract compliance
- Checks that all interface contracts from `contracts/` are implemented correctly
- Verifies no unexpected database schema changes
- Reviews security-critical code paths manually (auth, payments, data handling)

**3. Merge execution:**
```bash
# On main branch
git merge module/c-auth-database --no-ff
# Run full test suite
npm test
# If tests pass, proceed to next merge
git merge module/a-pwa-shell --no-ff
npm test
# Continue in dependency order...
```

**4. Post-merge integration tests:**
- After each merge, run the relevant integration tests from Section 5.2
- If integration tests fail, fix on `main` before proceeding to the next merge

### Conflict Resolution Approach

**Prevention (primary strategy):**
- Strict directory ownership means modules rarely touch the same files
- Shared code lives in `contracts/` which is frozen during a sprint phase
- Each module has its own migration files (numbered to avoid collision: Module C uses 001-099, Module D uses 100-199, etc.)

**Resolution (when conflicts occur):**
1. Coordinator identifies the conflict scope
2. If conflict is in a shared file (e.g., `package.json` dependencies), coordinator manually resolves by combining both changes
3. If conflict is in module-owned code, the later-merging module rebases onto the updated `main` and fixes
4. After resolution, re-run full test suite before proceeding

### CI Gates Before Merge

Every PR to `main` must pass:

| Gate | Tool | Failure Action |
|------|------|----------------|
| TypeScript compilation | `tsc --noEmit` | Block merge |
| Unit tests | Jest/Vitest | Block merge |
| Lint | ESLint | Block merge |
| Bundle size | `bundlesize` | Block merge if over budget |
| Security scan | `npm audit` + dependency check | Block merge on critical/high vulnerabilities |
| Integration tests (post-merge) | Custom test suite | Block next merge |

---

## 7. Phase 0 Deliverables (Pre-Sprint, Day 1-25)

Phase 0 runs before the PRAXIS sprint begins. Its purpose is to validate three things: (1) the AI content pipeline produces acceptable Nigerian professional content, (2) at least one corporate client will pilot, and (3) compliance prerequisites are moving.

### 7.1 Founding Working Session

**Owner:** All three founders
**Effort:** 2-3 days
**Deliverables:**
- Founders' Term Sheet signed -- equity confirmation, contribution schedules, governance structure
- Interim Contributor Letters signed for all three founders (6-month sunset: December 2026)
- Cash burn model agreed -- using the Economics Skeptic's honest numbers (realistic Year 1 platform revenue under $11,000; monthly burn $2,280-$6,103 out-of-pocket)
- Kill criteria from council synthesis Section 5 explicitly discussed and agreed in writing
- Efiko IP audit completed -- confirm no IP encumbrance from existing Efiko consulting practice
- Bridge capital routing plan agreed (CCI at time of inflow via authorized dealer bank)
- SABIficate reframed as Gbitse's consulting practice enhanced by technology layer (not standalone platform startup)
- Contribution schedule: Sanju (full-time build), Gbitse (content + sales + Nigerian ops), Mark (legal + partnerships, 10-15 hrs/week)

**Gate Criterion:** Founders' Term Sheet signed. Interim Contributor Letters signed. Cash burn model agreed. Kill criteria agreed.

### 7.2 Nigerian Business Context Library

**Owner:** Gbitse
**Effort:** 15-20 hours
**Deliverables:**
- 50+ vetted Nigerian business scenarios covering:
  - Banking and financial services (CBN circulars, NDIC requirements)
  - Accounting and taxation (ICAN standards, CITN frameworks, FIRS guidelines)
  - Human resources (CIPM competency frameworks, Labour Act compliance)
  - Corporate governance (SEC Nigeria guidelines, Companies and Allied Matters Act)
- Negative examples list: culturally inappropriate assumptions, incorrect regulatory references, outdated information to avoid
- Terminology glossary: Nigerian business terms, acronyms, regulatory body abbreviations
- Regulatory reference tables: CBN circular index, ICAN standards list, CIPM frameworks, ITF Form 7A fields
- Format: structured markdown/JSON files in `corpus/nigerian-context/` directory, usable as RAG corpus for content generation prompts

**Gate Criterion:** Library exists and is usable as RAG corpus for content generation prompts.

### 7.3 AI Content Pipeline v0 + Day 25 Velocity Test

**Owner:** Sanju (pipeline engineering) + Gbitse (SME review)
**Effort:** 40-50 hours (Sanju) + included in Gbitse's review time
**Deliverables:**
- Prompt engineering for all 5 pipeline agents (lesson_generator, quiz_generator, adaptive_variant_generator, artifact_prompt_generator, validation_agent)
- JSON content schema definition (shared with Module B contract)
- Multi-agent generation pipeline functional end-to-end
- Day 25 Velocity Test results:
  - Minimum 5 courses across 2 verticals (generic business + Nigeria-specific regulatory)
  - Each course: 3 adaptive variants, 3-5 quiz items per lesson, artifact prompt per lesson
  - Generic business skills: 60%+ acceptance rate by Gbitse
  - Nigeria-specific content: 40%+ acceptance rate by Gbitse
  - Time from SME brief to validated draft: under 2 hours per course

**Gate Criterion:** Pipeline produces structured JSON output from SME briefs. Day 25 velocity test acceptance rates met.

### 7.4 WhatsApp Learning Loop Prototype

**Owner:** Sanju
**Effort:** 15-20 hours
**Deliverables:**
- WhatsApp Business API setup (Meta Business verification, phone number registration)
- Complete micro-lesson delivery prototype:
  - Problem statement (under 50 words)
  - 300-word micro-lesson
  - 2 quiz questions via interactive reply buttons
  - Artifact prompt
- Delivered to 10 test users from Gbitse's professional network
- Qualitative feedback collected (structured interviews or feedback form)
- Completion rate measured (how many of the 10 users completed the full lesson + quiz)

**Gate Criterion:** Prototype functional. Qualitative feedback collected from 10 Nigerian professionals. Completion rate measured.

### 7.5 Corporate Pilot Letter of Intent

**Owner:** Gbitse
**Effort:** 10-15 hours
**Deliverables:**
- Outreach to existing Efiko clients (targets: Fidelity Bank, FCMB, or other from 8-client base)
- Pitch: 5-10 learner pilot at zero or nominal cost, SABIficate handles all setup
- Named L&D contact at the pilot company
- LOI or confirmed verbal commitment specifying:
  - Number of pilot learners (5-10)
  - Department(s) participating
  - Course topics relevant to the organization
  - Timeline (aligned with Phase 1 delivery at Day 75)

**Gate Criterion:** Signed LOI or confirmed verbal commitment with named L&D contact.

### 7.6 Compliance Kickoffs

**Owner:** Mark (legal coordination) + Gbitse (Nigerian regulatory)
**Effort:** ~35 hours combined across multiple workstreams

| Deliverable | Owner | Effort | Gate Criterion |
|-------------|-------|--------|----------------|
| CIPM CPD accreditation inquiry letter | Mark + Gbitse | 5 hrs | Letter sent to CIPM. Response timeline established. |
| CAC registration initiated for Nigerian subsidiary | Gbitse | 5-10 hrs | Application submitted. Timeline for completion established. |
| Nigerian data protection counsel engaged; DPIA scope defined; DPO candidate identified | Mark + Gbitse | 10 hrs | Counsel retained. DPIA work plan with milestone dates. |
| Authorized dealer bank engaged for CCI; bridge capital routing plan agreed | Mark | 10 hrs | Bank engaged. CCI process understood. Bridge capital routing documented. |
| Trademark search filed (Nigerian Trademarks Registry Classes 9/41/42; USPTO) | Mark | 5 hrs | Search initiated. Timeline for results known. |

### Phase 0 Gate (Day 25)

**Proceed to PRAXIS Sprint ONLY IF all of the following are true:**

- [ ] Day 25 velocity test passes (generic business: 60%+ acceptance, Nigeria-specific: 40%+ acceptance)
- [ ] At least 1 corporate pilot commitment secured (LOI or verbal)
- [ ] CAC registration submitted
- [ ] DPIA process initiated (counsel retained, work plan exists)
- [ ] Founders' Term Sheet signed and Interim Contributor Letters executed
- [ ] WhatsApp prototype tested with real users and feedback analyzed
- [ ] Kill criteria agreed in writing by all three founders

**If gate fails:** Pivot to consulting-augmented model (sell AI-generated content packages to existing clients via WhatsApp/email/Google Workspace, no platform build) OR invoke kill criteria.

---

## Appendix A: Module-to-Feature Mapping

| Phase 1 Feature | Module(s) | Notes |
|-----------------|-----------|-------|
| 1.1 Mobile-first lesson player | A (shell) + B (renderer) | Split across two modules |
| 1.2 User authentication | C | Standalone |
| 1.3 Course catalog | D | Standalone |
| 1.4 Learner progress tracking | B (client writes) + D (API) + H (sync) | Three-module collaboration |
| 1.5 Foreground-first offline sync | A (service worker) + H (sync engine) | Split across two modules |
| 1.6 Basic corporate admin | D | Standalone |
| 1.7 ITF Form 7A export | D | Part of admin API |
| 1.8 Paystack payment integration | F | Standalone |
| 1.9 WhatsApp micro-lesson delivery | G | Standalone |
| 1.10 15-20 courses via AI pipeline | E | Standalone (runs continuously) |
| 1.11 Data saver mode | A (toggle/hook) + B (rendering tiers) | Split across two modules |
| 1.12 Basic credential issuance | H | Standalone |

## Appendix B: Directory Ownership Map

```
/
+-- contracts/            # Coordinator-owned (frozen during sprint phases)
|   +-- types/            # Shared TypeScript type definitions
|   +-- api/              # API request/response interfaces
|   +-- schemas/          # JSON schemas for content blocks, DB tables
|   +-- components/       # Shared component prop interfaces
|   +-- shared/           # Constants, enums, configuration
|
+-- src/                  # Frontend source
|   +-- app/              # Module A: app entry, router, providers
|   +-- components/
|   |   +-- layout/       # Module A: shell, nav, top bar, indicators
|   |   +-- auth/         # Module C: login, register, consent forms
|   |   +-- course/       # Module B: lesson player, navigation
|   |   +-- content/      # Module B: block renderers (text, quiz, etc.)
|   |   +-- catalog/      # Module D: browse, search, filter, course cards
|   |   +-- admin/        # Module D: admin dashboard, CSV upload, reports
|   |   +-- payments/     # Module F: pricing, checkout, history, invoices
|   |   +-- credentials/  # Module H: credential view, QR, portfolio
|   |   +-- sync/         # Module H: sync status, offline indicators, storage
|   |   +-- whatsapp/     # Module G: subscription settings (minimal frontend)
|   +-- lib/
|   |   +-- pwa/          # Module A: service worker reg, cache health
|   |   +-- network/      # Module A: connection detection, timeouts
|   |   +-- auth/         # Module C: JWT storage, auth context, hooks
|   |   +-- content/      # Module B: content block types, difficulty logic
|   |   +-- progress/     # Module B: Dexie.js progress hooks
|   |   +-- payments/     # Module F: Paystack SDK integration
|   |   +-- sync/         # Module H: Dexie.js schema, sync engine
|   |   +-- offline/      # Module H: storage management, download manager
|
+-- server/               # Backend source
|   +-- api/              # Module D: Fastify app setup, plugins
|   +-- routes/           # Module D: route handlers
|   +-- services/         # Module D: business logic
|   +-- auth/             # Module C: auth middleware, JWT, bcrypt
|   +-- db/               # Module C: connection, query helpers
|   +-- payments/         # Module F: Paystack client, dunning engine
|   +-- webhooks/         # Module F: Paystack webhooks
|   +-- credentials/      # Module H: OB 3.0 issuance, Ed25519 signing
|   +-- whatsapp/         # Module G: WA API client, conversation state
|
+-- migrations/           # Module C: database migrations (001-099)
|                         # Module D: seed data migrations (100-199)
|
+-- pipeline/             # Module E: AI content pipeline (standalone)
|   +-- agents/           # Pipeline agent implementations
|   +-- schemas/          # Content JSON schema definitions
|   +-- cli/              # CLI tool
|   +-- prompts/          # Prompt templates
|   +-- corpus/           # Nigerian Business Context Library reference
|
+-- public/               # Module A: static assets, manifest, icons
+-- tests/
|   +-- unit/             # Per-module unit tests (mirror src/ structure)
|   +-- integration/      # Cross-module integration tests
|   +-- e2e/              # Playwright E2E tests
|
+-- .github/workflows/    # CI configuration
```

## Appendix C: Risk Mitigations Built Into the Sprint

| Risk (from council) | How the sprint addresses it |
|---------------------|---------------------------|
| Team burnout (Risk 1) | PRAXIS eliminates most manual coding. Sanju coordinates agents, not writes code line-by-line. |
| Transsion device breakage (Risk 4) | Foreground-first sync in Module H. Physical device testing protocol in Week 7. Cache health check in Module A. |
| GLO connectivity (Risk 7) | Grey-cloud subdomain setup as infrastructure task parallel to sprint. Cloudflare Workers GLO detection. |
| AI content quality (Risk 8) | Module E includes validation agent. Nigerian Business Context Library created in Phase 0. Day 25 velocity test gates the sprint. |
| NDPA compliance (Risk 6) | PII table flagging in Module C schema. Three-tier consent in Module C. DPIA runs in parallel from Day 1. |
| SeamlessHR competition (Risk 5) | Sprint prioritizes ITF export (Module D) and credential issuance (Module H) as differentiation features a generic LMS lacks. |

---

*This build plan decomposes the SABIficate Phase 1 MVP into 8 parallel modules buildable by a PRAXIS agent swarm within the Day 25-75 window. It should be reviewed at the founding working session and updated after Phase 0 Gate results are known.*
