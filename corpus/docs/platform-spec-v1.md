# Platform Development Spec v1 — Consolidated Build Reference

- Container: 512d85960490
- Domain: docs
- Opened: 2026-07-20
- Status: OPEN

## Question / Scope

Mark Otis's consolidated technical specification for the SABIficate platform: Studio, Library, LMS, and credential trust layer. Prepared for Sanju as the single build reference. Version 1.0, July 2026.

## Source

- File: `/workspace/SABIficate_Platform_Development_Spec.docx`
- Author: Mark Otis (compiled from existing SABIficate document set)
- Shared with team: 2026-07-14

## Key Architecture Decisions

### Three Systems, One Shared Library
1. **Studio** — produces and maintains content (intake, decomposition, generation, verification, translation, assembly review, lifecycle monitoring)
2. **Library** — shared Postgres store (JSONB documents, pgvector source materials, assets)
3. **LMS** — delivers content to learners, tracks progress. Owns only the delivery artifact and runtime learner state.

### Technology Stack (Decided)
- **Data:** Supabase Postgres, course/curriculum as JSONB
- **Source grounding:** pgvector in same Postgres instance
- **Auth:** Supabase Auth with actorRef (account_id, role, org_id)
- **Storage:** Supabase Storage for media/artifacts (signed-URL access)
- **Front end:** React/Next.js or SvelteKit (open, decide before Phase 0)
- **AI pipeline:** Server-side staged jobs (decomposition, generation, verification, translation)
- **CMS:** Explicitly rejected — no headless CMS, no generic LMS authoring tool

### Three Schemas (Contract)
1. `course.schema.v1.json` — single 10-15 minute unit with brief, content, artifact, credential rule, verification state
2. `curriculum.schema.v1.json` — credential track (skill decomposed into competencies, each mapped to a course)
3. `delivery.schema.v1.json` — published learner-facing artifact (ONLY schema the LMS reads)

### Six Structural Pillars
1. **Translation** — LocalizedText (keyed by language code: en-NG, en, ha, yo, ig, pcm)
2. **Context variants** — linked documents, not branches (Nigerian vs Kenyan as separate courses sharing concept_id)
3. **Trust** — SourcedClaim (every factual assertion cites a source or is flagged unsourced)
4. **Assets** — explicit lifecycle (n/a, scripted, in_production, produced, rejected). Text-first for v1.
5. **Telemetry** — itemTelemetry (per assessment item: attempts, p-value, mean time, distractor rates)
6. **Identity/workflow/audit** — actorRef, workflow state transitions, append-only audit_log

### Two-Axis Pedagogy Model
- **Axis 1:** customer_tier (b2c_free / b2b_hiring / b2b_upskilling / premium) — sets packaging/monetization
- **Axis 2:** proficiency_level (beginner / intermediate / advanced) — picks depth variant
- Default: packaging_only (identical content, only wrapper differs) — lean-ops margin discipline

### Studio-to-LMS Boundary (Most Consequential Decision)
- Studio publishes a clean, stripped, versioned delivery artifact at the `published` transition
- The LMS sees ONLY the delivery schema, never the production schema
- Resolution (persona/tier/proficiency/locale) happens on the Studio side, not in the LMS
- Keeps proprietary pedagogy on Studio side, lets production schema churn without breaking delivery

## Production Pipeline (5 Stages)

1. **Skill intake & decomposition** — break skill into competencies, AI coherence check, SME approves map
2. **Course production** — brief, clarify, draft, review, approve (v0.1 loop, now batchable)
3. **Verification** — claim extraction, retrieval-grounded checking, blocks on unresolved regulatory claims. **Cannot be bypassed by editorial approval.**
4. **Translation** — post-verification only, machine-draft with human review, stale-detection
5. **Assembly & lifecycle** — end-to-end skill playthrough, source-freshness monitoring

## Credential Verification

### Evidence Tiers
- **completion_badge** — self_attested, honestly labeled ("completed and self-attested," never "verified")
- **verified_certificate** — rubric_scored + employer_witnessed (or project_verified). Hiring-grade signal.
- **professional_certificate** — rubric_scored + depth_indicated. CPD credit.
- **team_completion_record** — self_attested_rollup. Employer dashboard.

### Proctoring Keystone
Employer-witnessed confirmation for B2B: the sponsoring manager confirms the learner did the work. Solves proctoring + artifact authenticity + identity at zero marginal cost.

## Security Requirements (Section 12)
- Credential URL permanence (stable, HTTPS-only, HSTS, non-enumerable)
- NDPA compliance (Nigeria Data Protection Act)
- Artifact confidentiality (artifact_view_url defaults to withheld, encrypted at rest, signed URLs)
- AI proxy hardening (bearer token, WAF rate limit, server-side keys only)
- Tenancy isolation (Supabase RLS keyed by org_id)
- Audit log immutability at database layer

## Roadmap (Phase 0-5)

| Phase | Builds | Exit Criterion |
|-------|--------|----------------|
| 0 — Migration | Supabase, port front-end, server-side jobs, delivery boundary, actorRef, workflow, audit log | SME authors complete course on new platform |
| 1 — Schema & source store | Lock schema with app team, pgvector source store, media posture decision | Schema ratified, sources retrievable |
| 2 — Verification | Claim extraction, grounded checking, regulatory claim blocking | Cannot reach verified with unresolved regulatory claim |
| 3 — Throughput | Batch decomposition-to-draft, review queue, metrics, coherence pass | Full skill to verified courses without per-course shepherding |
| 4 — Translation & variants | Post-verification translation, stale-detection, context variants, concept_id reuse | Verified English course ships approved Hausa rendering |
| 5 — Lifecycle & app | Telemetry from app, lifecycle monitor, source-freshness, needs_review/deprecated | Source update flags dependent courses for re-verification |

## Open Questions (Section 15)
- Front-end framework: React/Next.js vs SvelteKit
- Blockchain-anchored credentials: deferred unless partner requires it
- Mobile push alerts: candidate for Phase 5
- Unit economics model: not yet documented, needed before any capital/pilot conversation
- Regulatory-claim staleness on issued credentials: no defined notification path yet

## What NOT to Build (Section 14)
- Multi-SME role hierarchies beyond actorRef.role
- Permission-heavy workflow engine
- Standalone ops/QA console
- Employer accounts or ATS integration
- Third-party proctoring by default
- Blockchain credentials (unless partner requires)
- Learner-facing delivery platform (until team size changes)

## Verdict
_On close run: corpus-close platform-spec-v1 <GO|CONDITIONAL_GO|NO_GO> <confidence%>_
