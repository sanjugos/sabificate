// ── Mock AI Service for Curriculum Studio ─────────────────────────────────
// These functions simulate AI-powered decomposition and content generation.
// Replace with real LLM calls when ready.

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

// ── Decompose a skill statement into spine nodes ──────────────────────────

export async function decomposeSkill(
  skillStatement: string,
  vertical: string,
  contextMode: string,
): Promise<SpineNode[]> {
  // Mock: generate 4 spine nodes relevant to Nigerian financial services
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

// ── Generate course content with 3 depth cards per spine node ─────────────

export async function generateCourse(brief: {
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

// ── Source claims — find sources for trust claims ─────────────────────────

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
