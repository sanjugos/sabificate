# GBITSE — Nigeria HR/OD Consulting Lead Intelligence Platform

## What This Is

A 4-phase agent-powered business intelligence system for a Nigeria-based HR/OD consulting firm. Built using Claude Code agents + SerpAPI for live data gathering.

## Data Files

### Phase 1: Source Discovery (30+ verified data sources)
- `data/sources/source-registry.json` — 30 Nigerian data sources ranked by tier, with URLs, access methods, costs, and ICP relevance

### Phase 2: Universe Catalog (168 companies)
- `data/companies/company-registry.json` — 168 Nigerian companies across 6 sectors, with employee estimates, ICP fit scores, and tier classifications
  - 37 banks (DMBs, merchant, non-interest)
  - 41 government agencies
  - 20 PFAs
  - 20 insurance companies
  - 30 conglomerates/industrials
  - 20 fintechs

### Phase 3: Contact Registry (54 named contacts)
- `data/contacts/contact-registry.json` — 54 named HR decision-makers with titles, LinkedIn URLs, email patterns, and confidence scores
  - 34 contacts across 12 banks
  - 20 contacts across government, conglomerates, fintechs, pensions

### Phase 4: Company Dossiers & Priority Matrix
- `data/dossiers/priority-matrix.json` — 16 company dossiers ranked by urgency, with buying triggers, recommended approach, opening lines, and estimated deal sizes

## Related Documents
- `/workspace/icps-nigeria-consulting.md` — 5 Ideal Customer Profiles
- `/workspace/agent-council-plan.md` — Full 5-phase architecture plan (includes Phase 5: Continuous Monitor)

## Top 5 Immediate Outreach Targets

| # | Company | Trigger | Contact | Urgency |
|---|---------|---------|---------|---------|
| 1 | Fidelity Bank | CEO succession 2026 | Charles Nwachukwu (CHRO) | IMMEDIATE |
| 2 | Access Bank | 3 C-suite exits, new CEO | Emeka Dibia (Head HR) | HIGH |
| 3 | NRS (ex-FIRS) | Complete institutional rebirth | Angel Fadahunsi (Director HCM) | CRITICAL |
| 4 | First Bank | New ED for transformation | Olumuyiwa Olulaja (Group Head HCM) | HIGH |
| 5 | Moniepoint | 500 unfilled roles, talent crisis | Chinaza Nduka-Dike (VP People) | CRITICAL |
