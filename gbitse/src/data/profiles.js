// Company Profiles — scraped website content + intelligence
// Populated from WebFetch scraping of company websites (2026-05-30)

const PROFILES = {
  // === BANKS ===
  "BNK-008": { // Premium Trust Bank
    about: "Premium Trust Bank is a commercial bank with national authorization, offering corporate, retail, and digital banking services across Nigeria.",
    leadership: [{name:"Olanike Martins",title:"Chief People Officer"},{name:"Emmanuel Efe Emefienim",title:"MD/CEO"},{name:"Ayodele Shoyemi",title:"Chief Financial Officer"},{name:"Myke Koledoye",title:"Group Head IT"}],
    services: "Corporate Banking, Retail Banking, Digital Banking, E-Business & Transaction Banking, Treasury, Specialized Banking",
    locations: "Lagos, Abuja, South-South, South-West regions",
  },
  "BNK-009": { // Providus Bank
    about: "Providus Bank is a Nigerian commercial bank offering corporate, commercial, affluent, institutional, and SME banking services with a strong focus on technology-driven solutions.",
    leadership: [{name:"Walter Akpani",title:"MD/CEO"},{name:"Kingsley Ogirri",title:"Group Head HR Management"},{name:"Dafe Ivwurie",title:"Group Head Brand & Corp Comms"},{name:"Kingsley Aigbokhaevbo",title:"Deputy Managing Director"}],
    services: "Corporate Banking, Commercial Banking, Affluent & Private Banking, Institutional Banking, SME Banking, Treasury, Transaction Banking",
    locations: "Lagos (HQ), Abuja, nationwide branches",
  },
  // === OIL & GAS ===
  "OG-015": { // NIPCO PLC
    about: "NIPCO PLC is a downstream petroleum marketing company in Nigeria dealing in white petroleum products, lubricants, LPG, and related energy services.",
    leadership: [{name:"Bonaventure Ehiem",title:"HR/Admin Manager"},{name:"Taofeeq Lawal",title:"Corporate Affairs Manager"},{name:"Abduulmalik Tijani",title:"Sales & Marketing Manager"}],
    services: "Petroleum products marketing, Lubricants, LPG distribution, Fleet fueling, Industrial fueling",
    locations: "Lagos (HQ), nationwide depots and retail stations",
  },
  // === CONGLOMERATES ===
  "IND-003": { // Dangote Cement
    about: "Dangote Cement PLC is Africa's largest cement producer with operations in 10 African countries. The company has 51.6 Mta installed capacity and is listed on the NGX.",
    leadership: [{name:"Arvind Pathak",title:"Group MD/CEO"},{name:"Gloria Byamugisha",title:"Group Chief HR Officer"},{name:"Funmi Sanni",title:"Group Sales & Marketing Director"},{name:"Temilade Aduroja",title:"Group Head Investor Relations"},{name:"Dr Gbenga Fapohunda",title:"Group CFO"}],
    services: "Cement manufacturing, Building materials, Infrastructure solutions, Export services",
    locations: "Lagos (HQ), 10 African countries including Nigeria, Ethiopia, Senegal, Tanzania, Cameroon, Congo, Ghana, Sierra Leone, South Africa, Zambia",
    rawContent: "expansion capacity building pan-african operations hiring training sustainability ESG",
  },
  "IND-004": { // BUA Cement
    about: "BUA Cement PLC is Nigeria's second-largest cement manufacturer by market cap with plants in Sokoto and Edo states, producing 17 million tonnes per annum.",
    leadership: [{name:"Engr. Yusuf Haliru Binji",title:"MD/CEO"},{name:"Chikezie Ajaero",title:"Executive Director/CFO"},{name:"Abdullahi Usman",title:"Director Strategic Supplies"},{name:"Hauwa Garba-Satomi",title:"Company Secretary/Chief Legal Officer"}],
    services: "Cement manufacturing, Building materials, Strategic supplies",
    locations: "Lagos (HQ), Sokoto plant, Edo (Obu) plant",
  },
  "IND-010": { // UAC of Nigeria
    about: "UAC of Nigeria PLC is a diversified conglomerate with interests in food & beverages (Grand Cereals), real estate (UPDC), logistics, and paints (CAP).",
    leadership: [{name:"Folasope Aiyesimoju",title:"Group Managing Director"},{name:"Nneka Chime",title:"Chief Strategy and Operations Officer"},{name:"Funke Ijaiya-Oladipo",title:"Group Finance Director"},{name:"Queenette Durosinmi-Etti",title:"Chief Operating Officer"}],
    services: "Food & Beverages (Grand Cereals), Real Estate (UPDC), Logistics, Paints (CAP), Animal Feeds (Livestock Feeds)",
    locations: "Lagos (HQ), nationwide operations",
    rawContent: "diversified strategy transformation talent people workforce",
  },
  "IND-017": { // Dangote Sugar
    about: "Dangote Sugar Refinery PLC is Nigeria's largest sugar refiner, processing raw sugar into refined granulated sugar with a refining capacity of 1.44 million MT/year.",
    leadership: [{name:"Ravindra Singh Singhvi",title:"Group MD/CEO"},{name:"Hassan Salisu",title:"GM Human Resources/Admin"},{name:"Adebola Falade",title:"Chief Financial Officer"}],
    services: "Sugar refining, Distribution, Backward integration projects (sugar plantations)",
    locations: "Lagos (Apapa refinery), Nasarawa (Tunga sugar plantation), Adamawa, Kwara",
  },
  "IND-018": { // Stallion Group
    about: "Stallion Group is one of Nigeria's largest conglomerates with interests in automotive (Hyundai, Honda), FMCG, agriculture (rice milling), packaging, and logistics.",
    leadership: [{name:"Sunil Vaswani",title:"Chairman"},{name:"Mahesh Vaswani",title:"Group Managing Director"},{name:"Alhaji Olalere Tajudeen",title:"Director Administration (HR)"},{name:"Samar Sapre",title:"CFO"}],
    services: "Automotive assembly & distribution, Rice milling, FMCG, Packaging, Logistics",
    locations: "Lagos (HQ), nationwide distribution network",
  },
  // === IHS Towers
  "IND-19": { // IHS Towers
    about: "IHS Towers is one of the largest independent tower companies globally with over 40,000 towers across Africa, the Middle East, and Latin America. The Nigeria operation is the largest.",
    leadership: [{name:"Mohamad Darwish",title:"EVP, IHS Nigeria CEO"},{name:"Ayotade Oyinlola",title:"EVP & Chief HR Officer"},{name:"Sam Darwish",title:"Chairman and Group CEO"},{name:"Steve Howden",title:"EVP and CFO"}],
    services: "Telecom tower infrastructure, Power-as-a-service, Fiber connectivity, Rural connectivity, In-building solutions",
    locations: "Lagos (Nigeria HQ), operations across 9 countries",
    rawContent: "expansion hiring talent people workforce digital transformation",
  },
  // === UPDC
  "IND-14": {
    about: "UPDC PLC is a leading Nigerian real estate development company and subsidiary of UAC of Nigeria, focused on residential, commercial, and mixed-use developments.",
    leadership: [{name:"Odunayo Ojo",title:"CEO and Managing Director"},{name:"Oluwatoyin Egwaikhide",title:"Head Human Resources"},{name:"Folake Kalaro",title:"Director Corporate Services"},{name:"Francis Falola",title:"Chief Financial Officer"}],
    services: "Residential development, Commercial real estate, Facility management, Property marketing",
    locations: "Lagos (HQ), Abuja, developments across Nigeria",
  },
  // === FMCG ===
  "CG-04": { // Dufil Prima Foods
    about: "Dufil Prima Foods PLC (makers of Indomie noodles, Power Oil, Minimie) is Nigeria's leading instant noodle manufacturer with over 25 years of operations and multiple factories.",
    leadership: [{name:"Adhi Narto",title:"MD/CEO"},{name:"Kolawole Olanrewaju Hassan",title:"Director of HR"},{name:"Adiamo Adebayo",title:"Director Legal Tax & Corp Affairs"},{name:"Rakesh Agarwal",title:"CFO"}],
    services: "Instant noodles (Indomie), Cooking oils (Power Oil), Snacks (Minimie), Flour processing",
    locations: "Lagos (HQ, Ikeja factory), Ota plant, Kaduna plant",
    rawContent: "5000 employees manufacturing expansion training hiring",
  },
  // === INSURANCE ===
  "INS-05": { // NEM Insurance
    about: "NEM Insurance PLC is one of Nigeria's leading composite insurance companies offering general, life, and special risk insurance services. NGX-listed since 1990.",
    leadership: [{name:"Tope Smart",title:"Group Chairman"},{name:"Andrew Ikekhua",title:"MD"},{name:"Olayinka Ojikutu",title:"AGM Human Resources"},{name:"Mojisola Teluwo",title:"GM Corporate Services"}],
    services: "General insurance, Life insurance, Oil & gas insurance, Marine insurance, Special risks",
    locations: "Lagos (HQ), Abuja, nationwide branches",
  },
  "INS-18": { // Hygeia HMO
    about: "Hygeia HMO is one of Nigeria's leading health maintenance organizations providing comprehensive healthcare plans to individuals and corporate clients through a network of healthcare providers.",
    leadership: [{name:"John Iwuajoku",title:"CEO"},{name:"Adesuwa Okhipo",title:"Head HR & Admin"},{name:"Enema Anumnu",title:"Chief Commercial Officer"},{name:"Bode Olawunmi",title:"Finance & Risk Management"}],
    services: "Health maintenance plans, Corporate health insurance, Individual plans, Telemedicine, Wellness programs",
    locations: "Lagos (HQ), nationwide provider network",
  },
  // === LOGISTICS ===
  "LOG-01": { // GIG Logistics
    about: "GIG Logistics (GIGL) is Nigeria's leading courier and express delivery company, part of GIG Group. The company provides domestic and international delivery services through technology-driven solutions.",
    leadership: [{name:"Sebastine Osita",title:"CEO"},{name:"Chinyere Nwaili-Chukwu",title:"Chief People Officer"},{name:"Adenike Ayodeji",title:"Acting CFO"},{name:"Amanpreet Singh",title:"CTO"}],
    services: "Express delivery, Courier services, Freight, E-commerce logistics, International shipping, Warehousing",
    locations: "Lagos (HQ), nationwide network, international operations",
    rawContent: "expansion hiring technology innovation training people talent workforce",
  },
  // === MEDIA ===
  "MED-01": { // MultiChoice
    about: "MultiChoice Nigeria operates Africa's leading pay-TV platforms DStv and GOtv, offering entertainment, sports, news, and educational content to millions of subscribers across Nigeria.",
    leadership: [{name:"Kemi Omotosho",title:"CEO PayTV Nigeria"},{name:"Tshepi Malatjie",title:"Director HR Africa"},{name:"Litlhare Moteetee",title:"Head Corporate Affairs"},{name:"Dr Keabetswe Modimoeng",title:"Director Public Affairs"}],
    services: "Pay-TV (DStv, GOtv), Streaming (Showmax), Content production, Advertising",
    locations: "Lagos (Nigeria HQ), Pan-African operations",
  },
  // === PROFESSIONAL SERVICES ===
  "PS-16": { // Workforce Group
    about: "Workforce Group is an HR and business consulting firm with 16+ years in Nigeria, helping companies solve people and business challenges through recruitment, learning, outsourcing, and advisory.",
    leadership: [{name:"Bolaji Olagunju",title:"Founder & Executive Chairman"},{name:"Foluso Aribisala",title:"CEO"},{name:"Theresa Amaechi",title:"Head People Culture & Transformation"},{name:"Olasunkanmi Adenuga",title:"Business Director Learning"}],
    services: "Executive search, Succession planning, Graduate trainee programs, Leadership development, Staff outsourcing, Payroll management, HR advisory, AI certification training",
    locations: "Lagos (HQ), operations across Africa",
    rawContent: "12000 top talent recruited 500 graduate trainee programmes 15000 professionals trained hiring learning development transformation",
  },
  "PS-17": { // SeamlessHR
    about: "SeamlessHR is an all-in-one HR software platform for African enterprises, serving 2,000+ businesses managing 300,000 employees across 20 countries. Recently raised $20M.",
    leadership: [{name:"Dr. Emmanuel Okeleji",title:"CEO & Co-Founder"},{name:"Deji Lana",title:"CTO & Co-Founder"},{name:"Moyowa Uranje-Odueso",title:"Head People Operations"},{name:"Sayo Akinwale",title:"Director Marketing & Communications"}],
    services: "HRMS, Payroll, Performance Management, Time Management, Recruitment/ATS, Employee Financial Solutions",
    locations: "Lagos (HQ), Kenya, Uganda, Ghana, Nigeria, South Africa",
    rawContent: "2000 businesses 300000 employees hiring careers expansion digital transformation HR technology",
  },
  "PS-08": { // Phillips Consulting
    about: "Phillips Consulting is 'Africa's execution partner' specializing in complex organizational change, strategy, technology, people transformation, and learning services for corporations and startups.",
    leadership: [{name:"Foluso Phillips",title:"Chairman"},{name:"Olawanle Moronkeji",title:"COO"},{name:"Kemi Laura Phillips",title:"Partner Strategy & Transformation"},{name:"Paul Ayim",title:"Partner Digital Learning"}],
    services: "Business advisory, People/talent transformation, Technology services, International development, Learning programme management, Training, Digital enablement, Recruitment",
    locations: "Lagos (Lekki Phase 1), Abuja (NEXIM House CBD)",
    rawContent: "training learning development transformation hiring capacity building strategy talent",
  },
  // === STARTUPS ===
  "ST-01": { // Helium Health
    about: "Helium Health is Africa's leading healthtech provider offering digital tools and financing solutions to healthcare providers. Serves 500+ providers, 10,000+ health workers, and 1M+ patients.",
    leadership: [{name:"Goke Olubusi",title:"Co-Founder & CEO"},{name:"Ijeoma Oyeyinka",title:"Head HR"},{name:"Dimeji Sofowora",title:"Co-Founder & CFO"},{name:"Chichi Offodile",title:"COO"}],
    services: "HeliumOS (care operating system), HeliumDoc, HeliumCredit, HeliumWallet, Public Health partnerships",
    locations: "Lagos (Lekki Phase 1), Nairobi Kenya",
    rawContent: "500 providers 10000 health workers 1 million patients hiring careers expansion digital transformation",
  },
  "FT-02": { // Moniepoint
    about: "Moniepoint is an all-in-one financial services platform for SMEs, processing 14 billion transactions worth NGN 412 trillion in 2025. Unicorn with 3,000+ employees.",
    leadership: [{name:"Tosin Eniolorunda",title:"CEO"},{name:"Chinaza Nduka-Dike",title:"VP People Business Partnering"},{name:"Gabriel Balogun",title:"Director Global Talent Development"},{name:"Adeola Ifoghale-Gbodume",title:"VP Global People Experience"}],
    services: "Business banking, POS terminals, Payment processing, Lending, Business tools",
    locations: "Lagos (Lekki), London",
    rawContent: "3000 employees hiring 500 unfilled roles talent transformation scaling expansion people operations",
  },
  "FT-04": { // Interswitch
    about: "Interswitch Group is Africa's leading digital payments company (est. 2002). The company powers most ATM and card transactions in Nigeria, valued at $1B+.",
    leadership: [{name:"Mitchell Elegbe",title:"Founder & Group CEO"},{name:"Franklin Ali",title:"Group Chief HR Officer"},{name:"Dr. Cherry Eromosele",title:"EVP & Group Chief Marketing & Communications Officer"}],
    services: "Payment switching, Card processing, Verve cards, Quickteller, Interswitch Developer Academy",
    locations: "Lagos (HQ), Pan-African operations",
    rawContent: "developer academy 20000 applicants training hiring learning development talent people workforce innovation",
  },
  "FT-05": { // Flutterwave
    about: "Flutterwave is Africa's most valuable fintech ($3B valuation) providing payment infrastructure connecting merchants and payment providers. Recently acquired Mono and received CBN microlending license.",
    leadership: [{name:"Olugbenga Agboola",title:"CEO"},{name:"Mansi Babyloni",title:"Chief People & Culture Officer"},{name:"Victoria Vodunnu",title:"Head of People Strategy & Operations"},{name:"Bridgit Antwi",title:"Head of Strategy & Planning"},{name:"Doyinsade Adeolu",title:"Global Manager Internal Communications"}],
    services: "Payment gateway, Checkout, Transfer, Invoicing, Store, Virtual cards, Consumer banking (Zap)",
    locations: "Lagos, San Francisco, multiple African countries",
    rawContent: "expansion acquisition digital transformation hiring people strategy talent culture innovation",
  },
};

export default PROFILES;

export function getProfile(companyId) {
  return PROFILES[companyId] || null;
}

export function extractSignals(profile) {
  if (!profile) return [];
  const signals = [];
  const text = (profile.about || '') + ' ' + (profile.services || '') + ' ' + (profile.rawContent || '');
  const lower = text.toLowerCase();
  if (/expand|expansion|growing|growth|scaling|new office/i.test(lower)) signals.push('Growth/Expansion');
  if (/hiring|recruit|career|job opening|vacancies|unfilled/i.test(lower)) signals.push('Active hiring');
  if (/training|learning|development|academy|capacity building/i.test(lower)) signals.push('L&D investment');
  if (/transform|transformation|restructur|reform|moderniz/i.test(lower)) signals.push('Transformation underway');
  if (/digital|technology|innovation|AI|artificial intelligence/i.test(lower)) signals.push('Digital transformation');
  if (/sustainability|ESG|climate|green|renewable/i.test(lower)) signals.push('ESG/Sustainability');
  if (/merger|acqui|consolidat|integrat/i.test(lower)) signals.push('M&A activity');
  if (/new CEO|new MD|appoint|leadership change/i.test(lower)) signals.push('Leadership change');
  if (/compliance|regulat|governance|risk/i.test(lower)) signals.push('Governance focus');
  if (/employee|workforce|talent|people|human capital/i.test(lower)) signals.push('People-centric');
  if (/award|certified|recognition|best employer/i.test(lower)) signals.push('Employer brand');
  if (/pan-african|africa-wide|multi-country/i.test(lower)) signals.push('Pan-African operations');
  return [...new Set(signals)];
}

export function contentScoreBoost(profile) {
  if (!profile) return 0;
  const signals = extractSignals(profile);
  let boost = 0;
  if (signals.includes('Active hiring')) boost += 3;
  if (signals.includes('Transformation underway')) boost += 4;
  if (signals.includes('L&D investment')) boost += 3;
  if (signals.includes('Leadership change')) boost += 4;
  if (signals.includes('Growth/Expansion')) boost += 2;
  if (signals.includes('M&A activity')) boost += 3;
  if (signals.includes('People-centric')) boost += 2;
  if (profile.leadership && profile.leadership.length > 3) boost += 2;
  return Math.min(boost, 15);
}
