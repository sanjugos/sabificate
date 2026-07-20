import { describe, it, expect } from 'vitest';
import {
  publishTransform,
  type PublishTransformInput,
  type PublishTransformOutput,
} from '../../server/services/publishTransform';
import type { SpineNode } from '../../server/services/curriculumAI';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSpineNode(overrides: Partial<SpineNode> = {}): SpineNode {
  return {
    index: 0,
    concept_id: 'aml-basics-001',
    title: 'AML Fundamentals',
    objective: 'Learner can explain core AML principles',
    bloom_level: 'understand',
    artifact_intent: 'Concept map',
    catalog_overlap: 'new',
    linked_concept_catalog_id: null,
    depth_cards: {
      foundational: {
        blocks: [
          {
            type: 'text_block',
            id: 's0-f-t1',
            content: 'AML intro text',
            difficulty_tier: 'foundational',
            bloom_level: 'remember',
          },
        ],
      },
      working: {
        blocks: [
          {
            type: 'quiz_block',
            id: 's0-w-q1',
            question: 'What is AML?',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 1,
            explanation: 'AML stands for Anti-Money Laundering',
            bloom_level: 'apply',
            difficulty_tier: 'working',
          },
        ],
      },
      applied: {
        blocks: [
          {
            type: 'scenario_block',
            id: 's0-a-s1',
            content: 'A suspicious transaction scenario',
            difficulty_tier: 'applied',
            bloom_level: 'evaluate',
          },
        ],
      },
    },
    trust_claim_count: 1,
    sme_approved: true,
    ...overrides,
  };
}

function makeTrackInput(overrides: Partial<PublishTransformInput> = {}): PublishTransformInput {
  return {
    trackId: 'track-abc-123',
    name: 'Nigerian AML Compliance',
    vertical: 'banking-compliance',
    customerTier: 'freemium',
    tierTreatment: 'A',
    credentialType: 'completion_badge',
    paywallLessonIndex: 2,
    spine: [makeSpineNode()],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('publishTransform', () => {
  describe('course record creation', () => {
    it('creates a course with correct title from track name', () => {
      const input = makeTrackInput({ name: 'Nigerian AML Compliance' });
      const result = publishTransform(input);

      expect(result.course.title).toBe('Nigerian AML Compliance');
    });

    it('generates a kebab-case slug from the title', () => {
      const input = makeTrackInput({ name: 'Nigerian AML Compliance' });
      const result = publishTransform(input);

      expect(result.course.slug).toBe('nigerian-aml-compliance');
    });

    it('maps vertical to course category', () => {
      const input = makeTrackInput({ vertical: 'banking-compliance' });
      const result = publishTransform(input);

      expect(result.course.category).toBe('banking-compliance');
    });

    it('maps tierTreatment to customer_tier_treatment', () => {
      const input = makeTrackInput({ tierTreatment: 'B' });
      const result = publishTransform(input);

      expect(result.course.customer_tier_treatment).toBe('B');
    });

    it('maps credentialType to credential_type', () => {
      const input = makeTrackInput({ credentialType: 'verified_certificate' });
      const result = publishTransform(input);

      expect(result.course.credential_type).toBe('verified_certificate');
    });

    it('sets is_published to true', () => {
      const result = publishTransform(makeTrackInput());

      expect(result.course.is_published).toBe(true);
    });

    it('sets difficulty_level to working by default', () => {
      const result = publishTransform(makeTrackInput());

      expect(result.course.difficulty_level).toBe('working');
    });

    it('generates a description from the track name', () => {
      const input = makeTrackInput({ name: 'Nigerian AML Compliance' });
      const result = publishTransform(input);

      expect(result.course.description).toContain('Nigerian AML Compliance');
    });

    it('strips leading/trailing hyphens and truncates slug to 100 chars', () => {
      const longName = 'A'.repeat(150);
      const input = makeTrackInput({ name: longName });
      const result = publishTransform(input);

      expect(result.course.slug.length).toBeLessThanOrEqual(100);
      expect(result.course.slug).not.toMatch(/^-|-$/);
    });
  });

  describe('module creation', () => {
    it('creates one module per spine node', () => {
      const spine = [
        makeSpineNode({ index: 0, title: 'Module One' }),
        makeSpineNode({ index: 1, title: 'Module Two' }),
        makeSpineNode({ index: 2, title: 'Module Three' }),
      ];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.modules).toHaveLength(3);
    });

    it('sets module title from spine node title', () => {
      const spine = [makeSpineNode({ index: 0, title: 'Risk Assessment Basics' })];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.modules[0].title).toBe('Risk Assessment Basics');
    });

    it('sets module sort_order from spine node index', () => {
      const spine = [
        makeSpineNode({ index: 0, title: 'First' }),
        makeSpineNode({ index: 1, title: 'Second' }),
      ];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.modules[0].sort_order).toBe(0);
      expect(result.modules[1].sort_order).toBe(1);
    });
  });

  describe('lesson creation', () => {
    it('creates one lesson per spine node with correct sort_order', () => {
      const spine = [
        makeSpineNode({ index: 0, title: 'Lesson A' }),
        makeSpineNode({ index: 1, title: 'Lesson B' }),
        makeSpineNode({ index: 2, title: 'Lesson C' }),
      ];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.lessons).toHaveLength(3);
      expect(result.lessons[0].sort_order).toBe(0);
      expect(result.lessons[1].sort_order).toBe(1);
      expect(result.lessons[2].sort_order).toBe(2);
    });

    it('sets lesson title from spine node title', () => {
      const spine = [makeSpineNode({ index: 0, title: 'Understanding KYC' })];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.lessons[0].title).toBe('Understanding KYC');
    });

    it('sets estimated_duration_minutes to 20', () => {
      const result = publishTransform(makeTrackInput());

      expect(result.lessons[0].estimated_duration_minutes).toBe(20);
    });

    it('sets is_published to true', () => {
      const result = publishTransform(makeTrackInput());

      expect(result.lessons[0].is_published).toBe(true);
    });

    it('sets has_quiz to true', () => {
      const result = publishTransform(makeTrackInput());

      expect(result.lessons[0].has_quiz).toBe(true);
    });

    it('marks lessons before paywallLessonIndex as free', () => {
      const spine = [
        makeSpineNode({ index: 0, title: 'Free Lesson' }),
        makeSpineNode({ index: 1, title: 'Free Lesson 2' }),
        makeSpineNode({ index: 2, title: 'Paid Lesson' }),
        makeSpineNode({ index: 3, title: 'Paid Lesson 2' }),
      ];
      const input = makeTrackInput({ spine, paywallLessonIndex: 2 });
      const result = publishTransform(input);

      expect(result.lessons[0].is_free).toBe(true);
      expect(result.lessons[1].is_free).toBe(true);
      expect(result.lessons[2].is_free).toBe(false);
      expect(result.lessons[3].is_free).toBe(false);
    });
  });

  describe('lesson_content creation (depth tiers)', () => {
    it('creates three lesson_content records per spine node (one per depth tier)', () => {
      const spine = [makeSpineNode({ index: 0 })];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.lessonContents).toHaveLength(3);
    });

    it('assigns correct difficulty_tier to each lesson_content', () => {
      const result = publishTransform(makeTrackInput());
      const tiers = result.lessonContents.map((lc) => lc.difficulty_tier);

      expect(tiers).toContain('foundational');
      expect(tiers).toContain('working');
      expect(tiers).toContain('applied');
    });

    it('includes content_blocks from the spine node depth_cards', () => {
      const result = publishTransform(makeTrackInput());
      const foundational = result.lessonContents.find(
        (lc) => lc.difficulty_tier === 'foundational',
      );

      expect(foundational).toBeDefined();
      expect(foundational!.content_blocks).toHaveLength(1);
      expect(foundational!.content_blocks[0].type).toBe('text_block');
      expect(foundational!.content_blocks[0].id).toBe('s0-f-t1');
    });

    it('creates empty content_blocks when depth_cards is null', () => {
      const spine = [makeSpineNode({ index: 0, depth_cards: null })];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.lessonContents).toHaveLength(3);
      result.lessonContents.forEach((lc) => {
        expect(lc.content_blocks).toEqual([]);
      });
    });

    it('creates 3 * N lesson_contents for N spine nodes', () => {
      const spine = [
        makeSpineNode({ index: 0, title: 'Node A' }),
        makeSpineNode({ index: 1, title: 'Node B' }),
      ];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      expect(result.lessonContents).toHaveLength(6);
    });
  });

  describe('track status update', () => {
    it('returns trackStatus as published', () => {
      const result = publishTransform(makeTrackInput());

      expect(result.trackStatus).toBe('published');
    });
  });

  describe('referential integrity', () => {
    it('lessons reference their corresponding module index', () => {
      const spine = [
        makeSpineNode({ index: 0 }),
        makeSpineNode({ index: 1 }),
      ];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      // Each lesson's moduleIndex should match its position
      expect(result.lessons[0].moduleIndex).toBe(0);
      expect(result.lessons[1].moduleIndex).toBe(1);
    });

    it('lessonContents reference their corresponding lesson index', () => {
      const spine = [
        makeSpineNode({ index: 0 }),
        makeSpineNode({ index: 1 }),
      ];
      const input = makeTrackInput({ spine });
      const result = publishTransform(input);

      // First 3 lessonContents belong to lesson 0, next 3 to lesson 1
      expect(result.lessonContents[0].lessonIndex).toBe(0);
      expect(result.lessonContents[1].lessonIndex).toBe(0);
      expect(result.lessonContents[2].lessonIndex).toBe(0);
      expect(result.lessonContents[3].lessonIndex).toBe(1);
      expect(result.lessonContents[4].lessonIndex).toBe(1);
      expect(result.lessonContents[5].lessonIndex).toBe(1);
    });
  });
});
