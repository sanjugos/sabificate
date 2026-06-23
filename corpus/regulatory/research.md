# SABIficate Regulatory & Compliance — Corpus

*Synthesized from Mark's Legal Review Brief, Foundation Framework, tech spec, and council evaluation.*

---

## 1. Nigeria Data Protection Act 2023 (NDPA)

### Key Requirements for SABIficate

**Data Controller:** The Nigerian operating subsidiary is sole legal owner and NDPA data controller for all learner data. The US holding entity holds defined usage rights under an intercompany data processing agreement.

**Data Protection Impact Assessment (DPIA):**
- Required BEFORE deploying AI systems that process Nigerian resident data through automated decision-making or large-scale profiling
- Must be completed before launch — this is a launch gate, not post-launch
- Budget for DPIA is a working-session deliverable

**Data Protection Officer (DPO):**
- Must be designated by name before launch
- Required by NDPA for organizations processing personal data at scale
- Can be an internal role or contracted

**Learner Rights:**
- Learners must be able to access the full educational platform WITHOUT opting into behavioral profiling
- Any profiling with significant effects on individuals requires human intervention rights (NDPA Section 37)
- This creates per-profile human review costs that conflict with "AI substitutes for staff" economics at scale

**Data Domicile:**
- Learner data must be domiciled in Nigeria
- Cross-border transfer to US entity (analytics, AI tooling) requires NDPA-compliant safeguards
- Intercompany data processing agreement needed

**Consent Model (from Foundation Framework):**
- Tiered, revocable consent
- Learner-benefit uses established before any external use
- No monetization or transfer to third parties without unanimous founder consent

### Annual Compliance
- Simple annual registration process
- Cost: approximately ₦800,000 (~$800 USD) government fee
- Certificate issued upon completion
- Gbitse already does this annually for existing business

---

## 2. Nigerian Business Registration

### Corporate Affairs Commission (CAC)
- Nigerian operating subsidiary must be registered with CAC
- Foreign participation path: NIPC registration, business permit, minimum capital, Certificate of Capital Importation (CCI)
- Gbitse handles local registration — described as simple and inexpensive

### Capital Importation
- Foreign capital into Nigerian subsidiary needs Certificate of Capital Importation (CCI) at time of inflow
- Without CCI, repatriating dividends or platform license fees through official channels is severely constrained
- This affects how bridge capital is routed — critical planning item

### No US-Nigeria Tax Treaty
- There is NO income tax treaty between the US and Nigeria
- A pass-through Delaware LLC with a Nigerian-resident member creates US filing/withholding obligations and double-taxation exposure
- Transfer pricing on the platform license (US entity to Nigerian subsidiary) must be arm's length, with tax counsel in both jurisdictions

---

## 3. US Entity Requirements

### Delaware LLC
- Formation is straightforward and inexpensive (~$90 filing fee + registered agent ~$50/year)
- Pre-agreed conversion trigger to C-Corp at institutional priced round or DFI requirement
- LLC equity mechanics: counsel translates option pool, vesting, repurchase, SAFE provisions into membership-unit and profits-interest equivalents

### Anti-Corruption / Anti-Bribery
- FCPA (Foreign Corrupt Practices Act) compliance required — US entity doing business in Nigeria
- Government agencies and state programs are named target customers
- DFIs will require anti-bribery policy at diligence
- Policy must exist BEFORE first B2G (business-to-government) outreach
- Founders agreed at meeting: zero tolerance for internal kickbacks; referral fees for third-party introductions are acceptable

### Restrictive Covenants
- Confidentiality, non-solicitation, and scoped non-compete for founders
- Enforceability standards differ between Delaware and Nigeria — must be drafted per jurisdiction

---

## 4. Trademark / Brand Protection

### SABIficate Name Risks
- "Sabi" (sabi.am) is a ~$300M-valuation Nigerian B2B platform — crowded namespace
- @sabificate Instagram account already exists ("the sabificate Institute")
- SABIFICATE.ng Facebook page exists (Abuja)
- "Skill For All" has a SABIFICATE advocacy campaign
- "Sabificate" functions as a category term in Nigerian Pidgin — genericness risk
- Limited portability outside anglophone West Africa

### Required Actions (Mark handling)
- Nigerian Trademarks Registry search through local agent (registry not reliably searchable online)
- File in Classes 9 (software), 41 (education), and 42 (technology services) immediately — Nigeria is first-to-file
- US trademark search (USPTO)
- Acquire or settle on consistent social handles before public launch
- Reserve neutral umbrella name for non-Nigerian expansion

### Protectable Asset
- The coined form "SABIficate" (not "sabi" alone) is the protectable mark
- Positioning as both company name AND credential name ("earn your Sabificate") converts genericness into brand language

---

## 5. Arbitration and Dispute Resolution

### Founders' Default
- UNCITRAL rules
- Sole arbitrator
- Seat: London
- English language
- Counsel may propose Lagos (LACIAC) or LCIA if better suited
- Must be enforceable in both jurisdictions

---

## 6. Payment Regulatory

### Paystack
- Licensed by CBN (Central Bank of Nigeria) as a Payment Service Provider
- Handles KYC/AML compliance for payment processing
- Supports card, bank transfer, USSD, and mobile money
- Standard fees: 1.5% + ₦100 per transaction (capped at ₦2,000 for transactions > ₦2,500)

### Flutterwave (backup)
- Also CBN-licensed
- Supports direct debit (e-mandate) via APIs
- B2B invoicing capabilities
- NIBSS Direct Debit integration possible but complex (requires CMMS via aggregator PSPs)

### Multi-Year Naira Contracts
- FX review clause required in any multi-year NGN-denominated contract
- Naira devaluation risk is material (₦1,500+ to $1 as of 2026)
- B2B contracts should include annual FX adjustment mechanism

---

## 7. Compliance Timeline

| Gate | What | Who | When |
|------|------|-----|------|
| Pre-build | Anti-bribery policy drafted | Mark + counsel | Before B2G outreach |
| Pre-launch | DPO designated by name | Sanju + Gbitse | Before launch |
| Pre-launch | DPIA completed | Counsel + Sanju | Before launch |
| Pre-launch | NDPA registration filed | Gbitse | Before launch |
| At formation | CAC registration (Nigerian subsidiary) | Gbitse | At entity formation |
| At formation | Delaware LLC formation | Mark | At entity formation |
| At formation | CCI for bridge capital | Mark + counsel | At first capital flow |
| At formation | Trademark filing (Nigeria + US) | Mark via counsel | Before brand spend |
| Post-formation | Intercompany data processing agreement | Counsel | Before data flows cross-border |
| Post-formation | Transfer pricing documentation | Tax counsel | Before platform license fees |
| Annual | NDPA compliance renewal | Gbitse | Annually |
