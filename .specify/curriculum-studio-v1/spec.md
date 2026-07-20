# SABIficate Curriculum Studio v1

| Field | Value |
|---|---|
| **Feature** | Curriculum Studio v1 — 7-Stage AI-Assisted Authoring Pipeline |
| **Client** | SABIficate |
| **Status** | GATE-2 APPROVED |
| **Spec version** | 1.0.0 |
| **Constitution version** | 2.0.0 |
| **Date** | 2026-07-20 |

---

## §1 Problem & Outcome

### Problem

SABIficate must produce 238 courses across 21 domains, each with 3 proficiency-level depth cards. Traditional curriculum development runs 6-12 months per course. At that pace the full catalogue would take decades. The existing Studio codebase implements the 7-stage pipeline skeleton and AI service, but seven critical gaps remain: publish transform, trust claim verification wiring, assembly review gate, revision loop, prompt tuning, catalogue pre-population, and role-gated access. Without closing these gaps, the pipeline cannot move a single track from authoring tables to learner-facing content.

### Desired Outcome

A fully functional internal Studio where a curriculum author creates a track, AI decomposes the skill into a competency spine, generates content at three depth levels, extracts trust claims, and an SME reviewer approves or requests revision — culminating in a one-click publish that transforms authoring data into the learner-facing schema. Target: reduce per-course production from months to hours (10x speed).

### Non-Goals

- Learner-facing UI changes (catalog, course player, enrollment)
- pgvector source grounding or RAG retrieval
- Translation pipeline or multilingual content
- Batch decomposition across multiple tracks in a single operation
- Automated source-freshness checking
- SCORM, xAPI, or Blackboard export
- Asset lifecycle management (image/video hosting, CDN)
- WhatsApp delivery pipeline modifications

---

## §2 Users & Scenarios

### Primary Users

| User | Role | Access |
|---|---|---|
| Curriculum Author | Creates tracks, runs AI pipeline, assembles content | `curriculum_author` or `platform_admin` |
| SME Reviewer | Reviews generated content, approves or requests revision | `sme_reviewer` or `platform_admin` |
| Platform Admin | Full access, manages users and tracks | `platform_admin` |

### Happy Path

1. Author logs in, lands on Track Dashboard, clicks "New Track."
2. Author selects a pre-populated template from the 238-course catalogue (or starts blank).
3. **Setup Stage:** Author names the track, selects domain, sets target proficiency levels.
4. **Intake Stage:** Author provides skill description, learning objectives, optional source material.
5. **Decomposition Stage:** Author clicks "Decompose." AI returns 3-6 competency spine nodes. Author reorders or edits nodes.
6. **Brief Stage:** System generates a content brief per node (scope, depth descriptors, artifact types). Author reviews and adjusts.
7. **Generation Stage:** Author clicks "Generate." AI produces content blocks at 3 depth levels per node, extracts trust claims, maps concept_ids from the Concept Catalog.
8. **Review Stage:** SME reviewer sees generated content with trust claims flagged. Reviewer marks each trust claim as verified, disputed, or needs-source. Reviewer approves sections or requests revision with comments.
9. If revision requested: system sends disputed sections back through generation with reviewer feedback appended to the prompt. Reviewer re-reviews.
10. **Assembly Review Gate:** System runs automated checks (terminology drift, difficulty inversion, artifact redundancy, coverage gap). Author resolves any flags.
11. **Publish Stage:** Author clicks "Publish." System transforms authoring data into learner-facing tables (`courses`, `modules`, `lessons`, `lesson_content`). Track status becomes `published`.

### Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| E-1 | ANTHROPIC_API_KEY not set | AI service falls back to mock mode; decomposition and generation return deterministic fixture data; UI shows "Mock Mode" badge |
| E-2 | Trust claims unverified at publish | Publish button disabled; tooltip shows count of unverified claims; hard gate cannot be bypassed |
| E-3 | SME requests revision on 2 of 5 nodes | Only the 2 disputed nodes re-enter generation; approved nodes remain unchanged |
| E-4 | Concept_id collision across tracks | Concept Catalog enforces uniqueness; duplicate concept_id returns 409 with existing track reference |
| E-5 | Author has no `curriculum_author` role | Studio routes return 403; UI redirects to learner dashboard |
| E-6 | Network failure during AI generation | Request times out after 120s; stage remains in `generating` state; author sees retry button; no partial content saved |
| E-7 | Two authors edit the same track concurrently | Optimistic locking via `updated_at` column; second save returns 409 conflict with diff |
| E-8 | Assembly review flags terminology drift | Track cannot advance to Publish until author resolves each flag (dismiss with justification or edit content) |

---

## §3 Functional Requirements

| ID | Requirement | Testable Assertion |
|---|---|---|
| **FR-1** | **Auth Gate.** Studio routes (`/studio/*` frontend, `/api/studio/*` backend) require an authenticated user with role `curriculum_author`, `sme_reviewer`, or `platform_admin`. Users without a qualifying role receive HTTP 403 and are redirected to the learner dashboard. | Role check on every Studio API endpoint; frontend RequireRole wrapper on Studio routes. |
| **FR-2** | **Track Dashboard.** The dashboard lists all authoring tracks with columns: title, domain, stage, status, author, last updated. Supports text search, domain filter, and status filter. Clicking a row opens the track's current stage. | Renders track list; filters reduce visible rows; row click navigates to correct stage. |
| **FR-3** | **Pre-populated Catalogue Templates.** The "New Track" flow offers a searchable list of the 238 catalogue entries. Selecting a template pre-fills setup fields (title, domain, skill description, learning objectives). Author can also start blank. | Template selection populates fields; blank start leaves fields empty; all 238 templates are present in seed data. |
| **FR-4** | **AI Decomposition.** In the Decomposition Stage, clicking "Decompose" sends the track's skill description and objectives to the AI service, which returns 3-6 competency spine nodes. Each node has: `node_id`, `title`, `description`, `sequence_order`. Author can reorder, edit titles/descriptions, add, or remove nodes before confirming. Falls back to mock data when API key is absent. | API returns 3-6 nodes; nodes are persisted; reorder/edit/add/remove operations update the database; mock mode returns fixture data. |
| **FR-5** | **AI Content Generation with Trust Claims.** In the Generation Stage, clicking "Generate" sends each confirmed spine node to the AI service. For each node, the AI produces content blocks at 3 depth levels (foundational, intermediate, advanced) following Gbitse's four-axis engine (stages of the moment, scenarios, failure modes, role lens). The AI extracts trust claims (factual assertions needing verification) and maps content to concept_ids from the Concept Catalog, creating new concept_ids for novel concepts. | Each node yields 3 depth-level content sets; trust claims are extracted and stored with `status: unverified`; concept_ids are assigned; four-axis structure is present in generated content; mock mode returns fixture data. |
| **FR-6** | **Trust Claim Verification Workflow.** Each trust claim has a status: `unverified`, `verified`, `disputed`, `needs_source`. SME reviewers can transition claims between states and attach comments. A track CANNOT be published while any trust claim remains `unverified` or `disputed`. This is a hard server-side gate — no client-side bypass. The TrustClaimsPanel displays claims grouped by node with status badges and action buttons. | Status transitions persist; publish endpoint returns 422 when unverified/disputed claims exist; UI disables publish button; server rejects publish regardless of client state. |
| **FR-7** | **SME Review & Revision Loop.** In the Review Stage, SME reviewers see generated content alongside trust claims. Per section (node + depth level), the reviewer can: approve, or request revision with a comment. Requesting revision sets the section status to `revision_requested`. The author triggers re-generation for revised sections only — the reviewer's comment is appended to the AI prompt as a revision directive. Re-generated content replaces only the revised sections; approved sections are untouched. The section then returns to review. | Approve/revise actions persist; re-generation targets only revised sections; approved sections remain unchanged; revision comment appears in AI prompt; re-generated content re-enters review. |
| **FR-8** | **Assembly Review Gate.** Before publish, the system runs four automated checks across the full track content: (1) **Terminology drift** — flags inconsistent use of key terms across nodes; (2) **Difficulty inversion** — flags cases where foundational content references advanced concepts; (3) **Artifact redundancy** — flags duplicate or near-duplicate content blocks; (4) **Coverage gap** — flags spine nodes with missing depth levels or empty content blocks. Each flag must be resolved (author edits content or dismisses with written justification) before publish is enabled. | Each check produces flags; unresolved flags block publish; dismiss requires non-empty justification; edit clears the flag; all four categories are checked. |
| **FR-9** | **Publish Transform.** Clicking "Publish" transforms authoring data into the learner-facing schema. The transform maps: `authoring_tracks` → `courses`, spine nodes → `modules`, depth levels → `lessons`, content blocks → `lesson_content`. The transform assigns sequential ordering, generates slugs, sets `published_at` timestamp, and marks the track status as `published`. The operation is atomic — if any step fails, no learner-facing data is written. Published tracks appear in the learner-facing Course Catalog. | Transform creates correct rows in learner tables; ordering is sequential; slugs are generated; transaction rolls back on failure; published course appears in catalog query; track status is `published`. |

---

## §4 Acceptance Criteria

### AC-1: Auth Gate (FR-1)

```
AC-1.1
GIVEN a user authenticated with role "learner"
WHEN they request GET /api/studio/tracks
THEN the server returns HTTP 403 with body { "error": "insufficient_role" }

AC-1.2
GIVEN a user authenticated with role "curriculum_author"
WHEN they request GET /api/studio/tracks
THEN the server returns HTTP 200 with a tracks array

AC-1.3
GIVEN a user authenticated with role "sme_reviewer"
WHEN they navigate to /studio in the browser
THEN the Studio dashboard renders (not the learner dashboard)

AC-1.4
GIVEN an unauthenticated request
WHEN they request any /api/studio/* endpoint
THEN the server returns HTTP 401
```

### AC-2: Track Dashboard (FR-2)

```
AC-2.1
GIVEN 5 tracks exist across 3 domains with mixed statuses
WHEN the author loads the Track Dashboard
THEN all 5 tracks render with correct title, domain, stage, status, author, and last-updated columns

AC-2.2
GIVEN 5 tracks exist and the author types "nurs" in the search box
WHEN the search executes
THEN only tracks whose title contains "nurs" (case-insensitive) are visible

AC-2.3
GIVEN 5 tracks and the author selects domain filter "Healthcare"
WHEN the filter applies
THEN only tracks with domain "Healthcare" are visible

AC-2.4
GIVEN the author clicks on a track row with current stage "decomposition"
WHEN the click handler fires
THEN the browser navigates to /studio/tracks/{trackId}/decomposition
```

### AC-3: Catalogue Templates (FR-3)

```
AC-3.1
GIVEN the seed data contains 238 catalogue templates
WHEN the author clicks "New Track" and the template picker renders
THEN 238 templates are available in the searchable list

AC-3.2
GIVEN the author selects the template "Nursing Ethics 101"
WHEN the template is applied
THEN the setup form pre-fills title as "Nursing Ethics 101", domain as the template's domain, and skill description from the template

AC-3.3
GIVEN the author clicks "Start Blank"
WHEN the blank track form renders
THEN all setup fields are empty
```

### AC-4: AI Decomposition (FR-4)

```
AC-4.1
GIVEN a track with skill description "Pediatric Patient Assessment"
WHEN the author clicks "Decompose" and the AI service responds
THEN the system stores between 3 and 6 spine nodes, each with node_id, title, description, and sequence_order

AC-4.2
GIVEN 5 spine nodes are displayed
WHEN the author drags node 3 to position 1
THEN the sequence_order values update so the moved node is first and all others shift accordingly

AC-4.3
GIVEN ANTHROPIC_API_KEY is not set
WHEN the author clicks "Decompose"
THEN the system returns mock fixture data and the UI displays a "Mock Mode" badge

AC-4.4
GIVEN 4 spine nodes exist
WHEN the author deletes node 2 and adds a new node titled "Custom Node"
THEN 4 nodes remain: the original nodes 1, 3, 4 plus "Custom Node," with correct sequence_order
```

### AC-5: AI Content Generation (FR-5)

```
AC-5.1
GIVEN a track with 4 confirmed spine nodes
WHEN the author clicks "Generate"
THEN each node receives content blocks at 3 depth levels (foundational, intermediate, advanced)

AC-5.2
GIVEN generation completes for a node
WHEN the content is stored
THEN at least 1 trust claim is extracted per node with status "unverified"

AC-5.3
GIVEN generated content for a node
WHEN the content structure is inspected
THEN it contains sections aligned to Gbitse's four-axis engine: stages_of_the_moment, scenarios, failure_modes, role_lens

AC-5.4
GIVEN the Concept Catalog already contains concept_id "NURS-ETHICS-001"
WHEN generation produces content referencing that concept
THEN the existing concept_id is reused (not duplicated)

AC-5.5
GIVEN generation produces content referencing a novel concept
WHEN the concept is stored
THEN a new concept_id is created in the Concept Catalog with the track as origin
```

### AC-6: Trust Claim Verification (FR-6)

```
AC-6.1
GIVEN a trust claim with status "unverified"
WHEN an SME reviewer clicks "Verify" and submits
THEN the claim status updates to "verified" in the database and UI

AC-6.2
GIVEN a trust claim with status "unverified"
WHEN an SME reviewer clicks "Dispute" and enters a comment
THEN the claim status updates to "disputed" with the comment stored

AC-6.3
GIVEN a track with 10 trust claims where 1 remains "unverified"
WHEN the author clicks "Publish"
THEN the server returns HTTP 422 with body { "error": "unverified_trust_claims", "count": 1 }

AC-6.4
GIVEN a track with 10 trust claims where 1 is "disputed"
WHEN the author attempts to publish via direct API call (bypassing UI)
THEN the server returns HTTP 422 — the gate is enforced server-side

AC-6.5
GIVEN a track where all trust claims are "verified" or "needs_source" (with source attached)
WHEN the author clicks "Publish"
THEN the trust claim gate passes and the publish flow continues
```

### AC-7: SME Review & Revision Loop (FR-7)

```
AC-7.1
GIVEN a track in Review Stage with 4 nodes, each with 3 depth levels (12 sections)
WHEN an SME reviewer approves 10 sections and requests revision on 2 with comments
THEN 10 sections have status "approved" and 2 have status "revision_requested" with comments stored

AC-7.2
GIVEN 2 sections with status "revision_requested"
WHEN the author clicks "Re-generate Revised Sections"
THEN the AI service is called only for those 2 sections, not all 12

AC-7.3
GIVEN a revision comment "Add a clinical scenario for neonatal jaundice"
WHEN re-generation is triggered for that section
THEN the AI prompt includes the comment as a revision directive

AC-7.4
GIVEN re-generation completes for a revised section
WHEN the new content is stored
THEN it replaces only the revised section; the 10 approved sections retain their original content byte-for-byte

AC-7.5
GIVEN re-generation completes
WHEN the revised sections return to review
THEN their status is "pending_review" (not auto-approved)
```

### AC-8: Assembly Review Gate (FR-8)

```
AC-8.1
GIVEN a track where node 1 uses "patient" and node 3 uses "client" for the same concept
WHEN the terminology drift check runs
THEN a flag is raised identifying the inconsistent terms and the nodes involved

AC-8.2
GIVEN a track where the foundational level of node 2 references "advanced pharmacokinetics"
WHEN the difficulty inversion check runs
THEN a flag is raised identifying the inversion with the specific content block

AC-8.3
GIVEN a track with two content blocks containing >80% text similarity
WHEN the artifact redundancy check runs
THEN a flag is raised identifying the redundant blocks

AC-8.4
GIVEN a track where node 4 has no "advanced" depth-level content
WHEN the coverage gap check runs
THEN a flag is raised identifying the missing depth level for node 4

AC-8.5
GIVEN 3 assembly flags exist
WHEN the author dismisses 1 with justification "Intentional synonym for accessibility" and edits content to resolve the other 2
THEN all 3 flags show as resolved and the publish button becomes enabled

AC-8.6
GIVEN an assembly flag
WHEN the author attempts to dismiss it with an empty justification
THEN the dismiss action is rejected and the flag remains unresolved
```

### AC-9: Publish Transform (FR-9)

```
AC-9.1
GIVEN a track with 4 spine nodes, each with 3 depth levels of content
WHEN the author clicks "Publish"
THEN the system creates: 1 row in `courses`, 4 rows in `modules`, 12 rows in `lessons`, and corresponding rows in `lesson_content`

AC-9.2
GIVEN the publish transform runs
WHEN the modules are inspected
THEN their `sequence_order` matches the spine node ordering from the authoring track

AC-9.3
GIVEN the publish transform runs
WHEN the course row is inspected
THEN it has a generated slug, `published_at` is set to the current timestamp, and the authoring track status is "published"

AC-9.4
GIVEN the publish transform encounters a database error after inserting the course but before inserting modules
WHEN the transaction completes
THEN no rows exist in `courses`, `modules`, `lessons`, or `lesson_content` for that track (full rollback)

AC-9.5
GIVEN a track has been successfully published
WHEN a learner queries the Course Catalog API
THEN the published course appears in the results with correct title, domain, and module count

AC-9.6
GIVEN a track with status "published"
WHEN the author views it on the Track Dashboard
THEN the status column shows "published" and the row links to the published course detail, not the authoring pipeline
```

---

## §5 Constitution Compliance

### §I — Boundary Rules

- [x] **No external API calls** except listed §III exceptions
- [x] **Secrets in `.env` only** — `ANTHROPIC_API_KEY`, `DATABASE_URL`, `JWT_SECRET` never in source
- [x] **Interactive-only deploys** via curl webhook (no CI/CD auto-deploy)
- [x] **No learner PII sent to Claude** — AI prompts contain curriculum content only, no student data

### §II — Process Rules

- [x] **Spec-gate before code** — this spec is the gate artifact
- [x] **TDD Iron Law** — each AC becomes a failing test before implementation
- [x] **Fresh subagent per task** — tasks are independent units; no shared mutable state between subagent sessions
- [x] **Two-reviewer merge gate** — PRs require two approvals before merge to main

### §II-B — Security Controls

- [x] **P10 Input validation** — all Studio API endpoints validate request bodies via JSON schema; AI-generated content is sanitized before storage
- [x] **P11 Server-side authZ** — role checks enforced in Fastify route hooks, not client-side only (FR-1)
- [x] **P12 TLS** — all endpoints served over HTTPS; API key transmitted in Authorization header
- [x] **P13 Tenant isolation** — single-tenant for v1; authoring data scoped by `author_id`
- [x] **P14 Audit logging** — all state transitions (stage changes, trust claim status, publish events) logged with actor, timestamp, previous/new state
- [x] **P15 SBOM** — `npm ls --all --json` generated at build time and stored in repo
- [x] **P16 WCAG 2.2 AA** — Studio UI meets AA contrast, keyboard navigation, ARIA labels on interactive elements
- [x] **P17 AI governance** — AI-generated content is never auto-published; SME review gate is mandatory; trust claims require human verification; mock mode available for testing without API calls
- [x] **P18 Rate limiting** — existing Fastify rate limiter applies to Studio endpoints; AI generation endpoints have per-user throttle (max 5 concurrent generation requests)

### §III — Exceptions Used

| Exception | Justification |
|---|---|
| **Exception 1: Anthropic Claude API** | Server-side only. Used for skill decomposition (FR-4), content generation (FR-5), trust claim extraction (FR-5), and assembly review checks (FR-8). Falls back to mock when API key absent. No learner PII in prompts. |

---

## §6 Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-1 | What is the exact schema for the 238 catalogue template seed data (JSON structure, required fields)? | FR-3 implementation; seed script design | Sanju |
| OQ-2 | Should the assembly review gate checks (FR-8) use Claude API for semantic analysis, or should they be deterministic algorithms (string matching, Jaccard similarity)? API-based checks are more accurate but add cost and latency. | FR-8 implementation approach; cost model | Sanju |
| OQ-3 | What is the maximum acceptable latency for a full-track generation (all nodes, all depth levels)? Should generation be synchronous or queued via BullMQ? | FR-5 architecture; UX for long-running operations | Sanju |
| OQ-4 | Should published tracks be immutable, or can an author "unpublish" and revise? If revisable, what happens to learners mid-course? | Post-publish workflow; data integrity | Sanju + Gbitse |
| OQ-5 | What is the minimum trust claim verification threshold — must 100% of claims be verified, or is a configurable threshold acceptable (e.g., 95%)? | FR-6 gate strictness | Gbitse |
| OQ-6 | Should the revision loop (FR-7) have a maximum iteration count to prevent infinite cycles? | UX guardrails; cost control | Sanju |

---

## §7 Traceability

| FR | Acceptance Criteria | Task ID |
|---|---|---|
| FR-1 Auth Gate | AC-1.1, AC-1.2, AC-1.3, AC-1.4 | T-xxx |
| FR-2 Track Dashboard | AC-2.1, AC-2.2, AC-2.3, AC-2.4 | T-xxx |
| FR-3 Catalogue Templates | AC-3.1, AC-3.2, AC-3.3 | T-xxx |
| FR-4 AI Decomposition | AC-4.1, AC-4.2, AC-4.3, AC-4.4 | T-xxx |
| FR-5 AI Content Generation | AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5 | T-xxx |
| FR-6 Trust Claim Verification | AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5 | T-xxx |
| FR-7 SME Review & Revision Loop | AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5 | T-xxx |
| FR-8 Assembly Review Gate | AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6 | T-xxx |
| FR-9 Publish Transform | AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6 | T-xxx |