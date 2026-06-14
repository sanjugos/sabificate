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

## How Agents Should Use This Corpus

1. **Council agents (R1-R5):** Read the relevant domain file + cross-container references for your expertise area
2. **PRAXIS build agents:** Read existing-specs (for data models/APIs), technology-landscape (for stack decisions), curriculum-design (for UX requirements)
3. **All agents:** Read founding-docs for partnership constraints that affect architecture (data ownership, NDPA, Nigeria-First Covenant)
