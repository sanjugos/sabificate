// ── T-008: E2E Pipeline Integration Test ───────────────────────────────
// Traces to: All studio FRs
// Validates the full 7-stage authoring pipeline data flow through the
// service layer: template → spine → content → assembly checks →
// section review → publish gate → publish transform.

import { describe, it, expect } from 'vitest';
import type { SpineNode, ContentBlock } from '../../server/services/curriculumAI';
import {
  publishTransform,
  type PublishTransformInput,
} from '../../server/services/publishTransform';
import {
  checkCoverageGap,
  runAllAssemblyChecks,
} from '../../server/services/assemblyChecks';
import {
  initializeSectionReviews,
  approveSectionReview,
  requestSectionRevision,
  getRevisionRequestedSections,
  regenerateSection,
} from '../../server/services/sectionReview';
import {
  publishGateCheck,
} from '../../server/services/publishGate';
import {
  TRACK_TEMPLATES,
  type TrackTemplate,
} from '../components/studio/trackTemplateData';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeBlock(
  id: string,
  content: string,
  type: ContentBlock['type'] = 'text_block',
  tier: string = 'foundational',
): ContentBlock {
  return { type, id, content, difficulty_tier: tier, bloom_level: 'understand' };
}

/** Build a complete spine node with 3 blocks per depth tier (9 blocks total). */
function makeCompleteNode(index: number, title?: string): SpineNode {
  const nodeTitle = title ?? `Concept Node ${index}`;
  return {
    index,
    concept_id: `concept-${index}`,
    title: nodeTitle,
    objective: `Learner can demonstrate competence in ${nodeTitle.toLowerCase()}.`,
    bloom_level: index < 2 ? 'understand' : 'evaluate',
    artifact_intent: `Artifact for ${nodeTitle}`,
    catalog_overlap: 'new',
    linked_concept_catalog_id: null,
    depth_cards: {
      foundational: {
        blocks: [
          makeBlock(`s${index}-f-t1`, `Foundational intro for ${nodeTitle}: core principles and definitions relevant to this domain.`, 'text_block', 'foundational'),
          makeBlock(`s${index}-f-t2`, `Key terminology for ${nodeTitle}: understanding the vocabulary used by practitioners in this area.`, 'text_block', 'foundational'),
          makeBlock(`s${index}-f-q1`, `What is the primary purpose of ${nodeTitle.toLowerCase()} in professional practice?`, 'quiz_block', 'foundational'),
        ],
      },
      working: {
        blocks: [
          makeBlock(`s${index}-w-t1`, `Working application of ${nodeTitle}: practical procedures and implementation steps for daily operations.`, 'text_block', 'working'),
          makeBlock(`s${index}-w-t2`, `Implementation framework for ${nodeTitle}: structured approaches to applying this concept in the workplace.`, 'text_block', 'working'),
          makeBlock(`s${index}-w-q1`, `How should a professional apply ${nodeTitle.toLowerCase()} when facing a compliance gap?`, 'quiz_block', 'working'),
        ],
      },
      applied: {
        blocks: [
          makeBlock(`s${index}-a-t1`, `Advanced analysis of ${nodeTitle}: evaluating complex scenarios requiring strategic judgment and leadership.`, 'text_block', 'applied'),
          makeBlock(`s${index}-a-t2`, `Strategic considerations for ${nodeTitle}: balancing regulatory requirements with organizational objectives.`, 'text_block', 'applied'),
          makeBlock(`s${index}-a-q1`, `Which approach best demonstrates strategic leadership in ${nodeTitle.toLowerCase()} governance?`, 'quiz_block', 'applied'),
        ],
      },
    },
    trust_claim_count: 1,
    sme_approved: false,
  };
}

/** Build a 4-node spine with 3 tiers each. */
function makeFourNodeSpine(): SpineNode[] {
  return [
    makeCompleteNode(0, 'Risk Assessment Fundamentals'),
    makeCompleteNode(1, 'Regulatory Compliance Framework'),
    makeCompleteNode(2, 'Practical Case Analysis'),
    makeCompleteNode(3, 'Strategic Risk Governance'),
  ];
}

/** Build a node missing the applied tier (empty blocks). */
function makeNodeMissingApplied(index: number, title?: string): SpineNode {
  const nodeTitle = title ?? `Incomplete Node ${index}`;
  return {
    index,
    concept_id: `concept-${index}`,
    title: nodeTitle,
    objective: `Learner can demonstrate competence in ${nodeTitle.toLowerCase()}.`,
    bloom_level: 'understand',
    artifact_intent: `Artifact for ${nodeTitle}`,
    catalog_overlap: 'new',
    linked_concept_catalog_id: null,
    depth_cards: {
      foundational: {
        blocks: [
          makeBlock(`s${index}-f-t1`, `Foundational content for ${nodeTitle}: covers basic principles.`, 'text_block', 'foundational'),
          makeBlock(`s${index}-f-t2`, `Key definitions for ${nodeTitle}: essential vocabulary.`, 'text_block', 'foundational'),
          makeBlock(`s${index}-f-q1`, `Quiz on foundational concepts of ${nodeTitle}.`, 'quiz_block', 'foundational'),
        ],
      },
      working: {
        blocks: [
          makeBlock(`s${index}-w-t1`, `Working procedures for ${nodeTitle}: implementation guidance.`, 'text_block', 'working'),
          makeBlock(`s${index}-w-t2`, `Practical exercises for ${nodeTitle}: hands-on application.`, 'text_block', 'working'),
          makeBlock(`s${index}-w-q1`, `Quiz on working knowledge of ${nodeTitle}.`, 'quiz_block', 'working'),
        ],
      },
      applied: { blocks: [] }, // missing applied tier
    },
    trust_claim_count: 0,
    sme_approved: false,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('Studio Pipeline Integration (T-008)', () => {

  // ── Test 1: publishTransform record counts ────────────────────────────

  describe('publishTransform creates correct number of records from spine', () => {
    it('produces 1 course + 4 modules + 4 lessons + 12 lesson contents from a 4-node spine with 3 tiers', () => {
      const spine = makeFourNodeSpine();
      const input: PublishTransformInput = {
        trackId: 'track-pipeline-001',
        name: 'AML Compliance Masterclass',
        vertical: 'banking-compliance',
        customerTier: 'upskilling',
        tierTreatment: 'A',
        credentialType: 'professional_certificate',
        paywallLessonIndex: 2,
        spine,
      };

      const result = publishTransform(input);

      // 1 course record
      expect(result.course).toBeDefined();
      expect(result.course.title).toBe('AML Compliance Masterclass');

      // 4 modules (one per spine node)
      expect(result.modules).toHaveLength(4);

      // 4 lessons (one per spine node)
      expect(result.lessons).toHaveLength(4);

      // 12 lesson contents (4 nodes x 3 tiers)
      expect(result.lessonContents).toHaveLength(12);

      // Verify each lesson content has the right tier assignment
      const tiers = result.lessonContents.map((lc) => lc.difficulty_tier);
      const foundationalCount = tiers.filter((t) => t === 'foundational').length;
      const workingCount = tiers.filter((t) => t === 'working').length;
      const appliedCount = tiers.filter((t) => t === 'applied').length;
      expect(foundationalCount).toBe(4);
      expect(workingCount).toBe(4);
      expect(appliedCount).toBe(4);

      // Verify track status
      expect(result.trackStatus).toBe('published');
    });
  });

  // ── Test 2: assembly checks detect coverage gap ───────────────────────

  describe('assembly checks detect coverage gap in incomplete spine', () => {
    it('flags a node missing applied tier blocks', () => {
      const spine: SpineNode[] = [
        makeCompleteNode(0, 'Complete Node A'),
        makeCompleteNode(1, 'Complete Node B'),
        makeNodeMissingApplied(2, 'Incomplete Node C'),
        makeCompleteNode(3, 'Complete Node D'),
      ];

      const flags = checkCoverageGap(spine);

      // Should flag node 2 for missing applied tier
      expect(flags.length).toBeGreaterThan(0);
      const coverageFlags = flags.filter((f) => f.category === 'coverage_gap');
      expect(coverageFlags.length).toBeGreaterThan(0);

      const node2Flag = coverageFlags.find((f) => f.node_indices.includes(2));
      expect(node2Flag).toBeDefined();
      expect(node2Flag!.description).toContain('applied');
    });
  });

  // ── Test 3: assembly checks pass clean spine ──────────────────────────

  describe('assembly checks pass clean spine', () => {
    it('returns 0 flags for a fully populated spine with unique content', () => {
      const spine = makeFourNodeSpine();

      const flags = runAllAssemblyChecks(spine);

      expect(flags).toHaveLength(0);
    });
  });

  // ── Test 4: section review lifecycle ──────────────────────────────────

  describe('section review lifecycle: init → approve → request revision → regenerate', () => {
    it('initializes 12 reviews for 4-node spine, approves 10, revises 2, regenerates with [REVISED] content', () => {
      const spine = makeFourNodeSpine();
      const trackId = 'track-review-lifecycle';

      // Step 1: Initialize reviews — 4 nodes x 3 tiers = 12 sections
      let reviews = initializeSectionReviews(trackId, spine);
      expect(reviews).toHaveLength(12);
      expect(reviews.every((r) => r.status === 'pending_review')).toBe(true);

      // Step 2: Approve 10 sections (indices 0-9)
      const reviewsToApprove = reviews.slice(0, 10);
      for (const review of reviewsToApprove) {
        reviews = approveSectionReview(reviews, review.id);
      }
      const approvedCount = reviews.filter((r) => r.status === 'approved').length;
      expect(approvedCount).toBe(10);

      // Step 3: Request revision on 2 sections (indices 10 and 11)
      const revisionTarget1 = reviews[10];
      const revisionTarget2 = reviews[11];
      const comment1 = 'Needs more Nigerian regulatory context for CBN compliance.';
      const comment2 = 'Add practical NFIU reporting examples.';

      reviews = requestSectionRevision(reviews, revisionTarget1.id, comment1);
      reviews = requestSectionRevision(reviews, revisionTarget2.id, comment2);

      // Verify exactly 2 sections are in revision_requested status
      const revisionRequested = getRevisionRequestedSections(reviews);
      expect(revisionRequested).toHaveLength(2);

      // Step 4: Regenerate the 2 revised sections
      const revisedSections: Array<{ blocks: ContentBlock[] }> = [];
      for (const section of revisionRequested) {
        const node = spine.find((n) => n.index === section.spineNodeIndex)!;
        const result = regenerateSection(
          node,
          section.depthTier,
          section.reviewerComment!,
        );
        revisedSections.push(result);
      }

      // Verify exactly 2 sections were regenerated
      expect(revisedSections).toHaveLength(2);

      // Verify all regenerated blocks contain [REVISED]
      for (const revised of revisedSections) {
        expect(revised.blocks.length).toBeGreaterThan(0);
        for (const block of revised.blocks) {
          const text = block.content ?? block.question ?? '';
          expect(text).toContain('[REVISED]');
        }
      }

      // Verify the original approved sections remain untouched
      const stillApproved = reviews.filter((r) => r.status === 'approved');
      expect(stillApproved).toHaveLength(10);
    });
  });

  // ── Test 5: publish gate blocks on unverified claims ──────────────────

  describe('publish gate blocks when unverified claims exist', () => {
    it('returns canPublish false when unverified count > 0', () => {
      const result = publishGateCheck(
        { total: 8, unverified: 3 },
        { total: 0, unresolved: 0 },
      );

      expect(result.canPublish).toBe(false);
      expect(result.reason).toBe('unverified_trust_claims');
      expect(result.count).toBe(3);
    });
  });

  // ── Test 6: publish gate allows when all verified ─────────────────────

  describe('publish gate allows when all verified', () => {
    it('returns canPublish true when all claims verified and all flags resolved', () => {
      const result = publishGateCheck(
        { total: 8, unverified: 0 },
        { total: 4, unresolved: 0 },
      );

      expect(result.canPublish).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.count).toBeUndefined();
    });
  });

  // ── Test 7: full pipeline from template to verified output ────────────

  describe('full pipeline: template → transform → gate check', () => {
    it('picks a template, builds mock spine, runs assembly checks, transforms, and verifies output', () => {
      // Stage 1: Pick a template from trackTemplateData
      const template: TrackTemplate = TRACK_TEMPLATES.find(
        (t) => t.id === 'tpl-006',
      )!;
      expect(template).toBeDefined();
      expect(template.name).toBe('AML/KYC Compliance for Branch Staff');

      // Stage 2: Create mock spine from template (simulates decomposeSkill output)
      const spine: SpineNode[] = [
        makeCompleteNode(0, 'KYC Due Diligence Basics'),
        makeCompleteNode(1, 'Transaction Monitoring Procedures'),
        makeCompleteNode(2, 'Suspicious Activity Reporting'),
        makeCompleteNode(3, 'CBN Regulatory Compliance'),
      ];

      // Stage 3: Run assembly checks — clean spine should pass
      const assemblyFlags = runAllAssemblyChecks(spine);
      expect(assemblyFlags).toHaveLength(0);

      // Stage 4: Run publish gate check (simulating all claims verified)
      const totalTrustClaims = spine.reduce((sum, n) => sum + n.trust_claim_count, 0);
      const gateResult = publishGateCheck(
        { total: totalTrustClaims, unverified: 0 },
        { total: assemblyFlags.length, unresolved: 0 },
      );
      expect(gateResult.canPublish).toBe(true);

      // Stage 5: Run publish transform
      const transformInput: PublishTransformInput = {
        trackId: 'track-tpl-006-live',
        name: template.name,
        vertical: template.vertical,
        customerTier: template.customer_tier,
        tierTreatment: template.tier_treatment,
        credentialType: template.credential_type,
        paywallLessonIndex: template.paywall_lesson_index,
        spine,
      };

      const output = publishTransform(transformInput);

      // Stage 6: Verify complete output structure
      // Course record
      expect(output.course.title).toBe('AML/KYC Compliance for Branch Staff');
      expect(output.course.slug).toBe('aml-kyc-compliance-for-branch-staff');
      expect(output.course.category).toBe('banking-compliance');
      expect(output.course.customer_tier_treatment).toBe('A');
      expect(output.course.credential_type).toBe('professional_certificate');
      expect(output.course.is_published).toBe(true);

      // Modules: 4 (one per spine node)
      expect(output.modules).toHaveLength(4);
      expect(output.modules[0].title).toBe('KYC Due Diligence Basics');
      expect(output.modules[3].title).toBe('CBN Regulatory Compliance');

      // Lessons: 4 (one per spine node)
      expect(output.lessons).toHaveLength(4);

      // Paywall: template says paywall_lesson_index = 1, so only index 0 is free
      expect(output.lessons[0].is_free).toBe(true);
      expect(output.lessons[1].is_free).toBe(false);
      expect(output.lessons[2].is_free).toBe(false);
      expect(output.lessons[3].is_free).toBe(false);

      // Lesson contents: 12 (4 nodes x 3 tiers)
      expect(output.lessonContents).toHaveLength(12);

      // Each lesson content should have non-empty content_blocks
      for (const lc of output.lessonContents) {
        expect(lc.content_blocks.length).toBeGreaterThan(0);
      }

      // Track status
      expect(output.trackStatus).toBe('published');

      // Referential integrity: lessonContent lessonIndex references valid lesson
      for (const lc of output.lessonContents) {
        expect(lc.lessonIndex).toBeGreaterThanOrEqual(0);
        expect(lc.lessonIndex).toBeLessThan(output.lessons.length);
      }

      // Referential integrity: lesson moduleIndex references valid module
      for (const lesson of output.lessons) {
        expect(lesson.moduleIndex).toBeGreaterThanOrEqual(0);
        expect(lesson.moduleIndex).toBeLessThan(output.modules.length);
      }
    });
  });
});
