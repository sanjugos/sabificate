// ── T-003: Assembly Review Gate (Automated Checks) ─────────────────────
// Traces to: FR-8 / AC-8.1 through AC-8.6
// Validates deterministic quality checks that run when a track review starts.

import { describe, it, expect } from 'vitest';
import type { SpineNode, ContentBlock } from '../../server/services/curriculumAI';
import {
  checkCoverageGap,
  checkArtifactRedundancy,
  runAllAssemblyChecks,
  type AssemblyFlag,
} from '../../server/services/assemblyChecks';

// ── Test helpers ───────────────────────────────────────────────────────

function makeBlock(id: string, content: string, type: ContentBlock['type'] = 'text_block'): ContentBlock {
  return { type, id, content };
}

function makeCompleteNode(index: number): SpineNode {
  // Each node gets meaningfully different content so redundancy checks do not flag them
  const foundationalTexts = [
    'Risk assessment begins with identifying the key threats and vulnerabilities in the organizational environment.',
    'Regulatory compliance requires understanding the legal framework governing financial institutions in Nigeria.',
    'Anti-money laundering fundamentals cover customer due diligence, transaction monitoring, and suspicious activity reporting.',
  ];
  const workingTexts = [
    'Implementing a risk matrix involves scoring each threat by likelihood and impact to prioritize remediation actions.',
    'Filing currency transaction reports with the NFIU demands accurate data collection within prescribed timelines.',
    'Building an effective compliance programme starts with a gap analysis against the latest CBN directives.',
  ];
  const appliedTexts = [
    'Strategic risk governance requires board-level oversight and integration with enterprise-wide risk appetite frameworks.',
    'Evaluating cross-border correspondent banking relationships demands multi-jurisdictional regulatory awareness.',
    'Designing an institution-wide compliance culture involves training, incentives, and accountability structures.',
  ];

  return {
    index,
    concept_id: `concept-${index}`,
    title: `Node ${index}`,
    objective: `Learner can do thing ${index}.`,
    bloom_level: 'understand',
    artifact_intent: 'Test artifact',
    catalog_overlap: 'new',
    linked_concept_catalog_id: null,
    depth_cards: {
      foundational: { blocks: [makeBlock(`s${index}-f-t1`, foundationalTexts[index % foundationalTexts.length])] },
      working: { blocks: [makeBlock(`s${index}-w-t1`, workingTexts[index % workingTexts.length])] },
      applied: { blocks: [makeBlock(`s${index}-a-t1`, appliedTexts[index % appliedTexts.length])] },
    },
    trust_claim_count: 0,
    sme_approved: false,
  };
}

function makeNodeMissingApplied(index: number): SpineNode {
  return {
    index,
    concept_id: `concept-${index}`,
    title: `Node ${index}`,
    objective: `Learner can do thing ${index}.`,
    bloom_level: 'understand',
    artifact_intent: 'Test artifact',
    catalog_overlap: 'new',
    linked_concept_catalog_id: null,
    depth_cards: {
      foundational: { blocks: [makeBlock(`s${index}-f-t1`, 'Foundational content present.')] },
      working: { blocks: [makeBlock(`s${index}-w-t1`, 'Working content present.')] },
      applied: { blocks: [] },  // <-- missing applied blocks
    },
    trust_claim_count: 0,
    sme_approved: false,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('Assembly Review Gate Checks (T-003)', () => {

  // ── AC-8.1: Coverage Gap Detection ──────────────────────────────────

  describe('checkCoverageGap', () => {
    it('detects when a spine node is missing a depth tier (no applied blocks)', () => {
      const spine: SpineNode[] = [
        makeCompleteNode(0),
        makeNodeMissingApplied(1),
      ];

      const flags = checkCoverageGap(spine);

      expect(flags.length).toBeGreaterThan(0);

      const gapFlag = flags.find(
        (f) => f.category === 'coverage_gap' && f.node_indices.includes(1),
      );
      expect(gapFlag).toBeDefined();
      expect(gapFlag!.description).toContain('applied');
    });

    it('detects when depth_cards is null (all tiers missing)', () => {
      const spine: SpineNode[] = [
        {
          ...makeCompleteNode(0),
          depth_cards: null,
        },
      ];

      const flags = checkCoverageGap(spine);

      expect(flags.length).toBeGreaterThan(0);
      const gapFlag = flags.find((f) => f.category === 'coverage_gap' && f.node_indices.includes(0));
      expect(gapFlag).toBeDefined();
    });

    it('returns no flags for a fully populated spine', () => {
      const spine: SpineNode[] = [
        makeCompleteNode(0),
        makeCompleteNode(1),
      ];

      const flags = checkCoverageGap(spine);
      expect(flags.length).toBe(0);
    });
  });

  // ── AC-8.2: Artifact Redundancy Detection ───────────────────────────

  describe('checkArtifactRedundancy', () => {
    it('detects two content blocks with >80% word overlap', () => {
      const duplicateContent = 'The compliance officer must review all transaction records and ensure that every filing meets the regulatory requirements established by the central bank authority for anti-money laundering purposes';
      const slightVariation = 'The compliance officer must review all transaction records and ensure that every filing meets the regulatory requirements established by the central bank authority for anti-money laundering objectives';
      // Only 1 word differs out of ~30 — well over 80% overlap

      const spine: SpineNode[] = [
        {
          ...makeCompleteNode(0),
          depth_cards: {
            foundational: { blocks: [makeBlock('s0-f-t1', duplicateContent)] },
            working: { blocks: [makeBlock('s0-w-t1', slightVariation)] },
            applied: { blocks: [makeBlock('s0-a-t1', 'Completely different content about strategic leadership.')] },
          },
        },
      ];

      const flags = checkArtifactRedundancy(spine);

      expect(flags.length).toBeGreaterThan(0);

      const redundancyFlag = flags.find((f) => f.category === 'artifact_redundancy');
      expect(redundancyFlag).toBeDefined();
      expect(redundancyFlag!.block_ids).toContain('s0-f-t1');
      expect(redundancyFlag!.block_ids).toContain('s0-w-t1');
    });

    it('does not flag blocks with low word overlap', () => {
      const spine: SpineNode[] = [
        {
          ...makeCompleteNode(0),
          depth_cards: {
            foundational: { blocks: [makeBlock('s0-f-t1', 'Introduction to risk assessment fundamentals and core principles.')] },
            working: { blocks: [makeBlock('s0-w-t1', 'Advanced regulatory compliance procedures for Nigerian banking institutions.')] },
            applied: { blocks: [makeBlock('s0-a-t1', 'Strategic leadership evaluation of multi-jurisdictional frameworks.')] },
          },
        },
      ];

      const flags = checkArtifactRedundancy(spine);
      expect(flags.length).toBe(0);
    });
  });

  // ── AC-8.3: Clean spine produces zero flags ─────────────────────────

  describe('clean spine', () => {
    it('produces zero flags when all nodes are complete and content is unique', () => {
      const spine: SpineNode[] = [
        makeCompleteNode(0),
        makeCompleteNode(1),
        makeCompleteNode(2),
      ];

      const flags = runAllAssemblyChecks(spine);
      expect(flags).toEqual([]);
    });
  });

  // ── AC-8.4: runAllAssemblyChecks combines flags from all checks ─────

  describe('runAllAssemblyChecks', () => {
    it('returns combined flags from coverage gap and redundancy checks', () => {
      const duplicateContent = 'The compliance officer must review all transaction records and ensure that every filing meets the regulatory requirements established by the central bank authority for anti-money laundering purposes in this jurisdiction';

      const spine: SpineNode[] = [
        // Node 0: has redundant content across tiers
        {
          ...makeCompleteNode(0),
          depth_cards: {
            foundational: { blocks: [makeBlock('s0-f-t1', duplicateContent)] },
            working: { blocks: [makeBlock('s0-w-t1', duplicateContent)] },
            applied: { blocks: [makeBlock('s0-a-t1', 'Unique applied content here.')] },
          },
        },
        // Node 1: missing applied tier
        makeNodeMissingApplied(1),
      ];

      const flags = runAllAssemblyChecks(spine);

      // Should have at least one coverage_gap flag and one artifact_redundancy flag
      const categories = flags.map((f) => f.category);
      expect(categories).toContain('coverage_gap');
      expect(categories).toContain('artifact_redundancy');
    });

    it('returns AssemblyFlag objects with correct shape', () => {
      const spine: SpineNode[] = [makeNodeMissingApplied(0)];
      const flags = runAllAssemblyChecks(spine);

      expect(flags.length).toBeGreaterThan(0);
      for (const flag of flags) {
        expect(flag).toHaveProperty('category');
        expect(flag).toHaveProperty('description');
        expect(flag).toHaveProperty('node_indices');
        expect(flag).toHaveProperty('block_ids');
        expect(typeof flag.category).toBe('string');
        expect(typeof flag.description).toBe('string');
        expect(Array.isArray(flag.node_indices)).toBe(true);
        expect(Array.isArray(flag.block_ids)).toBe(true);
      }
    });
  });
});
