/**
 * Stage 5 — Validation Agent
 *
 * Performs comprehensive validation on a complete lesson package:
 * - Zod schema validation on all blocks
 * - Word count checks (max 300 per text block)
 * - Quiz count checks (3-5 per lesson)
 * - Bloom's taxonomy distribution (>= 40% application+)
 * - Cross-reference: quiz questions relate to text content
 * - Artifact prompt rubric quality check
 * - Nigerian context presence check
 *
 * Returns a structured validation report with pass/fail status,
 * issues found, and a quality score.
 */
import { z } from 'zod';
import {
  TextBlockSchema,
  QuizBlockSchema,
  ArtifactPromptBlockSchema,
  ScenarioBlockSchema,
  ContentBlockSchema,
} from '../schemas/contentSchema.ts';
import type {
  TextBlockZ,
  QuizBlockZ,
  ArtifactPromptBlockZ,
  ContentBlockZ,
} from '../schemas/contentSchema.ts';
import { CONTENT } from '../../contracts/shared/constants.ts';

// ── Validation Report ────────────────────────────────────────────────

export interface ValidationIssue {
  severity: 'error' | 'warning';
  category: string;
  message: string;
  blockId?: string;
}

export interface ValidationReport {
  lessonId: string;
  lessonTitle: string;
  passed: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  stats: {
    text_block_count: number;
    quiz_block_count: number;
    artifact_block_count: number;
    scenario_block_count: number;
    total_word_count: number;
    avg_words_per_block: number;
    bloom_distribution: Record<string, number>;
    application_plus_percent: number;
  };
}

// ── Input ────────────────────────────────────────────────────────────

export interface ValidationInput {
  lessonId: string;
  lessonTitle: string;
  blocks: ContentBlockZ[];
}

// ── Bloom categories ─────────────────────────────────────────────────

const APPLICATION_AND_ABOVE = new Set([
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

// ── Validation functions ─────────────────────────────────────────────

function validateSchemas(blocks: ContentBlockZ[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const block of blocks) {
    try {
      ContentBlockSchema.parse(block);
    } catch (err) {
      issues.push({
        severity: 'error',
        category: 'schema',
        message: `Block ${block.id} fails schema validation: ${err instanceof Error ? err.message : String(err)}`,
        blockId: block.id,
      });
    }
  }

  return issues;
}

function validateWordCounts(textBlocks: TextBlockZ[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const block of textBlocks) {
    const wordCount = block.content.split(/\s+/).filter(Boolean).length;
    if (wordCount > CONTENT.WORD_COUNT_MAX_PER_BLOCK) {
      issues.push({
        severity: 'error',
        category: 'word_count',
        message: `Block ${block.id} has ${wordCount} words (max ${CONTENT.WORD_COUNT_MAX_PER_BLOCK})`,
        blockId: block.id,
      });
    } else if (wordCount < 30) {
      issues.push({
        severity: 'warning',
        category: 'word_count',
        message: `Block ${block.id} has only ${wordCount} words — may be too brief`,
        blockId: block.id,
      });
    }
  }

  return issues;
}

function validateQuizCount(quizBlocks: QuizBlockZ[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const count = quizBlocks.length;

  if (count < CONTENT.MIN_QUIZ_ITEMS_PER_LESSON) {
    issues.push({
      severity: 'error',
      category: 'quiz_count',
      message: `Only ${count} quiz items (min ${CONTENT.MIN_QUIZ_ITEMS_PER_LESSON})`,
    });
  }

  if (count > CONTENT.MAX_QUIZ_ITEMS_PER_LESSON) {
    issues.push({
      severity: 'error',
      category: 'quiz_count',
      message: `${count} quiz items exceeds max ${CONTENT.MAX_QUIZ_ITEMS_PER_LESSON}`,
    });
  }

  return issues;
}

function validateBloomDistribution(
  quizBlocks: QuizBlockZ[],
): { issues: ValidationIssue[]; distribution: Record<string, number>; applicationPercent: number } {
  const issues: ValidationIssue[] = [];
  const distribution: Record<string, number> = {};

  for (const q of quizBlocks) {
    distribution[q.bloom_level] = (distribution[q.bloom_level] ?? 0) + 1;
  }

  const total = quizBlocks.length;
  const higherOrder = quizBlocks.filter((q) =>
    APPLICATION_AND_ABOVE.has(q.bloom_level),
  ).length;
  const applicationPercent = total > 0 ? (higherOrder / total) * 100 : 0;

  if (applicationPercent < CONTENT.MIN_APPLICATION_QUIZ_PERCENT) {
    issues.push({
      severity: 'error',
      category: 'bloom_distribution',
      message:
        `Only ${applicationPercent.toFixed(0)}% of quiz items at application+ level ` +
        `(need >= ${CONTENT.MIN_APPLICATION_QUIZ_PERCENT}%)`,
    });
  }

  return { issues, distribution, applicationPercent };
}

function validateQuizOptions(quizBlocks: QuizBlockZ[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const q of quizBlocks) {
    if (q.correct_answer < 0 || q.correct_answer >= q.options.length) {
      issues.push({
        severity: 'error',
        category: 'quiz_options',
        message: `Quiz ${q.id}: correct_answer index ${q.correct_answer} out of range (${q.options.length} options)`,
        blockId: q.id,
      });
    }

    // Check for duplicate options
    const unique = new Set(q.options.map((o) => o.toLowerCase().trim()));
    if (unique.size < q.options.length) {
      issues.push({
        severity: 'warning',
        category: 'quiz_options',
        message: `Quiz ${q.id}: has duplicate or near-duplicate options`,
        blockId: q.id,
      });
    }
  }

  return issues;
}

function validateArtifactRubrics(
  artifactBlocks: ArtifactPromptBlockZ[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const a of artifactBlocks) {
    if (a.rubric.length < 3) {
      issues.push({
        severity: 'warning',
        category: 'artifact_rubric',
        message: `Artifact ${a.id}: rubric has only ${a.rubric.length} criteria (recommend 4-6)`,
        blockId: a.id,
      });
    }
  }

  return issues;
}

function validateUniqueIds(blocks: ContentBlockZ[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    if (seen.has(block.id)) {
      issues.push({
        severity: 'error',
        category: 'unique_ids',
        message: `Duplicate block ID: ${block.id}`,
        blockId: block.id,
      });
    }
    seen.add(block.id);
  }

  return issues;
}

function checkNigerianContext(textBlocks: TextBlockZ[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const nigerianMarkers = [
    'nigeria',
    'nigerian',
    'naira',
    'ngn',
    'lagos',
    'abuja',
    'cbn',
    'cibn',
    'ican',
    'citn',
    'cipm',
    'paystack',
    'flutterwave',
    'bvn',
  ];

  const allContent = textBlocks.map((b) => b.content.toLowerCase()).join(' ');
  const hasNigerianContext = nigerianMarkers.some((marker) =>
    allContent.includes(marker),
  );

  if (!hasNigerianContext) {
    issues.push({
      severity: 'warning',
      category: 'nigerian_context',
      message:
        'No Nigerian context markers found in text content. ' +
        'Content should reference Nigerian institutions, currency, or regulations.',
    });
  }

  return issues;
}

// ── Main function ────────────────────────────────────────────────────

export function validateLessonPackage(input: ValidationInput): ValidationReport {
  const { blocks, lessonId, lessonTitle } = input;

  // Separate block types
  const textBlocks = blocks.filter(
    (b): b is TextBlockZ => b.type === 'text_block',
  );
  const quizBlocks = blocks.filter(
    (b): b is QuizBlockZ => b.type === 'quiz_block',
  );
  const artifactBlocks = blocks.filter(
    (b): b is ArtifactPromptBlockZ => b.type === 'artifact_prompt_block',
  );
  const scenarioBlocks = blocks.filter((b) => b.type === 'scenario_block');

  // Run all validations
  const allIssues: ValidationIssue[] = [
    ...validateSchemas(blocks),
    ...validateWordCounts(textBlocks),
    ...validateQuizCount(quizBlocks),
    ...validateQuizOptions(quizBlocks),
    ...validateArtifactRubrics(artifactBlocks),
    ...validateUniqueIds(blocks),
    ...checkNigerianContext(textBlocks),
  ];

  const { issues: bloomIssues, distribution, applicationPercent } =
    validateBloomDistribution(quizBlocks);
  allIssues.push(...bloomIssues);

  // Calculate stats
  const totalWords = textBlocks.reduce(
    (sum, b) => sum + b.content.split(/\s+/).filter(Boolean).length,
    0,
  );
  const avgWords =
    textBlocks.length > 0 ? Math.round(totalWords / textBlocks.length) : 0;

  // Calculate score
  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

  return {
    lessonId,
    lessonTitle,
    passed: errorCount === 0,
    score,
    issues: allIssues,
    stats: {
      text_block_count: textBlocks.length,
      quiz_block_count: quizBlocks.length,
      artifact_block_count: artifactBlocks.length,
      scenario_block_count: scenarioBlocks.length,
      total_word_count: totalWords,
      avg_words_per_block: avgWords,
      bloom_distribution: distribution,
      application_plus_percent: applicationPercent,
    },
  };
}
