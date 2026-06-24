// ── AI Service for Curriculum Studio ────────────────────────────────────
// Uses real Claude API when ANTHROPIC_API_KEY is set, falls back to mock.

import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const AI_MODE = ANTHROPIC_API_KEY ? 'claude' : 'mock';

// Lazy-init client only when key is present
function getClient(): Anthropic {
  return new Anthropic();
}

// ── Shared interfaces ───────────────────────────────────────────────────

export interface SpineNode {
  index: number;
  concept_id: string | null;
  title: string;
  objective: string;
  bloom_level: string;
  artifact_intent: string;
  catalog_overlap: 'linked' | 'fork' | 'new';
  linked_concept_catalog_id: string | null;
  depth_cards: {
    foundational: { blocks: ContentBlock[] };
    working: { blocks: ContentBlock[] };
    applied: { blocks: ContentBlock[] };
  } | null;
  trust_claim_count: number;
  sme_approved: boolean;
}

export interface ContentBlock {
  type: 'text_block' | 'quiz_block' | 'scenario_block' | 'artifact_block';
  id: string;
  content?: string;
  question?: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
  bloom_level?: string;
  difficulty_tier?: string;
}

export interface TrustClaim {
  spine_node_index: number;
  depth_tier: 'foundational' | 'working' | 'applied';
  claim_text: string;
  claim_type: 'numeric' | 'regulatory' | 'statistical' | 'citation';
  source_url: string | null;
  source_label: string | null;
}

export interface CourseGenerationResult {
  spine: SpineNode[];
  trust_claims: TrustClaim[];
  languages_requested: string[];
  total_blocks_generated: number;
}

// ── Claude-powered decomposeSkill ───────────────────────────────────────

async function claudeDecomposeSkill(
  skillStatement: string,
  vertical: string,
  contextMode: string,
): Promise<SpineNode[]> {
  const client = getClient();

  const nigerianClause =
    contextMode === 'nigerian'
      ? `The curriculum targets Nigerian financial services professionals. Reference CBN (Central Bank of Nigeria), NFIU (Nigerian Financial Intelligence Unit), and FATF regulations where relevant. Use Nigerian examples, Naira denominations, and local regulatory frameworks.`
      : '';

  const systemPrompt = `You are SABIficate's curriculum decomposition engine. Given a skill statement and vertical, you produce a learning spine: a sequence of 3–6 concept nodes that build on each other from foundational to advanced.

${nigerianClause}

Return ONLY a JSON array of spine node objects. Each object must have:
- index: integer starting at 0
- concept_id: a kebab-case identifier (e.g. "aml-risk-assessment-basics")
- title: short descriptive title
- objective: a learner-facing objective starting with "Learner can..."
- bloom_level: one of "remember", "understand", "apply", "analyze", "evaluate", "create"
- artifact_intent: what artifact the learner will produce (e.g. "Risk matrix template")
- catalog_overlap: always "new" for AI-generated nodes
- linked_concept_catalog_id: null
- depth_cards: null
- trust_claim_count: 0
- sme_approved: false

Return 3–6 nodes. The sequence should progress through Bloom's taxonomy from lower to higher levels. Return valid JSON only, no markdown fences.`;

  const userMessage = `Decompose this skill into a learning spine:

Skill statement: ${skillStatement}
Vertical: ${vertical}
Context: ${contextMode}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );
  if (!textBlock) {
    throw new Error('No text content in Claude response');
  }

  // Strip markdown fences if present
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed: unknown[] = JSON.parse(jsonText);

  // Validate and coerce to SpineNode[]
  const nodes: SpineNode[] = parsed.map((item: unknown, i: number) => {
    const obj = item as Record<string, unknown>;
    return {
      index: typeof obj.index === 'number' ? obj.index : i,
      concept_id: typeof obj.concept_id === 'string' ? obj.concept_id : null,
      title: typeof obj.title === 'string' ? obj.title : `Node ${i}`,
      objective: typeof obj.objective === 'string' ? obj.objective : '',
      bloom_level: typeof obj.bloom_level === 'string' ? obj.bloom_level : 'understand',
      artifact_intent: typeof obj.artifact_intent === 'string' ? obj.artifact_intent : '',
      catalog_overlap: 'new' as const,
      linked_concept_catalog_id: null,
      depth_cards: null,
      trust_claim_count: 0,
      sme_approved: false,
    };
  });

  return nodes;
}

// ── Claude-powered generateCourse ───────────────────────────────────────

async function claudeGenerateDepthCards(
  client: Anthropic,
  node: SpineNode,
  brief: {
    trackName: string;
    vertical: string;
    contextMode: string;
    thingsToAvoid: string | null;
  },
): Promise<{
  depthCards: NonNullable<SpineNode['depth_cards']>;
  trustClaims: TrustClaim[];
}> {
  const nigerianClause =
    brief.contextMode === 'nigerian'
      ? `This is for Nigerian financial services professionals. Reference CBN, NFIU, and FATF regulations. Use Nigerian examples (Naira amounts, local institutions, Nigerian case studies).`
      : '';

  const avoidClause = brief.thingsToAvoid
    ? `\nIMPORTANT: Avoid the following in generated content: ${brief.thingsToAvoid}`
    : '';

  const systemPrompt = `You are SABIficate's content generation engine. You generate depth cards for a curriculum spine node. Each spine node gets 3 depth cards: foundational, working, and applied.

${nigerianClause}${avoidClause}

For each depth card, generate 3 ContentBlock objects. Each block must have:
- type: one of "text_block", "quiz_block", "scenario_block", "artifact_block"
- id: a unique string identifier (use format "s{nodeIndex}-{tier_letter}-{type_letter}{number}")
- For text_block: include "content" (markdown string), "difficulty_tier", "bloom_level"
- For quiz_block: include "question", "options" (array of 4 strings), "correct_answer" (0-based index), "explanation", "bloom_level", "difficulty_tier"
- For scenario_block: include "content" (scenario description), "difficulty_tier", "bloom_level"

Also identify trust claims: factual assertions (numeric, regulatory, statistical, citation) that need verification. Return them separately.

Depth tiers:
- foundational: bloom levels "remember" and "understand" — basic concepts and definitions
- working: bloom level "apply" — practical implementation and procedures
- applied: bloom levels "evaluate" and "create" — critical analysis and strategic thinking

Return ONLY valid JSON (no markdown fences) with this structure:
{
  "foundational": { "blocks": [ContentBlock, ContentBlock, ContentBlock] },
  "working": { "blocks": [ContentBlock, ContentBlock, ContentBlock] },
  "applied": { "blocks": [ContentBlock, ContentBlock, ContentBlock] },
  "trust_claims": [{ "depth_tier": "...", "claim_text": "...", "claim_type": "numeric|regulatory|statistical|citation" }]
}`;

  const userMessage = `Generate depth cards for this spine node:

Track: ${brief.trackName}
Vertical: ${brief.vertical}
Node index: ${node.index}
Node title: ${node.title}
Node objective: ${node.objective}
Bloom level: ${node.bloom_level}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );
  if (!textBlock) {
    throw new Error('No text content in Claude response for depth cards');
  }

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  const depthCards = {
    foundational: { blocks: parseBlocks(parsed.foundational) },
    working: { blocks: parseBlocks(parsed.working) },
    applied: { blocks: parseBlocks(parsed.applied) },
  };

  const rawClaims = Array.isArray(parsed.trust_claims) ? parsed.trust_claims : [];
  const trustClaims: TrustClaim[] = rawClaims.map((c: unknown) => {
    const claim = c as Record<string, unknown>;
    return {
      spine_node_index: node.index,
      depth_tier: (typeof claim.depth_tier === 'string' ? claim.depth_tier : 'working') as
        | 'foundational'
        | 'working'
        | 'applied',
      claim_text: typeof claim.claim_text === 'string' ? claim.claim_text : '',
      claim_type: (typeof claim.claim_type === 'string' ? claim.claim_type : 'citation') as
        | 'numeric'
        | 'regulatory'
        | 'statistical'
        | 'citation',
      source_url: null,
      source_label: null,
    };
  });

  return { depthCards, trustClaims };
}

function parseBlocks(tier: unknown): ContentBlock[] {
  if (!tier || typeof tier !== 'object') return [];
  const obj = tier as Record<string, unknown>;
  const blocks = Array.isArray(obj.blocks) ? obj.blocks : [];
  return blocks.map((b: unknown) => {
    const block = b as Record<string, unknown>;
    return {
      type: (typeof block.type === 'string' ? block.type : 'text_block') as ContentBlock['type'],
      id: typeof block.id === 'string' ? block.id : `gen-${Math.random().toString(36).slice(2, 8)}`,
      content: typeof block.content === 'string' ? block.content : undefined,
      question: typeof block.question === 'string' ? block.question : undefined,
      options: Array.isArray(block.options) ? (block.options as string[]) : undefined,
      correct_answer: typeof block.correct_answer === 'number' ? block.correct_answer : undefined,
      explanation: typeof block.explanation === 'string' ? block.explanation : undefined,
      bloom_level: typeof block.bloom_level === 'string' ? block.bloom_level : undefined,
      difficulty_tier: typeof block.difficulty_tier === 'string' ? block.difficulty_tier : undefined,
    };
  });
}

async function claudeGenerateCourse(brief: {
  trackName: string;
  vertical: string;
  contextMode: string;
  spine: SpineNode[];
  thingsToAvoid: string | null;
  gatewayPersonas: unknown[];
}): Promise<CourseGenerationResult> {
  const client = getClient();
  const allTrustClaims: TrustClaim[] = [];
  let totalBlocks = 0;

  const enrichedSpine: SpineNode[] = [];

  for (const node of brief.spine) {
    try {
      const { depthCards, trustClaims } = await claudeGenerateDepthCards(client, node, {
        trackName: brief.trackName,
        vertical: brief.vertical,
        contextMode: brief.contextMode,
        thingsToAvoid: brief.thingsToAvoid,
      });

      allTrustClaims.push(...trustClaims);
      const nodeBlockCount =
        depthCards.foundational.blocks.length +
        depthCards.working.blocks.length +
        depthCards.applied.blocks.length;
      totalBlocks += nodeBlockCount;

      enrichedSpine.push({
        ...node,
        depth_cards: depthCards,
        trust_claim_count: trustClaims.length,
      });
    } catch (err) {
      // Fall back to mock for this node on error
      console.error(`Claude depth card generation failed for node ${node.index}, using mock:`, err);
      const mockResult = await mockGenerateCourse({
        trackName: brief.trackName,
        vertical: brief.vertical,
        contextMode: brief.contextMode,
        spine: [node],
        thingsToAvoid: brief.thingsToAvoid,
        gatewayPersonas: brief.gatewayPersonas,
      });
      enrichedSpine.push(mockResult.spine[0]);
      allTrustClaims.push(...mockResult.trust_claims);
      totalBlocks += mockResult.total_blocks_generated;
    }
  }

  return {
    spine: enrichedSpine,
    trust_claims: allTrustClaims,
    languages_requested: ['en', 'pcm'],
    total_blocks_generated: totalBlocks,
  };
}

// ── Mock implementations (always available as fallback) ─────────────────

async function mockDecomposeSkill(
  skillStatement: string,
  vertical: string,
  contextMode: string,
): Promise<SpineNode[]> {
  const nigerianContext = contextMode === 'nigerian';
  const prefix = nigerianContext ? 'Nigerian ' : '';

  const nodes: SpineNode[] = [
    {
      index: 0,
      concept_id: `${vertical.toLowerCase().replace(/\s+/g, '-')}-fundamentals-001`,
      title: `${prefix}${vertical} Fundamentals`,
      objective: `Learner can explain the core principles of ${skillStatement.toLowerCase().slice(0, 60)} in the ${prefix}context.`,
      bloom_level: 'understand',
      artifact_intent: 'Concept map of key terms and relationships',
      catalog_overlap: 'new',
      linked_concept_catalog_id: null,
      depth_cards: null,
      trust_claim_count: 0,
      sme_approved: false,
    },
    {
      index: 1,
      concept_id: `${vertical.toLowerCase().replace(/\s+/g, '-')}-regulatory-002`,
      title: `Regulatory Framework and Compliance`,
      objective: `Learner can identify the key regulatory bodies and legislation governing ${skillStatement.toLowerCase().slice(0, 40)} in Nigeria.`,
      bloom_level: 'apply',
      artifact_intent: 'Regulatory compliance checklist',
      catalog_overlap: 'new',
      linked_concept_catalog_id: null,
      depth_cards: null,
      trust_claim_count: 0,
      sme_approved: false,
    },
    {
      index: 2,
      concept_id: `${vertical.toLowerCase().replace(/\s+/g, '-')}-practical-003`,
      title: `Practical Application and Case Studies`,
      objective: `Learner can apply ${skillStatement.toLowerCase().slice(0, 40)} principles to real-world ${prefix}scenarios.`,
      bloom_level: 'apply',
      artifact_intent: 'Case study analysis worksheet',
      catalog_overlap: 'new',
      linked_concept_catalog_id: null,
      depth_cards: null,
      trust_claim_count: 0,
      sme_approved: false,
    },
    {
      index: 3,
      concept_id: `${vertical.toLowerCase().replace(/\s+/g, '-')}-advanced-004`,
      title: `Advanced Strategies and Risk Management`,
      objective: `Learner can evaluate advanced strategies and manage risks related to ${skillStatement.toLowerCase().slice(0, 40)}.`,
      bloom_level: 'evaluate',
      artifact_intent: 'Risk assessment matrix template',
      catalog_overlap: 'new',
      linked_concept_catalog_id: null,
      depth_cards: null,
      trust_claim_count: 0,
      sme_approved: false,
    },
  ];

  return nodes;
}

async function mockGenerateCourse(brief: {
  trackName: string;
  vertical: string;
  contextMode: string;
  spine: SpineNode[];
  thingsToAvoid: string | null;
  gatewayPersonas: unknown[];
}): Promise<CourseGenerationResult> {
  const trustClaims: TrustClaim[] = [];
  let totalBlocks = 0;

  const enrichedSpine = brief.spine.map((node, idx) => {
    const foundationalBlocks: ContentBlock[] = [
      {
        type: 'text_block',
        id: `s${idx}-f-t1`,
        content: `## ${node.title} - Getting Started\n\nThis section introduces the fundamental concepts of ${node.title.toLowerCase()}. ${brief.contextMode === 'nigerian' ? 'In the Nigerian context, this is particularly relevant for financial services professionals operating under CBN guidelines.' : 'This foundational knowledge is essential for professionals in the field.'}`,
        difficulty_tier: 'foundational',
        bloom_level: 'remember',
      },
      {
        type: 'text_block',
        id: `s${idx}-f-t2`,
        content: `## Key Definitions\n\nBefore diving deeper, let us establish the key terms you will encounter throughout this module. Understanding these terms will help you follow the regulatory discussions ahead.`,
        difficulty_tier: 'foundational',
        bloom_level: 'understand',
      },
      {
        type: 'quiz_block',
        id: `s${idx}-f-q1`,
        question: `Which of the following best describes the core purpose of ${node.title.toLowerCase()}?`,
        options: [
          `To maximise profit for the organisation`,
          `To ensure compliance with regulatory requirements and protect stakeholders`,
          `To reduce operational costs`,
          `To increase market share`,
        ],
        correct_answer: 1,
        explanation: `The primary purpose of ${node.title.toLowerCase()} is to ensure compliance with regulatory requirements while protecting all stakeholders involved.`,
        bloom_level: 'remember',
        difficulty_tier: 'foundational',
      },
    ];

    const workingBlocks: ContentBlock[] = [
      {
        type: 'text_block',
        id: `s${idx}-w-t1`,
        content: `## ${node.title} - Working Knowledge\n\nBuilding on the fundamentals, this section explores the practical implementation of ${node.title.toLowerCase()}. ${brief.contextMode === 'nigerian' ? 'Nigerian financial institutions must align their practices with both CBN regulations and international standards such as FATF recommendations.' : 'Organizations must align their practices with relevant regulatory frameworks.'}`,
        difficulty_tier: 'working',
        bloom_level: 'apply',
      },
      {
        type: 'text_block',
        id: `s${idx}-w-t2`,
        content: `## Implementation Framework\n\nA structured approach to implementing ${node.title.toLowerCase()} involves three key phases: assessment, design, and monitoring. Each phase requires specific documentation and stakeholder engagement.`,
        difficulty_tier: 'working',
        bloom_level: 'apply',
      },
      {
        type: 'quiz_block',
        id: `s${idx}-w-q1`,
        question: `A compliance officer discovers a gap in the institution's ${node.title.toLowerCase()} framework. What is the most appropriate first step?`,
        options: [
          `Ignore it until the next annual review`,
          `Document the gap and assess its risk impact before recommending remediation`,
          `Immediately report to external regulators`,
          `Terminate the related business activity`,
        ],
        correct_answer: 1,
        explanation: `The best practice is to document the gap, assess its risk impact, and develop a remediation plan. Premature external reporting or drastic action may be disproportionate.`,
        bloom_level: 'apply',
        difficulty_tier: 'working',
      },
    ];

    const appliedBlocks: ContentBlock[] = [
      {
        type: 'text_block',
        id: `s${idx}-a-t1`,
        content: `## ${node.title} - Advanced Application\n\nAt this level, you will critically evaluate complex scenarios involving ${node.title.toLowerCase()}. ${brief.contextMode === 'nigerian' ? 'This includes navigating the intersection of CBN directives, NFIU requirements, and international correspondent banking expectations.' : 'This includes navigating complex multi-jurisdictional regulatory landscapes.'}`,
        difficulty_tier: 'applied',
        bloom_level: 'evaluate',
      },
      {
        type: 'text_block',
        id: `s${idx}-a-t2`,
        content: `## Strategic Considerations\n\nSenior professionals must balance regulatory compliance with business objectives. This requires understanding not just what the rules are, but why they exist and how they interact with broader organisational strategy.`,
        difficulty_tier: 'applied',
        bloom_level: 'evaluate',
      },
      {
        type: 'quiz_block',
        id: `s${idx}-a-q1`,
        question: `Your institution's board has requested a review of the ${node.title.toLowerCase()} framework following a regulatory examination finding. Which approach best demonstrates strategic compliance leadership?`,
        options: [
          `Address only the specific finding cited by the regulator`,
          `Conduct a comprehensive gap analysis, benchmark against peer institutions, and present a risk-prioritised remediation roadmap to the board`,
          `Outsource the entire compliance function to a consulting firm`,
          `Increase staffing in the compliance department without assessing root causes`,
        ],
        correct_answer: 1,
        explanation: `Strategic compliance leadership involves a comprehensive, risk-based response that addresses root causes, benchmarks against peers, and provides the board with a clear, prioritised remediation plan.`,
        bloom_level: 'evaluate',
        difficulty_tier: 'applied',
      },
    ];

    totalBlocks += foundationalBlocks.length + workingBlocks.length + appliedBlocks.length;

    // Generate mock trust claims for numeric/regulatory content
    if (brief.contextMode === 'nigerian') {
      trustClaims.push({
        spine_node_index: idx,
        depth_tier: 'working',
        claim_text: `CBN regulatory threshold of NGN 5 million for Currency Transaction Reports (CTRs) as referenced in ${node.title}`,
        claim_type: 'regulatory',
        source_url: null,
        source_label: null,
      });
      if (idx === 1) {
        trustClaims.push({
          spine_node_index: idx,
          depth_tier: 'applied',
          claim_text: `Section 6(2) of the ML(P&P) Act 2022 mandates STR filing upon reasonable suspicion of ML/TF`,
          claim_type: 'regulatory',
          source_url: null,
          source_label: null,
        });
      }
    }

    return {
      ...node,
      depth_cards: {
        foundational: { blocks: foundationalBlocks },
        working: { blocks: workingBlocks },
        applied: { blocks: appliedBlocks },
      },
      trust_claim_count: trustClaims.filter((c) => c.spine_node_index === idx).length,
    };
  });

  return {
    spine: enrichedSpine,
    trust_claims: trustClaims,
    languages_requested: ['en', 'pcm'],
    total_blocks_generated: totalBlocks,
  };
}

// ── Public API (dispatches to Claude or mock) ───────────────────────────

export async function decomposeSkill(
  skillStatement: string,
  vertical: string,
  contextMode: string,
): Promise<SpineNode[]> {
  if (AI_MODE === 'claude') {
    try {
      return await claudeDecomposeSkill(skillStatement, vertical, contextMode);
    } catch (err) {
      console.error('Claude decomposeSkill failed, falling back to mock:', err);
      return mockDecomposeSkill(skillStatement, vertical, contextMode);
    }
  }
  return mockDecomposeSkill(skillStatement, vertical, contextMode);
}

export async function generateCourse(brief: {
  trackName: string;
  vertical: string;
  contextMode: string;
  spine: SpineNode[];
  thingsToAvoid: string | null;
  gatewayPersonas: unknown[];
}): Promise<CourseGenerationResult> {
  if (AI_MODE === 'claude') {
    try {
      return await claudeGenerateCourse(brief);
    } catch (err) {
      console.error('Claude generateCourse failed, falling back to mock:', err);
      return mockGenerateCourse(brief);
    }
  }
  return mockGenerateCourse(brief);
}

// ── Source claims — find sources for trust claims (mock only) ────────────

export async function sourceClaims(
  claims: Array<{ id: string; claim_text: string; claim_type: string }>,
): Promise<Array<{ id: string; source_url: string; source_label: string }>> {
  // Mock: return plausible sources for each claim
  return claims.map((claim) => {
    if (claim.claim_type === 'regulatory') {
      return {
        id: claim.id,
        source_url: 'https://www.cbn.gov.ng/out/2022/ccd/aml-cft-regulations-2022.pdf',
        source_label: 'CBN AML/CFT Regulations 2022',
      };
    }
    if (claim.claim_type === 'statistical') {
      return {
        id: claim.id,
        source_url: 'https://www.nfiu.gov.ng/reports/annual-report-2023',
        source_label: 'NFIU Annual Report 2023',
      };
    }
    return {
      id: claim.id,
      source_url: 'https://www.fatf-gafi.org/recommendations.html',
      source_label: 'FATF Recommendations',
    };
  });
}
