# Adaptive Learning Systems

**Research Date:** 2026-06-21
**Source:** SABIficate Research Sweep — Deep Research Agent

---

# Adaptive Learning Systems: Technical Architecture for Proficiency-Based Content Delivery

## 1. Adaptive Learning Engine Architectures

The leading adaptive learning platforms use fundamentally different algorithmic approaches. **ALEKS** (McGraw Hill) implements Knowledge Space Theory (KST), mapping domains like Algebra into ~350 concepts that generate millions of feasible "knowledge states." Its Markovian assessment procedure identifies a learner's exact state in just 25-30 questions, then serves items at the "outer fringe" -- the boundary between known and unknown concepts (Matayoshi & Doignon, 2021, *Journal of Mathematical Psychology*).

**Knewton** (now Knewton Alta) combines Item Response Theory, Probabilistic Graphical Models, and Hierarchical Cluster Modeling to recommend both *what* to learn next and *how* to learn it, ingesting interaction data through a flexible API (HBS Digital Innovation case study).

**DreamBox** captures every click, keystroke, and time-on-task to adapt instruction in real-time through its Intelligent Adaptive Learning (IAL) engine. **Smart Sparrow** takes an instructor-led approach, using rule-based triggers (response patterns, time-on-screen) to branch learners to remediation or acceleration content -- a model well-suited for small teams that cannot build real-time telemetry infrastructure.

## 2. Difficulty Dimensions: Research Foundations

Five dimensions govern content difficulty in practice:

- **Prior knowledge**: Scaffolding meta-analyses confirm directed prompts benefit low-prior-knowledge learners while generic prompts suit advanced learners (ScienceDirect scaffolding meta-analysis, 2025). This is the single strongest predictor of learning outcomes.
- **Abstraction level**: Research identifies abstract material as a recognized difficulty dimension requiring explicit scaffolding support (NIU CITL Instructional Scaffolding Guide).
- **Pacing**: Self-paced e-learning is preferred by 58% of employees (LinkedIn Workforce Report), but adaptive systems must modulate pace based on performance signals.
- **Scaffolding intensity**: Ranges from highly directed (worked examples, step-by-step) at foundational levels to generic prompts (open-ended problems) at advanced levels. Aptitude-treatment-interaction studies show this gradient significantly affects outcomes.
- **Depth-of-why**: Maps to Webb's Depth of Knowledge levels (Recall through Extended Thinking) and Bloom's knowledge dimension (Factual through Metacognitive).

## 3. Vygotsky's ZPD in Digital Systems

The Zone of Proximal Development -- the band of tasks a learner cannot do independently but can accomplish with support -- is operationalized in adaptive platforms through three mechanisms: (1) adaptive content delivery matching material to current competency, (2) graduated scaffolding that reduces as mastery is demonstrated, and (3) AI-powered tutoring acting as the "More Knowledgeable Other" (Coursebox AI, 2025). ALEKS's "outer fringe" is perhaps the most mathematically precise ZPD implementation, serving items at exactly the boundary of the learner's knowledge state.

For SABIficate's three-tier model, ZPD maps as follows: a Foundational learner's ZPD spans basic comprehension with heavy scaffolding; a Working learner's ZPD covers procedural application with moderate support; an Applied learner's ZPD involves strategic analysis with minimal scaffolding.

## 4. Item Response Theory for Mobile Placement

The Rasch model (1PL IRT) provides a lightweight placement mechanism ideal for mobile: P(correct) = 1/(1+exp(-(theta-d))), where theta is learner ability and d is item difficulty. A simplified adaptive implementation: start theta at 0, administer 10-15 calibrated questions, update theta after each response using theta_new = theta_old + K*(response - P), where K is a learning rate of 0.3-0.5. Convergence typically occurs within 10-15 items. Map the final theta to proficiency tiers: theta below -1 indicates Foundational, -1 to 1 indicates Working, above 1 indicates Applied (adapted from TEMJournal IRT implementation study and py-irt library documentation).

## 5. Spaced Repetition + Adaptive Difficulty

The FSRS algorithm (Free Spaced Repetition Scheduler) represents the state of the art, using a DSR memory model with 19 trainable parameters. The forgetting curve follows a power law: R = (1 + FACTOR * elapsed_days/stability)^DECAY, where DECAY=-0.5 and FACTOR=19/81. Benchmarked on 500M+ Anki reviews, FSRS requires 20-30% fewer reviews than SM-2 for identical retention rates (open-spaced-repetition GitHub).

The TypeScript implementation `ts-fsrs` (MIT license, npm) provides a drop-in scheduler for React/Node.js stacks. Card state is captured in eight fields: due, stability, difficulty (1-10), elapsed_days, scheduled_days, reps, lapses, and state (New/Learning/Review/Relearning). The stateless `repeat()` method returns scheduling outcomes for all four ratings (Again/Hard/Good/Easy), enabling preview-before-commit UX patterns.

## 6. AI-Driven Content Difficulty Adjustment

Research demonstrates LLMs can generate content at controlled difficulty levels using a dual-layer prompt strategy. The static layer contains pedagogical templates defining each tier's characteristics; the dynamic layer injects RAG-retrieved content and learner metadata (LPITutor, PMC 2025). Evaluation shows 97% accuracy at beginner level, 94% at intermediate, and 89% at advanced.

For SABIficate's Claude-powered pipeline, each concept should be generated three times with tier-specific prompts: Foundational uses plain language, concrete Nigerian examples, and step-by-step scaffolding; Working uses technical terminology, procedural walkthroughs, and professional scenarios; Applied uses case studies, strategic analysis, and cross-domain synthesis. The CaLM research (arXiv 2406.03030) shows that smaller finetuned models can match GPT-4's difficulty control at 25x lower cost, relevant for high-volume content generation.

## 7. Measuring Proficiency Over Time

Learning analytics for proficiency tracking requires a `learning_events` table capturing user_id, concept_id, event_type, score, theta_estimate, and timestamp. Compute rolling theta per concept using exponentially weighted moving average. Key metrics include: time-to-proficiency (days from first interaction to stable Working-tier performance), skill gap closure rate (percentage of concepts moving from Foundational to Working per month), and lapse rate (frequency of regression from Working back to Foundational).

Dynamic models like Hidden Markov Models can capture state transitions between proficiency tiers, but a simpler approach for a 2-3 person team is threshold-based: if a learner's rolling quiz average exceeds 80% on 3+ consecutive assessments, promote to the next tier; if it drops below 50%, offer tier regression with reinforcement content.

## 8. The "Depth Cards" Pattern

The depth cards pattern -- teaching the same concept at three levels -- is implemented by generating three content variants per concept sharing a common `concept_id` but distinct `proficiency_tier` values. In the database, each variant is a `content_block` row with metadata including `bloom_level`, `dok_level`, `scaffolding_type`, and `prerequisite_concepts`. The UI enables tier switching so a Working-tier learner encountering difficulty can drill into the Foundational version, or an advanced learner can skip ahead to Applied.

## Nigerian Market Context

Nigeria's corporate training market stands at USD 325.95M (2024), growing at 7% CAGR, with 85% of graduates lacking basic digital competencies (TechCabal Insights). Over 70% of training providers concentrate in Lagos, Abuja, and Port Harcourt. SABIficate's mobile-first adaptive approach addresses the geographic gap while the three-tier proficiency model serves both the large Foundational-needs population and the smaller but higher-value Applied segment targeted by B2B employers.

## Sources

- [ALEKS Knowledge Space Theory](https://www.aleks.com/about_aleks/knowledge_space_theory)
- [FSRS Algorithm Overview (DeepWiki)](https://deepwiki.com/open-spaced-repetition/rs-fsrs/3.1-fsrs-algorithm-overview)
- [ts-fsrs TypeScript Package](https://github.com/open-spaced-repetition/ts-fsrs)
- [LPITutor: LLM-based Intelligent Tutoring](https://pmc.ncbi.nlm.nih.gov/articles/PMC12453719/)
- [From Tarzan to Tolkien: Controlling LLM Proficiency](https://arxiv.org/html/2406.03030v1)
- [Nigeria Digital Skills Gap (TechCabal)](https://insights.techcabal.com/nigerias-digital-skills-gap/)
- [Nigeria Corporate Training Market (6W Research)](https://www.6wresearch.com/industry-report/nigeria-corporate-training-services-market)
- [Knewton Adaptive Learning (HBS)](https://aiinstitute.hbs.edu/platform-digit/submission/knewton-personalizes-learning-with-the-power-of-ai/)
- [DreamBox Learning Technical Overview](https://dreamboxlearning.zendesk.com/hc/en-us/articles/27281843188243-How-Does-DreamBox-Math-Work)
- [Smart Sparrow Platform](https://www.smartsparrow.com/platform/)
- [Rasch Model Python Implementation](https://oneruby.dev/understanding-and-implementing-the-rasch-model-with-python/)
- [FSRS Spaced Repetition Algorithms Comparison](https://studyglen.com/guides/best-spaced-repetition-apps)

## Key Findings Summary

### Finding 1
**Finding:** ALEKS uses Knowledge Space Theory with Markovian procedures to map 350+ concepts into millions of feasible knowledge states, yet requires only 25-30 questions for accurate placement. Students work on items at the 'outer fringe' of their knowledge state -- a direct operationalization of ZPD.

**Source:** ALEKS Knowledge Space Theory documentation (aleks.com); Matayoshi & Doignon 2021, Journal of Mathematical Psychology

**Relevance:** Provides a proven algorithmic model for SABIficate's placement assessment. The 'outer fringe' concept maps directly to SABIficate's Foundational/Working/Applied tier boundaries.

### Finding 2
**Finding:** FSRS (Free Spaced Repetition Scheduler) uses a 3-variable DSR model (Difficulty 0-10, Stability in days, Retrievability as recall probability) with 19 trainable parameters and a power-law forgetting curve: R = (1 + FACTOR * elapsed_days / stability)^DECAY. Benchmarks on 500M+ Anki reviews show FSRS needs 20-30% fewer reviews than SM-2 for the same retention rate. Open-source TypeScript implementation (ts-fsrs) available on npm.

**Source:** open-spaced-repetition/free-spaced-repetition-scheduler GitHub; DeepWiki FSRS Algorithm Overview; ts-fsrs npm package

**Relevance:** ts-fsrs is a drop-in TypeScript package for SABIficate's React/Fastify stack. The DSR model can be stored in PostgreSQL columns per learner-concept pair, enabling adaptive review scheduling within the existing tech stack.

### Finding 3
**Finding:** The Rasch model (1PL IRT) uses the formula P(correct) = 1 / (1 + e^(-(theta - d))) where theta is learner ability and d is item difficulty. This single-parameter model is computationally lightweight enough for mobile adaptive quizzes -- only requiring a running estimate of theta updated after each response.

**Source:** OneRuby.dev Rasch Model implementation guide; py-irt library documentation; TEMJournal IRT implementation study

**Relevance:** A simplified 1PL IRT can be implemented in ~50 lines of TypeScript for SABIficate's quiz-based placement, determining whether a learner belongs at Foundational, Working, or Applied proficiency for each topic.

### Finding 4
**Finding:** LLMs can generate educational content at controlled difficulty levels using a dual-layer prompt strategy: (i) a static pedagogical template layer and (ii) a dynamic layer injecting retrieved content and learner metadata. Research shows 97% accuracy at beginner level declining to 89% at advanced level. The CaLM approach (finetuning + PPO on smaller models) achieves GPT-4-level difficulty control at 25x lower cost.

**Source:** LPITutor (PMC 2025); 'From Tarzan to Tolkien' (arXiv 2406.03030); Automated Educational Question Generation (arXiv 2408.04394)

**Relevance:** SABIficate's AI content pipeline using Claude can implement the dual-layer prompt pattern to generate the same concept at Foundational/Working/Applied levels, with RAG grounding content in verified Nigerian regulatory and business materials.

### Finding 5
**Finding:** DreamBox's Intelligent Adaptive Learning engine captures every interaction (clicks, keystrokes, time-on-task, answer strategies) to adapt instruction in real-time. Smart Sparrow uses instructor-defined adaptive rules with triggers based on response patterns or time-on-screen to branch learners to remediation or acceleration paths.

**Source:** DreamBox Learning Zendesk documentation; Smart Sparrow platform documentation

**Relevance:** DreamBox's interaction-level telemetry is too heavy for SABIficate's mobile context, but Smart Sparrow's rule-based branching model is implementable: define trigger rules per content block (e.g., if quiz score < 60%, branch to Foundational reinforcement).

### Finding 6
**Finding:** Nigeria's corporate training market is USD 325.95 million (2024), growing at 7.0% CAGR. 85% of graduates lack basic digital competencies despite tech contributing 20% of GDP growth. Over 70% of training providers are concentrated in urban areas, leaving rural regions untapped. Over 70% of Nigerian companies are investing in employee training.

**Source:** 6W Research Nigeria Corporate Training 2025-2031; TechCabal Insights Nigeria Digital Skills Gap; BusinessDay NG

**Relevance:** Validates SABIficate's B2B upskilling tier targeting corporate Nigeria. The 85% digital skills gap among graduates confirms the need for Foundational-level content, while the urban concentration gap supports mobile-first delivery.

### Finding 7
**Finding:** Proficiency scales in competency-based education typically use 3-5 levels. Webb's Depth of Knowledge defines 4 tiers (Recall, Skill/Concept, Strategic Thinking, Extended Thinking). Bloom's revised taxonomy adds a knowledge dimension (Factual, Conceptual, Procedural, Metacognitive) orthogonal to cognitive process levels.

**Source:** Great Schools Partnership proficiency scales; Webb DOK framework (Hess 2009); Bloom's revised taxonomy (Anderson & Krathwohl 2001)

**Relevance:** SABIficate's 3-tier Foundational/Working/Applied maps cleanly to DOK levels 1-2/2-3/3-4. Each tier can be defined by Bloom's knowledge dimension: Foundational=Factual+Conceptual, Working=Procedural, Applied=Metacognitive+Strategic.

### Finding 8
**Finding:** Scaffolding effectiveness varies by prior knowledge: directed prompts work better for low-prior-knowledge learners, while generic prompts work better for high-prior-knowledge learners. Meta-analysis confirms scaffolding through prompts in digital learning has significant positive effects on learning achievement.

**Source:** ScienceDirect scaffolding meta-analysis 2025; NIU CITL Instructional Scaffolding guide; Springer Aptitude-Treatment-Interaction study

**Relevance:** SABIficate's Foundational tier should use highly directed scaffolding (step-by-step prompts, worked examples), while Applied tier should use open-ended prompts and case studies -- the AI content pipeline should encode this scaffolding gradient into prompt templates.

## Implementation Insights

- Use ts-fsrs (npm package, TypeScript, 19 trainable parameters) for spaced repetition scheduling. Store DSR state (difficulty, stability, retrievability) per learner-concept pair in PostgreSQL. Card states map to: New, Learning, Review, Relearning. The repeat() method is stateless and returns scheduling outcomes for all four ratings (Again/Hard/Good/Easy).

- Implement a simplified 1PL IRT (Rasch model) for placement quizzes in ~50 lines of TypeScript: P(correct) = 1/(1+exp(-(theta-d))). Start theta at 0, update after each response using: theta_new = theta_old + (K * (response - P)), where K is a learning rate (0.3-0.5). After 10-15 questions, theta reliably places learners into Foundational (theta < -1), Working (-1 to 1), or Applied (theta > 1) bands.

- For AI content generation at three proficiency levels, use a dual-layer prompt architecture: Layer 1 is a static pedagogical template defining Foundational (plain language, concrete examples, step-by-step), Working (technical terminology, procedural focus, professional scenarios), and Applied (case studies, strategic analysis, cross-domain synthesis). Layer 2 dynamically injects topic-specific RAG context and Nigerian regulatory/business materials.

- Store difficulty metadata per content block in PostgreSQL with columns: bloom_level (1-6), dok_level (1-4), prerequisite_concepts (array), scaffolding_type (directed|guided|generic), and proficiency_tier (foundational|working|applied). This enables both rule-based adaptive branching and analytics-driven difficulty calibration.

- Implement Smart Sparrow-style branching rules as JSON config per lesson: {trigger: 'quiz_score < 0.6', action: 'branch_to_foundational', target_block_id: 'xxx'}. This is simpler than DreamBox's interaction-level telemetry and works well on mobile where bandwidth is constrained.

- For measuring proficiency change over time, track a learning_events table with columns: user_id, concept_id, event_type (quiz|completion|review), score, theta_estimate, timestamp. Compute a rolling theta estimate per concept using exponentially weighted moving average. Visualize as a proficiency heat map on the learner dashboard.

- The 'depth cards' pattern (same concept at 3 levels) maps directly to SABIficate's tier system. Generate three content variants per concept using Claude with tier-specific prompts. Store as content_blocks with a shared concept_id and distinct proficiency_tier. Enable tier switching in the UI so learners can drill down or review fundamentals.

- For the FSRS integration, the PostgreSQL schema needs: card_id, user_id, concept_id, due_date (timestamp), stability (float), difficulty (float), elapsed_days (int), scheduled_days (int), reps (int), lapses (int), state (enum: new/learning/review/relearning), last_review (timestamp). The ts-fsrs createEmptyCard() initializes all values.

## Nigerian Context

- Nigeria's corporate training market is USD 325.95M (2024) growing at 7% CAGR, with over 70% of companies investing in employee training -- validating SABIficate's B2B upskilling tier.

- 85% of Nigerian graduates lack basic digital competencies despite tech contributing 20% of GDP growth, confirming strong demand for Foundational-tier content in digital skills, financial literacy, and business fundamentals.

- Over 70% of training providers concentrate in Lagos, Abuja, and Port Harcourt -- mobile-first adaptive learning serves the underserved 30% in secondary cities and rural areas.

- Nigeria scores 44% in human capital development vs. 55% Sub-Saharan average, with 8.3% of businesses reporting unfilled roles due to qualified candidate shortages -- this is the exact gap SABIficate's proficiency-based credentials address.

- uLesson's 2023 partnership with Nigeria's Ministry of Education to reach 5M+ students demonstrates government receptiveness to digital adaptive learning platforms.

- Bandwidth constraints in Nigeria (average mobile speeds 15-25 Mbps but with frequent drops) favor lightweight adaptive algorithms like 1PL IRT over heavy real-time telemetry systems -- quiz-based placement with 10-15 questions uses minimal data.

- The National Board for Technical Education (NBTE) is actively reforming technical education to be more practical and labor-market-aligned, creating potential B2G partnership opportunities for SABIficate's Applied-tier professional content.

## Tools & Libraries

| Name | Purpose | URL | Cost |
|------|---------|-----|------|
| ts-fsrs | TypeScript implementation of FSRS spaced repetition algorithm with DSR memory model, card scheduling, and 19 trainable parameters | https://github.com/open-spaced-repetition/ts-fsrs | Free, MIT license |
| ALEKS (Knowledge Space Theory reference) | Reference implementation of Knowledge Space Theory for adaptive assessment -- academic papers describe the Markovian placement algorithm | https://www.aleks.com/about_aleks/knowledge_space_theory | Commercial product (McGraw Hill), but the theory is published openly |
| py-irt | Python library for Bayesian IRT models (1PL/2PL/4PL) -- useful for offline item calibration and difficulty parameter estimation | https://github.com/nd-ball/py-irt | Free, open source |
| catsim (Python) | Computerized Adaptive Testing simulation library implementing IRT-based item selection, ability estimation, and test termination rules | https://arxiv.org/pdf/1707.03012 | Free, open source |
| Claude API (Anthropic) | LLM API for generating educational content at controlled difficulty levels using dual-layer prompt engineering with RAG | https://docs.anthropic.com/en/docs | Usage-based pricing; Claude Sonnet ~$3/$15 per 1M input/output tokens |
| simple-ts-fsrs | Minimal TypeScript FSRS implementation for projects that need a lightweight alternative to the full ts-fsrs package | https://github.com/AustinShelby/simple-ts-fsrs | Free, open source |
