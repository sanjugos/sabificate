# SABIficate Curriculum Studio v1 -- Tasks

| Field | Value |
|---|---|
| **Feature** | Curriculum Studio v1 -- 7-Stage AI-Assisted Authoring Pipeline |
| **Plan version** | 1.0.0 |
| **Status** | GATE-4 APPROVED |

---

## Legend

- `[parallel]` = safe to run concurrently with other `[parallel]` tasks at the same level
- `depends: T-xxx` = must wait for the named task to merge first
- Each task targets one worktree branch, one subagent, one PR
- Test framework: vitest + @testing-library/react + @testing-library/jest-dom
- Test environment: jsdom (configured in `/workspace/app/vitest.config.ts`)

---

## T-001 -- Schema Migration 003 + Auth Gate Error Body

**Traces to:** FR-1 (Auth Gate), AC-1.1, AC-1.2, AC-1.3, AC-1.4

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/auth-gate.test.ts`

1. `forbidden() helper returns { error: "insufficient_role" } in response body` -- assert the 403 response from `GET /api/v1/studio/tracks` when user role is `learner` includes `{ error: "insufficient_role" }` (currently returns `{ message: "Insufficient permissions" }`)
2. `curriculum_author gets 200 on GET /api/v1/studio/tracks` -- mock authenticated user with role `curriculum_author`, assert 200 with tracks array
3. `sme_reviewer gets 200 on GET /api/v1/studio/tracks` -- mock authenticated user with role `sme_reviewer`, assert 200 (currently returns 403 because `GET /tracks` uses `canAuthor()` which excludes `sme_reviewer`)
4. `unauthenticated request gets 401 on /api/v1/studio/tracks` -- assert 401 when no auth token present
5. `RequireRole renders Studio for sme_reviewer` -- React component test: render `<RequireRole role={['corporate_admin','platform_admin','curriculum_author','sme_reviewer']}>` with a mock user having role `sme_reviewer`, assert children render
6. `RequireRole redirects learner away from Studio` -- React component test: render with mock user role `learner`, assert "Access Denied" text appears

**Implementation summary:**

- Create `/workspace/app/migrations/003_studio_v1_gaps.sql`:
  - `CREATE TABLE track_templates` (id, title, domain, vertical, skill_description, learning_objectives JSONB, context_mode, source, created_at)
  - `CREATE TABLE assembly_flags` (id, track_id, review_id, category CHECK enum, description, node_indices INTEGER[], block_ids TEXT[], resolved, resolution_type, justification, resolved_by, resolved_at, created_at)
  - `CREATE TABLE section_reviews` (id, track_id, review_id, spine_node_index, depth_tier CHECK enum, status CHECK enum, reviewer_id, reviewer_comment, revision_count, created_at, updated_at, UNIQUE(review_id, spine_node_index, depth_tier))
  - `ALTER TABLE trust_claims ADD COLUMN status VARCHAR(20) DEFAULT 'unverified' CHECK (...)`, `ADD COLUMN reviewer_comment TEXT`
  - Backfill: `UPDATE trust_claims SET status = CASE WHEN verified THEN 'verified' ELSE 'unverified' END`
  - `ALTER TABLE review_actions ALTER COLUMN lesson_id DROP NOT NULL`
- Update `/workspace/app/server/db/schema.ts`: add `TRACK_TEMPLATES`, `ASSEMBLY_FLAGS`, `SECTION_REVIEWS` to TABLES constant
- Update `/workspace/app/server/db/index.ts`: load migration 003 in pg-mem setup for dev/test mode
- Update `/workspace/app/server/routes/studio.ts`:
  - Change `forbidden()` helper to return `{ error: 'insufficient_role' }` in the body (alongside statusCode/message for backward compat)
  - Change `GET /api/v1/studio/tracks` from `canAuthor()` to new `hasStudioAccess()` check that includes `sme_reviewer` for read endpoints
  - Keep write endpoints (POST, PUT, DELETE) behind `canAuthor()`
- Update `/workspace/app/src/app/App.tsx` line 54: add `'sme_reviewer'` to the RequireRole array on the `/studio` route

**Done when:**

- All 6 tests pass
- Migration 003 SQL file exists and creates 3 new tables + alters 2 existing tables
- `sme_reviewer` can access Studio routes (read-only) in both frontend and backend
- 403 responses include `{ error: "insufficient_role" }`

**Isolation:** worktree branch `studio/t001-schema-auth-gate`

**Depends:** none (foundation task)

---

## T-002 -- Trust Claim Status Enum + Verification Workflow

**Traces to:** FR-6 (Trust Claim Verification), AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5

**[parallel]** -- can run concurrently with T-003, T-004 (after T-001 merges)

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/trust-claims.test.ts`

1. `PUT trust claim with { status: "verified" } updates status and sets verified_by/verified_at` -- assert DB update writes status, verified_by = user_id, verified_at = timestamp (currently the endpoint only accepts `{ verified: boolean }`)
2. `PUT trust claim with { status: "disputed", comment: "..." } stores comment` -- assert status transitions to `disputed` and `reviewer_comment` column is populated
3. `PUT trust claim with { status: "disputed" } without comment returns 400` -- assert validation rejects missing comment when disputing
4. `publish returns 422 when 1 claim is unverified` -- call `POST /publish` with a track that has 1 unverified trust claim, assert HTTP 422 with `{ error: "unverified_trust_claims", count: 1 }` (currently publish has no trust-claim gate)
5. `publish returns 422 when 1 claim is disputed (server-side gate)` -- call `POST /publish` via API with 1 disputed claim, assert 422 regardless of client state
6. `publish succeeds when all claims are verified or needs_source` -- assert 200/success when all claims have status `verified` or `needs_source`
7. `TrustClaimsPanel renders status badges and action buttons` -- React component test: render TrustClaimsPanel with mock claims, assert "Verify", "Dispute", "Needs Source" buttons appear instead of checkboxes
8. `PublishStage disables button when unverified claims exist` -- React component test: render PublishStage with unverified claim count, assert button is disabled and tooltip mentions unverified claims

**Implementation summary:**

- Update `/workspace/app/server/routes/studio.ts`:
  - Replace `trustClaimUpdateSchema` to accept `status` enum (`unverified`, `verified`, `disputed`, `needs_source`) and `comment` string instead of boolean `verified`
  - Validate: if `status === 'disputed'`, `comment` is required (non-empty)
  - On `status === 'verified'`: set `verified_by`, `verified_at`
  - Update `GET /trust-claims`: add `?status=unverified|verified|disputed|needs_source` query filter alongside legacy `?verified=true|false`
  - Add trust-claim gate to `POST /publish`: query `SELECT COUNT(*) FROM trust_claims WHERE track_id = $1 AND status IN ('unverified', 'disputed')`. If count > 0, return 422 `{ error: "unverified_trust_claims", count: N }`
- Update `/workspace/app/src/components/studio/TrustClaimsPanel.tsx`:
  - Replace `verified: boolean` in TrustClaim interface with `status: 'unverified' | 'verified' | 'disputed' | 'needs_source'`
  - Replace toggle checkbox with action buttons: "Verify", "Dispute", "Needs Source"
  - "Dispute" opens comment textarea (required before submit)
  - Add filter tabs: All, Unverified, Verified, Disputed, Needs Source
  - Status badges: green/verified, red/disputed, amber/unverified, blue/needs_source
  - Summary bar: "X of Y verified | Z disputed | W pending"
- Update `/workspace/app/src/components/studio/PublishStage.tsx`:
  - Accept `trustClaimCounts` prop (unverified, disputed counts)
  - Disable Publish button when counts > 0
  - Show tooltip with count of blocking claims

**Done when:**

- All 8 tests pass
- Trust claims use status enum (not boolean) in API requests/responses
- Publish endpoint enforces server-side trust-claim gate returning 422
- TrustClaimsPanel shows status badges and action buttons
- PublishStage disables publish when claims are unresolved

**Isolation:** worktree branch `studio/t002-trust-claim-workflow`

**Depends:** T-001 (needs `trust_claims.status` column from migration 003)

---

## T-003 -- Assembly Review Gate (Automated Checks)

**Traces to:** FR-8 (Assembly Review Gate), AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6

**[parallel]** -- can run concurrently with T-002, T-004 (after T-001 merges)

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/assembly-checks.test.ts` (unit tests)

1. `checkTerminologyDrift detects "patient" vs "client" across nodes` -- build spine with node 1 using "patient" and node 3 using "client" for the same concept, assert a `terminology_drift` flag is raised identifying both nodes
2. `checkDifficultyInversion detects foundational referencing advanced concept` -- build spine where foundational tier of node 2 references "advanced pharmacokinetics" (a term only in applied tier), assert flag raised
3. `checkArtifactRedundancy detects >80% similar blocks` -- build spine with two content blocks sharing >80% word trigrams, assert `artifact_redundancy` flag raised
4. `checkCoverageGap detects missing depth tier for a node` -- build spine where node 4 has no `applied` depth-level content (empty blocks array), assert `coverage_gap` flag raised
5. `clean content produces zero flags` -- build well-formed spine with consistent terminology, proper difficulty progression, no redundancy, full coverage, assert 0 flags returned

File: `/workspace/app/src/__tests__/studio/assembly-gate.test.ts` (integration tests)

6. `start review creates assembly flags from checks` -- mock POST start review, assert flags are persisted to `assembly_flags` table
7. `dismiss flag with empty justification returns 400` -- call PUT flag with `{ resolution_type: "dismissed", justification: "" }`, assert 400
8. `dismiss flag with justification resolves it` -- call PUT flag with `{ resolution_type: "dismissed", justification: "Intentional synonym" }`, assert flag `resolved = true`
9. `edit resolution resolves flag without justification` -- call PUT flag with `{ resolution_type: "edited" }`, assert resolved without requiring justification
10. `complete review with unresolved flags returns 422` -- call POST complete review when 1 flag is unresolved, assert 422 with `{ error: "unresolved_assembly_flags", count: 1 }`
11. `complete review with all flags resolved succeeds` -- assert success when all flags resolved

**Implementation summary:**

- Create `/workspace/app/server/services/assemblyChecks.ts`:
  - `checkTerminologyDrift(spine)`: extract key terms per node from text_block content, build frequency map, flag synonym pairs using configurable synonym dictionary + Jaccard context similarity > 0.8
  - `checkDifficultyInversion(spine)`: extract key terms from applied-tier blocks, search foundational-tier blocks for those terms, flag matches
  - `checkArtifactRedundancy(spine)`: compare all content blocks pairwise using word-level trigram Jaccard similarity, flag pairs > 0.8
  - `checkCoverageGap(spine)`: verify each node has all 3 depth tiers with non-empty blocks, flag missing/empty
  - Export `runAllAssemblyChecks(spine)` that runs all four and returns combined `AssemblyFlag[]`
  - `interface AssemblyFlag { category, description, node_indices, block_ids }`
- Update `/workspace/app/server/routes/studio.ts`:
  - Modify `POST /review` (start review): after creating assembly_reviews row, call `runAllAssemblyChecks(spine)` and INSERT flags into `assembly_flags`
  - Add `GET /review/flags` endpoint: returns all flags for the current review
  - Add `PUT /review/flags/:flagId` endpoint: resolve a flag with `{ resolution_type, justification? }`. Validate non-empty justification when `dismissed`
  - Modify `POST /review/complete`: check `SELECT COUNT(*) FROM assembly_flags WHERE review_id = $1 AND resolved = false`. If > 0, return 422 with `{ error: "unresolved_assembly_flags", count }`. Replace 4-checkbox flow with automated flag-based gate
- Create `/workspace/app/src/components/studio/AssemblyFlagsPanel.tsx`:
  - Render flag list grouped by category with status badges
  - Each flag: category icon, description, affected nodes/blocks
  - "Dismiss" action opens justification textarea (required non-empty)
  - "Edit Content" navigates to relevant section
- Update `/workspace/app/src/components/studio/ReviewStage.tsx`:
  - Add AssemblyFlagsPanel above the existing review content
  - Replace 4-checkbox flow with automated flags display
  - "Complete Review" disabled until all flags resolved

**Done when:**

- All 11 tests pass
- Four deterministic check algorithms produce correct flags
- Flags persist to `assembly_flags` table on review start
- Flag resolution enforced (empty justification rejected for dismissals)
- Complete-review gate blocks on unresolved flags
- ReviewStage shows AssemblyFlagsPanel instead of manual checkboxes

**Isolation:** worktree branch `studio/t003-assembly-gate`

**Depends:** T-001 (needs `assembly_flags` table from migration 003)

---

## T-004 -- Prompt Tuning: Four-Axis Engine

**Traces to:** FR-5 (AI Content Generation), FR-4 (AI Decomposition), AC-5.3, AC-5.4, AC-5.5

**[parallel]** -- can run concurrently with T-002, T-003 (after T-001 merges)

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/four-axis.test.ts`

1. `mock generateCourse returns blocks with axis field on every block` -- call `mockGenerateCourse`, assert every ContentBlock in the result has an `axis` field set to one of the four values
2. `each depth tier has at least 1 block per axis` -- call `mockGenerateCourse` for a single node, assert each tier (foundational, working, applied) has >= 1 block with `axis === 'stages_of_the_moment'`, >= 1 with `'scenarios'`, >= 1 with `'failure_modes'`, >= 1 with `'role_lens'` (currently each tier has 3 generic blocks, not 4 axis-tagged blocks)
3. `ContentBlock interface includes optional axis field` -- TypeScript compile check: create a ContentBlock with `axis: 'scenarios'`, assert it type-checks (currently the interface lacks `axis`)
4. `generated content blocks are tagged with four-axis values` -- call `mockGenerateCourse`, collect all unique `axis` values across all blocks, assert set equals `{ stages_of_the_moment, scenarios, failure_modes, role_lens }`
5. `novel concept_id is inserted into concept_catalog after generation` -- mock the generate endpoint flow, assert a new concept_id is written to `concept_catalog` table when not already present
6. `existing concept_id is reused (not duplicated)` -- pre-insert a concept_id into `concept_catalog`, mock generation referencing that concept, assert no duplicate row created (409 or skip on conflict)

**Implementation summary:**

- Update `/workspace/app/server/services/curriculumAI.ts`:
  - Add `axis?: 'stages_of_the_moment' | 'scenarios' | 'failure_modes' | 'role_lens'` to `ContentBlock` interface
  - Update `claudeGenerateDepthCards` system prompt: require output organized by Gbitse's four-axis engine (stages_of_the_moment, scenarios, failure_modes, role_lens). Request >= 1 block per axis per tier (minimum 4 blocks per tier instead of 3)
  - Update `parseBlocks()`: preserve `axis` field from parsed JSON
  - Update `mockGenerateCourse`: generate 4 blocks per tier (1 per axis) with `axis` field set. Change from 3 generic blocks to 4 axis-tagged blocks
  - Update `mockDecomposeSkill` if needed for consistency
  - Add concept catalog integration to generation endpoint: after generating, for each novel concept_id, INSERT into `concept_catalog` with ON CONFLICT DO NOTHING. For existing concept_ids, set `catalog_overlap: 'linked'`

**Done when:**

- All 6 tests pass
- `ContentBlock` interface includes `axis` field
- Mock generation returns 4 blocks per tier, each tagged with an axis
- Claude prompt requests four-axis structure
- Concept catalog integration handles both novel and existing concept_ids

**Isolation:** worktree branch `studio/t004-four-axis-prompts`

**Depends:** T-001 (migration must be applied for concept_catalog schema compatibility)

---

## T-005 -- SME Review and Revision Loop

**Traces to:** FR-7 (SME Review & Revision Loop), AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/revision-loop.test.ts`

1. `initialize section reviews creates N x 3 rows with pending_review` -- POST to init endpoint for a track with 4 spine nodes, assert 12 rows created in `section_reviews` (4 nodes x 3 depth tiers) all with status `pending_review`
2. `approve action sets section status to approved` -- PUT section review with `{ action: "approve" }`, assert status becomes `approved`
3. `request_revision action sets status to revision_requested with comment stored` -- PUT with `{ action: "request_revision", comment: "Add clinical scenario" }`, assert status `revision_requested` and comment persisted
4. `regenerate endpoint only calls AI for revision_requested sections` -- mock AI service, POST regenerate for a track where 2 of 12 sections are `revision_requested`, assert AI service called exactly 2 times (not 12)
5. `regenerate does not modify approved section content (byte comparison)` -- capture approved section content before regeneration, trigger regeneration of other sections, assert approved content is byte-identical after
6. `revision comment appears in AI prompt (mock mode)` -- trigger regeneration with comment "Add neonatal jaundice scenario", assert mock AI service receives the comment in its input
7. `re-generated sections return to pending_review (not auto-approved)` -- after regeneration completes, assert revised sections have status `pending_review`
8. `revision_count increments on each re-generation cycle` -- regenerate a section twice, assert `revision_count` = 2

**Implementation summary:**

- Update `/workspace/app/server/routes/studio.ts`:
  - Add `POST /api/v1/studio/tracks/:trackId/review/sections` -- init section reviews: for each (spine_node_index, depth_tier) combo, INSERT into `section_reviews` with status `pending_review`. Requires `canReview` role
  - Add `PUT /api/v1/studio/tracks/:trackId/review/sections/:sectionId` -- SME action: body `{ action: 'approve' | 'request_revision', comment?: string }`. Updates `section_reviews` status. `request_revision` requires non-empty comment
  - Add `GET /api/v1/studio/tracks/:trackId/review/sections` -- returns all section reviews with statuses
  - Add `POST /api/v1/studio/tracks/:trackId/regenerate-revised` -- queries sections with `revision_requested`, for each: calls `curriculumAI.regenerateSection()`, replaces only that section's depth card content in spine JSONB, sets status back to `pending_review`, increments `revision_count`
- Update `/workspace/app/server/services/curriculumAI.ts`:
  - Add `regenerateSection(node, depthTier, brief, revisionComment)` function. Calls Claude (or mock) with existing content + revision comment appended as directive. Prompt includes: `REVISION DIRECTIVE FROM SME REVIEWER: "{comment}". Revise the {depthTier} content for this node.`
  - Mock implementation: returns modified fixture data with `[REVISED]` prefix on content blocks
- Update `/workspace/app/src/components/studio/ReviewStage.tsx`:
  - Replace 4-checkbox manual review with two-panel layout:
    - Left: section list showing (node, depth_tier) combos with status badges
    - Right: content preview for selected section with "Approve" / "Request Revision" buttons
  - "Request Revision" opens comment textarea
  - "Re-generate Revised Sections" button enabled when `revision_requested` sections exist
  - After re-generation, revised sections show `pending_review`
- Update `/workspace/app/src/app/pages/CurriculumStudio.tsx`:
  - Add `handleInitSectionReviews()`, `handleSectionAction(sectionId, action, comment?)`, `handleRegenerateRevised()` handlers

**Done when:**

- All 8 tests pass
- Section reviews track per-(node, depth_tier) approval status
- Only `revision_requested` sections are re-generated
- Approved sections are untouched during re-generation
- Revision comments appear in AI prompt
- Re-generated sections return to `pending_review`
- `revision_count` tracks iteration cycles

**Isolation:** worktree branch `studio/t005-revision-loop`

**Depends:** T-001 (needs `section_reviews` table), T-002 (trust claim status needed for downstream publish), T-004 (four-axis content structure for generated blocks)

---

## T-006 -- Publish Transform (Atomic Transaction)

**Traces to:** FR-9 (Publish Transform), AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/publish-transform.test.ts`

1. `publish creates 1 course, N modules, N lessons for N spine nodes` -- create a track with 4 spine nodes each with 3 depth levels, call POST publish, assert: 1 row in `courses`, 4 rows in `modules`, 4 rows in `lessons` (1 per node with 3 JSONB content columns)
2. `module sort_order matches spine node ordering` -- assert modules' `sort_order` values match the spine node `index` values sequentially
3. `course has slug, published_at set, track status = published` -- assert course row has non-empty slug, non-null `published_at` timestamp, and authoring track status is `published`
4. `on DB error mid-transaction, no rows exist (full rollback)` -- mock a DB error after inserting the course but before inserting modules, assert zero rows in courses/modules/lessons for that track
5. `published course appears in catalog API query` -- after publish, call the learner-facing catalog endpoint (GET /courses), assert the published course appears with correct title and module count
6. `publish with unverified trust claims returns 422` -- create track with 1 unverified trust claim, call POST publish, assert 422 with `{ error: "unverified_trust_claims" }`
7. `publish with unresolved assembly flags returns 422` -- create track with 1 unresolved assembly flag, call POST publish, assert 422 with `{ error: "unresolved_assembly_flags" }`
8. `published track in dashboard shows published status` -- React component test: render track list with a published track, assert "published" badge appears

**Implementation summary:**

- Refactor `POST /api/v1/studio/tracks/:trackId/publish` in `/workspace/app/server/routes/studio.ts`:
  - **Gate checks (before transaction):**
    1. Track must be in `review` status (existing)
    2. Trust claim gate: `SELECT COUNT(*) FROM trust_claims WHERE track_id = $1 AND status IN ('unverified', 'disputed')` -- if > 0 return 422 (from T-002)
    3. Assembly flag gate: `SELECT COUNT(*) FROM assembly_flags WHERE review_id = (latest review for track) AND resolved = false` -- if > 0 return 422 (from T-003)
  - **Atomic transaction:** wrap all DB operations in `BEGIN`/`COMMIT`/`ROLLBACK`:
    - `pool.connect()` to get a client for transaction
    - INSERT course (with slug generation)
    - INSERT modules (1 per spine node, sort_order = node.index)
    - INSERT lessons (1 per node, 3 JSONB content columns: content_foundational, content_working, content_applied)
    - INSERT personas + calibration questions (from gateway_personas)
    - INSERT credential template
    - UPDATE authoring_tracks: status = 'published', published_course_id, published_at = NOW()
    - On any error: ROLLBACK + throw
  - Existing non-transactional code uses `query()` helper (auto-release). Refactor to use `client.query()` within transaction scope
- Update `/workspace/app/server/db/index.ts`: export `getPool()` or `pool` for transaction support. Currently only `query()` is exported
- Update `/workspace/app/src/components/studio/PublishStage.tsx`:
  - Show trust-claim gate status and assembly-flag gate status before publish button
  - After successful publish, show link to published course at `/courses/:slug`
- Update `/workspace/app/src/app/pages/CurriculumStudio.tsx`:
  - Published tracks in list view show "published" badge
  - Published track row links to `/courses/:slug` instead of studio editor

**Done when:**

- All 8 tests pass
- Publish runs inside a single PostgreSQL transaction
- Transaction rolls back fully on any mid-operation error
- Trust claim gate and assembly flag gate enforced before transaction starts
- Published course appears in learner catalog
- Published tracks display correctly in dashboard

**Isolation:** worktree branch `studio/t006-publish-transform`

**Depends:** T-002 (trust claim gate), T-003 (assembly flag gate)

---

## T-007 -- Track Templates (Pre-populated Catalogue)

**Traces to:** FR-3 (Catalogue Templates), FR-2 (Track Dashboard), AC-3.1, AC-3.2, AC-3.3, AC-2.1, AC-2.2, AC-2.3, AC-2.4

**[parallel]** -- can run concurrently with T-002, T-003, T-004 (after T-001 merges)

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/track-templates.test.ts`

1. `GET /api/v1/studio/templates returns 238 templates` -- seed data loaded, assert response contains 238 template rows (currently no templates endpoint exists)
2. `GET /api/v1/studio/templates?q=nursing returns filtered results` -- assert only templates with "nursing" (case-insensitive) in title are returned
3. `GET /api/v1/studio/templates?domain=Healthcare returns only Healthcare templates` -- assert domain filter works
4. `POST /api/v1/studio/tracks/from-template/:id creates track with pre-filled fields` -- select a template, create a track from it, assert track's name, vertical, and skill_statement match the template
5. `TemplatePicker renders search input and template list` -- React component test: render TemplatePicker with mock templates, assert search input and list items are visible
6. `selecting a template populates SetupStage form fields` -- React component test: simulate template selection, assert form fields are pre-filled with template data
7. `"Start Blank" leaves all fields empty` -- React component test: click "Start Blank", assert all form fields are empty/default

File: `/workspace/app/src/__tests__/studio/track-dashboard.test.ts`

8. `track dashboard renders 5 tracks with correct columns` -- render track list with 5 mock tracks, assert title, domain, stage, status, last-updated columns visible (AC-2.1)
9. `search filter reduces visible tracks` -- type "nurs" in search box, assert only matching tracks visible (AC-2.2)
10. `domain filter shows only matching tracks` -- select "Healthcare" domain filter, assert only Healthcare tracks visible (AC-2.3)

**Implementation summary:**

- Create `/workspace/app/migrations/seed_track_templates.sql`: 238 INSERT statements into `track_templates`. Cover 21 NCCE programme areas (Healthcare, Engineering, Agriculture, Education, Environmental Science, Mass Communication, Business Administration, Computer Science, Social Work, Public Administration, Science Lab Tech, Arts & Design, Languages, Library Science, Leisure & Tourism, Nutrition & Dietetics, etc.). Each row: title, domain, vertical, skill_description, learning_objectives JSONB, context_mode, source
- Update `/workspace/app/server/routes/studio.ts`:
  - Change `createTrackSchema.vertical` from fixed enum to `z.string().min(1).max(100)` to support 21+ NCCE domains
  - Similarly update `updateTrackSetupSchema.vertical`
  - Add `GET /api/v1/studio/templates`: paginated, searchable list. Query params: `q` (ILIKE search on title/domain), `domain` (exact filter), `page`, `limit`. Requires `hasStudioAccess`
  - Add `POST /api/v1/studio/tracks/from-template/:templateId`: reads template, creates new track with pre-filled name, vertical, skill_statement from template. Returns new track. Requires `canAuthor`
- Create `/workspace/app/src/components/studio/TemplatePicker.tsx`:
  - Searchable modal listing templates. Search input filters by title (case-insensitive)
  - Domain filter dropdown
  - Each row: title + domain
  - Click selects template, calls `onSelect(template)`
  - "Start Blank" button calls `onBlank()`
- Update `/workspace/app/src/components/studio/SetupStage.tsx`:
  - When no track exists, show TemplatePicker before the form
  - When template selected, pre-fill form fields
  - When "Start Blank" clicked, show empty form
  - Change vertical `<select>` from 5 fixed options to a text input or expanded dropdown supporting NCCE domains
- Update `/workspace/app/src/app/pages/CurriculumStudio.tsx`:
  - Add `handleCreateFromTemplate(templateId)` handler
  - Add text search and domain filter to track list view (for AC-2.2, AC-2.3)

**Done when:**

- All 10 tests pass
- 238 templates are seeded and queryable
- Template selection pre-fills track setup form
- "Start Blank" creates empty form
- Vertical field supports 21+ NCCE domains (not fixed 5-option enum)
- Track dashboard supports text search and domain filter

**Isolation:** worktree branch `studio/t007-track-templates`

**Depends:** T-001 (needs `track_templates` table from migration 003)

---

## T-008 -- E2E Pipeline Test (Full 7-Stage Journey with Mock AI)

**Traces to:** All FRs (FR-1 through FR-9), all ACs (integration verification)

**Failing tests to write first:**

File: `/workspace/app/src/__tests__/studio/e2e-pipeline.test.ts`

1. `full pipeline: template -> setup -> intake -> decompose -> brief -> generate -> review -> publish` -- end-to-end test exercising all 7 stages in sequence with mock AI:
   - Create track from template (FR-3)
   - Fill intake (skill statement, learner role)
   - Decompose (mock returns 4 nodes) (FR-4)
   - Generate (mock returns 4-axis depth cards + trust claims) (FR-5)
   - Verify all trust claims (FR-6)
   - Start review, resolve assembly flags (FR-8)
   - Init section reviews, approve all sections (FR-7)
   - Complete review
   - Publish (FR-9): assert course, modules, lessons created in learner tables
   - Assert track status is `published`
2. `pipeline blocks publish when trust claims unverified` -- run pipeline to generation stage, skip trust claim verification, attempt publish, assert 422
3. `pipeline blocks publish when assembly flags unresolved` -- run pipeline with content that triggers assembly flags, skip flag resolution, attempt publish, assert 422
4. `revision loop: SME requests revision, author re-generates, SME re-reviews` -- generate content, start review, approve 10 sections, request revision on 2, re-generate revised sections, assert only 2 sections re-generated, re-review and approve, assert all 12 sections approved
5. `mock mode badge shown when ANTHROPIC_API_KEY absent` -- assert AI service returns mock data and response includes mock mode indicator

**Implementation summary:**

- This task writes integration tests only -- no new production code
- Tests call the API endpoints in sequence, using mock AI mode (no ANTHROPIC_API_KEY)
- Tests validate the full data flow: authoring_tracks -> trust_claims -> section_reviews -> assembly_flags -> courses/modules/lessons
- Tests verify gate enforcement: trust claim gate blocks publish, assembly flag gate blocks complete-review, both must pass for publish
- Tests verify revision loop: only disputed sections re-generated, approved sections untouched

**Done when:**

- All 5 integration tests pass
- Full 7-stage pipeline exercised end-to-end in mock mode
- Gate enforcement verified at every checkpoint
- Revision loop verified with selective re-generation

**Isolation:** worktree branch `studio/t008-e2e-pipeline`

**Depends:** T-002, T-003, T-004, T-005, T-006, T-007 (all prior tasks must be merged)

---

## Merge / Integration Order

```
Phase 1 (foundation):
  T-001  Schema Migration + Auth Gate

Phase 2 (parallel, after T-001):
  T-002  Trust Claim Workflow        [parallel]
  T-003  Assembly Review Gate        [parallel]
  T-004  Four-Axis Prompts           [parallel]
  T-007  Track Templates             [parallel]

Phase 3 (after T-002 + T-004):
  T-005  Revision Loop

Phase 4 (after T-002 + T-003):
  T-006  Publish Transform

Phase 5 (after all):
  T-008  E2E Pipeline Test
```

---

## Constitution Gate Checklist (per task)

Each task PR must pass before merge:

- [ ] **TDD Iron Law**: failing test written first, implementation makes it pass
- [ ] **No secrets in source**: ANTHROPIC_API_KEY, DATABASE_URL, JWT_SECRET only in `.env`
- [ ] **Server-side authZ**: role checks in Fastify hooks, not client-only
- [ ] **Input validation**: Zod schemas on all new/modified endpoints
- [ ] **WCAG 2.2 AA**: new UI components have ARIA labels, keyboard nav, sufficient contrast
- [ ] **AI governance**: no auto-publish; SME review gate mandatory; mock mode available
- [ ] **Audit trail**: state transitions logged with actor + timestamp
- [ ] **No new dependencies**: all algorithms use built-in string operations
- [ ] **Fresh subagent**: task executed in isolation, no shared mutable state
- [ ] **Two-reviewer gate**: PR requires two approvals before merge

---

## Traceability

| FR | Acceptance Criteria | Task ID |
|---|---|---|
| FR-1 Auth Gate | AC-1.1, AC-1.2, AC-1.3, AC-1.4 | T-001 |
| FR-2 Track Dashboard | AC-2.1, AC-2.2, AC-2.3, AC-2.4 | T-007 |
| FR-3 Catalogue Templates | AC-3.1, AC-3.2, AC-3.3 | T-007 |
| FR-4 AI Decomposition | AC-4.1, AC-4.2, AC-4.3, AC-4.4 | T-004 |
| FR-5 AI Content Generation | AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5 | T-004 |
| FR-6 Trust Claim Verification | AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5 | T-002 |
| FR-7 SME Review & Revision Loop | AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5 | T-005 |
| FR-8 Assembly Review Gate | AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6 | T-003 |
| FR-9 Publish Transform | AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6 | T-006 |

---

## Test Summary

| Task | Test File | Type | Count |
|---|---|---|---|
| T-001 | `src/__tests__/studio/auth-gate.test.ts` | API + Component | 6 |
| T-002 | `src/__tests__/studio/trust-claims.test.ts` | API + Component | 8 |
| T-003 | `src/__tests__/studio/assembly-checks.test.ts` | Unit | 5 |
| T-003 | `src/__tests__/studio/assembly-gate.test.ts` | API + Integration | 6 |
| T-004 | `src/__tests__/studio/four-axis.test.ts` | Unit + API | 6 |
| T-005 | `src/__tests__/studio/revision-loop.test.ts` | API + Integration | 8 |
| T-006 | `src/__tests__/studio/publish-transform.test.ts` | API + Integration | 8 |
| T-007 | `src/__tests__/studio/track-templates.test.ts` | API + Component | 7 |
| T-007 | `src/__tests__/studio/track-dashboard.test.ts` | Component | 3 |
| T-008 | `src/__tests__/studio/e2e-pipeline.test.ts` | E2E Integration | 5 |
| **Total** | | | **62** |