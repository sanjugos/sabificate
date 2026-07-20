# SABIficate Project Corpus — Index

**Updated:** 2026-06-14
**Location:** `/workspace/corpus/`
**Purpose:** Complete knowledge base for SABIficate platform build — feeds council evaluation and PRAXIS build agents

---

## Corpus Domains

| # | Domain | Path | Description | Status |
|---|--------|------|-------------|--------|
| 1 | **Founding Docs** | `founding-docs/research.md` | Mark Otis's founding document packet — partnership, equity, governance, legal | Building |
| 2 | **Meeting Transcript** | `meeting-transcript/research.md` | June 11 1 Million Cups meeting transcript + action items | Complete |
| 3 | **Market Intelligence** | `market-intelligence/research.md` | 393 Nigerian companies, 327 contacts, ICP model, competitive landscape | Building |
| 4 | **Existing Specs** | `existing-specs/research.md` | Functional spec (21 features), tech spec, ZoneThree analysis — with pivot annotations | Building |
| 5 | **Education Ecosystem** | `education-ecosystem/research.md` | 50 education moats, EdTech pricing, PRAXIS methodology | Building |
| 6 | **Technology Landscape** | `technology-landscape/research.md` | PWA for Nigeria, Paystack APIs, Hetzner+Cloudflare, AI content generation | Building |
| 7 | **Regulatory** | `regulatory/research.md` | NDPA 2023, CAC registration, FCPA, trademark, payments regulation | Complete |
| 8 | **Curriculum Design** | `curriculum-design/research.md` | Problem-driven microlearning, adaptive difficulty, credential model, content pipeline | Complete |
| 9 | **Tiering Architecture v3.1** | `curriculum-design/tiering-v3.1.md` | Two-axis tiering (customer × proficiency), persona gateway, 7-stage pipeline, concept_id, exit credentials | Complete |
| 10 | **Curriculum Tool Walkthrough** | `curriculum-design/sabi-curriculum-tool-walkthrough.md` | SABI Curriculum Tool decomposition simulation — 7-stage prototype | Complete |
| 11 | **Learner Mobile Walkthrough** | `curriculum-design/sabi-learner-mobile-walkthrough.md` | SABI Learner Mobile Course — 5-block lesson model in action | Complete |

## Partner Documents (July 2026)

| # | Document | Path | Author | Status |
|---|----------|------|--------|--------|
| 12 | **Course Catalogue v1** | `catalog/course-catalogue-v1.md` | Gbitse Barrow | Complete |
| 13 | **Platform Spec v1** | `docs/platform-spec-v1.md` | Mark Otis | Complete |
| 14 | **NCCE Partnership Lead** | `partnership/ncce-opportunity.md` | Team meeting 2026-07-08 | Open |
| 15 | **Team Meeting 2026-07-08** | `meeting-transcript/meeting-2026-07-08.md` | All three partners | Complete |

| 16 | **Codebase Readiness Assessment** | `docs/codebase-readiness-assessment.md` | Engineering audit 2026-07-20 | Complete |

Source documents: `/workspace/SABIFICATE Course Catalogue v1. July 2026.docx` (87 KB), `/workspace/SABIficate_Platform_Development_Spec.docx` (38 KB)

## Build Specs (Praxis v2 — July 2026)

| # | Document | Path | Product | Status |
|---|----------|------|---------|--------|
| B1 | **Learner App v1 Spec** | `/workspace/specs/learner-app-v1-spec.md` | Learner App | For Review |
| B2 | **Curriculum Studio v1 Spec** | `/workspace/specs/curriculum-studio-v1-spec.md` | Curriculum Studio | For Review |
| B3 | **Praxis Spec Gate** | `/workspace/.specify/` | Both | In Progress |

## Cross-Container References

These files in other containers are relevant and readable:

| Resource | Path | Words |
|----------|------|-------|
| SABIficate Council Evaluation | `/workspaces/smarts/council/outputs/sabificate_evaluation.md` | 8,680 |
| Functional Spec | `/workspaces/refiner/docs/gbitse_functional_spec.md` | 16,186 |
| Tech Spec | `/workspaces/refiner/docs/gbitse_tech_spec.md` | 5,871 |
| ZoneThree Analysis | `/workspaces/refiner/docs/zonethree-learning-platform-analysis.md` | 7,317 |
| Education Ecosystem Moats | `/workspaces/smarts/corpus/education-ecosystem/research.md` | 17,327 |
| Equity Structures | `/workspaces/smarts/corpus/equity-structures/research.md` | 15,026 |
| Legal Entity Structure | `/workspaces/smarts/corpus/legal-entity-structure/research.md` | 8,323 |
| Council Methodology | `/workspaces/smarts/moat-engine/methodology/moat_discovery_methodology.md` | — |
| 280 Business Models | `/workspaces/refiner/library/kb_master_280_models.md` | 13,576 |

## Research Sweep — 2026-06-21

Deep research across 10 curriculum architecture topics. Each file contains key findings with sources, implementation insights, Nigerian context, and tools/libraries.

| # | Topic | Path | Findings | Insights |
|---|-------|------|----------|----------|
| R1 | **Paywall & Monetization** | `research-2026-06-21/paywall-monetization.md` | 8 | 8 |
| R2 | **Credential Verification** | `research-2026-06-21/credential-verification.md` | 8 | 9 |
| R3 | **Persona-Based Onboarding** | `research-2026-06-21/persona-onboarding.md` | 6 | 8 |
| R4 | **Adaptive Learning Systems** | `research-2026-06-21/adaptive-learning.md` | 8 | 8 |
| R5 | **B2B Learning Dashboards** | `research-2026-06-21/b2b-dashboards.md` | 8 | 8 |
| R6 | **B2B Hiring & Verification** | `research-2026-06-21/b2b-hiring-verification.md` | 8 | 8 |
| R7 | **AI Authoring Pipeline** | `research-2026-06-21/ai-authoring-pipeline.md` | 8 | 8 |
| R8 | **TTS & Audio Learning** | `research-2026-06-21/tts-audio-learning.md` | 7 | 8 |
| R9 | **Assembly Review & QA** | `research-2026-06-21/assembly-review-qa.md` | 9 | 8 |
| R10 | **Nigerian EdTech Market** | `research-2026-06-21/nigerian-edtech-market.md` | 9 | 8 |

## Course Corpora

Individual course knowledge bases for content-generation agents:

| # | Course | Path | Description | Status |
|---|--------|------|-------------|--------|
| 1 | **Better Business Presentations** | `courses/better-business-presentations.md` | Presentation frameworks, Nigerian business communication, slide design, delivery, executive communication | Complete |

## How Agents Should Use This Corpus

1. **Council agents (R1-R5):** Read the relevant domain file + cross-container references for your expertise area
2. **PRAXIS build agents:** Read existing-specs (for data models/APIs), technology-landscape (for stack decisions), curriculum-design (for UX requirements)
3. **All agents:** Read founding-docs for partnership constraints that affect architecture (data ownership, NDPA, Nigeria-First Covenant)
