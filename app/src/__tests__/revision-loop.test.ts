// ── T-005: SME Review and Revision Loop ────────────────────────────────
// Traces to: FR-7 / AC-7.1 through AC-7.5
// Validates the per-section review workflow where SMEs can approve or
// request revision on individual (node, depth_tier) sections.

import { describe, it, expect } from 'vitest';
import type { SpineNode, ContentBlock } from '../../server/services/curriculumAI';
import {
  initializeSectionReviews,
  approveSectionReview,
  requestSectionRevision,
  getRevisionRequestedSections,
  regenerateSection,
  type SectionReview,
} from '../../server/services/sectionReview';

// ── Test helpers ───────────────────────────────────────────────────────

function makeBlock(id: string, content: string, type: ContentBlock['type'] = 'text_block'): ContentBlock {
  return { type, id, content };
}

function makeSpine(): SpineNode[] {
  return [
    {
      index: 0,
      concept_id: 'aml-fundamentals-001',
      title: 'AML Fundamentals',
      objective: 'Learner can explain the core principles of AML compliance.',
      bloom_level: 'understand',
      artifact_intent: 'Concept map of AML key terms',
      catalog_overlap: 'new',
      linked_concept_catalog_id: null,
      depth_cards: {
        foundational: { blocks: [makeBlock('s0-f-t1', 'Foundational AML content.')] },
        working: { blocks: [makeBlock('s0-w-t1', 'Working AML content.')] },
        applied: { blocks: [makeBlock('s0-a-t1', 'Applied AML content.')] },
      },
      trust_claim_count: 1,
      sme_approved: false,
    },
    {
      index: 1,
      concept_id: 'regulatory-framework-002',
      title: 'Regulatory Framework',
      objective: 'Learner can identify regulatory bodies governing AML.',
      bloom_level: 'apply',
      artifact_intent: 'Regulatory compliance checklist',
      catalog_overlap: 'new',
      linked_concept_catalog_id: null,
      depth_cards: {
        foundational: { blocks: [makeBlock('s1-f-t1', 'Foundational regulatory content.')] },
        working: { blocks: [makeBlock('s1-w-t1', 'Working regulatory content.')] },
        applied: { blocks: [makeBlock('s1-a-t1', 'Applied regulatory content.')] },
      },
      trust_claim_count: 2,
      sme_approved: false,
    },
  ];
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('SME Review and Revision Loop (T-005)', () => {

  // ── AC-7.1: Initialize section reviews ──────────────────────────────

  describe('initializeSectionReviews', () => {
    it('creates section review objects for every (node, depth_tier) combination', () => {
      const spine = makeSpine();
      const trackId = 'track-001';
      const reviews = initializeSectionReviews(trackId, spine);

      // 2 nodes x 3 tiers = 6 section reviews
      expect(reviews).toHaveLength(6);
    });

    it('returns section reviews with status "pending_review"', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);

      for (const review of reviews) {
        expect(review.status).toBe('pending_review');
      }
    });

    it('each section review has correct shape', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);

      for (const review of reviews) {
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('trackId');
        expect(review).toHaveProperty('spineNodeIndex');
        expect(review).toHaveProperty('depthTier');
        expect(review).toHaveProperty('status');
        expect(review).toHaveProperty('reviewerComment');
        expect(review).toHaveProperty('revisionCount');
        expect(typeof review.id).toBe('string');
        expect(review.trackId).toBe('track-001');
        expect(typeof review.spineNodeIndex).toBe('number');
        expect(['foundational', 'working', 'applied']).toContain(review.depthTier);
        expect(review.reviewerComment).toBeNull();
        expect(review.revisionCount).toBe(0);
      }
    });

    it('covers all tiers for each node', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);

      // Node 0 should have foundational, working, applied
      const node0Reviews = reviews.filter((r) => r.spineNodeIndex === 0);
      const node0Tiers = node0Reviews.map((r) => r.depthTier).sort();
      expect(node0Tiers).toEqual(['applied', 'foundational', 'working']);

      // Node 1 should have foundational, working, applied
      const node1Reviews = reviews.filter((r) => r.spineNodeIndex === 1);
      const node1Tiers = node1Reviews.map((r) => r.depthTier).sort();
      expect(node1Tiers).toEqual(['applied', 'foundational', 'working']);
    });
  });

  // ── AC-7.2: Approve a section ───────────────────────────────────────

  describe('approveSectionReview', () => {
    it('changes section status to "approved"', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);
      const targetReview = reviews[0];

      const updated = approveSectionReview(reviews, targetReview.id);

      const found = updated.find((r) => r.id === targetReview.id);
      expect(found).toBeDefined();
      expect(found!.status).toBe('approved');
    });

    it('does not change status of other sections', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);
      const targetReview = reviews[0];

      const updated = approveSectionReview(reviews, targetReview.id);

      const others = updated.filter((r) => r.id !== targetReview.id);
      for (const other of others) {
        expect(other.status).toBe('pending_review');
      }
    });

    it('does not increment revision count on approval', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);
      const targetReview = reviews[0];

      const updated = approveSectionReview(reviews, targetReview.id);

      const found = updated.find((r) => r.id === targetReview.id);
      expect(found!.revisionCount).toBe(0);
    });
  });

  // ── AC-7.3: Request revision with comment ───────────────────────────

  describe('requestSectionRevision', () => {
    it('changes section status to "revision_requested"', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);
      const targetReview = reviews[0];
      const comment = 'The CBN regulatory reference is outdated. Update to 2024 guidelines.';

      const updated = requestSectionRevision(reviews, targetReview.id, comment);

      const found = updated.find((r) => r.id === targetReview.id);
      expect(found).toBeDefined();
      expect(found!.status).toBe('revision_requested');
    });

    it('stores the reviewer comment', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);
      const targetReview = reviews[0];
      const comment = 'Need more Nigerian-specific examples.';

      const updated = requestSectionRevision(reviews, targetReview.id, comment);

      const found = updated.find((r) => r.id === targetReview.id);
      expect(found!.reviewerComment).toBe(comment);
    });

    it('increments revision count', () => {
      const spine = makeSpine();
      let reviews = initializeSectionReviews('track-001', spine);
      const targetReview = reviews[0];

      // First revision request
      reviews = requestSectionRevision(reviews, targetReview.id, 'First revision comment');
      let found = reviews.find((r) => r.id === targetReview.id);
      expect(found!.revisionCount).toBe(1);

      // Second revision request (after re-generation)
      reviews = requestSectionRevision(reviews, targetReview.id, 'Second revision comment');
      found = reviews.find((r) => r.id === targetReview.id);
      expect(found!.revisionCount).toBe(2);
    });

    it('does not affect other sections', () => {
      const spine = makeSpine();
      const reviews = initializeSectionReviews('track-001', spine);
      const targetReview = reviews[0];

      const updated = requestSectionRevision(reviews, targetReview.id, 'Fix this section.');

      const others = updated.filter((r) => r.id !== targetReview.id);
      for (const other of others) {
        expect(other.status).toBe('pending_review');
        expect(other.reviewerComment).toBeNull();
        expect(other.revisionCount).toBe(0);
      }
    });
  });

  // ── AC-7.4: Regenerate only revision_requested sections ─────────────

  describe('getRevisionRequestedSections', () => {
    it('returns only sections with status "revision_requested"', () => {
      const spine = makeSpine();
      let reviews = initializeSectionReviews('track-001', spine);

      // Approve first section, request revision on second
      reviews = approveSectionReview(reviews, reviews[0].id);
      reviews = requestSectionRevision(reviews, reviews[1].id, 'Needs work');

      const revisionRequested = getRevisionRequestedSections(reviews);
      expect(revisionRequested).toHaveLength(1);
      expect(revisionRequested[0].id).toBe(reviews[1].id);
      expect(revisionRequested[0].status).toBe('revision_requested');
    });

    it('returns empty array when no sections need revision', () => {
      const spine = makeSpine();
      let reviews = initializeSectionReviews('track-001', spine);

      // Approve all
      for (const review of reviews) {
        reviews = approveSectionReview(reviews, review.id);
      }

      const revisionRequested = getRevisionRequestedSections(reviews);
      expect(revisionRequested).toHaveLength(0);
    });

    it('does not return approved or pending_review sections', () => {
      const spine = makeSpine();
      let reviews = initializeSectionReviews('track-001', spine);

      // Approve one, leave rest pending, request revision on one
      reviews = approveSectionReview(reviews, reviews[0].id);
      reviews = requestSectionRevision(reviews, reviews[3].id, 'Fix it');

      const revisionRequested = getRevisionRequestedSections(reviews);

      for (const section of revisionRequested) {
        expect(section.status).toBe('revision_requested');
        expect(section.status).not.toBe('approved');
        expect(section.status).not.toBe('pending_review');
      }
    });
  });

  // ── AC-7.5: regenerateSection produces revised content ──────────────

  describe('regenerateSection', () => {
    it('returns revised content blocks with [REVISED] prefix in mock mode', () => {
      const node = makeSpine()[0];
      const comment = 'Use more CBN-specific regulatory language.';

      const result = regenerateSection(node, 'foundational', comment);

      expect(result.blocks).toBeDefined();
      expect(result.blocks.length).toBeGreaterThan(0);

      for (const block of result.blocks) {
        if (block.content) {
          expect(block.content).toContain('[REVISED]');
        }
      }
    });

    it('preserves block type and id format', () => {
      const node = makeSpine()[0];
      const result = regenerateSection(node, 'working', 'Add practical examples');

      for (const block of result.blocks) {
        expect(['text_block', 'quiz_block', 'scenario_block', 'artifact_block']).toContain(block.type);
        expect(typeof block.id).toBe('string');
        expect(block.id.length).toBeGreaterThan(0);
      }
    });

    it('includes the revision comment context in content', () => {
      const node = makeSpine()[0];
      const comment = 'Include NFIU reporting requirements';

      const result = regenerateSection(node, 'applied', comment);

      // At least one block should reference the revision context
      const hasRevisionContext = result.blocks.some(
        (b) => b.content && b.content.includes(comment),
      );
      expect(hasRevisionContext).toBe(true);
    });

    it('returns blocks for the specified tier only', () => {
      const node = makeSpine()[0];

      const foundational = regenerateSection(node, 'foundational', 'fix');
      const working = regenerateSection(node, 'working', 'fix');
      const applied = regenerateSection(node, 'applied', 'fix');

      // Each should return blocks independently
      expect(foundational.blocks.length).toBeGreaterThan(0);
      expect(working.blocks.length).toBeGreaterThan(0);
      expect(applied.blocks.length).toBeGreaterThan(0);
    });
  });
});
