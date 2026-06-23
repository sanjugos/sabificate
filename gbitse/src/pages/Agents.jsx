import { Bot, Database, Users, FileText, Rss, Globe, RefreshCw, Mail, Phone, Zap, Search, Building2, Eye, Shield } from 'lucide-react';
import { getStats } from '../lib/store';

const AGENTS = [
  {
    id: 'source-discovery',
    name: 'Source Discovery Council',
    icon: Database,
    color: 'bg-blue-50 text-blue-700',
    description: '7 specialist agents + 1 synthesizer deliberate across 3 rounds to map every free/low-cost Nigerian data source.',
    protocols: [
      'GOV-REG: Scan CAC, CBN, PenCom, NAICOM, SEC, BPP, FIRS portals for company registries',
      'CORP-REG: Crawl BusinessList.ng, VConnect, NGX Listed, Chamber directories, OpenCorporates',
      'FIN-DATA: Map CBN licensed banks, NDIC insured institutions, FMDQ, PenCom PFA list, Tracxn fintech DB',
      'NEWS-PR: Verify RSS feeds (BusinessDay, TechCabal, Punch, Vanguard, Premium Times, ThisDay, Leadership)',
      'SOCIAL: Map CIPM membership, SHRM Nigeria, LinkedIn HR groups, Jobberman/MyJobMag job signals',
      'INDUSTRY: Catalog CIPM conference, FITC events, LBS alumni, NECA members, MAN directory',
      'OSINT: Monitor job boards for HR hiring signals, Glassdoor reviews, Google Alerts per company',
      'SOURCE-SYNTH: Rank all sources by tier (free/paid), reliability (1-5), collection schedule',
    ],
    sources: ['CAC', 'CBN', 'PenCom', 'NAICOM', 'SEC', 'NGX', 'NDIC', 'BusinessDay RSS', 'TechCabal RSS', 'Google News', 'CIPM', 'LinkedIn', 'Jobberman', 'BPP', 'Tracxn'],
    lastRun: '2026-05-30',
    status: 'completed',
    results: '30 verified sources across 6 categories',
    schedule: 'Quarterly',
  },
  {
    id: 'universe-cataloger',
    name: 'Universe Cataloger Swarm',
    icon: Globe,
    color: 'bg-purple-50 text-purple-700',
    description: 'Parallel sector agents crawl all discovered sources to catalog Nigerian companies with 200+ employees.',
    protocols: [
      'BANK-CAT: Fetch all CBN licensed DMBs, merchant banks, DFIs, microfinance (national license)',
      'GOV-CAT: Catalog federal agencies, regulators, parastatals, military from official websites',
      'PENSION-CAT: Pull all 20 PenCom-licensed PFAs + 4 CPFAs with MD contacts',
      'INSURANCE-CAT: Map all 67 NAICOM-licensed insurers (life, general, composite, takaful, micro)',
      'CONGLOM-CAT: NGX listed companies + SerpAPI for unlisted industrials, FMCG, construction',
      'FINTECH-CAT: Tracxn + Crunchbase + TechCabal + Disrupt Africa for funded startups',
      'EXPANSION: Oil & Gas (IOCs + indigenous), Prof Services (Big4 + law firms), Healthcare, Education, Media, Logistics, Power',
      'SCORING: ICP fit score (0-100) based on employee count, HQ city, sector, NGX listing, ownership',
      'DEDUP: Composite key on company name + HQ city to prevent duplicates',
    ],
    sources: ['CBN Licensed Banks', 'PenCom PFAs', 'NAICOM Insurers', 'NGX Listed', 'Tracxn', 'SerpAPI', 'Crunchbase', 'Disrupt Africa', 'TechCabal'],
    lastRun: '2026-05-30',
    status: 'completed',
    results: '393 companies across 15 sectors',
    schedule: 'Weekly',
  },
  {
    id: 'contact-mapper',
    name: 'Contact & Persona Mapper',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-700',
    description: 'Multi-method contact discovery across all 5 target personas for every company.',
    protocols: [
      'SERPAPI LINKEDIN: For each company, search site:linkedin.com "[Company]" "Head of HR" OR "HR Director" OR "Chief People Officer"',
      'WEBSITE SCRAPING: WebFetch /about, /about-us, /team, /management, /leadership for named executives',
      'PERSONA EXPANSION: Search for L&D Manager, Talent Specialist, Strategy Manager, Corp Comms per company',
      'CONFIDENCE SCORING: High (multiple sources confirm), Medium (single source), mark departed contacts',
      'EMAIL PATTERN DETECTION: Infer firstname.lastname@domain from confirmed emails (e.g., Wema Bank pattern)',
      'CONTACT PAGE SCRAPING: Fetch /contact, /contact-us for general emails (info@), HR emails (hr@, careers@), phone numbers',
      'DEDUP: Match contacts to companies by name, prevent duplicate entries across scraping rounds',
      'COVERAGE TRACKING: Track % of companies with at least 1 named contact per persona type',
    ],
    sources: ['SerpAPI LinkedIn', 'Company Websites (/about, /team)', 'Company Contact Pages', 'ZoomInfo', 'RocketReach', 'TheOrg', 'CIPM Directory'],
    lastRun: '2026-05-30',
    status: 'completed',
    results: '327 named contacts covering 234 companies (60%)',
    schedule: 'Monthly',
  },
  {
    id: 'website-intelligence',
    name: 'Website Intelligence Scraper',
    icon: Eye,
    color: 'bg-cyan-50 text-cyan-700',
    description: 'Scrapes company websites to build intelligence profiles with about text, services, leadership, signals, and contact info.',
    protocols: [
      'ABOUT SCRAPING: WebFetch homepage + /about for company description (2-3 sentences)',
      'LEADERSHIP EXTRACTION: Parse /about, /team, /management for named executives with titles',
      'SERVICES MAPPING: Extract products/services offered from homepage and service pages',
      'SIGNAL DETECTION: Auto-detect 12 intent signals from website content:',
      '  - Growth/Expansion (new offices, branches, markets)',
      '  - Active Hiring (careers page, vacancies, job listings)',
      '  - L&D Investment (training programs, academies, capacity building)',
      '  - Transformation Underway (restructuring, reform, modernization)',
      '  - Digital Transformation (technology, AI, innovation)',
      '  - ESG/Sustainability (climate, green, renewable)',
      '  - M&A Activity (merger, acquisition, consolidation)',
      '  - Leadership Change (new CEO, new MD, appointments)',
      '  - Governance Focus (compliance, regulation, risk management)',
      '  - People-Centric Language (employee, workforce, talent, human capital)',
      '  - Employer Brand (awards, certified, best employer)',
      '  - Pan-African Operations (multi-country, Africa-wide)',
      'CONTACT EXTRACTION: Scrape /contact for emails (info@, hr@, careers@) and phone numbers',
      'SCORE BOOST: Up to +15 ICP points from content signals (hiring +3, transformation +4, L&D +3, etc.)',
      'PROFILE STORAGE: Store about, leadership[], services, locations, signals, rawContent per company',
    ],
    sources: ['Company Homepages', '/about Pages', '/contact Pages', '/team Pages', '/careers Pages'],
    lastRun: '2026-05-30',
    status: 'completed',
    results: '20 full profiles with signals, 120 websites scraped for leaders',
    schedule: 'Monthly',
  },
  {
    id: 'email-phone-enrichment',
    name: 'Email & Phone Enrichment',
    icon: Mail,
    color: 'bg-orange-50 text-orange-700',
    description: 'Scrapes company contact pages and infers email patterns to enrich contacts with direct email addresses and phone numbers.',
    protocols: [
      'CONTACT PAGE SCRAPE: WebFetch /contact, /contact-us for each company with a website',
      'EMAIL EXTRACTION: Parse for info@, enquiries@, contact@, support@, hr@, careers@, recruitment@, people@',
      'PHONE EXTRACTION: Parse for Nigerian phone numbers (+234, 0800, 01-, 09-, 08-)',
      'EMAIL PATTERN INFERENCE: From confirmed emails (e.g., firstname.lastname@wemabank.com), infer pattern for all contacts at that company',
      'HR EMAIL PRIORITY: Prefer hr@, careers@, recruitment@ over generic info@ for outreach',
      'VALIDATION: Flag emails that bounce or domains that dont match company website',
      'ENRICHMENT: Update contact records with discovered emails and phone numbers',
    ],
    sources: ['Company /contact Pages', 'Company /careers Pages', 'Email Pattern Analysis'],
    lastRun: '2026-05-30',
    status: 'running',
    results: 'Scraping 50 company contact pages...',
    schedule: 'Monthly',
  },
  {
    id: 'company-intel',
    name: 'Company Intelligence Council',
    icon: FileText,
    color: 'bg-amber-50 text-amber-700',
    description: '4 specialist agents + synthesizer build actionable sales dossiers per company.',
    protocols: [
      'CORP-ANALYST: Research financials, org structure, strategic direction via annual reports and news',
      'HR-ANALYST: Assess HR function maturity, talent challenges, L&D programs, Glassdoor signals',
      'NEWS-ANALYST: Find recent news (90 days) — leadership changes, M&A, expansion, regulatory actions',
      'PROC-SPEC: Determine procurement pathway — vendor registration, budget cycle, BPP requirements, decision chain',
      'DOSSIER-SYNTH: Produce actionable brief with:',
      '  - Executive Summary (3 sentences)',
      '  - Top 3 Pain Points mapped to our offerings',
      '  - Buying Triggers with timing',
      '  - Who to Contact first (prioritized personas)',
      '  - Opening Line (tailored per company)',
      '  - Deal Size estimate',
      '  - Competitive Threats',
      'CONFLICT RESOLUTION: PROC-SPEC overrides on procurement, NEWS-ANALYST on recency, HR-ANALYST on talent claims',
    ],
    sources: ['Google News', 'BusinessDay', 'Nairametrics', 'NGX Disclosures', 'Glassdoor', 'Annual Reports', 'Company Websites'],
    lastRun: '2026-05-30',
    status: 'completed',
    results: '10 priority dossiers with opening lines and deal sizes',
    schedule: 'Hot: Weekly, Warm: Monthly',
  },
  {
    id: 'continuous-monitor',
    name: 'Continuous Monitor',
    icon: Rss,
    color: 'bg-red-50 text-red-700',
    description: '6 collectors scan Nigerian news, regulatory circulars, job boards, and social media for buying triggers every 6 hours.',
    protocols: [
      'GOOGLE NEWS: Per-company RSS feeds via news.google.com/rss/search?q="Company"+Nigeria&gl=NG',
      'RSS FEEDS: 15 verified Nigerian news RSS feeds (BusinessDay, TechCabal, Punch, Vanguard, etc.)',
      'LINKEDIN JOBS: Monitor HR Director/L&D/Talent job postings as buying signals',
      'REGULATORY MONITOR: Scrape CBN circulars, PenCom circulars, SEC rules, NAICOM guidelines',
      'BPP TENDER MONITOR: Watch NOCOPO/BPP portal for consulting/training RFPs',
      'SOCIAL MONITOR: Track CIPM events, X/Twitter HR influencers, Telegram channels',
      'TRIGGER DETECTION: Classify events into 11 types:',
      '  - Leadership Change (new CEO/CHRO appointment)',
      '  - Regulatory Mandate (CBN/PenCom circular requiring training)',
      '  - M&A (merger, acquisition creating integration needs)',
      '  - Expansion (new office, product, market entry)',
      '  - Restructuring (reorg, layoffs, department changes)',
      '  - HR Hiring (hiring for HR roles = budget signal)',
      '  - Consulting RFP (published tender for consulting services)',
      '  - Employer Brand Crisis (Glassdoor complaints, negative press)',
      '  - Funding Round (fintech funding = professionalization trigger)',
      '  - Strategic Plan (new strategic plan published)',
      '  - Event Attendance (company hosting/attending relevant events)',
      'SCORING: Signal score (5-25) + Recency score (1-10) + Company tier score → Total event score',
      'RESCORING: Auto-update company ICP fit score when triggers detected',
      'DIGEST: Daily email with hot triggers, score changes, new leads',
    ],
    sources: ['Google News RSS', 'BusinessDay RSS', 'TechCabal RSS', 'Punch RSS', 'Vanguard RSS', 'Premium Times RSS', 'ThisDay RSS', 'Leadership RSS', 'Google Alerts', 'CBN Circulars', 'NGX Disclosures', 'Jobberman HR Jobs', 'NOCOPO/BPP Tenders'],
    lastRun: 'Not yet deployed',
    status: 'designed',
    results: 'Awaiting Phase 5 implementation',
    schedule: 'Every 6 hours',
  },
];

export default function Agents() {
  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bot size={24} /> BI Agents</h1>
        <p className="text-sm text-gray-500">Agent-powered intelligence pipeline for Nigerian HR/OD lead generation</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-brand-800">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Companies Cataloged</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700">{stats.totalContacts}</p>
          <p className="text-xs text-gray-500 mt-1">Named Contacts</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">{stats.totalDossiers}</p>
          <p className="text-xs text-gray-500 mt-1">Dossiers Generated</p>
        </div>
      </div>

      <div className="space-y-4">
        {AGENTS.map(agent => (
          <div key={agent.id} className="card p-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${agent.color}`}>
                <agent.icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${agent.status === 'completed' ? 'bg-green-100 text-green-700' : agent.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {agent.status}
                    </span>
                    <button className="btn-secondary text-xs flex items-center gap-1" disabled={agent.status === 'designed'}>
                      <RefreshCw size={12} /> Run
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{agent.description}</p>

                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  <span className="text-gray-500">Schedule: <span className="font-medium text-gray-700">{agent.schedule}</span></span>
                  <span className="text-gray-500">Last Run: <span className="font-medium text-gray-700">{agent.lastRun}</span></span>
                  <span className="text-gray-500">Results: <span className="font-medium text-gray-700">{agent.results}</span></span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {agent.sources.map(s => <span key={s} className="badge bg-gray-100 text-gray-600 text-[10px]">{s}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
