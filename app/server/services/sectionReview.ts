// ── Section Review Service for SME Review and Revision Loop ─────────────
// Traces to: FR-7 / AC-7.1 through AC-7.5
//
// Provides per-section (node x depth_tier) review workflow:
//   - Initialize section reviews for a track's spine
//   - Approve individual sections
//   - Request revision with reviewer comment
//   - Filter revision-requested sections
//   - Regenerate revised content (mock mode)

import type { SpineNode, ContentBlock } from './curriculumAI.js';

// ── Types ──────────────────────────────────────────────────────────────

export type SectionReviewStatus = 'pending_review' | 'approved' | 'revision_requested';

export interface SectionReview {
  id: string;
  trackId: string;
  spineNodeIndex: number;
  depthTier: 'foundational' | 'working' | 'applied';
  status: SectionReviewStatus;
  reviewerComment: string | null;
  revisionCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

const DEPTH_TIERS: Array<'foundational' | 'working' | 'applied'> = [
  'foundational',
  'working',
  'applied',
];

function generateId(trackId: string, nodeIndex: number, tier: string): string {
  return `sr-${trackId}-${nodeIndex}-${tier}`;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * AC-7.1: Initialize section review objects for every (node, depth_tier)
 * combination in the spine. All sections start as "pending_review".
 */
export function initializeSectionReviews(
  trackId: string,
  spine: SpineNode[],
): SectionReview[] {
  const reviews: SectionReview[] = [];

  for (const node of spine) {
    for (const tier of DEPTH_TIERS) {
      reviews.push({
        id: generateId(trackId, node.index, tier),
        trackId,
        spineNodeIndex: node.index,
        depthTier: tier,
        status: 'pending_review',
        reviewerComment: null,
        revisionCount: 0,
      });
    }
  }

  return reviews;
}

/**
 * AC-7.2: Approve a single section. Returns updated reviews array
 * (immutable pattern).
 */
export function approveSectionReview(
  reviews: SectionReview[],
  reviewId: string,
): SectionReview[] {
  return reviews.map((review) => {
    if (review.id === reviewId) {
      return {
        ...review,
        status: 'approved' as const,
      };
    }
    return review;
  });
}

/**
 * AC-7.3: Request revision on a section. Stores the reviewer comment
 * and increments the revision count.
 */
export function requestSectionRevision(
  reviews: SectionReview[],
  reviewId: string,
  comment: string,
): SectionReview[] {
  return reviews.map((review) => {
    if (review.id === reviewId) {
      return {
        ...review,
        status: 'revision_requested' as const,
        reviewerComment: comment,
        revisionCount: review.revisionCount + 1,
      };
    }
    return review;
  });
}

/**
 * AC-7.4: Filter to only the sections that have been flagged for revision.
 * Approved and pending_review sections are excluded.
 */
export function getRevisionRequestedSections(
  reviews: SectionReview[],
): SectionReview[] {
  return reviews.filter((r) => r.status === 'revision_requested');
}

/**
 * AC-7.5: Regenerate content for a single section (mock mode).
 * Returns revised content blocks with [REVISED] prefix and
 * incorporates the revision comment context.
 */
export function regenerateSection(
  node: SpineNode,
  tier: 'foundational' | 'working' | 'applied',
  revisionComment: string,
): { blocks: ContentBlock[] } {
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const nodeTitle = node.title;
  const nodeIdx = node.index;
  const tierLetter = tier[0];

  const blocks: ContentBlock[] = [
    {
      type: 'text_block',
      id: `s${nodeIdx}-${tierLetter}-rev-t1`,
      content: `[REVISED] ${tierLabel} content for ${nodeTitle}. Revision context: ${revisionComment}`,
      bloom_level: node.bloom_level,
      difficulty_tier: tier,
    },
    {
      type: 'text_block',
      id: `s${nodeIdx}-${tierLetter}-rev-t2`,
      content: `[REVISED] Updated section addressing reviewer feedback for ${nodeTitle} at the ${tier} level.`,
      bloom_level: node.bloom_level,
      difficulty_tier: tier,
    },
    {
      type: 'quiz_block',
      id: `s${nodeIdx}-${tierLetter}-rev-q1`,
      question: `[REVISED] Which aspect of ${nodeTitle.toLowerCase()} was updated based on SME feedback?`,
      options: [
        'No changes were needed',
        `The ${tier} content was revised to address: ${revisionComment}`,
        'The section was removed entirely',
        'Only formatting was changed',
      ],
      correct_answer: 1,
      explanation: `[REVISED] The ${tier} content for ${nodeTitle} was revised based on SME feedback.`,
      bloom_level: node.bloom_level,
      difficulty_tier: tier,
    },
  ];

  return { blocks };
}
