# SABIficate Curriculum Design — Corpus

*Synthesized from the June 11, 2026 founding meeting, Mark Otis's Foundation Framework, and the existing functional specification.*

---

## 1. Core Pedagogy: Problem-Driven Microlearning

SABIficate rejects traditional e-learning (2-hour lectures, classroom replication, compliance-driven content). The model is:

**A learner has a real problem → they come to the platform → they learn how to solve it → they produce an artifact → they earn a credential.**

### Example Flow
1. Boss tells employee their last presentation was terrible
2. Employee opens SABIficate, finds "Better Business Presentations" pathway
3. 10-15 minute lessons: structure, visuals, delivery, storytelling
4. Each lesson produces an artifact: a restructured slide deck, a practiced opening, a peer-reviewed summary
5. Artifacts accumulate into a portfolio
6. Completing the pathway earns a SABIFICATE credential
7. The credential is backed by institutional partners (ICAN, CIPM, a federal university)

### Why This Is Different
- **Not Coursera:** Not translating Western content to African markets
- **Not uLesson:** Not K-12 video content
- **Not Articulate Storyline:** Not replicating classroom courses digitally
- **Not LinkedIn Learning:** Not general professional development without Nigerian context
- **The model is the consultant/coach:** "We are replicating consultants, these programs, the coach" — Gbitse

### Key Design Principles (from meeting)
- Problem-driven, not curriculum-driven
- 10-15 minutes per lesson, single learning objective
- Every lesson produces a tangible artifact
- Artifacts accumulate into a portfolio/project
- The portfolio IS the certification output
- AI evaluates submitted artifacts and provides feedback
- Adaptive difficulty: same content, different language sophistication

---

## 2. Adaptive Difficulty Model

Three tiers that adjust language, not content:

| Tier | Language Level | Example (teaching profit) |
|------|---------------|--------------------------|
| **Beginner** | Plain language, no jargon | "Profit is the difference between your revenue and your expenses" |
| **Intermediate** | Standard business terms | "Your operating profit shows how efficiently the business runs" |
| **Advanced** | Technical/financial terms | "EBITDA provides a clearer view of operational performance" |

### How It Works
- **Onboarding assessment:** Self-report business language sophistication
- **Test-out capability:** If learner demonstrates mastery, skip ahead and earn certificates
- **Dynamic adjustment:** AI adjusts language complexity based on assessed level
- **Same course, same outcome:** Only the language changes, not the learning objectives
- **Regional examples:** AI brings in Nigerian-specific examples, names, scenarios

### Implementation Notes
- English is the language of instruction (covers all Nigerian business audiences)
- Infrastructure for future language support (Hausa, Yoruba, Igbo) but not Phase 1
- Graphically rich content for varying literacy levels
- Mobile-first: all content must render well on smartphones

---

## 3. Content Production Pipeline

### The AI Velocity Test (Day 25 Gate)
Before committing to batch production, the pipeline must pass:

1. **Input:** SME (Gbitse) provides learning objectives and course brief
2. **AI generates:** Structured lesson with text, interactive quiz, artifact prompt
3. **SME reviews:** Gbitse validates accuracy, cultural fit, quality
4. **Measure:** 
   - Time from brief to publishable lesson (target: 3x faster than traditional)
   - SME acceptance rate on AI drafts (target: >60% with light edits)
   - Learner retention on post-assessments

### Production Roles
- **Gbitse (SME):** Define learning objectives, course briefs, validate AI output, manage catalog
- **AI (Claude):** Generate lesson content, quizzes, artifact prompts, adaptive language variants
- **Sanju (Tech):** Build the pipeline tooling, rendering engine, assessment engine

### Content Types
- Text-based interactive lessons (primary — bandwidth-friendly)
- Embedded quizzes and knowledge checks
- Artifact prompts (practical exercises producing portfolio items)
- AI-generated scenarios with Nigerian context (names, companies, situations)
- Audio summaries (stretch — for commute learning)
- Video (minimal — bandwidth costs are prohibitive in Nigeria)

---

## 4. Credential Model: The SABIFICATE

### What It Is
A portable, employer-recognized credential certifying completed learning tied to:
- Demonstrated project work (portfolio of artifacts)
- Institutional partner endorsement (ICAN, CIPM, federal university)
- Assessment performance

### What It's NOT
- Not just a certificate of completion ("congratulations, you sat through 2 hours")
- Not paper — it's digital, verifiable, and tied to actual work product
- Not a one-time award — it's a growing portfolio

### Credential Architecture
- Built on Open Badges 2.0/3.0 standard (W3C Verifiable Credentials alignment)
- Each completed pathway earns a SABIFICATE badge
- Badges are backed by co-signing institutional partner
- The portfolio of artifacts is the primary evidence of competence
- Employers can verify credentials and review artifacts

### Institutional Partners (Target List from Mark's Framework)
- **Nigerian professional body:** ICAN, CIPM, or equivalent (Gbitse leads outreach)
- **Nigerian federal university:** Co-branded short-course certificate (Gbitse leads)
- **Global certification body:** AWS, Google, Microsoft (Mark leads)
- **Big Four firm or major corporation:** CSR/L&D pilot partnership (Gbitse leads, Mark on global relationships)

---

## 5. Content Verticals

### Phase 1 Verticals (from Gbitse's meeting comments)
Gbitse is "working on content across three verticals" — specific verticals TBD from his input. Likely candidates based on the CRM data:

1. **Banking/Financial Services** — largest sector in the CRM (47 companies), post-CBN recapitalization creating massive HR restructuring demand
2. **Professional/Business Skills** — cross-sector (presentations, communication, leadership, project management)
3. **Digital Skills/Technology** — high demand in fintech sector (33 companies), tech talent attrition at 47%

### Future Verticals
- Oil & Gas HSE (Health, Safety, Environment)
- Government/Public Sector (NRS institutional reforms)
- Entrepreneurship (startup skills, financial literacy)

---

## 6. AI in the Learner Experience (Phase 2)

Phase 1: AI is a **production tool** (generates content, not learner-facing)
Phase 2: AI becomes **learner-facing:**

- **AI Tutor:** Learner asks questions, gets context-aware help within the lesson
- **AI Feedback on Artifacts:** "Here's your email draft. Here's how to improve it."
- **Adaptive Recommendations:** "Based on your progress, try this next"
- **Dynamic Assessment:** Quiz difficulty adjusts based on performance
- **Early Intervention:** Flags learners at risk of dropping out
- **Portfolio Coach:** "Your portfolio has 8 artifacts. Here's how to present them to an employer."

### AI Cost Model (from tech spec)
- Claude Sonnet for content generation: ~$0.05/course
- Claude Haiku for simple learner queries: ~$0.001/interaction
- Target: AI costs < $0.50/learner/month at scale

---

## 7. Assessment Design

### Per-Lesson Assessment
- Embedded quiz (3-5 questions) gating progression to next lesson
- Knowledge check, not high-stakes exam
- Immediate feedback with explanation

### Per-Pathway Assessment
- Portfolio review (collection of artifacts from all lessons in pathway)
- Capstone artifact (larger practical project demonstrating integrated skill)
- AI-assisted evaluation with SME spot-checking

### Competency Framework
- Beginner → Intermediate → Advanced progression
- Test-out capability at each level
- Certificates at each competency level, not just completion
