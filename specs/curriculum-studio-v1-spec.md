# SABIficate Curriculum Studio v1 — Functional & Technical Specification

**Version:** 1.0
**Date:** 2026-07-20
**Authors:** Sanju (engineering), synthesized from Gbitse's catalogue + Mark's platform spec + tiering v3.1
**Status:** DRAFT — For partner review
**Repo:** `/workspace/app/` (same codebase, `/studio` route)

---

## 1. Problem Statement

SABIficate needs to produce 238 courses across 21 domains, each with three proficiency-level depth cards, localized for African corporate contexts. Traditional curriculum development takes 6-12 months per course with a team of instructional designers. At that pace, the full catalogue would take decades.

Curriculum Studio v1 is the content production tool that lets SMEs (subject matter experts) direct curriculum development while AI does the heavy lifting. An SME defines the skill, approves the competency decomposition, reviews the generated content, and verifies factual claims. The AI handles decomposition, content generation across three proficiency levels, trust claim extraction, and assembly. Target: 10x content development speed vs. traditional approaches.

**Studio users are NOT learners.** The Studio is an internal tool for curriculum authors and SME reviewers. Learners never see it.

## 2. Scope — What's In v1

### 2.1 Users

- **Curriculum Author** — creates and manages authoring tracks (Sanju, future hires)
- **SME Reviewer** — reviews generated content, verifies trust claims (Gbitse, domain experts)
- **Platform Admin** — manages users, views pipeline status (Sanju)

### 2.2 Feature Scope

| Feature | v1 | Deferred |
|---------|:--:|:--------:|
| 7-stage authoring pipeline | Yes | |
| AI decomposition (skill → competencies) | Yes | |
| AI course generation (3 depth levels) | Yes | |
| Trust claim extraction + verification UI | Yes | |
| Concept catalog with concept_id reuse | Yes | |
| SME review workflow (approve/revise) | Yes | |
| Assembly review gate (4 categories) | Yes | |
| Publish to Learner App | Yes | |
| Track lifecycle management | Yes | |
| pgvector source grounding | | v1.1 |
| Translation pipeline (multi-locale) | | v1.1 |
| Batch decomposition (multiple tracks) | | v1.1 |
| Automated source-freshness monitoring | | v2 |
| SCORM/Blackboard export (for NCCE) | | v2 |
| Asset lifecycle (audio, video, images) | | v2 |

### 2.3 Content Target

- v1 launch: 30 courses (Cluster 1 full + samples from clusters 2-7)
- 90-day backfill: remaining 208 courses from Gbitse's catalogue
- Each course: 3-6 spine nodes → 3-6 lessons × 3 depth levels = 9-18 depth-variant lesson versions

## 3. Functional Requirements

### FR-1: Track Setup (Stage 1)

**Description:** Create a new authoring track with metadata.

**Acceptance Criteria:**
- AC-1.1: Set track name, vertical (from Gbitse's 7 clusters), customer_tier, tier_treatment (A/B/C)
- AC-1.2: Set credential type (completion_badge for v1)
- AC-1.3: Set paywall_lesson_index (which lesson triggers the paywall)
- AC-1.4: Track created in `draft` status with stage = 1
- AC-1.5: Vertical options include all 21 domains from the catalogue

**Existing code:** `SetupStage.tsx`, `createTrackSchema` in `server/routes/studio.ts`. Implemented.

### FR-2: Skill Intake (Stage 2)

**Description:** Define the skill statement, target learner, and context.

**Acceptance Criteria:**
- AC-2.1: Author writes a skill statement (what the learner will be able to do)
- AC-2.2: Author specifies target learner role (e.g., "mid-career banking professional")
- AC-2.3: Author selects context mode (Nigerian / generic)
- AC-2.4: Intake data saved to track record, stage advances to 3
- AC-2.5: Skill statement used as primary input for AI decomposition

**Existing code:** `IntakeStage.tsx`, `intakeSchema` in studio routes. Implemented.

### FR-3: AI Decomposition (Stage 3)

**Description:** AI breaks the skill into 3-6 competencies (spine nodes), checks concept catalog for reuse.

**Acceptance Criteria:**
- AC-3.1: AI produces 3-6 spine nodes, each with: concept_id, title, objective, bloom_level, artifact_intent
- AC-3.2: Each node checked against concept catalog — matching concept_id shows existing course with "link" option
- AC-3.3: Author can accept linked nodes (zero new authoring) or fork for Option C treatment
- AC-3.4: Author can reorder, add, or remove nodes
- AC-3.5: Author approves final decomposition → stage advances to 4
- AC-3.6: Bloom levels form a coherent progression (remember → create) across the spine
- AC-3.7: New concept_ids registered in the concept catalog for future reuse

**Existing code:** `DecomposeStage.tsx`, `ConceptCatalog.tsx`, `curriculumAI.decomposeSkill()` (616-line AI service with Claude integration + mock fallback). Decomposition endpoint exists at `POST /studio/tracks/:id/decompose`.

### FR-4: Pre-filled Brief (Stage 4)

**Description:** AI generates a brief for each spine node with objectives and guardrails.

**Acceptance Criteria:**
- AC-4.1: For each unlinked node, AI generates: learning objectives, "things to avoid," example scenarios, assessment hints
- AC-4.2: Brief pre-fills the five depth dimensions (prior_knowledge, abstraction, pacing, scaffolding, depth_of_why) for each proficiency level
- AC-4.3: Author can edit any brief field before generation
- AC-4.4: Brief stage shows all nodes in a scrollable list with expand/collapse
- AC-4.5: Author approves briefs → stage advances to 5

**Existing code:** `BriefStage.tsx`, `curriculumAI.generateBrief()`. Implemented with Claude + mock paths.

### FR-5: AI Course Generation (Stage 5)

**Description:** AI generates full course content at three proficiency levels for each spine node.

**Acceptance Criteria:**
- AC-5.1: For each unlinked node, AI generates depth cards at foundational/working/applied levels
- AC-5.2: Each depth card contains 4-6 content blocks (text, quiz, scenario, artifact prompt)
- AC-5.3: Content follows the four-axis engine: stages of the moment, scenarios, failure modes, role lens
- AC-5.4: African corporate localization applied (hierarchy, seniority, relationship-first business)
- AC-5.5: Generation runs as async job (tracked in `generation_jobs` table)
- AC-5.6: Progress indicator shows generation status per node
- AC-5.7: On completion, trust claims auto-extracted from generated content
- AC-5.8: Stage advances to 6 when all nodes generated

**Existing code:** `GenerateStage.tsx`, `curriculumAI.generateCourse()` + `extractTrustClaims()`. Full implementation with Claude structured output. `generation_jobs` table exists.

### FR-6: SME Review & Trust Claim Verification (Stage 6)

**Description:** SME reviews generated content and verifies factual claims.

**Acceptance Criteria:**
- AC-6.1: SME sees generated content organized by spine node → depth level → block
- AC-6.2: Trust claims panel shows all extracted claims with type (numeric/regulatory/statistical/citation)
- AC-6.3: SME can mark each claim as: verified, contradicted, or unsourced
- AC-6.4: Contradicted/unsourced claims block publication (cannot be bypassed by editorial approval)
- AC-6.5: SME can request revision on any content block with comments
- AC-6.6: Revision sends block back to generation with SME feedback included in prompt
- AC-6.7: SME approves content per node → when all nodes approved, stage advances to 7
- AC-6.8: Review decision logged in `assembly_reviews` table with reviewer_id and timestamp

**Existing code:** `ReviewStage.tsx`, `TrustClaimsPanel.tsx`, `trust_claims` table, `assembly_reviews` table, `review_actions` table. UI and DB exist; need wiring for the claim verification workflow.

### FR-7: Publish (Stage 7)

**Description:** Publish verified content to the Learner App.

**Acceptance Criteria:**
- AC-7.1: Pre-publish checklist: all nodes approved, all trust claims verified or resolved, all depth cards present
- AC-7.2: Publish creates course + modules + lessons + lesson_content records in the learner-facing tables
- AC-7.3: Each lesson_content record stores content at the correct difficulty_tier (foundational/working/applied)
- AC-7.4: Track status changes to `published`, published_at timestamp set
- AC-7.5: Course immediately available in the Learner App catalog
- AC-7.6: Published content is immutable — edits require a new version (track revision)
- AC-7.7: Concept catalog `reuse_count` incremented for all linked concepts

**Existing code:** `PublishStage.tsx`, publish endpoint exists. Needs the actual data transform from authoring_tracks to courses/modules/lessons.

### FR-8: Track Dashboard

**Description:** List and manage all authoring tracks with status.

**Acceptance Criteria:**
- AC-8.1: List view of all tracks with: name, vertical, status, current stage, created_at, author
- AC-8.2: Filter by status, vertical
- AC-8.3: Click track → opens at current stage
- AC-8.4: Stage tracker component shows 7 stages with completed/current/pending state
- AC-8.5: Only curriculum_author and platform_admin roles can access Studio

**Existing code:** `CurriculumStudio.tsx` (462 lines), `StageTracker.tsx`, track list endpoints. Fully implemented.

### FR-9: Concept Catalog Management

**Description:** Browse and manage the shared concept catalog for cross-track reuse.

**Acceptance Criteria:**
- AC-9.1: List all concepts with concept_id, label, bloom_level, domain, vertical, reuse_count
- AC-9.2: Search concepts by label or domain
- AC-9.3: View which tracks use each concept (linked vs forked)
- AC-9.4: Concepts auto-created during decomposition, never manually
- AC-9.5: Catalog grows organically as tracks are authored

**Existing code:** `ConceptCatalog.tsx`, `concept_catalog` table. UI component exists.

## 4. Architecture

### 4.1 System Position

```
[Curriculum Author / SME] → [Studio UI (/studio route)] → [Fastify API /studio/*]
                                                         → [Claude API (AI pipeline)]
                                                         → [PostgreSQL (authoring_tracks, concept_catalog, trust_claims)]
                                                         ↓ publish
                                                   [Learner-facing tables (courses, modules, lessons)]
```

Studio and Learner App share the same codebase, database, and API server. The Studio is a separate route (`/studio`) accessible only to `curriculum_author` and `platform_admin` roles.

### 4.2 Three Schema Contract

The platform spec defines three JSON schemas that formalize the data boundaries:

| Schema | Purpose | v1 Status |
|--------|---------|-----------|
| `course.schema.v1.json` | Single 10-15 min unit with brief, content, artifact, credential rule | Needs creation — currently TypeScript interfaces only |
| `curriculum.schema.v1.json` | Credential track (skill → competencies → courses) | Needs creation — currently implicit in authoring_tracks |
| `delivery.schema.v1.json` | Published learner-facing artifact (ONLY schema LMS reads) | Needs creation — currently no formal boundary |

**v1 approach:** TypeScript contracts in `app/contracts/` serve as the schema contract. Formal JSON Schema files created post-launch for cross-system interop (especially NCCE Blackboard export in v2).

### 4.3 AI Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ Decompose   │ →  │ Brief        │ →  │ Generate     │ →  │ Extract      │
│ Skill→Spine │    │ Objectives   │    │ 3 depth      │    │ Trust Claims │
│             │    │ + guardrails │    │ cards/node   │    │              │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
     Claude              Claude              Claude              Claude
```

- All AI calls go through `curriculumAI.ts` (616 lines)
- Real Claude API when `ANTHROPIC_API_KEY` is set, mock fallback otherwise
- Async generation tracked in `generation_jobs` table
- Each stage produces structured output (SpineNode[], ContentBlock[], TrustClaim[])

### 4.4 Database Tables (Studio-Specific)

From migrations `001` and `002`:

| Table | Purpose |
|-------|---------|
| `authoring_tracks` | Track metadata, status, current_stage, JSONB stage data |
| `concept_catalog` | Shared concept registry with concept_id, bloom_level, reuse_count |
| `trust_claims` | Per-track factual claims with verification status |
| `assembly_reviews` | Review decisions per track |
| `generation_jobs` | Async AI job tracking (status, model, tokens_used) |
| `language_readiness` | Per-locale translation status (deferred to v1.1) |
| `review_actions` | Individual review decisions with comments |

### 4.5 API Endpoints (Existing)

All routes in `server/routes/studio.ts` (1433 lines):

| Endpoint | Purpose |
|----------|---------|
| GET /studio/tracks | List tracks with filters |
| POST /studio/tracks | Create new track |
| GET /studio/tracks/:id | Get track with full stage data |
| PUT /studio/tracks/:id/setup | Update track setup |
| POST /studio/tracks/:id/intake | Submit skill intake |
| POST /studio/tracks/:id/decompose | AI decomposition |
| PUT /studio/tracks/:id/decomposition | Update spine nodes |
| POST /studio/tracks/:id/brief | Generate briefs |
| PUT /studio/tracks/:id/brief | Update briefs |
| POST /studio/tracks/:id/generate | Start course generation |
| GET /studio/tracks/:id/generation-status | Poll generation progress |
| POST /studio/tracks/:id/review | Submit review decision |
| POST /studio/tracks/:id/publish | Publish to learner tables |
| GET /studio/concept-catalog | Browse concept catalog |
| GET /studio/tracks/:id/trust-claims | Get trust claims |
| PUT /studio/trust-claims/:id | Update claim verification |

## 5. What Exists vs. What Needs Building

### 5.1 Exists and Functional
- Track CRUD (create, list, get, update setup)
- Stage tracker UI (7-stage visual progression)
- Setup stage UI + API
- Intake stage UI + API
- Decomposition stage UI + API + AI (Claude + mock)
- Brief stage UI + API + AI
- Generation stage UI + API + AI (async jobs)
- Review stage UI (content display, trust claims panel)
- Concept catalog UI + API
- All database tables (migrations 001 + 002)
- Full Zod validation on all endpoints
- Role-based access (curriculum_author, sme_reviewer)

### 5.2 Needs Fixing / Wiring
- **Trust claim verification workflow** — table + UI exist, need claim status update endpoint wiring
- **Assembly review gate** — 4-category checklist exists in schema, needs UI integration
- **Publish transform** — endpoint exists, needs the data transform from authoring format → learner tables (courses/modules/lessons/lesson_content)
- **Generation job polling** — endpoint exists, UI needs real-time status updates
- **Concept catalog search** — component exists, needs search-on-decompose integration

### 5.3 Needs Building
- **ANTHROPIC_API_KEY integration** — needs production Claude API key for real generation
- **Structured output prompts** — the prompts in `curriculumAI.ts` need tuning for Gbitse's catalogue style (four-axis engine, African corporate localization, capstone artifacts)
- **Batch course creation workflow** — UI to queue multiple courses from the 238 catalogue
- **Pre-populated track templates** — load Gbitse's 238 course definitions as intake templates so authors don't start from scratch
- **Revision loop** — SME requests revision → re-generation with feedback → re-review
- **Production deployment** — Studio route needs auth gate (currently any logged-in user can access)

## 6. Seven-Stage Pipeline Detail

```
Stage 1: Setup          → Track metadata (name, vertical, tier, credential)
                           Gate: all required fields set
                           
Stage 2: Intake         → Skill statement, target role, context mode
                           Gate: skill statement ≥1 sentence, role specified
                           
Stage 3: Decomposition  → AI produces 3-6 spine nodes
                           Gate: author approves node sequence + concept reuse decisions
                           
Stage 4: Brief          → AI pre-fills objectives + depth dimensions per node
                           Gate: author approves all briefs
                           
Stage 5: Generation     → AI generates content at 3 proficiency levels per node
                           Gate: generation complete for all nodes
                           
Stage 6: Review         → SME reviews content + verifies trust claims
                           Gate: all nodes approved, all trust claims resolved
                           HARD GATE: unresolved regulatory/numeric claims block publish
                           
Stage 7: Publish        → Content pushed to learner-facing tables
                           Gate: pre-publish checklist passes
```

## 7. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI generation quality | Major — unusable courses | Tuned prompts with Gbitse's four-axis engine; SME review gate catches issues |
| Trust claim verification overhead | Major — bottleneck at stage 6 | Prioritize regulatory claims; numeric/citation claims batch-verifiable |
| 238 courses is enormous scope | Major — years of backlog | Staged rollout: 30 courses at launch, batch workflow for remainder |
| Claude API cost at scale | Moderate — margins at risk | Track tokens per generation_job; use Haiku for decomposition, Opus for generation |
| Single SME reviewer (Gbitse) | Major — bottleneck | Build review workflow for multiple reviewers; per-domain expert assignment |
| Prompt engineering fragility | Moderate — inconsistent output | Structured output schemas enforce shape; revision loop catches content issues |

## 8. Success Metrics (v1 Launch)

- First course generated end-to-end (all 7 stages) within 48 hours
- 30 courses published within 2 weeks of Studio launch
- <$5 Claude API cost per course (all stages)
- >80% of trust claims verified without revision needed
- SME review turnaround <24 hours per course
- Zero unresolved regulatory claims in published courses

## 9. Dependencies

- **Claude API key** — production Anthropic API access
- **Gbitse's catalogue** — 238 course definitions as intake templates
- **SME availability** — Gbitse + domain experts for review (stage 6)
- **Learner App v1** — the delivery target for published content
