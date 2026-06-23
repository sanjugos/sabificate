# GBITSE Agent Council — Nigeria HR/OD Lead Intelligence Platform

## Architecture Plan v1.0

Created: 2026-05-30
Based on patterns from: TradeCircle (swarm), Coryphaeus (BD scanner), Refiner (councils), Library (opportunity monitor)

---

## System Overview

```
PHASE 1: SOURCE DISCOVERY COUNCIL (one-time + periodic refresh)
    13 specialist agents deliberate on Nigerian data sources
    Output: Ranked source registry with access methods
         |
         v
PHASE 2: UNIVERSE CATALOGER (swarm — runs weekly)
    Sector agents crawl discovered sources in parallel
    Output: Company registry (firmographics, sector, size, HQ)
         |
         v
PHASE 3: CONTACT & PERSONA MAPPER (per-company — runs after cataloging)
    Enrichment agents find decision-makers per company
    Output: Contact registry (name, title, email, LinkedIn, phone)
         |
         v
PHASE 4: COMPANY INTELLIGENCE AGENTS (per-sector — runs daily)
    Deep-research agents build dossiers per company
    Output: Pain points, buying triggers, procurement notes, approach strategy
         |
         v
PHASE 5: CONTINUOUS MONITOR (cron — runs every 6 hours)
    News + social + regulatory watchers detect events
    Output: Trigger alerts, lead rescoring, digest emails
```

---

## PHASE 1: SOURCE DISCOVERY COUNCIL

**Pattern:** Refiner NeuroCouncil (3-round deliberation)
**Frequency:** One-time at launch, refresh quarterly
**Purpose:** Systematically discover every free/low-cost data source for Nigerian business intelligence

### Agent Roster (7 specialists + 1 synthesizer)

```
┌─────────────────────────────────────────────────────────────────┐
│  ROUND 1 (Blind, Parallel) — Each agent researches independently │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GOV-REG    Government & regulatory data sources                │
│  CORP-REG   Corporate registries & filings                      │
│  FIN-DATA   Financial & banking sector data                     │
│  SOCIAL     Social media & professional networks                │
│  NEWS-PR    News, press releases, media monitoring              │
│  INDUSTRY   Industry associations & events                      │
│  OSINT      Open-source intelligence & web scraping             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ROUND 2 (Cross-Pollination) — Agents see R1 outputs, refine   │
├─────────────────────────────────────────────────────────────────┤
│  ROUND 3 (Synthesis) — SOURCE-SYNTH produces ranked registry   │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Definitions

#### GOV-REG — Government & Regulatory Sources Agent
```
Provider: Perplexity (web search enabled)
Temperature: 0.3
Domain: Nigerian government data, regulators, policy

MISSION: Discover every free/low-cost government and regulatory data source
relevant to identifying Nigerian companies with 200+ employees.

REQUIRED OUTPUT:
- Federal agencies with public data (CBN, SEC Nigeria, PENCOM, CAC, FIRS, BPP)
- State government portals (Lagos, Abuja/FCT)
- Regulatory filings and compliance databases
- Budget and procurement portals
- For each source: URL, data available, access method (API/scrape/manual),
  update frequency, cost (free/paid), reliability rating (1-5)

ANTI-HALLUCINATION: You have web search. Verify every URL exists.
Do not invent government portals. If uncertain, mark "UNVERIFIED".
```

#### CORP-REG — Corporate Registries Agent
```
Provider: Perplexity (web search enabled)
Temperature: 0.3
Domain: Company registration, filings, corporate directories

MISSION: Discover sources for cataloging Nigerian companies — registrations,
annual returns, director listings, and corporate structures.

REQUIRED OUTPUT:
- CAC (Corporate Affairs Commission) data access methods
- NGX (Nigerian Exchange Group) listed company filings
- Chamber of Commerce directories (LCCI, Abuja CCI, NACCIMA)
- Industry association member lists
- Business directories (Nigerian Yellow Pages, VConnect, etc.)
- International databases with Nigerian coverage (Dun & Bradstreet, Orbis)
- For each: URL, data fields available, access method, cost
```

#### FIN-DATA — Financial & Banking Sector Agent
```
Provider: Perplexity (web search enabled)
Temperature: 0.3
Domain: Banking, insurance, pension, fintech data

MISSION: Discover data sources specific to Nigerian financial services —
the primary ICP sector.

REQUIRED OUTPUT:
- CBN licensed institutions lists (DMBs, merchant banks, microfinance)
- PENCOM licensed PFA/PFC lists
- NAICOM (insurance) licensed companies
- SEC Nigeria registered entities
- FMDQ, NGX listed companies with annual reports
- Fintech directories and funding databases
- For each: URL, data fields, update frequency, access method
```

#### SOCIAL — Social Media & Professional Networks Agent
```
Provider: Claude Sonnet
Temperature: 0.4
Domain: LinkedIn, Twitter/X, professional communities in Nigeria

MISSION: Map professional networking and social channels where Nigerian
HR Directors, L&D Managers, and Talent Specialists are active.

REQUIRED OUTPUT:
- LinkedIn search strategies (Sales Navigator vs free)
- Nigerian HR professional groups and communities
- Twitter/X accounts and hashtags for Nigerian business/HR
- WhatsApp/Telegram groups (business networking)
- CIPM (Chartered Institute of Personnel Mgmt) online presence
- SHRM Nigeria chapter
- Podcast directories, YouTube channels, webinar platforms
- For each: reach estimate, cost, data extractable, automation potential
```

#### NEWS-PR — News & Press Release Sources Agent
```
Provider: Perplexity (web search enabled)
Temperature: 0.3
Domain: Nigerian business news, press, media monitoring

MISSION: Discover news and media sources for monitoring Nigerian companies
for leadership changes, M&A, restructuring, and other buying triggers.

REQUIRED OUTPUT:
- Business news outlets (BusinessDay, The Guardian Nigeria, Punch, ThisDay,
  Vanguard, Nairametrics, TechCabal, Disrupt Africa)
- RSS feed availability for each
- Press release wires serving Nigeria
- Google News RSS strategies for Nigerian companies
- Google Alerts configuration for monitoring
- For each: URL, RSS feed URL if available, scraping feasibility, cost
```

#### INDUSTRY — Industry Associations & Events Agent
```
Provider: Perplexity (web search enabled)
Temperature: 0.3
Domain: Nigerian industry bodies, conferences, trade shows

MISSION: Discover industry associations, conferences, and events where
target companies and personas gather.

REQUIRED OUTPUT:
- HR/OD conferences in Nigeria (CIPM annual conference, HR Tech Lagos, etc.)
- Banking/finance conferences (FITC events, CBN conferences)
- General business events (Lagos Business School events, Nigerian Economic
  Summit Group)
- Industry association member directories
- Event attendee lists (availability and access)
- Speaker/panelist databases
- For each: frequency, attendee count, data availability, cost
```

#### OSINT — Open Source Intelligence Agent
```
Provider: Claude Sonnet
Temperature: 0.4
Domain: Web scraping, data extraction, alternative data

MISSION: Identify unconventional and creative data sources for Nigerian
company and contact intelligence.

REQUIRED OUTPUT:
- Job posting sites (Jobberman, MyJobMag, LinkedIn Jobs) as signals
- Company career pages as intelligence source
- Glassdoor Nigeria / company review sites
- Court filings and legal databases
- Domain registration (WHOIS) for Nigerian companies
- Google Maps / business listings
- Academic/research databases (Nigerian universities, LBSN)
- For each: data extractable, scraping method, legal considerations, cost
```

#### SOURCE-SYNTH — Synthesis Agent (Round 3 only)
```
Provider: Claude Opus
Temperature: 0.2
Domain: Synthesis and prioritization

MISSION: Integrate all specialist findings into a single ranked source registry.

REQUIRED OUTPUT:
§1. TIER 1 SOURCES (free, high-value, automatable) — ranked list
§2. TIER 2 SOURCES (free, moderate-value, some manual effort)
§3. TIER 3 SOURCES (low-cost paid, high-value)
§4. SOURCE-TO-ICP MAPPING — which sources serve which ICP best
§5. RECOMMENDED COLLECTION SCHEDULE — daily/weekly/monthly per source
§6. TECHNICAL IMPLEMENTATION NOTES — API vs scrape vs manual per source
§7. GAPS & RISKS — what we can't get, legal risks, data quality concerns

CONFLICT RESOLUTION:
- GOV-REG overrides OSINT on regulatory data accuracy
- FIN-DATA overrides CORP-REG on financial institution lists
- SOCIAL overrides INDUSTRY on professional networking channels
- Round 2 updates override Round 1 positions
```

### Output Schema: Source Registry

```typescript
interface DataSource {
  id: string;                    // e.g., "cac-company-search"
  name: string;                  // "CAC Company Search Portal"
  category: "government" | "corporate" | "financial" | "social" | "news" | "industry" | "osint";
  url: string;
  description: string;
  dataFields: string[];          // ["company_name", "directors", "registration_date", ...]
  accessMethod: "api" | "scrape" | "rss" | "manual" | "download";
  cost: "free" | "freemium" | "paid";
  costDetails?: string;          // "$50/month" or "free with registration"
  updateFrequency: "realtime" | "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  reliability: 1 | 2 | 3 | 4 | 5;
  automatable: boolean;
  icpRelevance: string[];        // ["banks", "government", "pensions"]
  legalNotes?: string;
  tier: 1 | 2 | 3;
  collectionSchedule: "6h" | "daily" | "weekly" | "monthly";
  discoveredBy: string;          // agent ID
  verifiedUrl: boolean;
}
```

---

## PHASE 2: UNIVERSE CATALOGER

**Pattern:** TradeCircle Swarm Orchestrator (parallel sector agents)
**Frequency:** Full scan weekly, incremental daily
**Purpose:** Build and maintain a registry of every Nigerian company matching our ICP criteria

### Swarm Architecture

```
┌──────────────────────────────────────┐
│      UNIVERSE SWARM ORCHESTRATOR     │
│  Concurrency: 3 sector agents       │
│  Error: catch-per-sector, continue   │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  │ BANK-CAT │  │ GOV-CAT  │  │ PENSION  │
│  │ Agent    │  │ Agent    │  │ CAT Agent│
│  └──────────┘  └──────────┘  └──────────┘
│                                      │
│  ┌──────────┐  ┌──────────┐          │
│  │ CONGLOM  │  │ FINTECH  │          │
│  │ CAT Agent│  │ CAT Agent│          │
│  └──────────┘  └──────────┘          │
│                                      │
│  Results → Deduplicate → Score → DB  │
└──────────────────────────────────────┘
```

### Sector Agent Template

Each sector agent follows the TradeCircle category-agent pattern:

```typescript
interface SectorAgentConfig {
  sector: "banking" | "government" | "pension_insurance" | "conglomerates" | "fintech";
  sources: DataSource[];         // From Phase 1 registry, filtered by icpRelevance
  employeeMinimum: 200;
  geographies: ["Lagos", "Abuja", "Port Harcourt", "Nationwide"];
  maxResults: number;
}

// Each agent executes:
// 1. Query sources for companies in this sector
// 2. Parse company details from each source
// 3. Cross-reference across sources (entity resolution)
// 4. Enrich with additional data (employee count estimates, HQ location)
// 5. Deduplicate (by CAC registration number or company name + location)
// 6. Return standardized CompanyRecord[]
```

### Sector-Specific Source Mapping

| Sector Agent | Primary Sources | Secondary Sources |
|---|---|---|
| **BANK-CAT** | CBN licensed banks list, NGX filings, SEC Nigeria | BusinessDay rankings, LinkedIn company pages |
| **GOV-CAT** | BPP vendor registry, federal budget docs, agency websites | Google News, government gazettes |
| **PENSION-CAT** | PENCOM licensed PFAs, NAICOM licensed insurers | Industry association directories |
| **CONGLOM-CAT** | NGX listed companies, CAC search, Forbes Africa | Annual reports, news archives |
| **FINTECH-CAT** | TechCabal directory, Disrupt Africa, Crunchbase | LinkedIn, Twitter/X, job boards |

### Output Schema: Company Registry

```typescript
interface CompanyRecord {
  id: string;                       // cuid
  name: string;                     // "Stanbic IBTC Holdings"
  tradingName?: string;             // "Stanbic IBTC"
  cacNumber?: string;               // CAC registration (dedup key)
  sector: Sector;
  subSector?: string;               // "Commercial Banking", "Pension Fund Administration"
  employeeEstimate: number;         // 2500
  employeeSource: string;           // "LinkedIn" | "annual_report" | "estimated"
  hqCity: string;                   // "Lagos"
  hqArea?: string;                  // "Victoria Island"
  hqState: string;                  // "Lagos"
  website?: string;
  linkedinUrl?: string;
  parentCompany?: string;           // "Standard Bank Group"
  ownership: "public" | "private" | "government" | "ngo";
  ngxListed: boolean;
  revenue?: string;                 // "N100B+" or specific if available
  yearFounded?: number;
  description?: string;

  // Scoring
  icpFitScore: number;              // 0-100 composite
  icpFitTier: "hot" | "warm" | "cool" | "watch";
  icpFitFlags: string[];            // ["existing_client", "200+_employees", "lagos_hq"]

  // Metadata
  sources: string[];                // ["cbn_licensed_banks", "ngx_filings"]
  rawData: Record<string, any>;     // Original API/scrape responses
  discoveredAt: Date;
  updatedAt: Date;
  status: "new" | "enriched" | "contacted" | "client";
}
```

### Company Scoring Model (adapted from TradeCircle podFitScore)

```typescript
function calculateIcpFitScore(company: CompanyRecord): number {
  let score = 0;
  const flags: string[] = [];

  // Size signals
  if (company.employeeEstimate >= 1000) { score += 15; flags.push("1000+_employees"); }
  else if (company.employeeEstimate >= 500) { score += 12; flags.push("500+_employees"); }
  else if (company.employeeEstimate >= 200) { score += 8; flags.push("200+_employees"); }

  // Location signals
  if (["Lagos", "Abuja"].includes(company.hqCity)) { score += 10; flags.push("primary_city_hq"); }
  else if (company.hqState === "Lagos" || company.hqState === "FCT") { score += 7; }

  // Sector signals
  if (company.sector === "banking") { score += 12; flags.push("priority_sector"); }
  else if (company.sector === "government") { score += 10; flags.push("priority_sector"); }
  else if (company.sector === "pension_insurance") { score += 10; }
  else if (company.sector === "conglomerates") { score += 8; }
  else if (company.sector === "fintech") { score += 6; }

  // Structure signals
  if (company.ngxListed) { score += 5; flags.push("ngx_listed"); }
  if (company.parentCompany) { score += 3; flags.push("subsidiary"); }
  if (company.ownership === "government") { score += 5; flags.push("government_entity"); }

  // Known client check
  if (KNOWN_CLIENTS.includes(company.name)) { score += 15; flags.push("existing_client"); }

  // Website presence
  if (company.website) { score += 3; }
  if (company.linkedinUrl) { score += 2; }

  // Tier assignment
  const tier = score >= 60 ? "hot" : score >= 40 ? "warm" : score >= 25 ? "cool" : "watch";

  return { score: Math.min(score, 100), tier, flags };
}
```

---

## PHASE 3: CONTACT & PERSONA MAPPER

**Pattern:** Coryphaeus Contact Intelligence + OSINT modules
**Frequency:** Runs per-company after cataloging, refresh monthly
**Purpose:** Find named decision-makers for each company matching our target personas

### Agent Architecture

```
┌─────────────────────────────────────────────┐
│         CONTACT DISCOVERY PIPELINE          │
│                                             │
│  For each CompanyRecord where               │
│  icpFitTier in ("hot", "warm"):             │
│                                             │
│  Step 1: LINKEDIN-SCOUT                     │
│    Search LinkedIn for target titles         │
│    at this company                           │
│                                             │
│  Step 2: WEB-SCOUT                          │
│    Google "[company] HR Director"            │
│    Check company website /about /team        │
│    Check press releases for named leaders    │
│                                             │
│  Step 3: SOCIAL-SCOUT                       │
│    Twitter/X bio search                      │
│    CIPM member directory search              │
│    Conference speaker lists                  │
│                                             │
│  Step 4: CONTACT-ENRICHER                   │
│    Email pattern detection (first.last@co)   │
│    Phone number discovery                    │
│    Validate email deliverability             │
│                                             │
│  Step 5: PERSONA-CLASSIFIER                 │
│    Map each contact to target persona        │
│    Score contact quality (0-100)             │
│    Generate approach notes                   │
│                                             │
│  Output → ContactRecord[]                   │
└─────────────────────────────────────────────┘
```

### Target Persona Search Patterns

```typescript
const TARGET_PERSONAS: PersonaConfig[] = [
  {
    id: "hr-director",
    titles: [
      "HR Director", "Chief People Officer", "Chief Human Resources Officer",
      "Group Head HR", "Group Head Human Resources", "ED Human Capital",
      "Executive Director Human Resources", "VP People", "VP Human Resources",
      "Director Human Resources", "Director Admin & HR", "Head of HR"
    ],
    priority: 1,  // Primary decision maker
    searchQueries: (company: string) => [
      `"${company}" "HR Director" OR "Chief People Officer" OR "Head of HR" site:linkedin.com`,
      `"${company}" "HR Director" OR "Chief People Officer" Nigeria`,
    ]
  },
  {
    id: "ld-manager",
    titles: [
      "L&D Manager", "Head of Learning", "Learning and Development Manager",
      "Training Manager", "Capability Development Lead", "Head Training",
      "Director Capacity Building", "Head of Learning and Development"
    ],
    priority: 2,
    searchQueries: (company: string) => [
      `"${company}" "Learning and Development" OR "L&D" OR "Training Manager" site:linkedin.com`,
    ]
  },
  {
    id: "talent-specialist",
    titles: [
      "Talent Management", "Head of Talent", "Talent Acquisition",
      "HR Business Partner", "Talent & OD Manager", "Head of Talent Development"
    ],
    priority: 2,
    searchQueries: (company: string) => [
      `"${company}" "Talent Management" OR "Talent Acquisition" Nigeria site:linkedin.com`,
    ]
  },
  {
    id: "strategy-manager",
    titles: [
      "Head of Corporate Strategy", "Strategy Manager", "Chief Strategy Officer",
      "Business Transformation Lead", "Head Reform Coordination",
      "Director Strategy and Planning"
    ],
    priority: 3,
    searchQueries: (company: string) => [
      `"${company}" "Corporate Strategy" OR "Strategy Manager" Nigeria site:linkedin.com`,
    ]
  },
  {
    id: "corp-comms",
    titles: [
      "Corporate Communications Manager", "Head of Corporate Affairs",
      "Internal Communications Lead", "Director Information",
      "Head Public Affairs", "VP Corporate Affairs"
    ],
    priority: 3,
    searchQueries: (company: string) => [
      `"${company}" "Corporate Communications" OR "Corporate Affairs" Nigeria site:linkedin.com`,
    ]
  }
];
```

### Output Schema: Contact Registry

```typescript
interface ContactRecord {
  id: string;
  companyId: string;              // FK to CompanyRecord
  companyName: string;

  // Identity
  fullName: string;
  firstName?: string;
  lastName?: string;
  title: string;                  // Current job title
  personaMatch: PersonaId;        // "hr-director" | "ld-manager" | etc.

  // Contact channels
  email?: string;
  emailVerified: boolean;
  phone?: string;
  linkedinUrl?: string;
  twitterHandle?: string;

  // Intelligence (populated by Phase 4)
  careerHistory?: string;         // Previous roles
  education?: string;
  certifications?: string[];      // CIPM, SHRM, etc.
  speakingHistory?: string[];     // Conferences spoken at
  publications?: string[];        // Articles, papers

  // Scoring
  contactScore: number;           // 0-100 quality score
  contactScoreFactors: string[];  // ["verified_email", "linkedin_found", "cipm_member"]

  // Metadata
  sources: string[];
  discoveredAt: Date;
  updatedAt: Date;
  status: "new" | "researched" | "contacted" | "engaged";
}
```

---

## PHASE 4: COMPANY INTELLIGENCE AGENTS

**Pattern:** Coryphaeus BD Scanner + Refiner Probe Council (hybrid)
**Frequency:** Deep research on "hot" companies weekly, "warm" monthly
**Purpose:** Build comprehensive dossiers with pain points, buying triggers, procurement notes, approach strategy

### Agent Architecture: Per-Company Intelligence Council

For each company with `icpFitTier === "hot"`, run a mini-council:

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPANY INTELLIGENCE COUNCIL (per company)                     │
│                                                                 │
│  ROUND 1 (Parallel, Blind) — 4 specialists                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐
│  │ CORP-ANALYST │ │ HR-ANALYST   │ │ NEWS-ANALYST │ │ PROC-SPEC  │
│  │ Financials,  │ │ HR structure,│ │ Recent news, │ │ Procurement│
│  │ strategy,    │ │ L&D maturity,│ │ M&A, leader- │ │ rules,     │
│  │ org structure│ │ pain points  │ │ ship changes │ │ BPP, RFPs  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘
│                                                                 │
│  ROUND 2 (Cross-Pollination) — Agents refine with peer context  │
│                                                                 │
│  ROUND 3 (Synthesis) — DOSSIER-SYNTH produces company brief     │
└─────────────────────────────────────────────────────────────────┘
```

### Specialist Agent Definitions

#### CORP-ANALYST — Corporate & Financial Analyst
```
Provider: Perplexity (web search)
Temperature: 0.3

MISSION: Research [COMPANY] corporate profile, financial performance,
organizational structure, and strategic direction.

REQUIRED OUTPUT:
§1. COMPANY OVERVIEW — founding, ownership, subsidiaries, HQ, branches
§2. FINANCIAL SNAPSHOT — revenue, profitability, recent results, NGX performance
§3. ORGANIZATIONAL STRUCTURE — divisions, reporting lines, board composition
§4. STRATEGIC DIRECTION — recent strategic plan, expansion, transformation
§5. COMPETITIVE POSITION — market share, peer comparison, strengths/weaknesses
```

#### HR-ANALYST — HR & Talent Landscape Analyst
```
Provider: Perplexity (web search)
Temperature: 0.3

MISSION: Research [COMPANY] HR function maturity, talent challenges,
L&D programs, and HR consulting needs.

REQUIRED OUTPUT:
§1. HR LEADERSHIP — who runs HR, their background, tenure
§2. TALENT CHALLENGES — attrition signals, Glassdoor reviews, hiring patterns
§3. L&D MATURITY — existing training programs, corporate university, certifications
§4. CONSULTING HISTORY — known consulting engagements (Big 4, local firms)
§5. PAIN POINTS — specific HR/talent challenges inferred from signals
§6. BUYING TRIGGERS — events that would trigger consulting procurement
```

#### NEWS-ANALYST — News & Event Monitor
```
Provider: Perplexity (web search)
Temperature: 0.3

MISSION: Find recent news (last 90 days) about [COMPANY] relevant to
HR/OD consulting opportunities.

REQUIRED OUTPUT:
§1. LEADERSHIP CHANGES — new CEO, CHRO, board appointments
§2. M&A & RESTRUCTURING — mergers, acquisitions, reorganizations
§3. EXPANSION — new offices, products, markets, headcount growth
§4. REGULATORY — compliance actions, regulatory changes affecting them
§5. CULTURE & EMPLOYER BRAND — awards, Glassdoor, employer branding activity
§6. TRIGGER ASSESSMENT — which of these create consulting opportunities
```

#### PROC-SPEC — Procurement Specialist
```
Provider: Claude Sonnet
Temperature: 0.3

MISSION: Determine how [COMPANY] procures consulting services, based on
its type (public, private, government) and sector.

REQUIRED OUTPUT:
§1. PROCUREMENT PATHWAY — how to become a vendor
§2. BUDGET CYCLE — when budgets are set, when to approach
§3. REQUIRED DOCUMENTS — TCC, CAC, PENCOM, BPP registration if applicable
§4. DECISION CHAIN — who approves consulting engagements, typical sign-off levels
§5. PAYMENT TERMS — typical payment cycles, advance payment norms
§6. ENTRY STRATEGY — recommended approach (referral, cold, event, RFP)
```

#### DOSSIER-SYNTH — Synthesis Agent (Round 3)
```
Provider: Claude Opus
Temperature: 0.2

MISSION: Synthesize all specialist findings into a single company intelligence
brief optimized for sales outreach.

REQUIRED OUTPUT:
§1. EXECUTIVE SUMMARY (3 sentences)
§2. WHY THEY NEED US — top 3 pain points mapped to our offerings
§3. WHEN TO APPROACH — specific timing based on budget cycle + triggers
§4. WHO TO CONTACT — prioritized list of personas with approach angles
§5. HOW TO ENTER — recommended procurement pathway + entry strategy
§6. WHAT TO PROPOSE — suggested initial engagement (scope, size, duration)
§7. RISKS & OBJECTIONS — anticipated pushback and responses
§8. COMPETITIVE THREATS — which competitors might also be pitching

CONFLICT RESOLUTION:
- PROC-SPEC overrides all on procurement pathway accuracy
- HR-ANALYST overrides CORP-ANALYST on talent-specific claims
- NEWS-ANALYST overrides all on recency (latest events win)
```

### Output Schema: Company Dossier

```typescript
interface CompanyDossier {
  id: string;
  companyId: string;
  companyName: string;
  sector: Sector;

  // Synthesis output
  executiveSummary: string;
  painPoints: PainPoint[];
  buyingTriggers: BuyingTrigger[];
  procurementNotes: ProcurementNotes;
  approachStrategy: ApproachStrategy;
  competitorThreats: string[];

  // Per-contact approach
  contactApproaches: ContactApproach[];

  // Raw agent outputs (for audit)
  corpAnalysis: string;
  hrAnalysis: string;
  newsAnalysis: string;
  procAnalysis: string;
  synthesisOutput: string;

  // Scoring
  opportunityScore: number;        // 0-100 overall opportunity
  urgencyScore: number;            // 0-100 time sensitivity
  readinessScore: number;          // 0-100 buyer readiness

  // Cost tracking
  totalCost: number;
  totalTokens: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  status: "pending" | "complete" | "failed";
}

interface PainPoint {
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;                  // Agent that identified it
  offeringMatch: string;           // Which service addresses this
}

interface BuyingTrigger {
  event: string;
  detected: boolean;
  dateDetected?: Date;
  urgency: "immediate" | "near_term" | "future";
  source: string;
}

interface ProcurementNotes {
  pathway: string;
  budgetCycle: string;
  requiredDocuments: string[];
  decisionChain: string;
  paymentTerms: string;
  entryStrategy: string;
}

interface ContactApproach {
  contactId: string;
  contactName: string;
  persona: PersonaId;
  openingLine: string;
  talkingPoints: string[];
  bestChannel: "email" | "linkedin" | "phone" | "event";
  bestTiming: string;
}
```

---

## PHASE 5: CONTINUOUS MONITOR

**Pattern:** Pioneer Fund Opportunity Monitor (collect → match → score → digest)
**Frequency:** Every 6 hours
**Purpose:** Detect buying triggers, news events, and leadership changes to update lead scores

### Monitor Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              CONTINUOUS MONITOR (cron: every 6h)                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  COLLECTORS (parallel)                               │        │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐       │        │
│  │  │ Google News│ │ RSS Feeds  │ │ LinkedIn   │       │        │
│  │  │ Collector  │ │ Collector  │ │ Job Monitor│       │        │
│  │  └────────────┘ └────────────┘ └────────────┘       │        │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐       │        │
│  │  │ Regulatory │ │ Social     │ │ BPP/Tender │       │        │
│  │  │ Monitor    │ │ Monitor    │ │ Monitor    │       │        │
│  │  └────────────┘ └────────────┘ └────────────┘       │        │
│  └─────────────────────────────────────────────────────┘        │
│                          │                                      │
│                          v                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  PROCESSORS                                         │        │
│  │  1. Deduplicate (URL-based + semantic)              │        │
│  │  2. Match to known companies                        │        │
│  │  3. Classify event type (trigger detection)         │        │
│  │  4. Score impact on lead opportunity                │        │
│  │  5. Update company/contact scores                   │        │
│  └─────────────────────────────────────────────────────┘        │
│                          │                                      │
│                          v                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  OUTPUTS                                            │        │
│  │  - Database update (event log, score changes)       │        │
│  │  - Email digest (hot triggers only)                 │        │
│  │  - Dashboard update (all events)                    │        │
│  │  - Webhook (Slack/WhatsApp notification)            │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Collector Definitions

#### Google News Collector
```typescript
// Adapted from Pioneer Fund pattern
const COMPANY_QUERIES = registeredCompanies.map(company => ({
  name: company.name,
  queries: [
    `"${company.name}" CEO OR "Managing Director" OR appointment OR restructuring`,
    `"${company.name}" training OR "human resources" OR "talent" OR "capacity building"`,
    `"${company.name}" expansion OR acquisition OR merger OR partnership`,
  ]
}));

// RSS endpoint: https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-NG&gl=NG
// Rate limit: 2 seconds between queries
// Max age: 7 days
// Filter: exclude social media domains
```

#### RSS Feed Collector
```typescript
const NIGERIA_BUSINESS_FEEDS = [
  { name: "BusinessDay", url: "https://businessday.ng/feed/", industries: ["all"] },
  { name: "Nairametrics", url: "https://nairametrics.com/feed/", industries: ["finance", "economy"] },
  { name: "TechCabal", url: "https://techcabal.com/feed/", industries: ["fintech", "tech"] },
  { name: "ThisDay", url: "https://www.thisdaylive.com/feed/", industries: ["all"] },
  { name: "The Guardian NG", url: "https://guardian.ng/feed/", industries: ["all"] },
  { name: "Punch", url: "https://punchng.com/feed/", industries: ["all"] },
  { name: "Vanguard", url: "https://www.vanguardngr.com/feed/", industries: ["all"] },
];
```

#### LinkedIn Job Monitor
```typescript
// Monitor target companies for HR/L&D job postings (buying signal)
const JOB_SIGNALS = [
  "HR Director",
  "Chief People Officer",
  "Head of Learning",
  "Talent Management",
  "Organizational Development",
];

// A new HR leadership hire = strong buying trigger
// Multiple HR postings = HR team expansion = budget signal
```

#### Regulatory Monitor
```typescript
// Monitor for regulatory changes that trigger training/consulting needs
const REGULATORY_SOURCES = [
  { name: "CBN Circulars", url: "https://www.cbn.gov.ng/documents/circulars.asp" },
  { name: "PENCOM Circulars", url: "https://www.pencom.gov.ng/circulars/" },
  { name: "SEC Nigeria Rules", url: "https://sec.gov.ng/rules-and-regulations/" },
  { name: "NAICOM Guidelines", url: "https://naicom.gov.ng/index.php/guidelines/" },
];
// New circular mentioning "training", "capacity building", "governance" = hot trigger
```

#### BPP/Tender Monitor
```typescript
// Monitor government procurement portal for consulting RFPs
const PROCUREMENT_SOURCES = [
  { name: "BPP Portal", url: "https://www.bpp.gov.ng/" },
  { name: "NOCOPO", url: "https://nocopo.bpp.gov.ng/" },
];

const CONSULTING_KEYWORDS = [
  "training", "capacity building", "human resource", "organizational development",
  "change management", "leadership development", "consulting services",
  "talent management", "performance management", "executive coaching",
];
```

### Trigger Detection & Classification

```typescript
type TriggerType =
  | "leadership_change"       // New CEO, CHRO, MD appointment
  | "regulatory_mandate"      // CBN/PENCOM circular requiring training
  | "merger_acquisition"      // M&A creating integration needs
  | "expansion"               // New office, product line, market entry
  | "restructuring"           // Reorganization, layoffs, department changes
  | "hr_hiring"               // Hiring for HR roles (budget signal)
  | "consulting_rfp"          // Published tender for consulting services
  | "negative_employer"       // Glassdoor complaints, employer brand crisis
  | "funding_round"           // Fintech funding (professionalization trigger)
  | "strategic_plan"          // New strategic plan published
  | "event_attendance"        // Company attending/hosting relevant event

const TRIGGER_PATTERNS: Record<TriggerType, RegExp[]> = {
  leadership_change: [
    /\bappoint(ed|s|ment)\b.*\b(CEO|MD|Managing Director|CHRO|HR Director)\b/i,
    /\bnew\b.*\b(CEO|MD|Managing Director|Chief)\b/i,
    /\b(CEO|MD|Managing Director)\b.*\b(resign|step down|retire)\b/i,
  ],
  regulatory_mandate: [
    /\b(CBN|PENCOM|SEC|NAICOM)\b.*\b(circular|directive|guideline|mandate)\b/i,
    /\bcapacity building\b.*\b(require|mandate|compulsory)\b/i,
    /\btraining\b.*\b(compliance|mandatory|required)\b/i,
  ],
  merger_acquisition: [
    /\b(merger|acquisition|acquire[ds]?|takeover|consolidat)\b/i,
    /\b(merger|M&A)\b/i,
  ],
  // ... etc for each trigger type
};
```

### Event Scoring & Lead Rescoring

```typescript
interface DetectedEvent {
  id: string;
  companyId?: string;            // Matched company (null if sector-wide)
  companyName?: string;
  triggerType: TriggerType;
  headline: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: Date;
  detectedAt: Date;

  // Scoring
  signalScore: number;           // Base score from trigger type
  recencyScore: number;          // Higher for recent events
  companyTierScore: number;      // Higher for hot/warm companies
  totalScore: number;            // Composite
}

const TRIGGER_BASE_SCORES: Record<TriggerType, number> = {
  consulting_rfp: 25,            // Direct opportunity
  leadership_change: 20,         // Strong trigger
  regulatory_mandate: 20,        // Compliance-driven
  merger_acquisition: 18,        // Integration needs
  restructuring: 15,
  expansion: 12,
  hr_hiring: 10,                 // Budget signal
  funding_round: 10,             // Fintech professionalization
  negative_employer: 8,          // Reputation crisis
  strategic_plan: 8,
  event_attendance: 5,
};

// Recency bonus (adapted from Pioneer Fund)
function recencyScore(publishedAt: Date): number {
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 10;
  if (hoursAgo < 72) return 7;
  if (hoursAgo < 168) return 4;  // 1 week
  return 1;
}

// After detecting events, update company icpFitScore
function rescoreCompany(company: CompanyRecord, recentEvents: DetectedEvent[]): void {
  const triggerBonus = recentEvents
    .filter(e => e.detectedAt > thirtyDaysAgo)
    .reduce((sum, e) => sum + Math.min(e.totalScore, 15), 0);  // Cap per-event contribution

  company.icpFitScore = Math.min(100, company.icpFitScore + triggerBonus);
  company.icpFitTier = recalculateTier(company.icpFitScore);
}
```

### Digest Output

```typescript
// Daily email digest (adapted from Pioneer Fund)
interface DailyDigest {
  date: string;
  hotTriggers: DetectedEvent[];         // Score >= 25
  warmTriggers: DetectedEvent[];        // Score 15-24
  newCompaniesDiscovered: CompanyRecord[];
  scoreChanges: { company: string, oldScore: number, newScore: number, reason: string }[];
  stats: {
    eventsScanned: number;
    companiesMonitored: number;
    triggersDetected: number;
    newLeads: number;
  };
}
```

---

## TECH STACK

```
Runtime:        Node.js 20+ (TypeScript)
Framework:      Next.js 14+ (App Router)
Database:       PostgreSQL 15+ (via Prisma ORM)
Queue:          In-memory drain loop (Refiner pattern) → BullMQ when scaling
LLM Providers:  Anthropic Claude (Sonnet for specialists, Opus for synthesis)
                Perplexity (web-search-enabled agents)
Web Search:     Perplexity Sonar API (for research agents)
                Google News RSS (for monitoring)
Scraping:       Playwright (for sources without APIs)
Cron:           Vercel Cron or node-cron (for monitoring schedule)
Email:          Resend or Nodemailer (for digest delivery)
Notifications:  WhatsApp Business API or Slack webhook
```

---

## DATABASE SCHEMA (Prisma)

```prisma
// ─── SOURCE REGISTRY ───
model DataSource {
  id                String   @id @default(cuid())
  name              String
  category          String   // government, corporate, financial, social, news, industry, osint
  url               String
  description       String
  dataFields        Json     // string[]
  accessMethod      String   // api, scrape, rss, manual, download
  cost              String   // free, freemium, paid
  updateFrequency   String
  reliability       Int      // 1-5
  automatable       Boolean  @default(false)
  tier              Int      // 1, 2, 3
  collectionSchedule String
  discoveredBy      String   // agent ID
  active            Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ─── COMPANY REGISTRY ───
model Company {
  id                String    @id @default(cuid())
  name              String
  tradingName       String?
  cacNumber         String?   @unique
  sector            String
  subSector         String?
  employeeEstimate  Int
  employeeSource    String?
  hqCity            String
  hqArea            String?
  hqState           String
  website           String?
  linkedinUrl       String?
  parentCompany     String?
  ownership         String    // public, private, government
  ngxListed         Boolean   @default(false)
  revenue           String?
  yearFounded       Int?
  description       String?

  icpFitScore       Int       @default(0)
  icpFitTier        String    @default("watch")
  icpFitFlags       String[]

  sources           String[]
  rawData           Json?
  status            String    @default("new")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  contacts          Contact[]
  dossiers          CompanyDossier[]
  events            DetectedEvent[]

  @@unique([name, hqCity], map: "uniq_company_name_city")
}

// ─── CONTACT REGISTRY ───
model Contact {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  fullName        String
  firstName       String?
  lastName        String?
  title           String
  personaMatch    String   // hr-director, ld-manager, talent-specialist, strategy-manager, corp-comms
  email           String?
  emailVerified   Boolean  @default(false)
  phone           String?
  linkedinUrl     String?
  twitterHandle   String?
  careerHistory   String?
  education       String?
  certifications  String[]
  contactScore    Int      @default(0)
  contactScoreFactors String[]
  sources         String[]
  status          String   @default("new")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([companyId, fullName, personaMatch], map: "uniq_contact_company_persona")
}

// ─── COMPANY DOSSIER ───
model CompanyDossier {
  id                String   @id @default(cuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  executiveSummary  String?
  painPoints        Json?    // PainPoint[]
  buyingTriggers    Json?    // BuyingTrigger[]
  procurementNotes  Json?    // ProcurementNotes
  approachStrategy  Json?    // ContactApproach[]
  competitorThreats String[]

  // Raw outputs
  corpAnalysis      String?  @db.Text
  hrAnalysis        String?  @db.Text
  newsAnalysis      String?  @db.Text
  procAnalysis      String?  @db.Text
  synthesisOutput   String?  @db.Text

  opportunityScore  Int      @default(0)
  urgencyScore      Int      @default(0)
  readinessScore    Int      @default(0)

  totalCost         Float    @default(0)
  totalTokens       Int      @default(0)
  status            String   @default("pending")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ─── EVENT MONITOR ───
model DetectedEvent {
  id              String   @id @default(cuid())
  companyId       String?
  company         Company? @relation(fields: [companyId], references: [id])
  companyName     String?
  triggerType     String
  headline        String
  summary         String?
  sourceUrl       String   @unique
  sourceName      String
  publishedAt     DateTime
  signalScore     Int      @default(0)
  recencyScore    Int      @default(0)
  companyTierScore Int     @default(0)
  totalScore      Int      @default(0)
  processed       Boolean  @default(false)
  createdAt       DateTime @default(now())
}

// ─── COUNCIL SESSIONS (for source discovery & dossier generation) ───
model CouncilSession {
  id              String          @id @default(cuid())
  type            String          // "source_discovery" | "company_intel"
  targetId        String?         // companyId if company_intel
  challengeText   String
  status          String          @default("pending")
  currentRound    Int             @default(0)
  synthesisOutput String?         @db.Text
  totalCost       Float           @default(0)
  totalInputTokens Int            @default(0)
  totalOutputTokens Int           @default(0)
  error           String?
  createdAt       DateTime        @default(now())
  rounds          CouncilRound[]
}

model CouncilRound {
  id           String              @id @default(cuid())
  sessionId    String
  session      CouncilSession      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  number       Int
  roundType    String              // divergent, cross_pollination, synthesis
  cost         Float               @default(0)
  elapsedMs    Int?
  createdAt    DateTime            @default(now())
  responses    CouncilAgentResponse[]
}

model CouncilAgentResponse {
  id            String        @id @default(cuid())
  roundId       String
  round         CouncilRound  @relation(fields: [roundId], references: [id], onDelete: Cascade)
  agentId       String
  agentLabel    String
  content       String        @db.Text
  isError       Boolean       @default(false)
  cost          Float         @default(0)
  inputTokens   Int           @default(0)
  outputTokens  Int           @default(0)
  createdAt     DateTime      @default(now())
}
```

---

## EXECUTION SCHEDULE

| Phase | Trigger | Frequency | Est. Cost per Run |
|---|---|---|---|
| 1. Source Discovery Council | Manual / quarterly | Quarterly | ~$2-5 (one-time council) |
| 2. Universe Cataloger | Cron | Weekly full, daily incremental | ~$0.50-2 (web search queries) |
| 3. Contact Mapper | After Phase 2 | Monthly refresh | ~$0.10-0.30 per company |
| 4. Company Intel Council | Priority-based | Hot: weekly, Warm: monthly | ~$1-3 per company |
| 5. Continuous Monitor | Cron | Every 6 hours | ~$0.05-0.20 per run (mostly RSS) |

### Estimated Monthly Costs (at scale)
- **100 tracked companies, 500 contacts:**
  - Phase 2 (weekly): ~$8/month
  - Phase 3 (monthly): ~$15/month
  - Phase 4 (mixed): ~$40/month (10 hot companies weekly + 30 warm monthly)
  - Phase 5 (4x daily): ~$18/month
  - **Total: ~$80-100/month in LLM costs**

---

## IMPLEMENTATION ORDER

```
Week 1:  Database schema + basic CRUD API
Week 2:  Phase 1 — Source Discovery Council (one-time run)
Week 3:  Phase 5 — Continuous Monitor (highest ongoing value)
         Start with Google News + RSS collectors only
Week 4:  Phase 2 — Universe Cataloger (sector agents)
         Seed with known companies from ICPs
Week 5:  Phase 3 — Contact Mapper (LinkedIn + web search)
Week 6:  Phase 4 — Company Intelligence Councils (hot companies first)
Week 7:  Dashboard UI + digest emails
Week 8:  Refinement, scoring tuning, additional collectors
```

---

## KNOWN COMPANIES SEED LIST

Pre-populate from ICP document to bootstrap before crawlers run:

```typescript
const SEED_COMPANIES = [
  // Existing clients
  { name: "Stanbic IBTC", sector: "banking", hqCity: "Lagos", status: "client" },
  { name: "Quest Merchant Bank", sector: "banking", hqCity: "Lagos", status: "client" },
  { name: "Ecobank Nigeria", sector: "banking", hqCity: "Lagos", status: "client" },
  { name: "Access Bank", sector: "banking", hqCity: "Lagos", status: "client" },
  { name: "FCMB Group", sector: "banking", hqCity: "Lagos", status: "client" },
  { name: "NNPC Ltd", sector: "government", hqCity: "Abuja", status: "client" },
  { name: "Federal Inland Revenue Service", sector: "government", hqCity: "Abuja", status: "client" },
  { name: "Central Bank of Nigeria", sector: "government", hqCity: "Abuja", status: "client" },
  { name: "Trust Fund Pensions", sector: "pension_insurance", hqCity: "Abuja", status: "client" },

  // High-priority prospects from ICPs
  { name: "Zenith Bank", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "GTBank (Guaranty Trust)", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "First Bank of Nigeria", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "UBA (United Bank for Africa)", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "Fidelity Bank", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "Union Bank", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "Sterling Bank", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "Wema Bank", sector: "banking", hqCity: "Lagos", status: "new" },
  { name: "Dangote Group", sector: "conglomerates", hqCity: "Lagos", status: "new" },
  { name: "BUA Group", sector: "conglomerates", hqCity: "Lagos", status: "new" },
  { name: "MTN Nigeria", sector: "conglomerates", hqCity: "Lagos", status: "new" },
  { name: "Flour Mills of Nigeria", sector: "conglomerates", hqCity: "Lagos", status: "new" },
  { name: "Nigerian Breweries", sector: "conglomerates", hqCity: "Lagos", status: "new" },
  { name: "Seplat Energy", sector: "conglomerates", hqCity: "Lagos", status: "new" },
  { name: "ARM Pensions", sector: "pension_insurance", hqCity: "Lagos", status: "new" },
  { name: "Leadway Pensure", sector: "pension_insurance", hqCity: "Lagos", status: "new" },
  { name: "Flutterwave", sector: "fintech", hqCity: "Lagos", status: "new" },
  { name: "Moniepoint", sector: "fintech", hqCity: "Lagos", status: "new" },
  { name: "Interswitch", sector: "fintech", hqCity: "Lagos", status: "new" },
  { name: "Paystack", sector: "fintech", hqCity: "Lagos", status: "new" },
  { name: "Kuda Bank", sector: "fintech", hqCity: "Lagos", status: "new" },
];
```
