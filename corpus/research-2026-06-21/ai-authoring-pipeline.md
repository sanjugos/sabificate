# AI Curriculum Authoring Pipeline

**Research Date:** 2026-06-21
**Source:** SABIficate Research Sweep — Deep Research Agent

---

# AI Curriculum Authoring Pipeline

*Synthesized from web research conducted June 2026. All sources cited inline. This document informs the design of SABIficate's content generation system for Nigerian professional microlearning.*

---

## 1. The Seven-Stage Authoring Pipeline

Industry practice has converged on multi-stage content production pipelines that separate generation from validation. Enterprise implementations report reducing production time from three weeks to three days for a 60-minute compliance module, but deployment timelines remain unchanged without integrated system connectors across stages ([MITR Media, 2026](https://www.mitrmedia.com/resources/blogs/why-ai-generated-content-alone-wont-fix-enterprise-training-bottlenecks-in-2026/)).

SABIficate's recommended seven-stage pipeline:

1. **Skill Decomposition** -- LLM decomposes a competency (e.g., "Financial Statement Analysis") into a directed graph of concept nodes with prerequisite edges. Research shows skills can be annotated into fine-grained, assessable competencies encoded as directed knowledge graphs ([arXiv 2502.15662](https://arxiv.org/pdf/2502.15662)).

2. **Prompt Assembly** -- System selects Bloom's-aligned prompt templates from a versioned registry, injecting topic context, target tier, and Nigerian localization parameters.

3. **Multi-Tier Generation** -- Claude API generates content at Foundational, Working, and Applied levels in a single Chain-of-Thought call. Few-shot prompting with readability-calibrated examples significantly outperforms zero-shot ([arXiv 2406.12787](https://arxiv.org/html/2406.12787v1)).

4. **Citation Extraction** -- Automated post-processing extracts factual claims and matches them against a source database. The average AI hallucination rate is 9.2% for general knowledge ([Clarity Bot](https://claritybot.io/ai-content-verification/)), making this step non-optional for professional training content.

5. **QA Triage** -- Traffic-light classifier auto-certifies green items (confidence >= 0.90), routes yellow to SME review, rejects red. In a proof-of-concept with 500 CS assessment items, 39.6% were auto-certified, 43.0% required human review, and 17.4% were rejected ([arXiv 2604.09622](https://arxiv.org/html/2604.09622v1)).

6. **SME Review** -- Subject matter experts review flagged content with explainability metadata, reducing review time by 31%. Of 100 yellow-flagged items, 38 were approved unchanged, 41 approved with minor edits, 21 rejected.

7. **Versioned Publishing** -- Approved content is version-tagged and linked to concept_id nodes, enabling reuse across B2C and B2B tracks.

## 2. Bloom's Taxonomy as the Cognitive Scaffold

Without deliberate prompt engineering, LLMs default to Remember-level outputs: lists, definitions, and summaries ([Structural Learning](https://www.structural-learning.com/post/ai-prompts-blooms-taxonomy-teachers-guide)). SABIficate's three proficiency tiers map directly to Bloom's levels:

| SABIficate Tier | Bloom's Levels | Example Prompt Verbs |
|---|---|---|
| Foundational | Remember, Understand | List, Define, Explain, Summarize |
| Working | Apply, Analyze | Demonstrate, Compare, Break down, Identify assumptions |
| Applied | Evaluate, Create | Critique, Judge, Design, Propose, Construct |

Prompt templates must encode these verbs explicitly. A study on automated question generation confirmed that scaffolded difficulty -- starting with factual recall and escalating to analysis and application -- mirrors natural instructional progression and produces higher-quality outputs ([arXiv 2408.04394](https://arxiv.org/pdf/2408.04394)).

## 3. SME-AI Collaboration Patterns

The PromptHive framework ([arXiv 2410.16547](https://arxiv.org/html/2410.16547v1)) demonstrates that 86% of lesson-level prompts are adapted rather than used verbatim by SMEs, confirming that collaborative authoring outperforms fully automated generation. The system uses a two-level abstraction:

- **Curriculum-level prompts**: Set tone, depth, and pedagogical approach for an entire track
- **Lesson-level prompts**: Add topic-specific context, examples, and assessment criteria

For SABIficate, Nigerian SMEs (accountants, bankers, engineers, HR professionals) should work with a prompt library rather than raw LLM interfaces. The async review model -- notifications via WhatsApp/email with inline editing capability -- accommodates SMEs distributed across Lagos, Abuja, Port Harcourt, and the diaspora.

## 4. Content Reuse via Concept Graph

Learning objects -- reusable curriculum components combining content, practice, and assessment around a single learning objective -- can be shared across multiple contexts ([Wikipedia - Learning Object](https://en.wikipedia.org/wiki/Learning_object)). Knowledge graphs represent educational concepts as interconnected entities enabling prerequisite mapping and adaptive path selection ([Springer](https://link.springer.com/article/10.1007/s42979-024-03341-y)).

SABIficate's implementation uses a PostgreSQL concept graph: a `concepts` table with prerequisite arrays, a `content_blocks` table keyed by `(concept_id, tier, bloom_level)`, and a junction table mapping blocks to tracks/courses. A single "time value of money" concept block can appear in B2C Finance Foundations, B2B Banking Upskilling, and Premium CFA Prep with different wrapper context but shared core content.

## 5. Trust Layer and Claim Sourcing

For Nigerian professional certification content referencing regulations (CAMA 2020, NDPC Act, CBN circulars, ICAN standards), every factual claim must be traceable. Best practice requires confirming claims against at least two independent credible sources ([LaunchCodex](https://launchcodex.com/blog/llms-ai-agents-tools/multi-source-content-verification/)). The EU AI Act and UNESCO guidelines classify educational assessment as high-risk requiring documented oversight ([arXiv 2604.09622](https://arxiv.org/html/2604.09622v1)).

Implementation: a `citations` JSONB column on `content_blocks` stores `{claim, source_url, source_title, verified, verified_by}` objects. The generation prompt instructs Claude to output claims with inline citation markers. Post-processing extracts and stores these separately. Unverified claims trigger yellow-flag in QA triage.

## 6. Multi-Tier Generation Strategy

Research on leveled-text generation ([arXiv 2406.12787](https://arxiv.org/html/2406.12787v1)) establishes that the Lexile scale provides measurable readability targets, and few-shot prompting with readability-calibrated examples produces content closest to target levels (measured by Mean Absolute Error from intended Lexile score).

SABIficate should generate all three tiers in a single Chain-of-Thought API call: the model first reasons about Foundational needs (simple vocabulary, concrete examples, Nigerian Naira-denominated scenarios), then Working level (professional terminology, analytical frameworks, sector-specific applications), then Applied level (strategic evaluation, cross-domain synthesis, leadership decision scenarios). This produces internally consistent content and costs approximately $0.05-0.15 per lesson across all three tiers using Claude Sonnet.

## 7. Nigerian Market Context

Nigeria's EdTech Skills and Certification Platforms market is valued at $110M with 15-20% annual growth ([Ken Research](https://www.kenresearch.com/nigeria-edtech-skills-certification-platforms-market)). With 140M smartphone users and 49.34% broadband penetration ([EduTech Global](https://edutech.global/nigeria-edtech-market-forecast-2026/)), the infrastructure supports mobile-first microlearning delivery. Content must account for Nigerian English usage, local regulatory frameworks, and bandwidth-conscious design (text-heavy with optional media rather than video-first).

## 8. Implementation for a Small Team

For a 2-3 developer team, the pipeline should be built entirely within the existing Fastify + PostgreSQL stack:

- **Job queue**: pg-boss (PostgreSQL-native, no Redis needed) manages stage transitions
- **Schema validation**: Zod validates structured Claude API outputs before database insertion
- **Admin UI**: Kanban-style board in the React PWA showing content blocks moving through pipeline stages
- **Review interface**: Lightweight page showing generated content alongside source prompt, Bloom's target, and citation list, with approve/edit/reject actions
- **Prompt registry**: Database table with versioned templates rather than hardcoded strings, enabling rapid iteration without code deploys

Total additional infrastructure cost: Claude API usage only (estimated $50-150/month for initial curriculum generation of 200+ lessons across all tiers).

---

*Sources: arXiv 2604.09622, arXiv 2406.12787, arXiv 2410.16547, MITR Media 2026, Structural Learning, EduTech Global 2026, Ken Research, Forasoft 2026, LaunchCodex, Clarity Bot, Wikipedia Learning Objects*

## Key Findings Summary

### Finding 1
**Finding:** A four-stage certification workflow (Generation, Explainability/Verification, Certification, Audit) with traffic-light system achieves 39.6% auto-certified (green), 43.0% human review (yellow), and 17.4% rejected (red) items. Human review time decreased 31% when explainability metadata was provided. Of 100 yellow items reviewed, 38 approved unchanged, 41 approved with minor edits, 21 rejected.

**Source:** arXiv 2604.09622 - Explainability and Certification of AI-Generated Educational Assessments

**Relevance:** Directly applicable as SABIficate's QA pipeline. The traffic-light system maps to the two-axis curriculum: auto-certify Foundational content (lower risk), require SME review for Applied content (higher stakes for B2B employers).

### Finding 2
**Finding:** Without deliberate prompt engineering, AI tools default to Remember-level (Bloom's lowest) outputs. Each cognitive level requires specific verb structures -- 'List the causes' vs 'Evaluate the relative significance of each cause' produce fundamentally different content. Few-shot prompting with Lexile-calibrated examples significantly outperforms zero-shot for leveled content generation.

**Source:** Structural Learning - AI Prompts for Bloom's Taxonomy; arXiv 2406.12787 - Generating Educational Materials with Different Levels of Readability

**Relevance:** Critical for SABIficate's three proficiency tiers: Foundational maps to Remember/Understand, Working to Apply/Analyze, Applied to Evaluate/Create. Prompt templates must encode these Bloom's levels explicitly.

### Finding 3
**Finding:** PromptHive framework shows 86% of lesson-level prompts are adapted rather than used verbatim by SMEs, indicating that collaborative prompt authoring (not fully automated generation) produces the best results. The system uses a two-level abstraction: textbook-level prompts for broad curriculum and lesson-level prompts for specific modules.

**Source:** arXiv 2410.16547 - PromptHive: Collaborative Prompt Engineering for Educational Content Creation

**Relevance:** SABIficate should implement a prompt library with curriculum-wide templates (per track) and lesson-specific refinements. Nigerian SMEs can adapt prompts rather than write from scratch, reducing authoring burden.

### Finding 4
**Finding:** Enterprise AI content pipelines reduced production time from 3 weeks to 3 days for 60-minute modules, but SME review cycle time increased 18% because experts were asked to review more frequently. Deployment timelines did not change without system connectors between generation, review, and publishing stages.

**Source:** MITR Media - AI-Generated Content Alone Won't Fix Enterprise Training Bottlenecks in 2026

**Relevance:** SABIficate must build integrated review workflows (not just fast generation). For a 2-3 person team, this means embedding approval gates directly in the admin UI rather than using external tools.

### Finding 5
**Finding:** Nigeria's EdTech market is projected at $400M in 2025, with Skills & Certification Platforms valued at $110M. Smartphone penetration at 140M devices, broadband at 49.34%. Nigeria accounts for 20.4% of Africa's e-learning market. 15-20% annual growth expected through 2026.

**Source:** EduTech Global - Nigeria EdTech Market Forecast 2026; Ken Research - Nigeria EdTech Skills & Certification Platforms Market

**Relevance:** Validates the market opportunity for AI-generated professional training content at scale. The $110M skills certification segment is SABIficate's primary addressable market.

### Finding 6
**Finding:** Knowledge graphs represent educational concepts as interconnected entities, enabling automatic identification of core concepts, prerequisite mapping, and content reuse across learning paths. Learning objects -- reusable curriculum components combining content, practice, and assessment items around a single learning objective -- can be shared across multiple contexts.

**Source:** Wikipedia - Learning Object; Springer - Knowledge Graph-Based Core Concept Identification; SmythOS - Knowledge Graphs in Education

**Relevance:** SABIficate's concept_id system should implement a lightweight knowledge graph in PostgreSQL, linking concept nodes to content blocks, enabling reuse of the same concept explanation across B2C freemium and B2B tracks.

### Finding 7
**Finding:** AI hallucination rate averages 9.2% for general knowledge, and 68% of marketers using generative AI have encountered hallucinated content. Multi-source verification -- confirming every claim against at least 2 independent credible sources before publishing -- is the recommended mitigation. Self-consistency approaches generating 30 response variations and selecting the centroid reduce hallucination risk.

**Source:** Clarity Bot - AI Verification; LaunchCodex - Multi-source Content Verification; arXiv 2410.16547 - PromptHive

**Relevance:** For Nigerian professional certification content where accuracy is critical (regulatory, financial, legal), SABIficate needs a claim-sourcing layer that tags each fact with a verifiable reference and flags unsourced claims for SME review.

### Finding 8
**Finding:** Claude (Anthropic) at $20/month Pro with 200K token context window is highlighted as excelling at curriculum synthesis and scaffolded content creation. MagicSchool AI at $11.99/month is adopted by 5M+ educators. Diffit at $14.99/month transforms passages into leveled reading versions automatically. Reference stack for L&D is approximately $300/month total.

**Source:** Forasoft - 10 Best AI Tools for Educational Content Creation in 2026

**Relevance:** SABIficate can use Claude API directly (already in the stack) rather than third-party wrappers, keeping costs to API usage only. Diffit's approach to automatic leveling validates the multi-tier content generation strategy.

## Implementation Insights

- Implement a seven-stage authoring pipeline in the existing Fastify backend: (1) Skill Decomposition -- LLM breaks a competency into concept nodes with prerequisites, (2) Prompt Assembly -- system selects Bloom's-aligned prompt templates for each proficiency tier, (3) Content Generation -- Claude API generates lesson content at Foundational/Working/Applied levels simultaneously using few-shot prompts with tier-specific verb structures, (4) Citation Extraction -- automated step that extracts and verifies factual claims against a source database, (5) QA Triage -- traffic-light classifier auto-certifies green items (confidence >= 0.90), routes yellow to SME review queue, rejects red, (6) SME Review -- inline approval UI with edit capability and structured feedback, (7) Publishing -- version-tagged content pushed to lesson store with concept_id linking.

- Design the PostgreSQL schema around a concept graph: concepts table (concept_id, name, domain, prerequisites[]), content_blocks table (block_id, concept_id, tier enum, bloom_level enum, body jsonb, citations jsonb, version int, status enum), and a content_reuse junction table mapping blocks to multiple tracks/courses. This enables a single 'time value of money' concept to appear in both B2C Finance Foundations and B2B Banking Upskilling with different wrapper context but shared core explanation.

- Build a prompt template registry stored in the database rather than hardcoded: each template has a bloom_level, tier, content_type (explanation, scenario, quiz, reflection), and a mustache-style template string. This follows PromptHive's two-level abstraction -- curriculum-level templates set tone and depth, lesson-level templates add topic specifics. Templates should be version-controlled so prompt improvements propagate to future regenerations without breaking existing content.

- For the trust layer, implement a citations jsonb column on content_blocks that stores an array of {claim: string, source_url: string, source_title: string, verified: boolean, verified_by: string}. During generation, prompt Claude to output claims in a structured format with inline citation markers. A post-processing step extracts these and stores them separately. Unverified claims trigger yellow-flag in the QA triage stage.

- Use Chain-of-Thought prompting for multi-tier generation: a single API call generates content at all three proficiency levels by instructing the model to first reason about what Foundational learners need (Remember/Understand verbs), then Working level (Apply/Analyze), then Applied level (Evaluate/Create). This produces internally consistent content across tiers and is more cost-effective than three separate API calls. Expected token usage: approximately 2000-4000 tokens per lesson across all three tiers.

- For a 2-3 developer team, avoid building a custom orchestration engine. Use PostgreSQL-backed job queues (pg-boss or a simple status column workflow) where content moves through statuses: draft -> generated -> qa_pending -> sme_review -> approved -> published. The admin UI shows a Kanban-style board. This is simpler than integrating n8n or Airtable and keeps everything in the existing stack.

- Implement content versioning with immutable content_block rows: each edit creates a new version row with an incremented version number and a parent_version_id. The active version is marked with is_current boolean. This provides full audit trail for regulatory compliance (important for Nigerian professional certification bodies like ICAN, CIBN, NIM) without complex git-like branching.

- For Nigerian SME collaboration, build an async review workflow: SMEs receive a WhatsApp or email notification with a link to a review page showing generated content alongside the prompt that produced it, the Bloom's level target, and citation sources. They can approve, edit inline, or reject with structured feedback (accuracy, relevance, cultural appropriateness, regulatory compliance). This accommodates SMEs who may not be available for synchronous review sessions.

## Nigerian Context

- Nigeria's EdTech Skills and Certification Platforms market is valued at $110M with 15-20% annual growth. The 140M smartphone users and 49.34% broadband penetration create a large addressable market for mobile-first AI-generated microlearning content.

- Nigerian professional bodies (ICAN for accountants, CIBN for bankers, NIM for managers, COREN for engineers) set curriculum standards that AI-generated content must align with. The trust layer and citation system is not optional -- these bodies require traceable, accurate content for any certification-adjacent training.

- Content must account for Nigerian English usage, local business context (Naira-denominated examples, Nigerian tax law, CBN regulations), and cultural scenarios. Prompt templates should include a 'Nigerian context injection' parameter that localizes generated content with relevant examples from the Nigerian business environment.

- Bandwidth constraints on Nigerian networks (average 25-35 Mbps mobile, but highly variable and often much lower in practice) mean AI-generated content should be text-heavy with optional media, not video-first. The microlearning format (5-10 minute lessons) aligns well with data-conscious usage patterns.

- B2B employer customers in Nigeria (banks, oil & gas, telecoms, FMCGs) require compliance training aligned with Nigerian regulatory frameworks. AI-generated content for these verticals needs sector-specific SME validation and must reference Nigerian legislation (CAMA 2020, NDPC Act, CBN circulars) rather than generic international standards.

- The SME pool for content review in Nigeria may be geographically distributed across Lagos, Abuja, Port Harcourt, and diaspora. An async review workflow with WhatsApp notifications is more practical than requiring SMEs to log into a desktop admin panel during business hours.

## Tools & Libraries

| Name | Purpose | URL | Cost |
|------|---------|-----|------|
| Claude API (Anthropic) | Core content generation engine -- curriculum synthesis, scaffolded lesson creation at multiple Bloom's levels, skill decomposition, and quiz generation. 200K token context window supports processing full curriculum outlines in a single call. | https://docs.anthropic.com/en/api | $15/M input tokens, $75/M output tokens (Claude Sonnet 4); approximately $0.05-0.15 per lesson generated across three tiers |
| pg-boss | PostgreSQL-native job queue for managing the authoring pipeline stages. Each content block moves through generation, QA, review, and publishing stages as background jobs. No additional infrastructure needed beyond existing PostgreSQL. | https://github.com/timgit/pg-boss | Free, open source (MIT license) |
| Diffit | Reference implementation for automatic content leveling -- transforms text into multiple readability levels. Validates SABIficate's approach of generating tiered content from a single source concept. | https://diffit.me | $14.99/month Premium; useful as reference, not as dependency |
| MagicSchool AI | Reference platform with 80+ educational content templates adopted by 5M+ educators. Study their template patterns for SABIficate's prompt template registry design. | https://www.magicschool.ai | $11.99/month Plus; reference only |
| Zod (TypeScript schema validation) | Validate structured AI output from Claude API -- ensure generated content blocks conform to expected schema (has required fields, citations array, correct Bloom's level tags) before storing in PostgreSQL. | https://zod.dev | Free, open source (MIT license) |
| Lexile Analyzer API | Measure readability of generated content to verify it matches target proficiency tier. Foundational content should target 800-1000L, Working 1000-1200L, Applied 1200+L. | https://lexile.com | API pricing varies; MetaMetrics provides institutional access |
| Drizzle ORM | Already in SABIficate's stack. Extend existing schema with concepts, content_blocks, prompt_templates, and review_actions tables. Type-safe queries for the content pipeline. | https://orm.drizzle.team | Free, open source |
