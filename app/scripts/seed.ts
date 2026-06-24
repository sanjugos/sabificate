import bcrypt from 'bcryptjs';
import pg from 'pg';
import { query, pool } from '../server/db/index.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function textBlock(
  id: string,
  title: string,
  body: string,
  _bloomLevel: string,
): Record<string, unknown> {
  return {
    type: 'text_block',
    id,
    content: `## ${title}\n\n${body}`,
    difficulty_tier: 'working', // overridden per tier at the lesson level
  };
}

function quizBlock(
  id: string,
  question: string,
  options: string[],
  correctAnswer: number,
  explanation: string,
  bloomLevel: string,
  difficulty: string,
): Record<string, unknown> {
  return {
    type: 'quiz_block',
    id,
    question,
    options,
    correct_answer: correctAnswer,
    explanation,
    bloom_level: bloomLevel,
    difficulty,
  };
}

// ── Lesson Content ─────────────────────────────────────────────────────────

// Lesson 1: Introduction to AML Framework in Nigeria
const lesson1Beginner = {
  blocks: [
    textBlock(
      'l1-b-t1',
      'What Is Money Laundering?',
      'Money laundering is the process of making illegally obtained money appear legitimate. Criminals move "dirty" money through banks, businesses, or other channels so it looks like it came from a lawful source. In Nigeria, the Central Bank of Nigeria (CBN) and the Nigerian Financial Intelligence Unit (NFIU) work together to stop this. Think of it like washing dirty clothes — criminals try to "clean" their illegal funds so no one can trace them back to the crime.',
      'remember',
    ),
    textBlock(
      'l1-b-t2',
      'Why AML Matters for Bank Staff',
      'Every bank employee in Nigeria plays a role in preventing money laundering. When you open an account, process a transfer, or handle cash deposits, you are the first line of defence. The Money Laundering (Prohibition) Act 2011 (as amended 2022) requires banks to report suspicious transactions. If a bank fails to comply, it can face heavy fines and loss of its licence. As a staff member, understanding AML basics protects you, your bank, and the Nigerian financial system.',
      'understand',
    ),
    textBlock(
      'l1-b-t3',
      'The Three Stages of Money Laundering',
      'Money laundering typically follows three stages. Placement is when criminals first introduce dirty money into the financial system, for example by depositing large amounts of cash. Layering involves moving the money through multiple accounts or transactions to create confusion. Integration is the final step where the "cleaned" money re-enters the economy as seemingly legitimate funds — perhaps through property purchases or business investments. Recognising these stages helps you spot red flags at your branch.',
      'understand',
    ),
    quizBlock(
      'l1-b-q1',
      'What is the primary goal of money laundering?',
      [
        'To increase the amount of money a criminal has',
        'To make illegally obtained money appear legitimate',
        'To avoid paying taxes on legal income',
        'To transfer money between countries',
      ],
      1,
      'Money laundering is specifically about disguising the origins of illegally obtained money so it appears to come from a legitimate source.',
      'remember',
      'beginner',
    ),
    quizBlock(
      'l1-b-q2',
      'Which Nigerian body is responsible for receiving and analysing financial intelligence reports?',
      [
        'Economic and Financial Crimes Commission (EFCC)',
        'Central Bank of Nigeria (CBN)',
        'Nigerian Financial Intelligence Unit (NFIU)',
        'Securities and Exchange Commission (SEC)',
      ],
      2,
      'The NFIU was established as an autonomous body to receive, analyse, and disseminate financial intelligence from Suspicious Transaction Reports (STRs) and Currency Transaction Reports (CTRs).',
      'remember',
      'beginner',
    ),
    quizBlock(
      'l1-b-q3',
      'In which stage of money laundering does the criminal first introduce dirty money into the banking system?',
      [
        'Integration',
        'Layering',
        'Placement',
        'Extraction',
      ],
      2,
      'Placement is the first stage where illegally obtained cash is introduced into the financial system, often through cash deposits, currency exchanges, or purchases of monetary instruments.',
      'apply',
      'beginner',
    ),
  ],
};

const lesson1Intermediate = {
  blocks: [
    textBlock(
      'l1-i-t1',
      'Nigeria\'s AML Legislative Framework',
      'Nigeria\'s anti-money laundering regime is anchored in the Money Laundering (Prevention and Prohibition) Act 2022, which replaced the 2011 Act. This legislation aligns with the Financial Action Task Force (FATF) Recommendations. Key regulatory bodies include the CBN (which supervises banks), the NFIU (which serves as the national centre for financial intelligence), and the Special Control Unit against Money Laundering (SCUML), which oversees Designated Non-Financial Businesses and Professions (DNFBPs). The CBN\'s AML/CFT Regulations 2022 provide sector-specific guidance for banks and other financial institutions.',
      'understand',
    ),
    textBlock(
      'l1-i-t2',
      'Obligations of Financial Institutions Under the Act',
      'Under the 2022 Act and CBN AML/CFT Regulations, financial institutions must implement a risk-based approach to customer due diligence (CDD). This includes verifying customer identity using approved documents (BVN, NIN, international passport), conducting enhanced due diligence (EDD) for high-risk customers such as Politically Exposed Persons (PEPs), maintaining transaction records for a minimum of five years, and appointing a Chief Compliance Officer (CCO) at management level. Failure to comply carries penalties up to ₦25 million for institutions and personal criminal liability for officers.',
      'understand',
    ),
    textBlock(
      'l1-i-t3',
      'The Three Stages and Red Flag Indicators',
      'Each stage of money laundering — placement, layering, and integration — presents distinct red flags. During placement, watch for structured cash deposits just below the ₦5 million CTR threshold (called "structuring" or "smurfing"), frequent large cash deposits inconsistent with the customer\'s profile, and rapid deposit-and-withdrawal patterns. During layering, be alert to multiple transfers between unrelated accounts, use of shell companies, and round-tripping through foreign currency transactions. Integration red flags include sudden purchases of high-value assets, loans backed by offshore collateral, and unexplained wealth inconsistent with declared income.',
      'analyze',
    ),
    quizBlock(
      'l1-i-q1',
      'Which legislation currently serves as Nigeria\'s principal AML law?',
      [
        'Money Laundering (Prohibition) Act 2011',
        'Money Laundering (Prevention and Prohibition) Act 2022',
        'CBN Act 2007 (as amended)',
        'Terrorism (Prevention and Prohibition) Act 2022',
      ],
      1,
      'The Money Laundering (Prevention and Prohibition) Act 2022 replaced the 2011 Act and now serves as Nigeria\'s principal AML legislation, incorporating updates aligned with FATF standards.',
      'remember',
      'intermediate',
    ),
    quizBlock(
      'l1-i-q2',
      'A customer consistently deposits ₦4.9 million in cash every Monday. What AML red flag does this most likely indicate?',
      [
        'Normal business activity for a trading company',
        'Structuring deposits to avoid the ₦5 million CTR threshold',
        'A sign of legitimate savings behaviour',
        'An error in the bank\'s transaction monitoring system',
      ],
      1,
      'Structuring (or "smurfing") involves deliberately breaking large transactions into smaller amounts below reporting thresholds. Deposits consistently just under ₦5 million are a classic indicator and should trigger an STR filing.',
      'apply',
      'intermediate',
    ),
    quizBlock(
      'l1-i-q3',
      'What is the minimum record retention period for customer transaction records under the CBN AML/CFT Regulations?',
      [
        'Three years after the transaction',
        'Five years after the transaction or account closure',
        'Seven years after account closure',
        'Ten years after account opening',
      ],
      1,
      'The CBN AML/CFT Regulations require financial institutions to maintain transaction records for a minimum of five years after the transaction was conducted or the business relationship ended, whichever is later.',
      'remember',
      'intermediate',
    ),
  ],
};

const lesson1Advanced = {
  blocks: [
    textBlock(
      'l1-a-t1',
      'Regulatory Architecture and Inter-Agency Coordination',
      'Nigeria\'s AML/CFT ecosystem involves a multi-layered institutional framework. The NFIU Act 2018 established the NFIU as an independent agency, resolving the previous structural dependence on the EFCC that had drawn criticism during Nigeria\'s FATF/GIABA mutual evaluation. The Inter-Ministerial Committee on AML/CFT coordinates national policy. Section 6 of the ML(P&P) Act 2022 designates the CCO role and requires direct board-level reporting, while Section 15 expands predicate offences to include tax evasion, cybercrime under the Cybercrimes Act 2015, and environmental crimes. Understanding how CBN Circular BSD/DIR/GEN/LAB/14/001 interacts with NFIU\'s operational autonomy is essential for compliance architecture design.',
      'analyze',
    ),
    textBlock(
      'l1-a-t2',
      'Risk-Based Approach: FATF Methodology and Nigerian Implementation',
      'The FATF Risk-Based Approach (Recommendation 1) requires institutions to identify, assess, and mitigate ML/TF risks proportionate to the risks identified. In Nigeria, the National ML/TF Risk Assessment (NRA) identified cash-intensive sectors, real estate, and correspondent banking as high-risk areas. The CBN\'s risk-based supervision framework under BSD/DIR/GEN/LAB/16/003 mandates that banks conduct institution-wide risk assessments covering customers, products/services, delivery channels, and geographic exposure. Banks must map their risk appetite against the NRA\'s sector findings and document residual risk after applying mitigants — a gap frequently flagged during CBN on-site examinations.',
      'evaluate',
    ),
    textBlock(
      'l1-a-t3',
      'Cross-Border Dimensions and Correspondent Banking',
      'Nigeria\'s integration into global financial markets creates complex AML challenges. FATF Recommendation 13 on correspondent banking requires respondent banks to perform due diligence on their correspondents, including assessment of the correspondent\'s AML/CFT controls. The CBN Circular FPR/DIR/GEN/CIR/07/035 prohibits "nested" or "payable-through" account arrangements without explicit approval. Nigerian banks face de-risking pressure as international correspondents apply heightened scrutiny based on Nigeria\'s FATF grey-listing history. Compliance officers must navigate the tension between financial inclusion mandates (CBN\'s National Financial Inclusion Strategy) and the rigorous CDD expectations of correspondent banking partners, particularly for trade finance instruments involving jurisdictions with strategic deficiencies.',
      'evaluate',
    ),
    quizBlock(
      'l1-a-q1',
      'Under Section 15 of the ML(P&P) Act 2022, which of the following was newly added as a predicate offence for money laundering?',
      [
        'Armed robbery',
        'Drug trafficking',
        'Tax evasion',
        'Kidnapping for ransom',
      ],
      2,
      'The ML(P&P) Act 2022 expanded the list of predicate offences to include tax evasion (aligning with FATF Recommendation 3), cybercrimes under the Cybercrimes Act 2015, and environmental crimes, reflecting Nigeria\'s evolving risk profile.',
      'remember',
      'advanced',
    ),
    quizBlock(
      'l1-a-q2',
      'A Nigerian bank discovers that its correspondent banking partner in a FATF-identified jurisdiction with strategic deficiencies is processing third-party payments from entities with no apparent relationship to the respondent. What is the most appropriate regulatory response?',
      [
        'Immediately terminate the correspondent relationship',
        'File an STR with the NFIU and conduct enhanced due diligence on the arrangement to determine if it constitutes a prohibited nested or payable-through structure',
        'Report to the CBN Banking Supervision Department only',
        'Restrict the relationship to trade finance only',
      ],
      1,
      'Per CBN Circular FPR/DIR/GEN/CIR/07/035 and FATF Recommendation 13, the bank should file an STR and investigate whether the arrangement constitutes a prohibited nested account. Termination may ultimately be warranted, but the compliance function must first gather evidence and engage with the NFIU before making that determination.',
      'evaluate',
      'advanced',
    ),
    quizBlock(
      'l1-a-q3',
      'During a CBN on-site examination, an examiner identifies that a bank\'s institutional risk assessment does not map residual risk after mitigants against the National Risk Assessment\'s sectoral findings. Which regulatory framework is the bank failing to comply with?',
      [
        'ML(P&P) Act 2022 Section 7',
        'CBN BSD/DIR/GEN/LAB/16/003 on risk-based supervision',
        'NFIU Act 2018 Section 12',
        'FATF Recommendation 20 on suspicious transaction reporting',
      ],
      1,
      'CBN Circular BSD/DIR/GEN/LAB/16/003 mandates that banks conduct institution-wide risk assessments and document residual risk after applying mitigants, mapped against the NRA\'s sector-specific findings. This is a common gap identified during on-site examinations.',
      'analyze',
      'advanced',
    ),
  ],
};

// Lesson 2: Know Your Customer (KYC) Procedures
const lesson2Beginner = {
  blocks: [
    textBlock(
      'l2-b-t1',
      'What Is KYC?',
      'Know Your Customer (KYC) means verifying who your customers are before you do business with them. In Nigeria, every bank must check a customer\'s identity when they open an account. This includes collecting their Bank Verification Number (BVN), National Identification Number (NIN), a valid photo ID, and proof of address. Think of KYC as getting to know someone before lending them your car — you need to know they are who they say they are.',
      'remember',
    ),
    textBlock(
      'l2-b-t2',
      'Why KYC Protects Everyone',
      'KYC procedures protect the bank, the customer, and Nigeria\'s financial system. When banks verify identities properly, it becomes harder for criminals to open fake accounts or use someone else\'s identity. The CBN requires all banks to collect BVN during account opening because it is linked to the customer\'s biometrics (fingerprints and photograph). If a criminal tries to open multiple accounts under different names, the BVN system can catch them. Without good KYC, banks become easy targets for fraud and money laundering.',
      'understand',
    ),
    textBlock(
      'l2-b-t3',
      'Tiered KYC in Practice',
      'The CBN introduced a tiered KYC system so that even Nigerians without full documentation can access basic banking. Tier 1 accounts need only a phone number and name (with a ₦300,000 daily limit). Tier 2 requires a BVN and adds a ₦500,000 daily limit. Tier 3 is the full KYC with photo ID, address verification, and references — this allows unlimited transactions. At your branch, you will most often deal with Tier 2 and Tier 3 account openings, where thorough document checking is essential.',
      'understand',
    ),
    quizBlock(
      'l2-b-q1',
      'What does KYC stand for?',
      [
        'Keep Your Cash',
        'Know Your Customer',
        'Key Yearly Compliance',
        'Know Your Colleague',
      ],
      1,
      'KYC stands for Know Your Customer — the process of verifying the identity of customers before and during a business relationship with a bank.',
      'remember',
      'beginner',
    ),
    quizBlock(
      'l2-b-q2',
      'Which biometric-linked identifier is required for Tier 2 account opening in Nigeria?',
      [
        'International passport',
        'National Identification Number (NIN)',
        'Bank Verification Number (BVN)',
        'Voter\'s card',
      ],
      2,
      'The Bank Verification Number (BVN) is a biometric-linked identifier required for Tier 2 accounts. It captures fingerprints and a photograph, making it a key tool in preventing identity fraud.',
      'remember',
      'beginner',
    ),
    quizBlock(
      'l2-b-q3',
      'A customer opens a Tier 1 account using only their phone number and name. What is the maximum daily transaction limit for this account?',
      [
        '₦100,000',
        '₦300,000',
        '₦500,000',
        'No limit',
      ],
      1,
      'Tier 1 accounts in the CBN\'s tiered KYC system have a daily transaction limit of ₦300,000. These accounts require minimal documentation (phone number and name) but have restricted transaction capabilities.',
      'apply',
      'beginner',
    ),
  ],
};

const lesson2Intermediate = {
  blocks: [
    textBlock(
      'l2-i-t1',
      'Customer Due Diligence Under CBN Regulations',
      'The CBN AML/CFT Regulations require financial institutions to apply Customer Due Diligence (CDD) at account opening, when carrying out occasional transactions above ₦5 million, when there is suspicion of ML/TF, and when there are doubts about previously obtained identification data. Standard CDD involves verifying the customer\'s identity through reliable independent sources, identifying the beneficial owner for corporate accounts, understanding the purpose and intended nature of the business relationship, and conducting ongoing monitoring. Enhanced Due Diligence (EDD) applies to PEPs, correspondent banking relationships, customers from high-risk jurisdictions, and complex or unusual transactions.',
      'understand',
    ),
    textBlock(
      'l2-i-t2',
      'Beneficial Ownership and Corporate Accounts',
      'For corporate customers, the CDD obligation extends to identifying the Ultimate Beneficial Owner (UBO) — any natural person who directly or indirectly owns or controls 10% or more of the shares or voting rights (per CAMA 2020 and CBN guidelines). Banks must obtain the company\'s CAC registration, memorandum and articles of association, board resolution authorising the account opening, and identification for all directors and signatories. For complex ownership structures involving trusts or nominee arrangements, banks must trace ownership through the chain until they identify the natural person who ultimately benefits. The ML(P&P) Act 2022 requires companies to maintain a register of beneficial owners, which must be available to banks upon request.',
      'analyze',
    ),
    textBlock(
      'l2-i-t3',
      'Ongoing Monitoring and CDD Triggers',
      'CDD is not a one-time exercise. Banks must implement continuous monitoring systems that flag transactions inconsistent with the customer\'s known profile. Triggers for CDD review include: a material change in the nature of the business relationship, transactions that appear unusual relative to the customer\'s profile, when the bank is required to contact the customer to verify identity, and at least once every 1-3 years depending on risk rating. High-risk customers should be reviewed annually, medium-risk every two years, and low-risk every three years. Each review should re-verify the customer\'s information, update the risk rating, and assess whether previously filed STRs require follow-up.',
      'apply',
    ),
    quizBlock(
      'l2-i-q1',
      'At what ownership threshold must a bank identify the ultimate beneficial owner of a corporate customer?',
      [
        '5% or more of shares or voting rights',
        '10% or more of shares or voting rights',
        '25% or more of shares or voting rights',
        '51% or more of shares or voting rights',
      ],
      1,
      'Per CAMA 2020 and CBN guidelines, the Ultimate Beneficial Owner (UBO) is any natural person who directly or indirectly owns or controls 10% or more of the shares or voting rights of a company. This is more stringent than the 25% threshold used in some other jurisdictions.',
      'remember',
      'intermediate',
    ),
    quizBlock(
      'l2-i-q2',
      'A medium-risk corporate customer has not been reviewed for 30 months. According to CBN CDD review cycles, what should the compliance team do?',
      [
        'No action needed — medium-risk customers are reviewed every 3 years',
        'Schedule an immediate CDD review as the 2-year cycle has been exceeded',
        'Downgrade the customer to low-risk since there have been no issues',
        'Close the account for non-compliance',
      ],
      1,
      'Medium-risk customers should be reviewed every two years (24 months). At 30 months, the review is overdue and the compliance team should schedule an immediate CDD review to re-verify customer information and update the risk rating.',
      'apply',
      'intermediate',
    ),
    quizBlock(
      'l2-i-q3',
      'A new corporate customer presents a complex ownership structure involving a BVI-registered holding company with nominee shareholders. What level of due diligence is required?',
      [
        'Simplified Due Diligence (SDD)',
        'Standard Customer Due Diligence (CDD)',
        'Enhanced Due Diligence (EDD)',
        'No special due diligence beyond standard CDD',
      ],
      2,
      'Complex ownership structures involving offshore entities and nominee arrangements are inherently high-risk and require Enhanced Due Diligence (EDD). The bank must trace through the nominee arrangements to identify the natural person who ultimately controls and benefits from the relationship.',
      'analyze',
      'intermediate',
    ),
  ],
};

const lesson2Advanced = {
  blocks: [
    textBlock(
      'l2-a-t1',
      'PEP Identification and Risk Scoring Methodologies',
      'FATF Recommendation 12 and Section 7 of the ML(P&P) Act 2022 require EDD for Politically Exposed Persons. Nigerian regulations define PEPs to include heads of state, senior government officials, senior executives of state-owned enterprises, senior political party officials, and senior military officers — extending to their family members and close associates. Banks must implement automated screening against PEP databases (commercial providers such as Refinitiv World-Check or Dow Jones), integrate PEP status into the customer risk scoring matrix, and apply a risk multiplier that accounts for both domestic and foreign PEP status. The CBN expects PEP relationships to have senior management approval (at minimum, the Head of Compliance or designated executive director), documented source of wealth verification, and enhanced ongoing monitoring with quarterly transaction reviews.',
      'analyze',
    ),
    textBlock(
      'l2-a-t2',
      'CDD for Complex Legal Arrangements and Trust Structures',
      'Nigerian banks increasingly encounter customers utilising complex legal arrangements — discretionary trusts, foundations registered under foreign law, multi-layered corporate structures with cross-border ownership, and private trust companies (PTCs). For trusts, CDD must cover the settlor, all trustees, the protector (if any), named beneficiaries, and the class of beneficiaries in discretionary trusts. Per FATF Recommendation 25 and CBN Circular BSD/DIR/GEN/LAB/14/001, banks must obtain the trust deed, understand the source of the trust\'s assets, and determine who has effective control over the trust\'s operations. Where the trust operates through a PTC registered in a jurisdiction without adequate AML controls (e.g., certain Caribbean or Pacific island jurisdictions), the bank must apply EDD equivalent to that applied to correspondent banking relationships under Recommendation 13.',
      'evaluate',
    ),
    textBlock(
      'l2-a-t3',
      'Digital Identity Verification and Regulatory Technology',
      'The CBN\'s regulatory sandbox framework and the Nigeria Data Protection Act 2023 (NDPA) create opportunities and constraints for digital KYC (e-KYC). Banks may leverage NIMC\'s NIN Verification Service, BVN validation via the Nigeria Inter-Bank Settlement System (NIBSS), and third-party identity verification providers registered with the CBN. However, the NDPA imposes consent and purpose limitation requirements on biometric data processing that must be reconciled with the ML(P&P) Act\'s CDD obligations. Section 9(2) of the NDPA provides a lawful basis exemption for AML compliance, but banks must still implement data minimisation principles. The challenge arises in EDD scenarios where extensive data collection — income verification, source of wealth documentation, and lifestyle analysis — may conflict with the NDPA\'s proportionality requirements. Compliance officers must work with data protection officers to develop integrated frameworks.',
      'evaluate',
    ),
    quizBlock(
      'l2-a-q1',
      'A bank\'s automated screening system flags a customer\'s spouse as a PEP. The customer themselves holds no political position. Under Nigerian AML regulations, how should the bank classify this customer?',
      [
        'As a non-PEP since they hold no political position themselves',
        'As a PEP family member requiring EDD, senior management approval, and source of wealth verification',
        'As a medium-risk customer requiring standard CDD with additional monitoring',
        'As a PEP requiring only simplified due diligence since the risk is indirect',
      ],
      1,
      'Under Section 7 of the ML(P&P) Act 2022 and FATF Recommendation 12, PEP classification extends to family members (including spouses) and close associates. The bank must apply the full EDD regime: senior management approval, source of wealth verification, and enhanced ongoing monitoring.',
      'apply',
      'advanced',
    ),
    quizBlock(
      'l2-a-q2',
      'A discretionary trust registered in Jersey wishes to open an account at a Nigerian bank. The trust deed names a class of beneficiaries described as "the settler\'s descendants and such persons as the trustee may determine." Which FATF Recommendation specifically addresses the CDD obligations for this type of arrangement?',
      [
        'Recommendation 10 (Customer Due Diligence)',
        'Recommendation 12 (Politically Exposed Persons)',
        'Recommendation 25 (Transparency and Beneficial Ownership of Legal Arrangements)',
        'Recommendation 22 (DNFBPs: Customer Due Diligence)',
      ],
      2,
      'FATF Recommendation 25 specifically addresses transparency and beneficial ownership of legal arrangements, including trusts. For discretionary trusts with open-ended beneficiary classes, the bank must obtain sufficient information about the class of beneficiaries to satisfy the trustee\'s obligation to identify beneficiaries at the time of payout.',
      'analyze',
      'advanced',
    ),
    quizBlock(
      'l2-a-q3',
      'Under the NDPA 2023, which provision provides the lawful basis for banks to process customer biometric data for AML/CDD purposes without explicit consent?',
      [
        'Section 5 (consent-based processing)',
        'Section 9(2) (compliance with legal obligations)',
        'Section 12 (legitimate interest)',
        'Section 15 (public interest)',
      ],
      1,
      'Section 9(2) of the NDPA 2023 provides a lawful basis exemption for processing personal data (including biometrics) when necessary for compliance with a legal obligation — in this case, the CDD requirements under the ML(P&P) Act 2022 and CBN AML/CFT Regulations.',
      'evaluate',
      'advanced',
    ),
  ],
};

// Lesson 3: Transaction Monitoring Basics
const lesson3Beginner = {
  blocks: [
    textBlock(
      'l3-b-t1',
      'What Is Transaction Monitoring?',
      'Transaction monitoring is the process of watching customer transactions to spot anything unusual. Banks in Nigeria use computer systems to automatically check every transaction against a set of rules. For example, if a customer who normally receives a ₦200,000 salary suddenly receives ₦50 million from an unknown source, the system flags it for review. Think of it like a security camera — it watches everything and alerts the guards when something looks wrong.',
      'remember',
    ),
    textBlock(
      'l3-b-t2',
      'Common Red Flags to Watch For',
      'Even without a computer, you can spot suspicious transactions at your branch. Watch for customers who deposit or withdraw large amounts of cash frequently, customers who seem nervous or reluctant to provide identification, transactions that don\'t match what the customer told you about their business, multiple people making deposits into the same account, and customers who try to convince you not to file paperwork. These are all red flags that the transaction might be linked to money laundering or other financial crime.',
      'understand',
    ),
    textBlock(
      'l3-b-t3',
      'Your Role in Transaction Monitoring',
      'As a frontline bank staff member, your observations matter. If something feels wrong about a transaction, tell your supervisor or compliance officer. You do not need to prove that money laundering is happening — you just need to report what seems unusual. The CBN and NFIU want banks to report early and often. It is better to report ten innocent transactions than to miss one case of real money laundering. Remember: reporting a suspicious transaction is confidential. The customer must never know that a report has been filed about them.',
      'apply',
    ),
    quizBlock(
      'l3-b-q1',
      'What is the primary purpose of transaction monitoring in banks?',
      [
        'To track how much profit the bank makes',
        'To detect unusual or suspicious financial activity',
        'To calculate taxes owed by customers',
        'To determine which customers qualify for loans',
      ],
      1,
      'Transaction monitoring\'s primary purpose is to detect unusual or suspicious financial activity that may indicate money laundering, terrorism financing, or other financial crimes.',
      'remember',
      'beginner',
    ),
    quizBlock(
      'l3-b-q2',
      'A regular customer who runs a small provision store deposits ₦15 million in cash. This is unusual because their normal deposits are around ₦500,000. What should you do?',
      [
        'Accept the deposit and say nothing',
        'Refuse the deposit and ask the customer to leave',
        'Accept the deposit and report it to your compliance officer',
        'Ask the customer where the money came from and then decide',
      ],
      2,
      'When a transaction is inconsistent with a customer\'s known profile, you should process the transaction normally but immediately report it to your compliance officer. Refusing the transaction or questioning the customer could tip them off (known as "tipping off"), which is illegal.',
      'apply',
      'beginner',
    ),
    quizBlock(
      'l3-b-q3',
      'Why is "tipping off" a problem in AML compliance?',
      [
        'It slows down the transaction process',
        'It alerts the customer that a suspicious report has been filed, allowing them to destroy evidence',
        'It causes the bank to lose the customer\'s business',
        'It creates extra paperwork for the compliance team',
      ],
      1,
      'Tipping off is a criminal offence because it warns the suspected person that a report has been or will be made, giving them the opportunity to destroy evidence, move funds, or flee. The ML(P&P) Act 2022 makes tipping off punishable by imprisonment.',
      'understand',
      'beginner',
    ),
  ],
};

const lesson3Intermediate = {
  blocks: [
    textBlock(
      'l3-i-t1',
      'Rule-Based vs Behaviour-Based Monitoring',
      'Nigerian banks typically employ two complementary transaction monitoring approaches. Rule-based systems use predefined thresholds and patterns — e.g., single cash transactions at or above ₦5 million (triggering a CTR), multiple transactions by the same customer within 24 hours that collectively exceed ₦5 million, or wire transfers to/from high-risk jurisdictions. Behaviour-based (anomaly detection) systems establish a baseline of each customer\'s normal activity and flag deviations. The CBN expects banks to use both approaches: rules catch known typologies, while behavioural models can detect novel schemes that don\'t match existing patterns.',
      'understand',
    ),
    textBlock(
      'l3-i-t2',
      'Currency Transaction Reports and Filing Obligations',
      'Section 10 of the ML(P&P) Act 2022 mandates that financial institutions file Currency Transaction Reports (CTRs) for all cash transactions at or above ₦5 million (individual) or ₦10 million (corporate). CTRs must be filed with the NFIU within 24 hours of the transaction. The report must include the customer\'s identity details, account information, transaction amount, and the source of funds if ascertainable. Unlike STRs, CTR filing is mandatory regardless of whether the transaction appears suspicious — it is a volume-based reporting requirement. Banks must also file Foreign Currency Transaction Reports (FCTRs) for transfers exceeding $10,000 or its equivalent.',
      'apply',
    ),
    textBlock(
      'l3-i-t3',
      'Alert Management and Escalation Procedures',
      'An effective transaction monitoring system generates alerts that must be investigated, documented, and resolved within defined timeframes. The CBN expects banks to implement a three-tier escalation model: Level 1 analysts review and disposit alerts within 48 hours, determining whether the alert is a true positive or false positive. True positives escalate to Level 2, where experienced analysts conduct deeper investigation, including customer outreach and source-of-funds analysis. If the investigation confirms suspicion, it escalates to the CCO (Level 3) for STR filing decision. Banks must maintain an alert-to-STR conversion ratio that demonstrates both system effectiveness and analyst competence — too few STRs relative to alerts suggests defensive filing, while too many may indicate inadequate monitoring rules.',
      'analyze',
    ),
    quizBlock(
      'l3-i-q1',
      'What is the cash transaction threshold for mandatory CTR filing for individual customers in Nigeria?',
      [
        '₦1 million',
        '₦5 million',
        '₦10 million',
        '₦25 million',
      ],
      1,
      'Under Section 10 of the ML(P&P) Act 2022, CTRs must be filed for cash transactions at or above ₦5 million for individual customers and ₦10 million for corporate customers.',
      'remember',
      'intermediate',
    ),
    quizBlock(
      'l3-i-q2',
      'A Level 1 analyst has been reviewing an alert for 72 hours without resolution. According to the three-tier escalation model, what should happen?',
      [
        'The alert should be automatically closed as a false positive',
        'The alert has exceeded the 48-hour resolution target and should be escalated for management attention',
        'The analyst should continue investigating until they reach a conclusion',
        'The alert should be filed as an STR out of caution',
      ],
      1,
      'Level 1 analysts are expected to review and disposit alerts within 48 hours. An alert outstanding for 72 hours has exceeded this timeframe and should be flagged for management attention, potentially escalating directly to Level 2 for investigation.',
      'apply',
      'intermediate',
    ),
    quizBlock(
      'l3-i-q3',
      'A bank\'s transaction monitoring system generates 5,000 alerts per month but only 2 result in STR filings. What does this alert-to-STR ratio most likely indicate?',
      [
        'The bank has excellent compliance and very few suspicious customers',
        'The monitoring rules are poorly calibrated, generating excessive false positives',
        'The bank is filing defensively to avoid regulatory penalties',
        'The NFIU has set a low STR quota for this bank',
      ],
      1,
      'An extremely low alert-to-STR conversion ratio (0.04% in this case) strongly suggests that the monitoring rules are generating excessive false positives. The CBN expects banks to regularly tune their monitoring rules to maintain a balanced ratio that demonstrates both system effectiveness and resource efficiency.',
      'analyze',
      'intermediate',
    ),
  ],
};

const lesson3Advanced = {
  blocks: [
    textBlock(
      'l3-a-t1',
      'Advanced Typologies: Trade-Based Money Laundering in Nigeria',
      'Trade-Based Money Laundering (TBML) exploits Nigeria\'s import-dependent economy. FATF typology studies and CBN advisories identify several Nigerian-specific TBML schemes: over-invoicing of imports (inflating the price of goods to justify outbound wire transfers), under-invoicing of exports (particularly crude oil and agricultural commodities), phantom shipments using falsified bills of lading and certificates of origin, and multiple invoicing where the same shipment is invoiced to several banks. Detection requires cross-referencing trade documents (Form M, bills of lading, inspection certificates) against market prices, verifying the existence of counterparties through independent sources, and analysing patterns of trade flows relative to the customer\'s declared business capacity. The NFIU\'s 2023 Strategic Analysis Report identified TBML as the highest-risk ML channel for Nigeria, accounting for an estimated 35% of proceeds of crime entering the formal financial sector.',
      'evaluate',
    ),
    textBlock(
      'l3-a-t2',
      'Machine Learning Models in Transaction Monitoring',
      'Leading Nigerian banks are supplementing rule-based systems with machine learning (ML) models to reduce false positive rates and detect emerging typologies. Supervised models trained on historical STR data can classify transactions with higher precision, while unsupervised clustering algorithms identify anomalous patterns without predefined labels. However, the CBN Circular BSD/DIR/GEN/LAB/22/007 on Model Risk Management requires banks using ML in compliance functions to maintain explainability — regulators and auditors must understand why a model flagged or cleared a transaction. This creates tension between complex models (e.g., deep neural networks) that achieve better accuracy and simpler models (e.g., gradient-boosted trees, logistic regression) that are more interpretable. Banks must also address data quality challenges: incomplete BVN records, inconsistent data across legacy systems, and the need to comply with the NDPA\'s data minimisation requirements when training models on customer data.',
      'evaluate',
    ),
    textBlock(
      'l3-a-t3',
      'Cross-Institutional Information Sharing and Section 14',
      'Section 14 of the ML(P&P) Act 2022 provides a safe harbour for information sharing between financial institutions when conducted in good faith for AML/CFT purposes. This enables Joint Money Laundering Intelligence Taskforce (JMLIT)-style collaboration, where banks share typology information and, in specific cases, customer risk intelligence through the NFIU as an intermediary. However, the NDPA 2023 imposes conditions: cross-institutional data sharing must have a lawful basis (typically legal obligation or substantial public interest), be limited to what is necessary, and include appropriate safeguards. In practice, Nigerian banks are establishing bilateral information-sharing agreements with NFIU oversight, modelled on the UK JMLIT framework. The compliance challenge is operationalising Section 14 while maintaining the confidentiality obligations under Section 18 (tipping-off prohibition) and ensuring that shared intelligence does not create regulatory liability for the receiving institution if it fails to act on information received.',
      'create',
    ),
    quizBlock(
      'l3-a-q1',
      'A Nigerian bank\'s trade finance department receives a Form M for importation of telecommunications equipment valued at $5 million from a company in Dubai. The bank\'s market price database shows similar equipment typically costs $1.5 million. What TBML typology does this most likely represent?',
      [
        'Phantom shipment',
        'Over-invoicing of imports',
        'Under-invoicing of exports',
        'Multiple invoicing',
      ],
      1,
      'Over-invoicing of imports involves inflating the declared value of imported goods to justify larger outbound wire transfers. The significant discrepancy between the invoiced price ($5M) and market price ($1.5M) is a classic indicator of this TBML typology, which is commonly used to move value out of Nigeria.',
      'apply',
      'advanced',
    ),
    quizBlock(
      'l3-a-q2',
      'A bank deploys a deep neural network for transaction monitoring that achieves a 15% false positive rate (compared to 85% for the previous rule-based system). However, the model cannot explain why specific transactions were flagged. Under which CBN circular would this model face regulatory challenge?',
      [
        'BSD/DIR/GEN/LAB/14/001 on AML/CFT Regulations',
        'BSD/DIR/GEN/LAB/22/007 on Model Risk Management',
        'FPR/DIR/GEN/CIR/07/035 on Correspondent Banking',
        'BSD/DIR/GEN/LAB/16/003 on Risk-Based Supervision',
      ],
      1,
      'CBN Circular BSD/DIR/GEN/LAB/22/007 on Model Risk Management requires explainability for ML models used in compliance functions. While the deep neural network achieves superior accuracy, its inability to explain individual decisions ("black box" problem) would fail the explainability requirement during regulatory examination.',
      'analyze',
      'advanced',
    ),
    quizBlock(
      'l3-a-q3',
      'Under Section 14 of the ML(P&P) Act 2022, Bank A shares customer risk intelligence with Bank B through the NFIU. Bank B subsequently fails to act on the information and the customer launders ₦500 million through Bank B. What is Bank A\'s regulatory exposure?',
      [
        'Bank A is jointly liable for Bank B\'s failure to act',
        'Bank A has no liability if the sharing was in good faith and conducted through the NFIU as intermediary',
        'Bank A is liable for tipping off because the customer may learn of Bank A\'s suspicions through Bank B',
        'Bank A must file an additional STR about Bank B\'s failure to act',
      ],
      1,
      'Section 14 provides a safe harbour for good-faith information sharing between financial institutions for AML/CFT purposes. If Bank A shared intelligence in good faith through the proper NFIU-mediated channel, it is protected from liability for Bank B\'s subsequent failure to act. However, the confidentiality obligations under Section 18 still apply — neither bank may disclose the sharing to the customer.',
      'evaluate',
      'advanced',
    ),
  ],
};

// Lesson 4: Suspicious Activity Reporting
const lesson4Beginner = {
  blocks: [
    textBlock(
      'l4-b-t1',
      'What Is a Suspicious Transaction Report?',
      'A Suspicious Transaction Report (STR) is a report that a bank sends to the Nigerian Financial Intelligence Unit (NFIU) when it notices a transaction or activity that might be linked to crime. You don\'t need to be certain that a crime has occurred — you only need to have a reasonable suspicion. The STR is kept completely confidential. The customer is never told that a report has been filed. The NFIU then analyses the report and may pass the information to law enforcement agencies like the EFCC or NDLEA if further investigation is needed.',
      'remember',
    ),
    textBlock(
      'l4-b-t2',
      'When Should You Report?',
      'You should consider filing an STR whenever something about a transaction or customer behaviour doesn\'t add up. Common situations include: a customer who is unable to explain the source of a large deposit, transactions that have no clear business or personal purpose, a customer who tries to avoid providing identification, unusual patterns like someone depositing cash and immediately wiring it abroad, and customers whose lifestyle doesn\'t match their declared occupation or income. If you are in doubt, report it — the NFIU would rather receive a report that turns out to be innocent than miss real criminal activity.',
      'understand',
    ),
    textBlock(
      'l4-b-t3',
      'How the Reporting Process Works',
      'When you spot something suspicious at your branch, follow these steps. First, do not tip off the customer — process the transaction normally and do not ask them about your suspicions. Second, record the details while they are fresh: customer name, account number, transaction amount, date/time, and what made you suspicious. Third, report to your supervisor or compliance officer as soon as possible. They will decide whether an STR needs to be filed with the NFIU. The compliance team files STRs electronically through the NFIU\'s goAML reporting platform. The whole process should happen within 72 hours of when you first noticed the suspicious activity.',
      'apply',
    ),
    quizBlock(
      'l4-b-q1',
      'Who receives Suspicious Transaction Reports filed by Nigerian banks?',
      [
        'The Economic and Financial Crimes Commission (EFCC)',
        'The Central Bank of Nigeria (CBN)',
        'The Nigerian Financial Intelligence Unit (NFIU)',
        'The Nigerian Police Force',
      ],
      2,
      'STRs are filed with the Nigerian Financial Intelligence Unit (NFIU), which is Nigeria\'s national centre for receiving and analysing financial intelligence. The NFIU may subsequently share relevant information with law enforcement agencies.',
      'remember',
      'beginner',
    ),
    quizBlock(
      'l4-b-q2',
      'After noticing a suspicious transaction, what should you do FIRST?',
      [
        'Ask the customer to explain the transaction',
        'Refuse to process the transaction',
        'Process the transaction normally and record the details',
        'Call the police immediately',
      ],
      2,
      'The correct first step is to process the transaction normally while recording the relevant details. Asking the customer about your suspicions or refusing the transaction could constitute tipping off, which is a criminal offence under the ML(P&P) Act 2022.',
      'apply',
      'beginner',
    ),
    quizBlock(
      'l4-b-q3',
      'What electronic platform does the NFIU use to receive STRs from Nigerian banks?',
      [
        'CBN E-Returns',
        'NIBSS Instant Payment',
        'goAML',
        'SWIFT GPI',
      ],
      2,
      'The NFIU uses the goAML platform — an IT solution developed by the United Nations Office on Drugs and Crime (UNODC) — to receive, manage, and analyse STRs and other financial intelligence reports from reporting entities in Nigeria.',
      'remember',
      'beginner',
    ),
  ],
};

const lesson4Intermediate = {
  blocks: [
    textBlock(
      'l4-i-t1',
      'STR Filing Requirements and Legal Obligations',
      'Under Section 6(2) of the ML(P&P) Act 2022, financial institutions must file STRs whenever there is a suspicion or reasonable ground to suspect that funds are the proceeds of a criminal offence or are related to terrorism financing. The filing obligation attaches to the institution, not the individual employee, though the CCO bears personal responsibility for ensuring that the bank\'s reporting framework operates effectively. STRs must be filed through the NFIU\'s goAML portal and should include: the full identity of the parties involved, the nature and details of the transaction, the grounds for suspicion, and any supporting documentation. Banks are required to file the STR regardless of whether the transaction was completed, attempted, or refused.',
      'understand',
    ),
    textBlock(
      'l4-i-t2',
      'Quality of STR Filings',
      'The NFIU has repeatedly emphasised that STR quality is as important as STR quantity. A high-quality STR contains a clear narrative explaining why the activity is suspicious (not just that a rule was triggered), relevant customer profile information for context, links to related accounts or individuals, a timeline of the suspicious activity, and supporting documents such as transaction records and identification documents. Common deficiencies flagged by the NFIU include: vague narratives (e.g., "unusual transaction"), failure to connect the suspicious activity to specific AML/CFT risk indicators, missing subject identification information, and defensive filing without genuine suspicion. Banks with persistent quality issues may face regulatory action under the CBN\'s risk-based supervision framework.',
      'analyze',
    ),
    textBlock(
      'l4-i-t3',
      'Attempted Transactions and Consent Regime',
      'The obligation to file STRs extends to attempted transactions — situations where a customer initiates a transaction but it is not completed, either because the bank refused it or the customer withdrew the request. These "attempted transaction STRs" are particularly valuable to the NFIU because they may indicate that the customer will attempt the same transaction at another institution. Additionally, Section 12 of the ML(P&P) Act 2022 introduces a consent regime: when a bank files an STR and the transaction has not yet been completed, the bank may apply to the NFIU for consent to proceed with or refuse the transaction. The NFIU must respond within 72 hours; if no response is received, the bank may proceed. This consent mechanism provides a legal framework for banks to delay suspicious transactions without tipping off the customer.',
      'apply',
    ),
    quizBlock(
      'l4-i-q1',
      'Under the ML(P&P) Act 2022, when must an STR be filed?',
      [
        'Only when the bank has confirmed that criminal activity occurred',
        'When there is suspicion or reasonable ground to suspect ML/TF, regardless of whether the transaction was completed',
        'Only for completed transactions above ₦5 million',
        'Only when instructed by the CBN or NFIU',
      ],
      1,
      'Section 6(2) requires STR filing whenever there is suspicion or reasonable ground to suspect ML/TF. The obligation applies to completed, attempted, and refused transactions — the bank does not need to confirm that criminal activity actually occurred.',
      'understand',
      'intermediate',
    ),
    quizBlock(
      'l4-i-q2',
      'A compliance officer files an STR with the narrative: "Large cash deposit flagged by monitoring system." Why is this STR likely to be flagged as deficient by the NFIU?',
      [
        'Because cash deposits do not require STR filing',
        'Because the narrative lacks a clear explanation of why the specific activity is suspicious in the context of the customer\'s profile',
        'Because STRs must be filed before investigating the alert',
        'Because the compliance officer should have contacted the NFIU by phone instead',
      ],
      1,
      'The NFIU expects STR narratives to explain why the activity is suspicious in the context of the customer\'s known profile and business. Simply stating that a monitoring system flagged a large deposit is a description, not an analysis. The narrative should explain how the deposit is inconsistent with the customer\'s profile and reference specific risk indicators.',
      'analyze',
      'intermediate',
    ),
    quizBlock(
      'l4-i-q3',
      'A bank files an STR for a pending wire transfer of ₦200 million and requests NFIU consent under Section 12. The NFIU does not respond within 72 hours. What may the bank do?',
      [
        'The bank must hold the transaction indefinitely until the NFIU responds',
        'The bank must refuse the transaction',
        'The bank may proceed with the transaction',
        'The bank must escalate to the CBN for instruction',
      ],
      2,
      'Under the consent regime in Section 12 of the ML(P&P) Act 2022, if the NFIU does not respond within 72 hours, the bank is deemed to have received consent and may proceed with the transaction. This time-bound mechanism balances law enforcement needs with the bank\'s obligation to process legitimate transactions.',
      'apply',
      'intermediate',
    ),
  ],
};

const lesson4Advanced = {
  blocks: [
    textBlock(
      'l4-a-t1',
      'Strategic Analysis and Typology Development',
      'Beyond operational (case-specific) STR analysis, the NFIU conducts strategic analysis to identify emerging ML/TF trends, typologies, and systemic vulnerabilities in Nigeria\'s financial sector. This analysis draws on aggregated STR data, CTR patterns, international intelligence from Egmont Group exchanges, and sector-specific studies. The NFIU\'s strategic analysis products — including the annual Nigerian Financial Intelligence Report and periodic typology publications — inform the National Risk Assessment (NRA) update cycle and the CBN\'s supervisory priorities. Compliance officers should incorporate NFIU typology publications into their institution\'s risk assessment methodology, staff training curriculum, and monitoring rule calibration. The feedback loop between STR filing, strategic analysis, and monitoring rule updates is what transforms the STR regime from a regulatory checkbox into an intelligence-driven compliance programme.',
      'evaluate',
    ),
    textBlock(
      'l4-a-t2',
      'Legal Protections and Liability Framework',
      'The ML(P&P) Act 2022 provides a complex liability framework for STR filing. Section 6(5) provides safe harbour: no civil, criminal, or disciplinary proceedings may be brought against a person who makes a good-faith disclosure to the NFIU. However, Section 4(1) creates personal criminal liability for officers who wilfully fail to report suspicious transactions — punishable by up to 3 years imprisonment and ₦1 million fine. The tension between these provisions creates a powerful incentive structure. Defensive over-filing is problematic but carries no legal penalty, while under-filing creates personal criminal exposure for the CCO and other designated officers. Courts have interpreted "wilful" in this context to include reckless disregard — meaning that a CCO who implements inadequate monitoring systems or ignores analyst escalations may face personal liability even absent specific intent. The 2021 Federal High Court decision in FRN v. Nwankwo established that systemic compliance failures can constitute wilful neglect.',
      'evaluate',
    ),
    textBlock(
      'l4-a-t3',
      'Cross-Border STR Coordination and Egmont Exchanges',
      'Nigeria\'s NFIU is a member of the Egmont Group of Financial Intelligence Units, enabling cross-border intelligence exchange through secure channels. When a Nigerian bank files an STR involving international counterparties, the NFIU may initiate a request for information from the relevant foreign FIU through the Egmont Secure Web (ESW). For Nigerian banks with correspondent relationships, this creates a dual-filing consideration: the Nigerian bank files with the NFIU, while the correspondent bank in the foreign jurisdiction may independently file with its own FIU. The two FIUs may then correlate the filings through Egmont channels. Compliance officers managing international relationships must understand that STR filings in Nigeria may trigger parallel investigations in correspondent jurisdictions, particularly in the US (FinCEN), UK (NCA/UKFIU), and UAE (FIU). This interconnected intelligence network means that the quality and timeliness of Nigerian STR filings directly affects the country\'s reputation in the international correspondent banking ecosystem.',
      'create',
    ),
    quizBlock(
      'l4-a-q1',
      'A CCO implements a transaction monitoring system but never reviews or updates the monitoring rules over a two-year period. During this time, multiple high-risk transactions pass through undetected. Under Section 4(1) of the ML(P&P) Act 2022 and the FRN v. Nwankwo precedent, what is the CCO\'s legal exposure?',
      [
        'No liability because the system was technically in place',
        'Civil liability only, limited to regulatory fines',
        'Potential personal criminal liability for wilful neglect, as courts have interpreted "wilful" to include reckless disregard of compliance obligations',
        'Liability only if they can prove the CCO had actual knowledge of specific suspicious transactions',
      ],
      2,
      'Following FRN v. Nwankwo, "wilful" failure includes reckless disregard for compliance obligations. A CCO who implements but never maintains monitoring systems demonstrates systemic neglect that courts have held constitutes wilful failure — exposing them to personal criminal liability under Section 4(1), including up to 3 years imprisonment.',
      'evaluate',
      'advanced',
    ),
    quizBlock(
      'l4-a-q2',
      'A Nigerian bank files an STR involving a wire transfer to a UAE-based company. The NFIU initiates an Egmont Group information exchange with the UAE FIU. The UAE FIU discovers that the UAE company is a front for sanctioned individuals. What mechanism enables this cross-border intelligence correlation?',
      [
        'SWIFT messaging system',
        'CBN-to-Central Bank bilateral agreement',
        'Egmont Secure Web (ESW) — the Egmont Group\'s confidential intelligence-sharing platform',
        'FATF mutual evaluation process',
      ],
      2,
      'The Egmont Secure Web (ESW) is the confidential communication channel through which Egmont Group member FIUs exchange financial intelligence. It enables the NFIU to request and receive information from foreign FIUs, facilitating cross-border correlation of STR filings and identification of international ML/TF networks.',
      'remember',
      'advanced',
    ),
    quizBlock(
      'l4-a-q3',
      'The NFIU\'s annual strategic analysis reveals that 40% of STRs filed by Bank X over the past year relate to structuring below the CTR threshold. How should the NFIU and CBN use this information?',
      [
        'Congratulate Bank X for filing a high volume of STRs',
        'Use the finding to inform the NRA update cycle, adjust CBN supervisory priorities, and issue guidance to banks on structuring detection — completing the intelligence feedback loop',
        'Penalise Bank X for filing too many STRs about the same typology',
        'Share the specific customer data from Bank X\'s STRs with all other banks',
      ],
      1,
      'The strategic analysis feedback loop means that aggregated STR data informs national risk assessment updates, CBN supervisory priorities, and industry guidance. The high concentration of structuring STRs may indicate either a genuine trend in the bank\'s customer base or an opportunity to refine CTR thresholds and monitoring rules sector-wide.',
      'evaluate',
      'advanced',
    ),
  ],
};

// Lesson 5: SAR Filing Procedures
const lesson5Beginner = {
  blocks: [
    textBlock(
      'l5-b-t1',
      'Understanding SAR/STR Filing',
      'A Suspicious Activity Report (SAR), which in Nigeria is called a Suspicious Transaction Report (STR), is the formal document that your bank submits to the NFIU. Think of it as filling out a detailed incident report. The STR captures four key pieces of information: who was involved (customer details), what happened (the transaction details), when it happened (dates and times), and why it is suspicious (your reasons for concern). The STR does not accuse anyone of a crime — it simply says, "this activity deserves a closer look."',
      'remember',
    ),
    textBlock(
      'l5-b-t2',
      'The goAML Reporting System',
      'Nigerian banks file STRs electronically through the goAML system. GoAML is a software platform created by the United Nations and used by financial intelligence units in over 50 countries. In Nigeria, each bank has designated users who can log into the goAML portal to file reports. The system guides you through a series of fields to fill in — customer information, transaction details, and the narrative explaining your suspicion. Once submitted, the report receives a reference number and is sent to the NFIU for analysis. Your bank\'s compliance team manages the goAML accounts and will train you on how to use the system.',
      'understand',
    ),
    textBlock(
      'l5-b-t3',
      'Writing a Good STR Narrative',
      'The narrative is the most important part of an STR because it explains why the transaction is suspicious. A good narrative answers: what about this transaction is unusual, how does it differ from the customer\'s normal behaviour, and what red flags did you observe. For example, instead of writing "large cash deposit," write "Customer deposited ₦8 million in cash on 5 March. Customer\'s account shows a monthly salary credit of ₦350,000 and no history of cash deposits exceeding ₦500,000. Customer could not explain the source of funds when asked at account review." This kind of detail helps the NFIU understand why you are concerned.',
      'apply',
    ),
    quizBlock(
      'l5-b-q1',
      'What is the Nigerian equivalent of a Suspicious Activity Report (SAR)?',
      [
        'Currency Transaction Report (CTR)',
        'Suspicious Transaction Report (STR)',
        'Financial Intelligence Report (FIR)',
        'Know Your Customer Report (KYC)',
      ],
      1,
      'In Nigeria, the equivalent of a SAR is called a Suspicious Transaction Report (STR). It serves the same function — reporting suspicious financial activity to the national financial intelligence unit.',
      'remember',
      'beginner',
    ),
    quizBlock(
      'l5-b-q2',
      'Which of the following is the BEST example of an STR narrative?',
      [
        '"Flagged by system for large cash transaction."',
        '"Customer behaviour seemed suspicious during visit."',
        '"Customer deposited ₦12 million cash on 10 April, inconsistent with their salaried account profile of ₦400,000 monthly. No prior cash deposits above ₦1 million. Customer declined to state source of funds."',
        '"Possible money laundering activity detected."',
      ],
      2,
      'A good STR narrative provides specific details: the amount, date, how it differs from the customer\'s normal profile, and what red flags were observed. The third option gives the NFIU enough context to understand why the activity is suspicious.',
      'apply',
      'beginner',
    ),
    quizBlock(
      'l5-b-q3',
      'The goAML platform was developed by which international organisation?',
      [
        'The World Bank',
        'The International Monetary Fund (IMF)',
        'The United Nations Office on Drugs and Crime (UNODC)',
        'The Financial Action Task Force (FATF)',
      ],
      2,
      'goAML was developed by the United Nations Office on Drugs and Crime (UNODC) and is used by over 50 countries worldwide as their financial intelligence reporting platform.',
      'remember',
      'beginner',
    ),
  ],
};

const lesson5Intermediate = {
  blocks: [
    textBlock(
      'l5-i-t1',
      'STR Construction: From Alert to Filing',
      'A well-constructed STR follows a structured workflow from initial alert to final filing. When a monitoring alert or frontline report triggers an investigation, the analyst should: (1) gather all relevant account and transaction data, (2) review the customer\'s CDD file including risk rating, expected activity, and prior STRs, (3) analyse the suspicious activity against known typologies, (4) determine whether the activity warrants filing based on reasonable grounds for suspicion, and (5) construct the STR with supporting documentation. The goAML platform supports attachments — bank statements, identification documents, and internal investigation notes should be included to support the narrative. The CCO reviews and approves the STR before submission. Filing should occur within 72 hours of the decision to report, though the ML(P&P) Act requires "prompt" filing without specifying an exact timeframe.',
      'apply',
    ),
    textBlock(
      'l5-i-t2',
      'CTR vs STR: Understanding the Reporting Regime',
      'Banks must understand the distinction between CTRs and STRs, as the filing criteria and obligations differ significantly. CTRs are mandatory, threshold-based reports: every cash transaction at or above ₦5 million (individual) or ₦10 million (corporate) triggers a CTR filing, regardless of whether the transaction is suspicious. STRs are suspicion-based reports with no monetary threshold — even a ₦1,000 transaction can warrant an STR if there are grounds for suspicion. Critically, the obligations are not mutually exclusive: a single transaction can trigger both a CTR (due to its amount) and an STR (due to suspicious circumstances). Additionally, banks must file Foreign Currency Transaction Reports (FCTRs) for international transfers exceeding $10,000. All three report types are filed through the goAML platform and must be retained on the bank\'s internal records for at least five years.',
      'understand',
    ),
    textBlock(
      'l5-i-t3',
      'Post-Filing Obligations and NFIU Feedback',
      'Filing an STR does not end the bank\'s obligations. Post-filing requirements include: continuing to monitor the subject\'s accounts for additional suspicious activity (which may warrant supplementary STR filings), responding promptly to NFIU requests for additional information under Section 13 of the ML(P&P) Act, not closing the subject\'s account solely to avoid further compliance obligations (known as "de-risking" or "risk dumping"), and maintaining the STR and all supporting documentation for at least five years. The NFIU provides feedback to reporting institutions through sanitised case studies and annual reports, but will not typically disclose the outcome of specific investigations. If the NFIU determines that a bank\'s STR filing practices are deficient, it may refer the matter to the CBN for supervisory action.',
      'analyze',
    ),
    quizBlock(
      'l5-i-q1',
      'A customer conducts a ₦7 million cash deposit that also exhibits suspicious characteristics. Which reports must the bank file?',
      [
        'An STR only, since the transaction is suspicious',
        'A CTR only, since the transaction exceeds ₦5 million',
        'Both a CTR (mandatory due to the ₦5 million threshold) and an STR (due to the suspicious characteristics)',
        'Neither — the bank should monitor the account and file later if a pattern emerges',
      ],
      2,
      'The CTR and STR obligations are not mutually exclusive. A ₦7 million cash deposit triggers a mandatory CTR (exceeds the ₦5 million individual threshold) and, separately, an STR due to the suspicious characteristics. Both reports must be filed through the goAML platform.',
      'apply',
      'intermediate',
    ),
    quizBlock(
      'l5-i-q2',
      'After filing an STR, the compliance team decides to close the customer\'s account immediately to avoid further risk exposure. Is this the correct course of action?',
      [
        'Yes — closing the account eliminates the bank\'s risk',
        'No — immediately closing an account after an STR filing could constitute tipping off and is considered "de-risking" or "risk dumping"',
        'Yes, but only if the CCO approves the closure',
        'No, but only because the account must remain open for law enforcement investigation',
      ],
      1,
      'Immediate account closure after an STR filing is problematic for two reasons: it could tip off the customer that a report has been filed, and it constitutes "de-risking" — pushing the risk to another institution rather than managing it. The bank should continue monitoring while the NFIU assesses the filing. Account closure decisions should follow normal procedures with appropriate timing.',
      'analyze',
      'intermediate',
    ),
    quizBlock(
      'l5-i-q3',
      'The NFIU sends a request for additional information under Section 13 of the ML(P&P) Act regarding an STR filed 6 months ago. What is the bank\'s obligation?',
      [
        'The bank may decline since the STR has already been filed',
        'The bank must respond promptly with the requested information, as Section 13 compels compliance',
        'The bank should redirect the request to the CBN',
        'The bank should consult its legal counsel before responding, as the request may be ultra vires',
      ],
      1,
      'Section 13 of the ML(P&P) Act gives the NFIU the power to request additional information from reporting entities, and compliance is mandatory. Banks must respond promptly — failure to do so can result in regulatory action and may constitute an offence under the Act.',
      'apply',
      'intermediate',
    ),
  ],
};

const lesson5Advanced = {
  blocks: [
    textBlock(
      'l5-a-t1',
      'Compliance Programme Design: Building an Effective STR Framework',
      'An effective STR programme requires integrated governance, technology, and human capital components. The governance framework should define clear escalation paths from frontline staff to the CCO, establish quality assurance processes (sampling and peer review of STR narratives before filing), and set KPIs that measure both quantity and quality of filings. Technology infrastructure should include an automated case management system that tracks alerts from generation to resolution, integrates with the goAML API for electronic filing, and maintains a searchable repository of filed STRs for pattern analysis and regulatory examination readiness. Human capital investment is critical: the NFIU and CBN increasingly expect compliance teams to include certified specialists (ACAMS, ICA, or CAMS certifications) and to demonstrate ongoing training programmes that cover evolving typologies, regulatory changes, and technology developments. The annual compliance programme review — required under CBN guidelines — should assess all three pillars and benchmark against peer institutions.',
      'evaluate',
    ),
    textBlock(
      'l5-a-t2',
      'Regulatory Examination Readiness',
      'CBN on-site AML/CFT examinations follow a risk-based methodology that intensively reviews the bank\'s STR programme. Examiners assess: the adequacy of board and senior management oversight (minutes of compliance committee meetings, CCO reports to the board), the effectiveness of the monitoring system (alert volumes, false positive rates, rule calibration history), STR filing timeliness and quality (sample review of filed STRs against source alerts and investigation files), CDD programme adequacy (sample review of customer files, particularly for high-risk categories), and staff training records (content, attendance, assessment results). Common examination findings include: inadequate investigation documentation between alert generation and STR filing decision, lack of documented rationale for alerts closed without filing, insufficient senior management engagement with compliance metrics, and failure to incorporate NFIU typology publications into monitoring rule updates. Banks should maintain an examination readiness file that is continuously updated, not assembled ad hoc before an announced examination.',
      'create',
    ),
    textBlock(
      'l5-a-t3',
      'Emerging Challenges: Virtual Assets and Fintech',
      'The emergence of Virtual Asset Service Providers (VASPs), fintech companies, and digital banking platforms creates new STR challenges for Nigerian compliance officers. While the CBN\'s February 2021 circular restricted banks from facilitating cryptocurrency transactions, the SEC\'s subsequent regulation of VASPs under the ISA 2007 created a regulatory gap that money launderers exploit. P2P cryptocurrency exchanges, mobile money platforms, and neobanks operating under CBN\'s Payment Service Bank (PSB) licence all present ML/TF risks that traditional monitoring systems may not adequately address. The NFIU\'s 2024 Strategic Analysis Report identified virtual asset-related STR filings as having increased by 300% year-on-year, with the primary typology being fiat-to-crypto conversion through bank accounts. Compliance officers must ensure their monitoring systems can detect patterns indicative of crypto-related money laundering: rapid fund movements matching crypto exchange operating hours, round-amount transfers to known crypto traders, and patterns of deposit-and-immediate-withdrawal consistent with P2P crypto trading.',
      'evaluate',
    ),
    quizBlock(
      'l5-a-q1',
      'During a CBN on-site examination, the examiner requests documentation for 50 alerts that were closed without STR filing in the past quarter. The bank can only produce investigation notes for 12 of the 50. What regulatory finding will this likely result in?',
      [
        'No finding — banks are not required to document alerts closed without filing',
        'A finding of inadequate investigation documentation, suggesting the bank cannot demonstrate that alerts were properly assessed before dismissal',
        'A finding of under-filing, with the examiner requiring retroactive STR filing for the undocumented alerts',
        'A referral to the EFCC for suspected obstruction of supervision',
      ],
      1,
      'CBN examination methodology requires banks to maintain documented rationale for all alert dispositions, whether filed or closed. Inability to produce investigation notes for closed alerts is a significant finding indicating inadequate investigation documentation — the bank cannot demonstrate to the examiner that the alerts were properly assessed before dismissal, potentially exposing it to supervisory action.',
      'evaluate',
      'advanced',
    ),
    quizBlock(
      'l5-a-q2',
      'A customer\'s bank account shows a pattern of receiving ₦10 million deposits at 2:00 AM local time (coinciding with peak UTC trading hours for a major crypto exchange), followed by immediate withdrawal to a specific set of beneficiaries. The account was opened 3 months ago with a declared occupation of "trader." What should the compliance team\'s analysis focus on?',
      [
        'Whether the customer has a valid trading licence',
        'Whether the transaction timing and patterns are consistent with P2P cryptocurrency trading, a known typology for fiat-to-crypto conversion identified in NFIU\'s strategic analysis',
        'Whether the deposits exceed the CTR threshold',
        'Whether the customer has properly declared income for tax purposes',
      ],
      1,
      'The pattern — timing aligned with crypto exchange hours, rapid deposit-and-withdrawal, new account with generic "trader" declaration — matches the NFIU-identified typology for P2P crypto trading used for fiat-to-crypto conversion. The compliance team should investigate this specific typology and file an STR if the analysis confirms reasonable grounds for suspicion.',
      'analyze',
      'advanced',
    ),
    quizBlock(
      'l5-a-q3',
      'A bank\'s annual compliance programme review reveals that its alert-to-STR conversion rate is 0.3%, no NFIU typology publications have been incorporated into monitoring rules in 18 months, and the CCO\'s quarterly report to the board has not been presented in two consecutive quarters. Which pillar of the compliance programme is most critically deficient?',
      [
        'Technology — the low conversion rate indicates monitoring system failure',
        'Governance — the failure of board-level oversight and CCO reporting represents the most critical systemic weakness',
        'Human capital — the staff need better training to improve filing rates',
        'All three pillars are equally deficient',
      ],
      1,
      'While all three indicators are concerning, the governance failure is most critical because board and senior management oversight drives the entire compliance programme. Without the CCO\'s regular reporting to the board, there is no mechanism for senior management to identify and remediate the other deficiencies (poor monitoring rule calibration and low conversion rates). CBN examiners prioritise governance findings because they indicate systemic rather than operational failure.',
      'evaluate',
      'advanced',
    ),
  ],
};

// ── Main seed function ─────────────────────────────────────────────────────

export async function seed(): Promise<void> {
  console.log('Seeding SABIficate demo data...\n');

  const counts = {
    organizations: 0,
    categories: 0,
    plans: 0,
    courses: 0,
    modules: 0,
    lessons: 0,
    users: 0,
    enrollments: 0,
    consent_records: 0,
  };

  // ── 1. Organization ────────────────────────────────────────────────────

  const orgResult = await query(
    `INSERT INTO organizations (name, slug, industry, size_category)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    ['First Bank of Nigeria Training Academy', 'first-bank-training', 'banking', 'enterprise'],
  );

  let orgId: string;
  if (orgResult.rows.length > 0) {
    orgId = orgResult.rows[0].id;
    counts.organizations++;
  } else {
    const existing = await query(
      `SELECT id FROM organizations WHERE slug = $1`,
      ['first-bank-training'],
    );
    orgId = existing.rows[0].id;
  }
  console.log(`  org        ${orgId}`);

  // ── 2. Course Categories ───────────────────────────────────────────────

  const categories = [
    { name: 'Banking & Finance', slug: 'banking-finance', sort_order: 1 },
    { name: 'Professional Development', slug: 'professional-development', sort_order: 2 },
    { name: 'Technology', slug: 'technology', sort_order: 3 },
  ];

  const categoryIds: Record<string, string> = {};

  for (const cat of categories) {
    const catResult = await query(
      `INSERT INTO course_categories (name, slug, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [cat.name, cat.slug, cat.sort_order],
    );
    if (catResult.rows.length > 0) {
      categoryIds[cat.slug] = catResult.rows[0].id;
      counts.categories++;
    } else {
      const existing = await query(
        `SELECT id FROM course_categories WHERE slug = $1`,
        [cat.slug],
      );
      categoryIds[cat.slug] = existing.rows[0].id;
    }
  }
  console.log(`  categories ${Object.keys(categoryIds).join(', ')}`);

  // ── 3. Subscription Plans ──────────────────────────────────────────────

  const plans = [
    {
      name: 'Free Individual',
      type: 'individual',
      price_ngn: 0,
      billing_cycle: 'monthly',
      features: JSON.stringify(['Access all course content', 'Completion badges', 'Community access']),
    },
    {
      name: 'Professional Monthly',
      type: 'individual',
      price_ngn: 2500,
      billing_cycle: 'monthly',
      features: JSON.stringify(['Everything in Free', 'Verified certificates', 'CPD tracking', 'Priority support']),
    },
    {
      name: 'Professional Annual',
      type: 'individual',
      price_ngn: 24000,
      billing_cycle: 'annual',
      features: JSON.stringify(['Everything in Professional', '2 months free']),
    },
    {
      name: 'B2B Compliance Essentials',
      type: 'corporate',
      price_ngn: 3500,
      billing_cycle: 'monthly',
      features: JSON.stringify(['Per-seat pricing', 'Admin dashboard', 'Compliance tracking', 'Progress reports']),
    },
    {
      name: 'B2B Professional',
      type: 'corporate',
      price_ngn: 5500,
      billing_cycle: 'monthly',
      features: JSON.stringify(['Everything in Essentials', 'Priority support', 'Custom reports', 'Bulk enrollment']),
    },
    {
      name: 'B2B Enterprise',
      type: 'corporate',
      price_ngn: 8000,
      billing_cycle: 'monthly',
      features: JSON.stringify(['Everything in Professional', 'Dedicated account manager', 'API access', 'SSO integration']),
    },
  ];

  for (const plan of plans) {
    const planResult = await query(
      `INSERT INTO subscription_plans (name, type, price_ngn, billing_cycle, features)
       SELECT $1::varchar, $2::varchar, $3::integer, $4::varchar, $5::jsonb
       WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = $1::varchar)`,
      [plan.name, plan.type, plan.price_ngn, plan.billing_cycle, plan.features],
    );
    if (planResult.rowCount && planResult.rowCount > 0) {
      counts.plans++;
    }
  }
  console.log(`  plans      ${plans.length} checked`);

  // ── 4. Course ──────────────────────────────────────────────────────────

  const courseResult = await query(
    `INSERT INTO courses (title, slug, description, category_id, difficulty_level, estimated_duration_minutes, cpd_hours, professional_body, learning_objectives, is_published, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, true, NOW())
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [
      'Anti-Money Laundering Compliance',
      'aml-compliance',
      'Comprehensive AML compliance training for Nigerian banking professionals. Covers the ML(P&P) Act 2022, CBN AML/CFT Regulations, KYC procedures, transaction monitoring, and suspicious transaction reporting. Aligned with CIBN CPD requirements.',
      categoryIds['banking-finance'],
      'working',
      120,
      4.0,
      'CIBN',
      JSON.stringify([
        'Explain the Nigerian AML legislative framework and key regulatory bodies',
        'Apply KYC and CDD procedures to various customer types',
        'Identify red flags and suspicious transaction indicators',
        'File accurate and complete STRs through the goAML platform',
      ]),
    ],
  );

  let courseId: string;
  if (courseResult.rows.length > 0) {
    courseId = courseResult.rows[0].id;
    counts.courses++;
  } else {
    const existing = await query(
      `SELECT id FROM courses WHERE slug = $1`,
      ['aml-compliance'],
    );
    courseId = existing.rows[0].id;
  }
  console.log(`  course     ${courseId}`);

  // ── 5. Modules ─────────────────────────────────────────────────────────

  const moduleData = [
    { title: 'Foundations of AML in Nigeria', sort_order: 1 },
    { title: 'Transaction Monitoring & SAR Filing', sort_order: 2 },
  ];

  const moduleIds: string[] = [];

  for (const mod of moduleData) {
    const modResult = await query(
      `INSERT INTO modules (course_id, title, sort_order)
       SELECT $1::uuid, $2::varchar, $3::integer
       WHERE NOT EXISTS (
         SELECT 1 FROM modules WHERE course_id = $1::uuid AND title = $2::varchar
       )
       RETURNING id`,
      [courseId, mod.title, mod.sort_order],
    );
    if (modResult.rows.length > 0) {
      moduleIds.push(modResult.rows[0].id);
      counts.modules++;
    } else {
      const existing = await query(
        `SELECT id FROM modules WHERE course_id = $1 AND title = $2`,
        [courseId, mod.title],
      );
      moduleIds.push(existing.rows[0].id);
    }
  }
  console.log(`  modules    ${moduleIds.join(', ')}`);

  // ── 6. Lessons ─────────────────────────────────────────────────────────

  const lessonData = [
    // Module 1: Foundations
    {
      module_id: moduleIds[0],
      title: 'Introduction to AML Framework in Nigeria',
      sort_order: 1,
      estimated_duration_minutes: 25,
      beginner: lesson1Beginner,
      intermediate: lesson1Intermediate,
      advanced: lesson1Advanced,
    },
    {
      module_id: moduleIds[0],
      title: 'Know Your Customer (KYC) Procedures',
      sort_order: 2,
      estimated_duration_minutes: 25,
      beginner: lesson2Beginner,
      intermediate: lesson2Intermediate,
      advanced: lesson2Advanced,
    },
    {
      module_id: moduleIds[0],
      title: 'Transaction Monitoring Basics',
      sort_order: 3,
      estimated_duration_minutes: 25,
      beginner: lesson3Beginner,
      intermediate: lesson3Intermediate,
      advanced: lesson3Advanced,
    },
    // Module 2: Transaction Monitoring & SAR Filing
    {
      module_id: moduleIds[1],
      title: 'Suspicious Activity Reporting',
      sort_order: 1,
      estimated_duration_minutes: 25,
      beginner: lesson4Beginner,
      intermediate: lesson4Intermediate,
      advanced: lesson4Advanced,
    },
    {
      module_id: moduleIds[1],
      title: 'SAR Filing Procedures',
      sort_order: 2,
      estimated_duration_minutes: 20,
      beginner: lesson5Beginner,
      intermediate: lesson5Intermediate,
      advanced: lesson5Advanced,
    },
  ];

  for (const lesson of lessonData) {
    const lessonResult = await query(
      `INSERT INTO lessons (module_id, course_id, title, sort_order, estimated_duration_minutes, content_foundational, content_working, content_applied, has_quiz, is_free, is_published)
       SELECT $1::uuid, $2::uuid, $3::varchar, $4::integer, $5::integer, $6::jsonb, $7::jsonb, $8::jsonb, true, $9::boolean, true
       WHERE NOT EXISTS (
         SELECT 1 FROM lessons WHERE course_id = $2::uuid AND module_id = $1::uuid AND title = $3::varchar
       )`,
      [
        lesson.module_id,
        courseId,
        lesson.title,
        lesson.sort_order,
        lesson.estimated_duration_minutes,
        JSON.stringify(lesson.beginner),
        JSON.stringify(lesson.intermediate),
        JSON.stringify(lesson.advanced),
        lesson.sort_order === 1,
      ],
    );
    if (lessonResult.rowCount && lessonResult.rowCount > 0) {
      counts.lessons++;
    }
  }
  console.log(`  lessons    ${lessonData.length} checked`);

  // ── 6b. Credential Templates for AML course ──────────────────────────

  const amlCourseTitle = 'Anti-Money Laundering Compliance';
  const credentialTemplates = [
    {
      name: `${amlCourseTitle} - Completion Badge`,
      description: `Completion badge for ${amlCourseTitle}`,
      credential_tier: 'completion_badge',
      minimum_score: 0,
      price_ngn: 0,
      cpd_eligible: false,
    },
    {
      name: `${amlCourseTitle} - Verified Certificate`,
      description: `Verified certificate for ${amlCourseTitle} with assessment validation`,
      credential_tier: 'verified_certificate',
      minimum_score: 70,
      price_ngn: 3000,
      cpd_eligible: true,
    },
  ];

  let credentialTemplateCount = 0;
  for (const ct of credentialTemplates) {
    const ctResult = await query(
      `INSERT INTO credential_templates
         (course_id, name, description, credential_tier, minimum_score, price_ngn, cpd_eligible)
       SELECT $1::uuid, $2::varchar, $3::text, $4::varchar, $5::smallint, $6::integer, $7::boolean
       WHERE NOT EXISTS (
         SELECT 1 FROM credential_templates WHERE course_id = $1::uuid AND credential_tier = $4::varchar
       )`,
      [courseId, ct.name, ct.description, ct.credential_tier, ct.minimum_score, ct.price_ngn, ct.cpd_eligible],
    );
    if (ctResult.rowCount && ctResult.rowCount > 0) {
      credentialTemplateCount++;
    }
  }
  console.log(`  cred tmpl  ${credentialTemplateCount} inserted`);

  // ── 7. Demo User (Learner) ────────────────────────────────────────────

  const demoPasswordHash = await bcrypt.hash('demo1234', 12);

  const demoUserResult = await query(
    `INSERT INTO users (email, first_name, last_name, password_hash, role, consent_education_only, consent_anonymized_aggregate, consent_full_profile, consent_whatsapp_notifications, consent_sms_notifications, email_verified, is_active)
     VALUES ($1, $2, $3, $4, $5, true, true, true, true, true, true, true)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['demo@sabificate.com', 'Adaeze', 'Okonkwo', demoPasswordHash, 'learner'],
  );

  let demoUserId: string;
  if (demoUserResult.rows.length > 0) {
    demoUserId = demoUserResult.rows[0].id;
    counts.users++;
  } else {
    const existing = await query(
      `SELECT id FROM users WHERE email = $1`,
      ['demo@sabificate.com'],
    );
    demoUserId = existing.rows[0].id;
  }
  console.log(`  demo user  ${demoUserId}`);

  // ── 8. Corporate Admin User ───────────────────────────────────────────

  const adminPasswordHash = await bcrypt.hash('admin1234', 12);

  const adminUserResult = await query(
    `INSERT INTO users (email, first_name, last_name, password_hash, role, org_id, consent_education_only, consent_anonymized_aggregate, consent_full_profile, email_verified, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true, true, true, true, true)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['admin@firstbank-training.ng', 'Chidi', 'Nnamdi', adminPasswordHash, 'corporate_admin', orgId],
  );

  let adminUserId: string;
  if (adminUserResult.rows.length > 0) {
    adminUserId = adminUserResult.rows[0].id;
    counts.users++;
  } else {
    const existing = await query(
      `SELECT id FROM users WHERE email = $1`,
      ['admin@firstbank-training.ng'],
    );
    adminUserId = existing.rows[0].id;
  }
  console.log(`  admin user ${adminUserId}`);

  // ── 8b. Departments ───────────────────────────────────────────────────

  const departmentNames = ['Compliance', 'Operations'];
  const departmentIds: string[] = [];

  for (const deptName of departmentNames) {
    const deptResult = await query(
      `INSERT INTO departments (org_id, name)
       SELECT $1::uuid, $2::varchar
       WHERE NOT EXISTS (
         SELECT 1 FROM departments WHERE org_id = $1::uuid AND name = $2::varchar
       )
       RETURNING id`,
      [orgId, deptName],
    );
    if (deptResult.rows.length > 0) {
      departmentIds.push(deptResult.rows[0].id);
    } else {
      const existing = await query(
        `SELECT id FROM departments WHERE org_id = $1 AND name = $2`,
        [orgId, deptName],
      );
      departmentIds.push(existing.rows[0].id);
    }
  }
  console.log(`  departments ${departmentIds.join(', ')}`);

  // ── 8c. Course Compliance Requirement ─────────────────────────────────

  const complianceDeadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const deadlineStr = complianceDeadline.toISOString().slice(0, 10);

  const compReqResult = await query(
    `INSERT INTO course_compliance_requirements (org_id, course_id, regulatory_body, compliance_deadline, is_mandatory)
     SELECT $1::uuid, $2::uuid, $3::varchar, $4::date, true
     WHERE NOT EXISTS (
       SELECT 1 FROM course_compliance_requirements WHERE org_id = $1::uuid AND course_id = $2::uuid AND regulatory_body = $3::varchar
     )`,
    [orgId, courseId, 'CBN', deadlineStr],
  );
  if (compReqResult.rowCount && compReqResult.rowCount > 0) {
    console.log(`  compliance AML course -> CBN deadline ${deadlineStr}`);
  } else {
    console.log(`  compliance AML course -> CBN (already exists)`);
  }

  // ── 9. Enrollment ─────────────────────────────────────────────────────

  const enrollResult = await query(
    `INSERT INTO enrollment (user_id, course_id, enrollment_type, status)
     VALUES ($1, $2, 'individual', 'active')
     ON CONFLICT (user_id, course_id) DO NOTHING`,
    [demoUserId, courseId],
  );
  if (enrollResult.rowCount && enrollResult.rowCount > 0) {
    counts.enrollments++;
  }
  console.log(`  enrollment demo user -> AML course`);

  // ── 10. Consent Records ───────────────────────────────────────────────

  const consentTypes = [
    'education_only',
    'anonymized_aggregate',
    'full_profile',
    'whatsapp_notifications',
    'sms_notifications',
  ];

  for (const consentType of consentTypes) {
    const consentResult = await query(
      `INSERT INTO consent_records (user_id, consent_type, granted, version)
       SELECT $1::uuid, $2::varchar, true, '1.0'
       WHERE NOT EXISTS (
         SELECT 1 FROM consent_records WHERE user_id = $1::uuid AND consent_type = $2::varchar
       )`,
      [demoUserId, consentType],
    );
    if (consentResult.rowCount && consentResult.rowCount > 0) {
      counts.consent_records++;
    }
  }
  console.log(`  consent    ${consentTypes.length} records checked`);

  // ── 11. Personas & Calibration Questions ──────────────────────────────

  const personaData = [
    {
      slug: 'new-graduate',
      label: 'Recent Graduate',
      description: 'Just finished school, starting my first job, learning to manage my salary',
      default_proficiency: 'foundational',
      default_customer_tier: 'freemium',
      sort_order: 0,
      calibration: {
        question_text: 'How familiar are you with financial statements?',
        options: JSON.stringify(["I've never seen one", "I've seen them but don't understand all parts", "I can read and interpret basic statements"]),
        proficiency_map: JSON.stringify({ "0": "foundational", "1": "foundational", "2": "working" }),
      },
    },
    {
      slug: 'mid-career-professional',
      label: 'Working Professional',
      description: 'A few years into my career, looking to grow my skills and earn certifications',
      default_proficiency: 'working',
      default_customer_tier: 'freemium',
      sort_order: 1,
      calibration: {
        question_text: 'How do you handle compliance reporting at work?',
        options: JSON.stringify(["Someone else handles it", "I follow a checklist someone gave me", "I create and review compliance reports"]),
        proficiency_map: JSON.stringify({ "0": "foundational", "1": "working", "2": "applied" }),
      },
    },
    {
      slug: 'team-lead-manager',
      label: 'Team Lead / Manager',
      description: 'Managing people and projects, need to upskill my team on compliance and best practices',
      default_proficiency: 'working',
      default_customer_tier: 'upskilling',
      sort_order: 2,
      calibration: {
        question_text: 'How do you assess your team\'s skill gaps?',
        options: JSON.stringify(["I'm not sure how to", "I use performance reviews", "I design training programs based on competency frameworks"]),
        proficiency_map: JSON.stringify({ "0": "working", "1": "working", "2": "applied" }),
      },
    },
    {
      slug: 'senior-specialist',
      label: 'Senior Specialist',
      description: 'Deep expertise in my field, pursuing advanced certifications and CPD credits',
      default_proficiency: 'applied',
      default_customer_tier: 'premium',
      sort_order: 3,
      calibration: {
        question_text: 'Which best describes your certification status?',
        options: JSON.stringify(["I have no professional certifications yet", "I have 1-2 active certifications", "I maintain multiple certifications and track CPD hours"]),
        proficiency_map: JSON.stringify({ "0": "working", "1": "applied", "2": "applied" }),
      },
    },
  ];

  let personaCount = 0;
  let calibrationCount = 0;

  for (const p of personaData) {
    const personaResult = await query(
      `INSERT INTO personas (vertical, slug, label, description, default_proficiency, default_customer_tier, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      ['financial-literacy', p.slug, p.label, p.description, p.default_proficiency, p.default_customer_tier, p.sort_order],
    );

    let personaId: string;
    if (personaResult.rows.length > 0) {
      personaId = personaResult.rows[0].id;
      personaCount++;
    } else {
      const existing = await query(
        `SELECT id FROM personas WHERE slug = $1`,
        [p.slug],
      );
      personaId = existing.rows[0].id;
    }

    // Insert calibration question for this persona
    const calResult = await query(
      `INSERT INTO calibration_questions (persona_id, question_text, options, proficiency_map, sort_order)
       SELECT $1::uuid, $2::text, $3::jsonb, $4::jsonb, 0
       WHERE NOT EXISTS (
         SELECT 1 FROM calibration_questions WHERE persona_id = $1::uuid AND question_text = $2::text
       )`,
      [personaId, p.calibration.question_text, p.calibration.options, p.calibration.proficiency_map],
    );
    if (calResult.rowCount && calResult.rowCount > 0) {
      calibrationCount++;
    }
  }
  console.log(`  personas   ${personaCount} inserted, ${calibrationCount} calibration questions`);

  // ── Summary ────────────────────────────────────────────────────────────

  console.log('\n── Seed Summary ──────────────────────────────────────');
  console.log(`  Organizations:    ${counts.organizations} inserted`);
  console.log(`  Categories:       ${counts.categories} inserted`);
  console.log(`  Plans:            ${counts.plans} inserted`);
  console.log(`  Courses:          ${counts.courses} inserted`);
  console.log(`  Modules:          ${counts.modules} inserted`);
  console.log(`  Lessons:          ${counts.lessons} inserted`);
  console.log(`  Users:            ${counts.users} inserted`);
  console.log(`  Enrollments:      ${counts.enrollments} inserted`);
  console.log(`  Consent records:  ${counts.consent_records} inserted`);
  console.log(`  Personas:         ${personaCount} inserted`);
  console.log(`  Calibration Qs:   ${calibrationCount} inserted`);
  console.log('─────────────────────────────────────────────────────\n');
}

// Run directly if this file is the entry point
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('seed.ts') ||
  process.argv[1].endsWith('seed.js')
);

if (isDirectRun) {
  seed()
    .then(() => {
      console.log('Seed completed successfully.');
      if (typeof (pool as unknown as pg.Pool).end === 'function') {
        return (pool as unknown as pg.Pool).end();
      }
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
