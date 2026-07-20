// ── T-004: Four-Axis Content Engine Tests ──────────────────────────────
// Traces to: FR-6 / AC-6.3, AC-6.4
// Validates that ContentBlock supports the four-axis framework and
// that mock generation produces axis-tagged blocks covering all four axes.

import { describe, it, expect } from 'vitest';

// We import the types and mock generator from the AI service.
// The service file exports ContentBlock and generateCourse (which uses mock when no API key).
import type { ContentBlock, CourseGenerationResult, SpineNode } from '../../server/services/curriculumAI';

// Four canonical axis values
const FOUR_AXES = [
  'stages_of_the_moment',
  'scenarios',
  'failure_modes',
  'role_lens',
] as const;

type Axis = typeof FOUR_AXES[number];

describe('Four-Axis Content Engine (T-004)', () => {
  // ── Test 1: ContentBlock interface allows an optional "axis" field ────
  it('ContentBlock allows an optional axis field', () => {
    // A block WITHOUT axis should be valid (backward compat)
    const blockWithoutAxis: ContentBlock = {
      type: 'text_block',
      id: 'test-no-axis',
      content: 'Some content',
    };
    expect(blockWithoutAxis.axis).toBeUndefined();

    // A block WITH axis should be valid and hold the value
    const blockWithAxis: ContentBlock = {
      type: 'scenario_block',
      id: 'test-with-axis',
      content: 'A scenario',
      axis: 'failure_modes',
    };
    expect(blockWithAxis.axis).toBe('failure_modes');
  });

  // ── Test 2: mockGenerateCourse returns blocks with axis field set ─────
  it('mock generateCourse returns blocks with axis field set', async () => {
    // We dynamically import so the module resolves without ANTHROPIC_API_KEY
    const { generateCourse } = await import('../../server/services/curriculumAI');

    const spine: SpineNode[] = [
      {
        index: 0,
        concept_id: 'test-four-axis-001',
        title: 'Test Node',
        objective: 'Learner can test the four-axis engine.',
        bloom_level: 'understand',
        artifact_intent: 'Test artifact',
        catalog_overlap: 'new',
        linked_concept_catalog_id: null,
        depth_cards: null,
        trust_claim_count: 0,
        sme_approved: false,
      },
    ];

    const result: CourseGenerationResult = await generateCourse({
      trackName: 'Test Track',
      vertical: 'Testing',
      contextMode: 'nigerian',
      spine,
      thingsToAvoid: null,
      gatewayPersonas: [],
    });

    // Every spine node should have depth cards
    expect(result.spine.length).toBeGreaterThan(0);

    const node = result.spine[0];
    expect(node.depth_cards).not.toBeNull();

    // Collect all blocks from all depth tiers
    const allBlocks: ContentBlock[] = [
      ...node.depth_cards!.foundational.blocks,
      ...node.depth_cards!.working.blocks,
      ...node.depth_cards!.applied.blocks,
    ];

    // At least one block must have the axis field set
    const blocksWithAxis = allBlocks.filter((b) => b.axis !== undefined);
    expect(blocksWithAxis.length).toBeGreaterThan(0);

    // Every block that has axis should have a valid axis value
    for (const block of blocksWithAxis) {
      expect(FOUR_AXES).toContain(block.axis);
    }
  });

  // ── Test 3: mock returns blocks covering ALL 4 axes ──────────────────
  it('mock generateCourse covers all four axes', async () => {
    const { generateCourse } = await import('../../server/services/curriculumAI');

    // Use multiple spine nodes to give the mock enough blocks to cover all axes
    const spine: SpineNode[] = [
      {
        index: 0,
        concept_id: 'axis-coverage-001',
        title: 'Fundamentals Node',
        objective: 'Learner can explain fundamentals.',
        bloom_level: 'understand',
        artifact_intent: 'Concept map',
        catalog_overlap: 'new',
        linked_concept_catalog_id: null,
        depth_cards: null,
        trust_claim_count: 0,
        sme_approved: false,
      },
      {
        index: 1,
        concept_id: 'axis-coverage-002',
        title: 'Regulatory Node',
        objective: 'Learner can identify regulations.',
        bloom_level: 'apply',
        artifact_intent: 'Checklist',
        catalog_overlap: 'new',
        linked_concept_catalog_id: null,
        depth_cards: null,
        trust_claim_count: 0,
        sme_approved: false,
      },
    ];

    const result: CourseGenerationResult = await generateCourse({
      trackName: 'Coverage Track',
      vertical: 'Compliance',
      contextMode: 'nigerian',
      spine,
      thingsToAvoid: null,
      gatewayPersonas: [],
    });

    // Collect ALL blocks across all nodes and depth tiers
    const allBlocks: ContentBlock[] = [];
    for (const node of result.spine) {
      if (node.depth_cards) {
        allBlocks.push(
          ...node.depth_cards.foundational.blocks,
          ...node.depth_cards.working.blocks,
          ...node.depth_cards.applied.blocks,
        );
      }
    }

    // Extract unique axis values from all blocks
    const axesPresent = new Set<Axis>();
    for (const block of allBlocks) {
      if (block.axis && FOUR_AXES.includes(block.axis as Axis)) {
        axesPresent.add(block.axis as Axis);
      }
    }

    // All four axes must be represented
    expect(axesPresent.size).toBe(4);
    for (const axis of FOUR_AXES) {
      expect(axesPresent.has(axis)).toBe(true);
    }
  });
});
