Curriculum Platform
Two-Axis Tiering & Structure Overview
Working draft for design and business-model discussion
The core idea: two axes, not one list
Tiering this curriculum involves two separate questions that are easy to conflate. Keeping them apart is the foundation of the whole structure.
Axis 1 — Customer / monetization tier: who is paying and why. This sorts learners and buyers into market segments (freemium individuals, hiring companies, business owners upskilling staff, premium specialists).
Axis 2 — Proficiency level: how much a given learner already knows. This is the Foundational / Working / Applied placement, applied within whatever track a customer is in.
A sophisticated urban learner and a rural low-bandwidth learner are the same customer tier (B2C) but may be at completely different proficiency levels. A business owner is a buyer segment, but each of their employees still needs an individual placement. The two axes are independent, so the real structure is a grid, not a list. Plan for the grid and the rest follows.
Axis 1 — Customer / monetization tiers
Four tiers, sorted by who pays and what they are buying.

Business-model risk to decide early. The freemium tier optimizes for volume and low cost-to-serve; verified certification optimizes for rigor and trust, which is expensive and high-friction. If verified certificates sit on top of a free funnel, be deliberate about where the wall goes: free to learn, pay to certify. Otherwise the certificate’s value (the thing hiring companies are buying) gets diluted by casual self-certification. This paywall placement is arguably the single most important decision here, more than the proficiency mechanics.
How Axis 1 shows up inside the curriculum
Axis 1 currently lives in the business model. The question is how it becomes visible in what the learner actually experiences. Three honest options, from cheapest to most expensive:
Option A — Packaging, not content. The lessons are identical; what differs is the wrapper: access, pricing, certification, and reporting. A freemium learner and a B2B employee can take the same financial-literacy module; the freemium user hits a paywall at the cert exam, while the employee’s completion reports to a manager dashboard. Cheapest to build, and the right default for most content.
Option B — Same skill, segment-relevant context. The competency is constant but examples flex to the segment. Financial literacy for a rural micro-entrepreneur uses crop-income smoothing and informal savings groups; for an urban professional it uses salary, digital banking, and investment. Worth doing where relevance drives completion, which in low-bandwidth B2C it strongly does.
Option C — Genuinely different content. A B2B-hiring track adds employer-demanded competencies and a proctored assessment the freemium track does not have at all. Reserve this for where a buyer’s requirement is real and specific, with verified certification the clearest case.
Practical default: build everything as Option A, use Option B for the parts where segment relevance changes whether someone finishes, and use Option C only where a buyer pays for something structurally different. In the product, this means Axis 1 is mostly entry conditions and exit conditions with a thin contextual layer in the middle:
Entry/onboarding: a segment question (“learning for yourself, your team, or hiring?”) sets the wrapper, not the lessons.
Middle: examples and scenarios swap by segment flag (the Option B layer).
Exit/credential: badge of completion (freemium) vs. verified certificate (paid / hiring) vs. team-progress rollup (upskilling).
Axis 2 — Proficiency, built as one spine per vertical
A spine is the fixed sequence of competencies a vertical requires, in order, regardless of who takes it. Proficiency does not change the spine; it changes how much scaffolding wraps each node. This is what keeps the content count sane.
Depth treatments per node:
Foundational: one concept per step, a worked example, a fill-in template, a comprehension check before moving on.
Working: concept stated, one example, then a problem they solve themselves. Faster pace, less hand-holding.
Applied: the principle and its edge cases, a challenge with no template, focus on tradeoffs and when the rule breaks.
Worked example — a Financial Literacy spine. Every learner moves through the same six nodes; only the depth card changes.
Reflecting skill level: vary five dimensions, not a label
Reflecting level is not about tagging content “Applied.” It is about adjusting specific, controllable dimensions of each lesson. These five do the real work. The reason to name them: in a prompt-driven system they become the parameters you pass into generation. “Level = Foundational” alone is too vague for a model to act on consistently; the five settings below are not. Level is a bundle of these, not a single dial.

1Practical implication: the gateway’s only job is to resolve where a learner sits on these five dimensions. Everything downstream is mechanical once those settings are fixed.
How the two axes compose on a single node
The axes act on different parts of a lesson, so they combine cleanly without multiplying into separate curricula. Each node carries depth cards (Axis 2) and an example skin plus wrapper (Axis 1).
Asset model:

Axis 2 picks the depth card. Axis 1 picks the example skin and the wrapper (paywall, certificate, reporting). Because they touch different parts of the node, four spines of six nodes at three depths is a lot of small assets that share a backbone, not twelve independent tracks. Revising a concept touches one place.
Matching the entry point to the customer tier
Every tier needs a proficiency entry point, but it should look different per tier. Friction tolerance and the role of assessment vary.

Recommended default: a persona-led gateway with a lightweight calibration check (detailed in the next section), feeding a dynamic output. The persona resolves segment and a default level in one low-friction pick; one or two calibration questions silently correct a poor default. The resolved level is passed into content generation as the five difficulty dimensions, not a vocabulary swap. Add adaptation later if learners land in the wrong tier.
Personas as the gateway
A persona is a stronger front door than a proficiency question, but only if you are honest that persona is not the same as skill level. A persona bundles who someone is and why they are here: goals, context, vocabulary, the examples that resonate, and the segment they belong to. It maps mostly to Axis 1 (segment and context), with a strong correlation to, but not a determination of, Axis 2 (proficiency). Two people with the identical persona can sit at different levels.
Why the persona gateway wins:
Better question to ask a human. People recognize themselves far more reliably than they self-assess skill. “Which sounds like you?” has near-zero friction and high accuracy; “are you Foundational or Applied?” invites a meaningless answer.
Carries more signal. One persona pick sets the example skin, the motivation framing, the vocabulary, and a sensible default level, all at once. A proficiency pick sets only one of those.
Contextually native. Relevance is what drives completion, which matters enormously for low-bandwidth B2C economics.
The trap to avoid: do not let the persona silently lock proficiency. If “market trader” hard-codes “Foundational,” you bore the experienced trader and lose them. The persona sets a default level; a single lightweight check confirms or overrides it.
Recommended structure: a two-layer gateway where the persona does the heavy lifting and a tiny calibration question corrects it.

Worked instance — the Financial Literacy gateway. Persona resolves Axis 1 plus a level guess; one question resolves Axis 2.

How the gateway flexes by customer tier:
B2C rural / low-bandwidth: persona pick + one calibration question, text-only, one tap each. Stop there.
B2C urban: persona pick + two or three calibration questions for tighter placement.
B2B hiring: persona is set by the job role the company is hiring for; the calibration layer expands into the full rigorous diagnostic, because here the assessment is the product.
B2B upskilling: the owner picks the persona per role; each employee answers the calibration questions individually.
Constraint worth holding: three or four sharp, recognizable personas per vertical is the sweet spot. Past five or six, the pick stops being instant and you reintroduce the friction the persona gateway was meant to remove. Personas are a fast recognition device, not a taxonomy.
What to build first
The grid is seductive because it is tidy, but every vertical and every depth card is real authoring work, and low-bandwidth B2C has brutal completion economics. Do not author all twelve cells before the pattern is proven.
Pick one vertical (financial literacy is the most concrete), one customer segment, and build all three depth cards end to end.
Instrument it: measure real completion and placement accuracy. Are learners landing in the right tier? Do Foundational learners finish?
Only then replicate the pattern across verticals and segments. The structure above is designed to scale to twelve cells, which is exactly why you should validate one first.
Updates since first draft: (1) Proficiency levels renamed from Beginner / Intermediate / Advanced to Foundational / Working / Applied — more professional, non-stigmatizing, and better recognized in Nigerian employer contexts. (2) Exit credential types formalized per tier (see section below). (3) Seven-stage authoring pipeline defined and prototyped. (4) Catalog reuse flow added via concept_id linking.
Exit credentials by tier
Each Axis 1 tier issues a different credential type. This is not cosmetic — the credential type determines what the learner can do with it, what the employer or buyer sees, and where the payment wall sits. These are the four types used in v3.1.
The credential type is set at the track level (Axis 1) and does not change with proficiency level (Axis 2). A Foundational-level learner on a B2B Hiring track gets a Verified Certificate at the same threshold as an Applied-level learner — the assessment difficulty differs, not the credential type.
Catalog reuse and the concept_id link
Every competency carries a concept_id — a stable identifier shared across all tracks and markets that teach the same competency. This is how the system finds existing work before authoring starts, and how revisions propagate.
During decomposition the AI checks the catalog for concept_id matches. When a match is found, the authoring team has two options:
Link (default). The spine node points to the existing course via course_ref. No re-authoring. The course runs at all three depth levels using the depth cards already in the catalog version. The segment skin adapts to this track’s Axis 1 tier at the wrapper level. Cost: zero authoring; revision is automatic when the catalog version updates.
Fork (Option C only). Creates a new course document for this track, copying the catalog version as a starting point but breaking the concept_id link. The fork no longer receives automatic updates. Reserve for Option C (distinct_content) treatment where the buyer requirement is structurally different from the catalog version — for example, a B2B Hiring track that adds a proctored assessment the catalog version does not have.
Decision rule: if your track’s Axis 1 treatment is Option A or Option B, always link. If it is Option C, evaluate whether the content difference is structural (fork) or just contextual (still link, adapt the skin).
Seven-stage authoring pipeline
The v3.1 curriculum studio walks the SME through seven stages from track definition to live publication. Each stage has a clear deliverable and a clear gate before the next stage opens.
Assembly review — the cross-competency coherence gate
The assembly review is the one gate in the pipeline where the SME plays the full skill end-to-end, after all individual courses are verified. Its purpose is to catch coherence failures that per-course review cannot see: terminology that drifted across authors, a difficulty inversion between adjacent nodes, artifacts that overlap rather than ladder, or a gap in coverage that only becomes visible when the full spine is played in sequence.
Four categories are checked:
Terminology drift. Key terms used consistently across all spine nodes? Inconsistency signals that two authors or two prompts used different vocabulary for the same concept.
Difficulty inversion. The Foundational → Applied ramp coherent across the spine, not just within each course? An advanced treatment in node 2 that is easier than the foundational treatment in node 3 breaks the learning sequence.
Artifact redundancy. The artifacts form a ladder, not overlapping tasks. Each artifact should build on the previous and together they should evidence the full competency claim.
Coverage gap. The full skill is covered end-to-end with no missing handoff between courses. A learner completing the last course should be able to perform the skill statement from intake.
Decision: approve (track proceeds to publish) or send back (named courses return to revising status; assembly review re-runs after corrections). In the v3.1 schema, each assembly review round is recorded with reviewer, decision, category flags, and any proficiency-level-specific notes.

| Tier | Who | How they pay | Core need |
|---|---|---|---|
| B2C Free / Freemium | Individual learners: urban sophisticated + rural low-bandwidth | Free core; pay for certificates and premium tracks | Access, relevance, low data cost |
| B2B Talent / Hiring | Companies sourcing candidates with verified skills | Pay for access to a verified talent pool | Trustworthy, verifiable certification |
| B2B Upskilling | Business owners training existing staff | Seat licenses or cohort pricing | Team progress visibility, role-relevant content |
| Premium Verticals | Anyone wanting deep specialization in a field | Higher-priced specialized tracks | Depth, credibility, measurable outcomes |

| # | Spine node (competency) | What changes across depth cards |
|---|---|---|
| 1 | Money in vs. money out | Foundational: tally a trader’s week together with a template. Applied: principles of cash-flow timing and edge cases. |
| 2 | Separating personal vs. business money | Foundational: one rule, one worked example. Applied: when separation costs you and how to decide. |
| 3 | Pricing and margin | Foundational: fill-in pricing sheet. Applied: margin tradeoffs and price-elasticity intuition. |
| 4 | Saving and buffers | Foundational: how much, how often, where. Applied: buffer sizing against volatility. |
| 5 | Credit and debt | Foundational: good vs. bad debt with examples. Applied: cost of capital and leverage limits. |
| 6 | Reinvestment and growth | Foundational: simple reinvest-or-hold choice. Applied: open problem, no template, focus on tradeoffs. |

| Dimension | Foundational | Working | Applied |
|---|---|---|---|
| Assumed prior knowledge | Define everything from scratch | Assume the basics, define the rest | Assume fluency; discuss second-order effects |
| Abstraction | Concrete first: example, then rule | Example and rule together | Principle first, then edge cases |
| Pacing / chunk size | One concept per step, with a check | Two or three concepts per step | Larger leaps, fewer checks |
| Scaffolding | Worked examples and fill-in templates | A problem they solve themselves | Open problems, no template |
| Depth of “why” | Enough mechanism to make it work | Why it works, with one caveat | Tradeoffs, failure modes, when it breaks |

| VERTICAL  (e.g. Financial Literacy)
 └ SPINE: ordered competencies [node 1 … node n]   ← authored once
     └ each NODE has:
         ├ depth: Foundational treatment      ← Axis 2
         ├ depth: Working treatment  ← Axis 2
         └ depth: Applied treatment      ← Axis 2
         └ segment skin + wrapper          ← Axis 1 |
|---|

| Customer tier | How the proficiency entry point should work |
|---|---|
| B2C rural / low-bandwidth | Self-select, one tap, text-only. Every extra screen costs data and drop-off. Adapt difficulty as they go rather than gating up front. |
| B2C urban sophisticated | Short diagnostic is tolerable and improves targeting. A few discriminating questions place them accurately. |
| B2B hiring | The diagnostic is the product. The placement assessment doubles as the verification signal companies pay for, so make it rigorous. |
| B2B upskilling | Two steps: the owner sets org context (role, goal), then each employee is placed individually by diagnostic. |
| Premium verticals | Assume motivation. Let them self-select, but offer a “start from fundamentals vs. jump ahead” fork. |

| GATEWAY
 ├ Layer 1 — Persona pick   (sets segment, examples, framing,
 │                          vocabulary, AND a default proficiency)
 │     “Which sounds most like you?”  → 3–5 persona cards
 │
 └ Layer 2 — One calibration question  (confirms or overrides level)
       A single discriminating question the default-Foundational learner gets
       wrong and an Applied learner gets right. |
|---|

| “Which sounds like you?” | Example skin + framing | Default level | Calibration question |
|---|---|---|---|
| Market trader, want better cash control | Market / trading scenarios; informal vocabulary; goal: stop running out of cash mid-month | Foundational | “Do you already keep business money separate from personal money?” Yes + tracked weekly → bump to Working. |
| Smallholder farmer, smoothing seasonal income | Crop-cycle and harvest examples; savings-group framing; goal: survive the lean season | Foundational | “Do you plan spending around harvest income across the year?” Yes, with a method → Working. |
| Urban side-hustler / salaried earner | Salary, digital banking, investing examples; goal: grow money beyond the paycheck | Working | “Do you currently budget and set aside savings each month?” No → drop to Foundational; yes + invests → Applied. |
| Established small-business owner | Multi-product margins, reinvestment, credit; goal: scale without running dry | Applied | “Do you track margin by product and reinvest deliberately?” No → drop to Working. |

| Tier | Credential type | What the learner gets | Employer / buyer view | Issuance gate |
|---|---|---|---|---|
| B2C Free / Freemium | Completion Badge | Shareable badge (WhatsApp, LinkedIn). Upsell to Verified Certificate shown at completion screen. | Not employer-verified. Signals initiative only. | Issued on course completion. No assessment gate. |
| B2B Talent / Hiring | Verified Certificate | Public verification link. Includes assessment score and artifact sample. | Hiring company dashboard: candidate scores, artifact samples, pass/fail. Proctored option available. | Requires passing diagnostic assessment (score ≥ 70%). |
| B2B Upskilling | Team Completion Record | Individual completion badge. Manager sees cohort dashboard: who completed, at what depth level, artifact scores. | Manager dashboard with completion %, depth-level breakdown, weekly digest. | Issued on completion. Seat license billing triggers on first learner activation. |
| Premium Verticals | Professional Certificate | Full portfolio: all artifacts, assessment results, depth-level indicator. CPD submission pack on request. | Suitable for CPD submission or formal recognition. Depth-level indicator included. | Completion + artifact submission + depth-level indicator attached. |

| # | Stage | Deliverable | Gate to next stage |
|---|---|---|---|
| 1 | Track setup | Axis 1 tier selected. Axis 1 treatment (Option A/B/C) selected. Paywall placement decision recorded. | Customer tier chosen. |
| 2 | Skill intake | Skill statement, target learner role, and context mode (Nigerian / generic) submitted. | Skill statement complete. |
| 3 | Decomposition | AI produces 3–6 competency spine nodes with objectives, artifact intent, and catalog-overlap flags. SME approves or reuses existing catalog nodes via concept_id link. | One competency approved or reuse confirmed. |
| 4 | Pre-filled brief | Objective, learner role, artifact intent, and functional statement carried down from decomposition. SME adds “things to avoid.” Gateway personas (3 per vertical) defined with calibration questions and default depth levels. | Brief confirmed. |
| 5 | Course (v3.1) | Full course with three depth cards (Foundational / Working / Applied) per concept unit. Option B skin panel for context-adapted examples. Trust layer (claim sourcing). Per-language readiness strip. Exit credential card showing tier-specific issuance. | All numeric claims sourced. At least one language fully ready (script + audio). |
| 6 | Assembly review | SME plays the full skill end-to-end. Four coherence categories checked. Approve or send back with notes. | Assembly approved. |
| 7 | Publish | Track goes live. Tier-specific delivery activated (app listing / employer portal / cohort invites / premium gate). Exit credential issued. Language readiness determines which locales are immediately live. | — |
