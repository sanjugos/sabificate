# SABIficate Curriculum Studio v1 -- Plan

| Field | Value |
|---|---|
| **Feature** | Curriculum Studio v1 -- 7-Stage AI-Assisted Authoring Pipeline |
| **Spec version** | 1.0.0 |
| **Status** | GATE-3 APPROVED |

---

## S1 Architecture Overview

### Components and Services

The Studio v1 build closes seven gaps in an existing, functioning pipeline. No new services are introduced. All work modifies existing files or adds siblings alongside them.

**Backend (Fastify server):**
- `server/routes/studio.ts` (1433 lines) -- existing route plugin with full CRUD for tracks, spine, brief, generation, review, trust claims, publish, unpublish, preview, jobs, prompt templates. Gaps: publish lacks trust-claim gate and atomic transaction; trust claims use a boolean `verified` column instead of a status enum; review actions have a broken `lesson_id` NOT NULL workaround; no revision-loop re-generation endpoint; no template-based track creation; no assembly-gate automated checks.
- `server/services/curriculumAI.ts` (616 lines) -- Claude SDK + mock fallback. Has `decomposeSkill`, `generateCourse`, `sourceClaims`. Gaps: no four-axis prompt structure (stages of the moment, scenarios, failure modes, role lens); no revision-aware re-generation function; no assembly-check functions.
- `server/services/assemblyChecks.ts` -- NEW FILE. Deterministic algorithms for the four assembly-gate checks (terminology drift, difficulty inversion, artifact redundancy, coverage gap).
- `server/db/schema.ts` -- table name constants. Needs `TRACK_TEMPLATES` added.

**Frontend (React 19 + Vite + Tailwind):**
- `src/app/pages/CurriculumStudio.tsx` (462 lines) -- page component with list/editor views, all stage handlers. Gaps: no template picker in "New Track" flow; no revision-loop handler; review stage lacks SME per-section approve/revise UI.
- `src/components/studio/` -- 10 existing components. Gaps: `PublishStage.tsx` has no trust-claim gate display; `ReviewStage.tsx` is a manual checklist, not an automated-flag + SME per-section review; `TrustClaimsPanel.tsx` uses boolean verified, not status enum; `SetupStage.tsx` has no template picker.
- `src/app/App.tsx` -- routing. Studio route is gated by `RequireRole` for `corporate_admin`, `platform_admin`, `curriculum_author`. Gap: `sme_reviewer` is missing from the allowed roles list.

**Database (PostgreSQL):**
- 46+ tables across migrations 001 + 002. Relevant: `authoring_tracks` (JSONB spine, gateway_personas), `trust_claims` (boolean verified), `assembly_reviews`, `review_actions`, `generation_jobs`, `concept_catalog`, `courses`, `modules`, `lessons`. Gaps: `trust_claims.verified` is boolean (needs status enum); `review_actions` has NOT NULL `lesson_id` constraint incompatible with authoring-phase reviews; no `track_templates` table; no `assembly_flags` table; no `section_review_status` tracking.

### Data Model -- Key Schema Changes (Migration 003)

```
-- track_templates: pre-populated 238-course catalogue
CREATE TABLE track_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    vertical VARCHAR(100) NOT NULL,
    skill_description TEXT,
    learning_objectives JSONB DEFAULT '[]',
    context_mode VARCHAR(20) DEFAULT 'nigerian',
    source VARCHAR(50) DEFAULT 'ncce_catalogue',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trust_claims: replace boolean verified with status enum
ALTER TABLE trust_claims
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unverified'
    CHECK (status IN ('unverified', 'verified', 'disputed', 'needs_source')),
  ADD COLUMN IF NOT EXISTS reviewer_comment TEXT;
-- Backfill: UPDATE trust_claims SET status = CASE WHEN verified THEN 'verified' ELSE 'unverified' END;

-- assembly_flags: automated check results
CREATE TABLE assembly_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL,
    review_id UUID NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('terminology_drift','difficulty_inversion','artifact_redundancy','coverage_gap')),
    description TEXT NOT NULL,
    node_indices INTEGER[] NOT NULL,
    block_ids TEXT[],
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_type VARCHAR(20) CHECK (resolution_type IN ('edited', 'dismissed')),
    justification TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- section_reviews: per-section (node + depth) review status
CREATE TABLE section_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL,
    review_id UUID NOT NULL,
    spine_node_index INTEGER NOT NULL,
    depth_tier VARCHAR(20) NOT NULL CHECK (depth_tier IN ('foundational', 'working', 'applied')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending_review'
      CHECK (status IN ('pending_review', 'approved', 'revision_requested')),
    reviewer_id UUID,
    reviewer_comment TEXT,
    revision_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(review_id, spine_node_index, depth_tier)
);

-- review_actions: make lesson_id nullable for authoring-phase reviews
ALTER TABLE review_actions ALTER COLUMN lesson_id DROP NOT NULL;
```

### Runtime Boundaries

- All AI calls are server-side only (Claude API via `@anthropic-ai/sdk`). No API keys reach the client.
- Assembly-check algorithms run server-side in `assemblyChecks.ts`. Decision: deterministic (string matching, Jaccard similarity) not Claude-based, to avoid cost/latency for OQ-2. Claude can be added later as an enhancement.
- Publish transform runs inside a single PostgreSQL transaction (BEGIN/COMMIT/ROLLBACK).
- Trust claim gate is server-side: the publish endpoint queries `trust_claims` before proceeding.

---

## S2 Tech Stack and Dependencies

### Existing Stack (no changes)

| Layer | Technology |
|---|---|
| Language | TypeScript 5.x |
| Frontend | React 19, Vite 8, Tailwind CSS |
| Backend | Fastify 5.x |
| Database | PostgreSQL (via `pg` driver, raw SQL) |
| AI | `@anthropic-ai/sdk` (model: `claude-sonnet-4-20250514`) |
| Auth | JWT + bcrypt, `fastify.authenticate` hook |
| Test | vitest + @testing-library/react + @testing-library/jest-dom |

### New Dependencies

None. All assembly-check algorithms use built-in string operations. No new npm packages are required.

### Build Tooling

- Vite 8 for frontend bundling (unchanged)
- `tsx` for server-side TypeScript execution (unchanged)
- Migration runner: manual `psql -f migrations/003_studio_v1_gaps.sql` (same pattern as 001/002)

---

## S3 Approach

### High-Level Sequence (7 Tasks, Dependency Order)

Tasks are ordered by dependency. Each task is a fresh subagent, TDD per Constitution SII.

```
T-001 Schema Migration + Auth Gate
  |
  +-- T-002 Track Templates (depends on track_templates table)
  |
  +-- T-003 Trust Claim Workflow (depends on status column)
  |
  +-- T-004 Prompt Tuning + Four-Axis (independent of schema)
  |
  +-- T-005 Revision Loop (depends on section_reviews table + T-003 + T-004)
  |
  +-- T-006 Assembly Review Gate (depends on assembly_flags table)
  |
  +-- T-007 Publish Transform (depends on T-003 + T-006 -- gate checks)
```

Parallelizable: T-002, T-003, T-004 can run simultaneously after T-001.
Sequential: T-005 after T-003+T-004. T-006 after T-001. T-007 after T-003+T-006.

---

### T-001: Schema Migration + Auth Gate

**FR:** FR-1 (Auth Gate)
**AC:** AC-1.1, AC-1.2, AC-1.3, AC-1.4

**Files modified:**
- `migrations/003_studio_v1_gaps.sql` -- NEW. Creates `track_templates`, `assembly_flags`, `section_reviews` tables. Adds `status`/`reviewer_comment` columns to `trust_claims`. Alters `review_actions.lesson_id` to nullable. Adds `TRACK_TEMPLATES`, `ASSEMBLY_FLAGS`, `SECTION_REVIEWS` to schema constants.
- `server/db/schema.ts` -- Add `TRACK_TEMPLATES`, `ASSEMBLY_FLAGS`, `SECTION_REVIEWS` to TABLES constant.
- `server/routes/studio.ts` -- Modify the `hasStudioRole()` function: already includes `sme_reviewer`. Verify `GET /api/v1/studio/tracks` returns 403 for learners (already does via `canAuthor` check). Add a specific error body `{ error: 'insufficient_role' }` to match AC-1.1.
- `src/app/App.tsx` -- Add `sme_reviewer` to the RequireRole array on the `/studio` route (currently missing).

**Implementation detail:**
The backend auth gate already exists (line 186: `fastify.addHook('preHandler', fastify.authenticate)` plus `canAuthor`/`canReview` checks per endpoint). The gap is:
1. The 403 response body says `{ message: 'Insufficient permissions' }` but AC-1.1 expects `{ error: 'insufficient_role' }`. Fix the `forbidden()` helper to return `{ error: 'insufficient_role' }`.
2. The frontend `RequireRole` on `/studio` in App.tsx (line 54) omits `sme_reviewer`. Add it.
3. SME reviewers need read access to the track list endpoint. Currently `GET /tracks` checks `canAuthor()` which excludes `sme_reviewer`. Add a new `hasStudioAccess()` check that includes `sme_reviewer` for read endpoints (GET tracks, GET track detail) while keeping write endpoints behind `canAuthor()`.

**Tests (vitest):**
- `src/__tests__/studio/auth-gate.test.ts` -- NEW
  - Test: learner role user gets 403 with `{ error: 'insufficient_role' }` on `GET /api/v1/studio/tracks`
  - Test: `curriculum_author` gets 200 on `GET /api/v1/studio/tracks`
  - Test: `sme_reviewer` gets 200 on `GET /api/v1/studio/tracks`
  - Test: unauthenticated request gets 401 on any `/api/v1/studio/*` endpoint
  - Test: RequireRole component renders Studio for `sme_reviewer` (React component test)
  - Test: RequireRole component redirects `learner` to dashboard

---

### T-002: Track Templates (Pre-populated Catalogue)

**FR:** FR-3 (Catalogue Templates)
**AC:** AC-3.1, AC-3.2, AC-3.3

**Files modified:**
- `migrations/003_studio_v1_gaps.sql` -- `track_templates` table (from T-001).
- `migrations/seed_track_templates.sql` -- NEW. 238 INSERT statements for the catalogue entries. Each row: `title`, `domain`, `vertical`, `skill_description`, `learning_objectives` (JSONB array), `context_mode`. Data sourced from the 30 existing static course templates + 208 additional entries covering the 21 NCCE domains.
- `server/routes/studio.ts` -- Add two new endpoints:
  - `GET /api/v1/studio/templates` -- returns paginated, searchable list of templates. Query params: `q` (text search on title/domain), `domain` (filter), `page`, `limit`.
  - `POST /api/v1/studio/tracks/from-template/:templateId` -- creates a new track pre-filled from a template. Sets `name`, `vertical`, `skill_statement` from template. Returns the new track.
- `src/components/studio/TemplatePicker.tsx` -- NEW. Searchable modal/panel listing 238 templates. Search input filters by title (case-insensitive). Domain filter dropdown. Each row shows title + domain. Click selects template and calls `onSelect(template)`. "Start Blank" button calls `onBlank()`.
- `src/components/studio/SetupStage.tsx` -- Modify: when no track exists, show TemplatePicker before the form. When a template is selected, pre-fill form fields. When "Start Blank" is clicked, show empty form.
- `src/app/pages/CurriculumStudio.tsx` -- Add `handleCreateFromTemplate(templateId)` handler that calls `POST /studio/tracks/from-template/:templateId`.

**Implementation detail:**
The 238 templates JSON structure:
```json
{
  "title": "Nursing Ethics 101",
  "domain": "Healthcare",
  "vertical": "professional-development",
  "skill_description": "...",
  "learning_objectives": ["LO1...", "LO2...", "LO3..."],
  "context_mode": "nigerian"
}
```
The `vertical` field maps to the existing enum in `createTrackSchema`. Domains are a broader classification (Healthcare, Engineering, Agriculture, etc.) that maps to the 21 NCCE programme areas. The vertical enum in the Zod schema needs expansion to accommodate NCCE domains -- add `'healthcare'`, `'engineering'`, `'agriculture'`, `'education'`, `'environmental-science'`, `'mass-communication'`, `'business-administration'`, `'computer-science'`, `'social-work'`, `'public-administration'`, `'science-lab-tech'`, `'arts-design'`, `'languages'`, `'library-science'`, `'leisure-tourism'`, `'nutrition-dietetics'` to the enum. Or: change the Zod schema from a fixed enum to `z.string().min(1).max(100)` to accommodate any domain. The latter is more practical given 21+ domains -- implement this.

**Tests:**
- `src/__tests__/studio/track-templates.test.ts` -- NEW
  - Test: `GET /api/v1/studio/templates` returns 238 templates (requires seed data)
  - Test: `GET /api/v1/studio/templates?q=nursing` returns filtered results
  - Test: `GET /api/v1/studio/templates?domain=Healthcare` returns only Healthcare templates
  - Test: `POST /api/v1/studio/tracks/from-template/:id` creates track with pre-filled fields
  - Test: TemplatePicker component renders search input and template list
  - Test: selecting a template populates SetupStage form fields
  - Test: "Start Blank" leaves all fields empty

---

### T-003: Trust Claim Verification Workflow

**FR:** FR-6 (Trust Claim Verification)
**AC:** AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5

**Files modified:**
- `migrations/003_studio_v1_gaps.sql` -- `status` and `reviewer_comment` columns on `trust_claims` (from T-001).
- `server/routes/studio.ts` -- Modify the trust claim update endpoint (`PUT /api/v1/studio/tracks/:trackId/trust-claims/:claimId`):
  - Replace the `trustClaimUpdateSchema` to accept `status` (enum: `unverified`, `verified`, `disputed`, `needs_source`) and `comment` (string) instead of boolean `verified`.
  - On status transition: record `verified_by`, `verified_at` when status becomes `verified`. Store `reviewer_comment` when status becomes `disputed` or `needs_source`.
  - Add query filter support: `GET /trust-claims?status=unverified` replaces the boolean `verified` filter.
- `server/routes/studio.ts` -- Modify publish endpoint (`POST /api/v1/studio/tracks/:trackId/publish`):
  - Before any publish logic, query: `SELECT COUNT(*) FROM trust_claims WHERE track_id = $1 AND status IN ('unverified', 'disputed')`.
  - If count > 0, return HTTP 422 with `{ error: 'unverified_trust_claims', count: N }`.
  - This is a hard server-side gate -- no bypass regardless of client state.
- `src/components/studio/TrustClaimsPanel.tsx` -- Refactor:
  - Replace `verified: boolean` with `status: 'unverified' | 'verified' | 'disputed' | 'needs_source'` in the TrustClaim interface.
  - Replace the single toggle checkbox with action buttons: "Verify", "Dispute", "Needs Source".
  - "Dispute" opens a comment textarea (required) before submission.
  - Filter tabs: All, Unverified, Verified, Disputed, Needs Source.
  - Status badges: green for verified, red for disputed, amber for unverified, blue for needs_source.
  - Summary bar shows: "X of Y claims verified | Z disputed | W pending".
- `src/components/studio/PublishStage.tsx` -- Modify:
  - Fetch trust claim counts via `GET /studio/tracks/:trackId/trust-claims?status=unverified` and `?status=disputed`.
  - If unverified or disputed claims exist: disable Publish button, show tooltip "N unverified/disputed trust claims must be resolved before publishing".
  - Display a trust-claim summary card showing verification progress.

**Implementation detail:**
The existing `trust_claims` table has `verified BOOLEAN`. The migration adds a `status VARCHAR(20)` column and backfills from the boolean. The boolean column is kept for backward compatibility but all new code reads/writes `status`. A future migration can drop the boolean.

**Tests:**
- `src/__tests__/studio/trust-claims.test.ts` -- NEW
  - Test: PUT trust claim with `{ status: 'verified' }` updates status and sets `verified_by`/`verified_at`
  - Test: PUT trust claim with `{ status: 'disputed', comment: '...' }` stores comment
  - Test: PUT trust claim with `{ status: 'disputed' }` without comment returns 400
  - Test: publish endpoint returns 422 when 1 claim is `unverified`
  - Test: publish endpoint returns 422 when 1 claim is `disputed` (server-side gate, AC-6.4)
  - Test: publish succeeds when all claims are `verified` or `needs_source` with source attached
  - Test: TrustClaimsPanel renders status badges and action buttons
  - Test: PublishStage disables button when unverified claims exist

---

### T-004: Prompt Tuning -- Four-Axis Engine

**FR:** FR-5 (AI Content Generation), FR-4 (AI Decomposition -- prompt alignment)
**AC:** AC-5.3 (four-axis structure), AC-5.4 (concept reuse), AC-5.5 (novel concept creation)

**Files modified:**
- `server/services/curriculumAI.ts` -- Modify both `claudeGenerateDepthCards` and `mockGenerateCourse`:
  - **Claude prompt changes:** Restructure the system prompt to require output organized by Gbitse's four-axis engine:
    - `stages_of_the_moment`: where the learner is in their journey at this depth level
    - `scenarios`: contextual situations the learner will encounter
    - `failure_modes`: common mistakes and misconceptions
    - `role_lens`: how different professional roles interact with this concept
  - Each depth card's blocks array must include at least one block per axis (4 minimum per tier instead of 3).
  - The JSON structure returned by Claude changes from `{ blocks: ContentBlock[] }` to `{ stages_of_the_moment: ContentBlock[], scenarios: ContentBlock[], failure_modes: ContentBlock[], role_lens: ContentBlock[] }`. The wrapper normalizes this to the flat `blocks` array with each block tagged with its `axis` field.
  - **Mock data changes:** Update `mockGenerateCourse` to return blocks with the four-axis structure: each tier gets 4 blocks (one text_block per axis) instead of 3.
  - **ContentBlock interface:** Add `axis?: 'stages_of_the_moment' | 'scenarios' | 'failure_modes' | 'role_lens'` field.
  - **Concept catalog integration:** After generation, for each node's `concept_id`, check `concept_catalog` for existence. If found, reuse (set `catalog_overlap: 'linked'`). If not found, insert a new row into `concept_catalog` with the track as origin. This logic partially exists in the decompose endpoint but not in the generate endpoint -- add it.

**Implementation detail:**
The updated system prompt for `claudeGenerateDepthCards`:
```
For each depth card, structure content along Gbitse's four-axis engine:
1. STAGES OF THE MOMENT - Where is the learner right now? What triggers this learning need?
2. SCENARIOS - Real-world situations where this knowledge applies.
3. FAILURE MODES - Common mistakes, misconceptions, and what goes wrong without this knowledge.
4. ROLE LENS - How different roles (compliance officer, branch manager, auditor, regulator) see this topic.

Generate at least 1 ContentBlock per axis per depth tier. Tag each block with an "axis" field.
```

The mock data adds an `axis` field to each block. The `parseBlocks` function in `curriculumAI.ts` is updated to preserve the `axis` field.

**Tests:**
- `src/__tests__/studio/four-axis.test.ts` -- NEW
  - Test: mock `generateCourse` returns blocks with `axis` field on every block
  - Test: each depth tier has at least 1 block per axis (4 axes x 3 tiers = 12+ blocks per node)
  - Test: ContentBlock interface includes optional `axis` field
  - Test: generated content structure contains `stages_of_the_moment`, `scenarios`, `failure_modes`, `role_lens` sections
  - Test: novel concept_id is inserted into concept_catalog after generation
  - Test: existing concept_id is reused (not duplicated) -- 409 on duplicate insert

---

### T-005: SME Review and Revision Loop

**FR:** FR-7 (SME Review and Revision Loop)
**AC:** AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5

**Files modified:**
- `server/routes/studio.ts` -- Add new endpoints:
  - `POST /api/v1/studio/tracks/:trackId/review/sections` -- Initialize section reviews when an SME starts reviewing. Creates one `section_reviews` row per (node, depth_tier) combination with status `pending_review`.
  - `PUT /api/v1/studio/tracks/:trackId/review/sections/:sectionId` -- SME approves or requests revision on a specific section. Body: `{ action: 'approve' | 'request_revision', comment?: string }`. Updates `section_reviews.status` to `approved` or `revision_requested`.
  - `POST /api/v1/studio/tracks/:trackId/regenerate-revised` -- Triggers re-generation for sections with status `revision_requested` only. For each such section: (a) reads the reviewer's comment from `section_reviews.reviewer_comment`, (b) appends the comment as a revision directive to the AI prompt, (c) calls `curriculumAI.regenerateSection()`, (d) replaces only the revised section's content in the spine JSONB, (e) sets section status to `pending_review`, (f) increments `revision_count`. Approved sections are not touched.
  - `GET /api/v1/studio/tracks/:trackId/review/sections` -- Returns all section reviews for a track with their statuses.
- `server/services/curriculumAI.ts` -- Add new function:
  - `regenerateSection(node, depthTier, brief, revisionComment)` -- Calls Claude (or mock) with the existing content plus the revision comment appended as a directive. Returns new depth card content for that single tier. The prompt includes: "REVISION REQUESTED: {comment}. Revise the {depthTier} content for this node to address the reviewer's feedback."
  - Mock implementation: returns modified fixture data with a "[REVISED]" prefix on content blocks.
- `src/components/studio/ReviewStage.tsx` -- Major refactor:
  - Replace the 4-checkbox manual review with a two-panel layout:
    - **Left panel:** Section list showing all (node, depth_tier) combinations with status badges (pending_review, approved, revision_requested).
    - **Right panel:** Content preview for the selected section. SME sees the generated content blocks. Two action buttons: "Approve" and "Request Revision" (opens comment textarea).
  - "Re-generate Revised Sections" button at the top, enabled only when sections with `revision_requested` status exist. Calls `POST /regenerate-revised`.
  - After re-generation, revised sections return to `pending_review` status (AC-7.5).
- `src/app/pages/CurriculumStudio.tsx` -- Add handlers:
  - `handleInitSectionReviews()` -- calls `POST /review/sections`
  - `handleSectionAction(sectionId, action, comment?)` -- calls `PUT /review/sections/:sectionId`
  - `handleRegenerateRevised()` -- calls `POST /regenerate-revised`

**Implementation detail:**
For AC-7.4 (approved sections retain original content byte-for-byte): the regenerate endpoint queries `section_reviews` to identify only `revision_requested` sections. It reads the track's spine JSONB, modifies only the depth card for the target (node_index, depth_tier), and writes back. A test verifies that the content of approved sections is byte-identical before and after re-generation.

For the revision prompt (AC-7.3), the revision comment is appended to the existing Claude prompt:
```
REVISION DIRECTIVE FROM SME REVIEWER:
"{comment}"

Revise ONLY the {depthTier} depth card for this node. Address the reviewer's feedback directly.
Keep the same four-axis structure. Return the revised content in the same JSON format.
```

**Tests:**
- `src/__tests__/studio/revision-loop.test.ts` -- NEW
  - Test: initialize section reviews creates N x 3 rows (N nodes, 3 tiers each) with `pending_review`
  - Test: approve action sets section status to `approved`
  - Test: request_revision action sets status to `revision_requested` with comment stored
  - Test: regenerate endpoint only calls AI for `revision_requested` sections (count matches)
  - Test: regenerate endpoint does not modify approved section content (byte comparison)
  - Test: revision comment appears in AI prompt (mock mode: verify mock receives comment)
  - Test: re-generated sections return to `pending_review` status (not auto-approved)
  - Test: revision_count increments on each re-generation cycle

---

### T-006: Assembly Review Gate (Automated Checks)

**FR:** FR-8 (Assembly Review Gate)
**AC:** AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6

**Files modified:**
- `server/services/assemblyChecks.ts` -- NEW FILE. Four deterministic check functions:
  - `checkTerminologyDrift(spine: SpineNode[]): AssemblyFlag[]` -- Extracts key terms from each node's content blocks. Identifies cases where semantically equivalent concepts use different terms across nodes (e.g., "patient" vs "client"). Algorithm: build a term frequency map per node from text_block content, flag pairs of terms that appear in different nodes and are likely synonyms (using a configurable synonym dictionary + Jaccard similarity > 0.8 on surrounding context).
  - `checkDifficultyInversion(spine: SpineNode[]): AssemblyFlag[]` -- Scans foundational-tier blocks for references to advanced concepts. Algorithm: extract key terms from applied-tier content, then search foundational-tier content for those terms. Flag matches with the specific block ID and concept reference.
  - `checkArtifactRedundancy(spine: SpineNode[]): AssemblyFlag[]` -- Compares all content blocks pairwise. Algorithm: compute Jaccard similarity on word-level trigrams. Flag pairs with similarity > 0.8 as redundant.
  - `checkCoverageGap(spine: SpineNode[]): AssemblyFlag[]` -- For each node, verify all 3 depth tiers have non-empty content blocks. Flag any node missing a depth tier or with an empty blocks array.
  - Type: `interface AssemblyFlag { category, description, node_indices, block_ids }`.
- `server/routes/studio.ts` -- Modify the review flow:
  - `POST /api/v1/studio/tracks/:trackId/review` (start review) -- After creating the `assembly_reviews` row, run all four checks via `assemblyChecks.ts`. Insert resulting flags into `assembly_flags` table. Return the review + flags.
  - `GET /api/v1/studio/tracks/:trackId/review/flags` -- NEW. Returns all flags for the current review.
  - `PUT /api/v1/studio/tracks/:trackId/review/flags/:flagId` -- NEW. Resolve a flag. Body: `{ resolution_type: 'edited' | 'dismissed', justification?: string }`. If `dismissed`, `justification` is required (non-empty) -- return 400 if empty. If `edited`, justification is optional. Sets `resolved = true`.
  - Modify `POST /api/v1/studio/tracks/:trackId/review/complete` -- Before completing review, check: `SELECT COUNT(*) FROM assembly_flags WHERE review_id = $1 AND resolved = false`. If count > 0, return 422 with `{ error: 'unresolved_assembly_flags', count: N }`. The existing 4-checkbox flow is replaced by the automated flags.
- `src/components/studio/ReviewStage.tsx` -- Extend (on top of T-005 changes):
  - Add an "Assembly Flags" section above the per-section review. Shows flags grouped by category with status badges.
  - Each flag displays: category icon, description, affected nodes/blocks.
  - Resolution options: "Edit Content" (navigates to the relevant section for editing, then auto-resolves on save) or "Dismiss" (opens justification textarea, required non-empty).
  - "Complete Review" button disabled until all flags are resolved.
- `src/components/studio/AssemblyFlagsPanel.tsx` -- NEW. Renders the flag list with resolution actions.

**Implementation detail:**
The assembly checks run server-side when a review starts. They operate on the spine JSONB data (no additional DB queries needed). The results are persisted as `assembly_flags` rows. The reviewer resolves flags through the UI, and the complete-review endpoint enforces the gate.

For AC-8.6 (empty justification rejection): the `PUT /flags/:flagId` endpoint validates `justification.trim().length > 0` when `resolution_type === 'dismissed'`.

**Tests:**
- `src/__tests__/studio/assembly-checks.test.ts` -- NEW (unit tests for the service)
  - Test: terminology drift detects "patient" vs "client" across nodes
  - Test: difficulty inversion detects foundational referencing advanced concept
  - Test: artifact redundancy detects >80% similar blocks
  - Test: coverage gap detects missing depth tier for a node
  - Test: clean content produces zero flags
- `src/__tests__/studio/assembly-gate.test.ts` -- NEW (integration tests)
  - Test: start review creates assembly flags from checks
  - Test: dismiss flag with empty justification returns 400
  - Test: dismiss flag with justification resolves it
  - Test: edit resolution resolves flag without justification
  - Test: complete review with unresolved flags returns 422
  - Test: complete review with all flags resolved succeeds

---

### T-007: Publish Transform (Atomic Transaction)

**FR:** FR-9 (Publish Transform)
**AC:** AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6

**Files modified:**
- `server/routes/studio.ts` -- Major refactor of `POST /api/v1/studio/tracks/:trackId/publish`:
  - **Gate checks (before transaction):**
    1. Track must be in `review` status.
    2. Trust claim gate: `SELECT COUNT(*) FROM trust_claims WHERE track_id = $1 AND status IN ('unverified', 'disputed')` must be 0 (from T-003).
    3. Assembly flag gate: `SELECT COUNT(*) FROM assembly_flags WHERE review_id = (latest review) AND resolved = false` must be 0 (from T-006).
  - **Atomic transaction:** Replace the current non-transactional publish with a single transaction:
    ```typescript
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 1. INSERT course
      // 2. INSERT modules (1 per spine node, sequence_order = node.index)
      // 3. INSERT lessons (1 per node per depth tier = 3 lessons per module)
      //    Map: spine node -> module, depth tier -> lesson
      //    content_foundational/content_working/content_applied from depth_cards
      // 4. INSERT lesson_content (if separate table exists -- actually content is JSONB on lessons)
      // 5. INSERT personas + calibration questions
      // 6. INSERT credential template
      // 7. UPDATE authoring_tracks SET status = 'published', published_course_id, published_at
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    ```
  - **Slug generation:** Current logic exists but does not handle unicode well. Keep existing: lowercase, replace non-alphanumeric with hyphens, trim, truncate to 100 chars. Append trackId prefix on collision.
  - **Transform mapping (spec says `lesson_content` table but the actual schema stores content as JSONB columns on `lessons`):**
    - `authoring_tracks` -> 1 `courses` row (title, slug, description, difficulty_level, tier_treatment, credential_type, is_published=true, published_at=NOW())
    - Per spine node -> 1 `modules` row (course_id, title=node.title, sort_order=node.index)
    - Per spine node -> 1 `lessons` row per module (module_id, course_id, title=node.title, sort_order=node.index, content_foundational=node.depth_cards.foundational, content_working=node.depth_cards.working, content_applied=node.depth_cards.applied, has_quiz, is_free based on paywall_lesson_index, is_published=true)
    - NOTE: The spec says "12 rows in lessons" for 4 nodes (3 per node), but the existing schema and publish code create 1 lesson per node with 3 JSONB content columns (foundational/working/applied). This matches the existing DB design. The spec's "lesson_content" table does not exist -- content is stored as JSONB columns on the `lessons` table. Keep the existing mapping (1 lesson per node, 3 JSONB columns) as this matches the learner-facing lesson player.
  - **`published_at` timestamp:** Set on both the `courses` row and the `authoring_tracks` row.
- `server/db/index.ts` -- Expose `pool` or add a `getClient()` helper for transaction support if not already available. Check if the `query` function already supports transactions.
- `src/components/studio/PublishStage.tsx` -- Minor updates:
  - Show trust-claim gate status (from T-003).
  - Show assembly-flag gate status (from T-006).
  - After successful publish, show link to the published course in the catalog.
  - For published tracks, show "Published" status with course detail link instead of authoring pipeline link.
- `src/app/pages/CurriculumStudio.tsx` -- Modify track list rendering:
  - Published tracks show "published" badge and link to `/courses/:slug` instead of the studio editor (AC-9.6).

**Implementation detail:**
The existing publish endpoint (lines 1142-1298) already does most of the work but is not wrapped in a transaction and lacks the trust-claim/assembly-flag gates. The refactor:
1. Wraps all DB operations in BEGIN/COMMIT/ROLLBACK.
2. Adds gate checks before the transaction.
3. Keeps the existing mapping logic (1 lesson per node with 3 JSONB columns).
4. The `db/index.ts` file likely exports a `query(text, params)` function that acquires and releases a client automatically. For transactions, we need the raw `pool.connect()` approach. Add a `getPool()` export if not present.

**Tests:**
- `src/__tests__/studio/publish-transform.test.ts` -- NEW
  - Test: publish creates 1 course, N modules, N lessons for N spine nodes (AC-9.1)
  - Test: module sort_order matches spine node ordering (AC-9.2)
  - Test: course has slug, published_at, track status = 'published' (AC-9.3)
  - Test: on DB error mid-transaction, no rows exist for that track in courses/modules/lessons (AC-9.4 -- rollback)
  - Test: published course appears in catalog API query (AC-9.5)
  - Test: publish with unverified trust claims returns 422 (from T-003)
  - Test: publish with unresolved assembly flags returns 422 (from T-006)
  - Test: published track in dashboard shows "published" status and links to course detail (AC-9.6)

---

### Test Strategy Summary

| Task | Test File | Type | Count |
|---|---|---|---|
| T-001 | `src/__tests__/studio/auth-gate.test.ts` | API + Component | 6 |
| T-002 | `src/__tests__/studio/track-templates.test.ts` | API + Component | 7 |
| T-003 | `src/__tests__/studio/trust-claims.test.ts` | API + Component | 8 |
| T-004 | `src/__tests__/studio/four-axis.test.ts` | Unit + API | 6 |
| T-005 | `src/__tests__/studio/revision-loop.test.ts` | API + Integration | 8 |
| T-006 | `src/__tests__/studio/assembly-checks.test.ts` | Unit | 5 |
| T-006 | `src/__tests__/studio/assembly-gate.test.ts` | API + Integration | 6 |
| T-007 | `src/__tests__/studio/publish-transform.test.ts` | API + Integration | 8 |
| **Total** | | | **54** |

All tests use vitest with jsdom environment. API tests mock the `query` function from `server/db/index.ts`. Component tests use `@testing-library/react`. TDD Iron Law: each test is written failing first, then implementation makes it pass.

---

## S4 Deploy Plan

| Item | Detail |
|---|---|
| **Target** | `sabificate.forwardai.dev` (Hetzner `5.161.236.61`) |
| **Pre-deploy** | Run migration: `psql $DATABASE_URL -f migrations/003_studio_v1_gaps.sql` then seed: `psql $DATABASE_URL -f migrations/seed_track_templates.sql` |
| **Build** | `cd /workspace/app && NODE_ENV=production npm run build` |
| **Deploy** | Interactive-only via curl webhook (no webhook exists yet -- must be created before deploy) |
| **Rollback** | Revert to previous build artifact. Migration 003 is additive (new tables, new columns) -- no destructive schema changes. Rollback SQL: `DROP TABLE IF EXISTS track_templates, assembly_flags, section_reviews; ALTER TABLE trust_claims DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS reviewer_comment;` |
| **Confirm** | Interactive-only. No CI/CD auto-deploy. Deploy triggered manually by Sanju or admin. |

---

## S5 Constitution Re-check

### SI -- Boundary Rules

- [x] **No external API calls** except Anthropic Claude API (used in `curriculumAI.ts` for decomposition and generation). No new external services added.
- [x] **Secrets in `.env` only** -- `ANTHROPIC_API_KEY`, `DATABASE_URL`, `JWT_SECRET` referenced via `process.env`. No secrets in source.
- [x] **Interactive-only deploys** -- deploy via curl webhook, triggered manually.
- [x] **No learner PII in AI prompts** -- prompts contain curriculum content (skill statements, node titles, objectives) only. No student names, emails, or progress data.

### SII -- Process Rules

- [x] **Spec-gate before code** -- this plan implements spec v1.0.0 (GATE-2 APPROVED).
- [x] **TDD Iron Law** -- 54 tests across 8 test files. Each AC maps to at least one test. Tests written failing before implementation.
- [x] **Fresh subagent per task** -- 7 tasks (T-001 through T-007), each executed by a fresh subagent.
- [x] **Two-reviewer merge gate** -- PRs require two approvals before merge to main.

### SII-B -- Security Controls

- [x] **P10 Input validation** -- all new endpoints use Zod schemas. Trust claim status transitions validated. Assembly flag justification validated non-empty.
- [x] **P11 Server-side authZ** -- role checks in Fastify route hooks (`canAuthor`, `canReview`, `hasStudioAccess`). Trust claim gate and assembly flag gate enforced server-side in publish endpoint.
- [x] **P12 TLS** -- unchanged, all endpoints over HTTPS.
- [x] **P13 Tenant isolation** -- single-tenant for v1; tracks scoped by `created_by`. Non-admin users see only their own tracks.
- [x] **P14 Audit logging** -- all state transitions logged: trust claim status changes (with actor, timestamp, old/new status), section review actions, assembly flag resolutions, publish events. Logged via existing `generation_jobs` + `review_actions` tables + new `section_reviews` and `assembly_flags` tables with timestamp/actor columns.
- [x] **P15 SBOM** -- `npm ls --all --json` at build time. No new dependencies added.
- [x] **P16 WCAG 2.2 AA** -- new components (TemplatePicker, AssemblyFlagsPanel, revised ReviewStage, revised TrustClaimsPanel) use semantic HTML, ARIA labels on interactive elements, keyboard-navigable, sufficient contrast ratios.
- [x] **P17 AI governance** -- AI-generated content requires SME review gate (section_reviews) + trust claim verification (trust_claims.status) + assembly flag resolution before publish. Mock mode available when API key absent.
- [x] **P18 Rate limiting** -- existing Fastify rate limiter applies. No changes needed.

---

## S6 Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Publish transaction too slow for large tracks (many nodes, many blocks) | Low | Medium | The largest track is ~6 nodes x 3 tiers = 18 lessons + 6 modules + 1 course. Transaction should complete in <1s. If slow, batch INSERT with multi-row VALUES. |
| R-2 | Terminology drift check produces false positives | Medium | Low | Use a configurable synonym dictionary rather than pure statistical similarity. Allow reviewers to dismiss with justification. Start with a conservative threshold (exact match synonyms only). |
| R-3 | Trust claim status migration breaks existing data | Low | High | Migration backfills `status` from existing `verified` boolean. Both columns coexist during transition. All code reads `status`. Rollback SQL provided. |
| R-4 | 238 template seed data is incomplete or incorrect | Medium | Medium | Validate seed data against the 21 NCCE domain list before inserting. Each template requires non-empty title, domain, vertical, and skill_description. Seed script includes a validation pass. |
| R-5 | Revision loop infinite cycles (OQ-6) | Low | Medium | For v1: no hard cap on revision iterations. Track `revision_count` per section. UI shows count. If the team decides to cap, add a configurable `MAX_REVISION_ITERATIONS` (default: 5) check in the regenerate endpoint. |
| R-6 | `review_actions.lesson_id` NOT NULL constraint blocks existing data | Low | High | Migration drops the NOT NULL constraint. Existing rows already have lesson_ids. New rows (authoring-phase) can have NULL lesson_id. No data loss. |
| R-7 | Vertical enum expansion breaks existing track creation | Low | Medium | Change Zod schema from fixed enum to `z.string().min(1).max(100)` for the vertical field. All existing values remain valid. |

---

## S7 Open Questions

| # | Question | Impact | Resolution for v1 |
|---|---|---|---|
| OQ-1 | Exact schema for 238 catalogue template seed data | FR-3 seed script | Use a JSON structure with `title`, `domain`, `vertical`, `skill_description`, `learning_objectives[]`, `context_mode`. Generate from NCCE programme areas + existing 30 static templates. Sanju to review before seed. |
| OQ-2 | Assembly review checks: Claude API or deterministic? | FR-8 implementation | **Deterministic for v1.** String matching + Jaccard similarity. Avoids API cost/latency. Claude-based checks deferred to v2. |
| OQ-3 | Max acceptable latency for full-track generation? Sync or queued? | FR-5 UX | **Synchronous for v1.** Current `POST /generate` is synchronous (waits for all nodes). Acceptable for 4-6 nodes. If latency exceeds 120s, the existing generation_jobs table supports async via BullMQ in v2. |
| OQ-4 | Published tracks immutable or revisable? | Post-publish workflow | **Revisable for v1.** Unpublish endpoint already exists. Unpublish sets course `is_published = false` and track status back to `review`. No learner-impact analysis in v1. |
| OQ-5 | Trust claim verification threshold (100% or configurable)? | FR-6 gate | **100% for v1.** All claims must be `verified` or `needs_source` (with source attached). No configurable threshold. Gate is strict per spec. |
| OQ-6 | Revision loop max iteration count? | FR-7 guardrail | **No hard cap for v1.** Track `revision_count` per section for visibility. Add configurable cap in v2 if needed. |