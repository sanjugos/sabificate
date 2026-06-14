/**
 * Stage 3 — Adaptive Variant Generator
 *
 * Takes baseline lesson content (text + quiz blocks) at the course's
 * default difficulty and produces two additional difficulty variants
 * (beginner, intermediate, advanced — whichever two are missing).
 *
 * Each variant rewrites text blocks and adjusts quiz difficulty while
 * preserving the same topic coverage and learning objectives.
 */
import { z } from 'zod';
import { TextBlockSchema, QuizBlockSchema } from '../schemas/contentSchema.ts';
import type { TextBlockZ, QuizBlockZ } from '../schemas/contentSchema.ts';
import type { LessonBrief, CourseBrief } from '../schemas/briefSchema.ts';
import type { DifficultyTier } from '../../contracts/types/index.ts';
import {
  getClient,
  MODEL_ID,
  withRetry,
  extractJson,
  getResponseText,
  computeCost,
  type StageResult,
  type TokenUsage,
} from './shared.ts';

// ── Types ────────────────────────────────────────────────────────────

const VariantSchema = z.object({
  difficulty_tier: z.enum(['beginner', 'intermediate', 'advanced']),
  text_blocks: z.array(TextBlockSchema).min(1),
  quiz_blocks: z.array(QuizBlockSchema).min(1),
});

const VariantsOutputSchema = z.object({
  variants: z.array(VariantSchema).length(2),
});

export type VariantOutput = z.infer<typeof VariantSchema>;
type VariantsOutput = z.infer<typeof VariantsOutputSchema>;

// ── Input ────────────────────────────────────────────────────────────

export interface AdaptiveVariantInput {
  baselineTextBlocks: TextBlockZ[];
  baselineQuizBlocks: QuizBlockZ[];
  baselineDifficulty: DifficultyTier;
  lesson: LessonBrief;
  courseContext: Pick<
    CourseBrief,
    'title' | 'difficulty_level' | 'professional_body' | 'additional_context'
  >;
  lessonId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const ALL_TIERS: DifficultyTier[] = ['beginner', 'intermediate', 'advanced'];

function getMissingTiers(baseline: DifficultyTier): DifficultyTier[] {
  return ALL_TIERS.filter((t) => t !== baseline);
}

// ── Prompts ──────────────────────────────────────────────────────────

function buildSystemPrompt(input: AdaptiveVariantInput): string {
  const missingTiers = getMissingTiers(input.baselineDifficulty);

  return `You are an adaptive learning specialist creating difficulty variants for Nigerian professional education.

ROLE: Given baseline lesson content at "${input.baselineDifficulty}" level, create two variants at different difficulty tiers: ${missingTiers.join(' and ')}.

VARIANT GUIDELINES:
- **beginner**: Simpler vocabulary, more examples, more step-by-step explanations. Quiz questions focus on "remember" and "understand" Bloom's levels. Use relatable Nigerian everyday analogies.
- **intermediate**: Balanced explanations with professional context. Mix of "understand", "apply", and "analyze" quiz questions. Reference Nigerian industry standards.
- **advanced**: Concise, assumes prior knowledge. Complex scenarios, edge cases, regulatory nuances. Quiz questions at "analyze", "evaluate", and "create" levels. Reference specific CBN circulars, IFRS standards, professional body frameworks.

CONSTRAINTS:
- Each text_block must be under 300 words.
- Preserve the same topic coverage and learning objectives as the baseline.
- Adapt language, depth, and examples — do NOT just copy.
- Text block IDs: "tb-{lessonId}-{tier[0]}-{index}" (e.g., "tb-lesson-001-b-00" for beginner).
- Quiz block IDs: "qb-{lessonId}-{tier[0]}-{index}".
- Each variant must have the same number of text blocks as the baseline (or within +/-1).
- Each variant must have 3-5 quiz blocks.

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "variants": [
    {
      "difficulty_tier": "${missingTiers[0]}",
      "text_blocks": [...],
      "quiz_blocks": [...]
    },
    {
      "difficulty_tier": "${missingTiers[1]}",
      "text_blocks": [...],
      "quiz_blocks": [...]
    }
  ]
}`;
}

function buildUserPrompt(input: AdaptiveVariantInput): string {
  const { baselineTextBlocks, baselineQuizBlocks, lesson, lessonId } = input;
  const missingTiers = getMissingTiers(input.baselineDifficulty);

  return `Create ${missingTiers.join(' and ')} variants for this lesson:

LESSON: ${lesson.title}
LEARNING OBJECTIVE: ${lesson.learning_objective}
LESSON ID: ${lessonId}
BASELINE DIFFICULTY: ${input.baselineDifficulty}

BASELINE TEXT BLOCKS:
${JSON.stringify(baselineTextBlocks, null, 2)}

BASELINE QUIZ BLOCKS:
${JSON.stringify(baselineQuizBlocks, null, 2)}

Generate both variants now.`;
}

// ── Main function ────────────────────────────────────────────────────

export async function generateAdaptiveVariants(
  input: AdaptiveVariantInput,
): Promise<StageResult<VariantsOutput>> {
  const client = getClient();
  const start = performance.now();

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL_ID,
      max_tokens: 16384,
      thinking: { type: 'adaptive' },
      system: buildSystemPrompt(input),
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    }),
  );

  const text = getResponseText(response);
  const raw = extractJson(text);
  const parsed = VariantsOutputSchema.parse(raw);

  // Validate word counts on all variant text blocks
  for (const variant of parsed.variants) {
    for (const block of variant.text_blocks) {
      const wordCount = block.content.split(/\s+/).length;
      if (wordCount > 300) {
        throw new Error(
          `Variant ${variant.difficulty_tier} block ${block.id} exceeds ` +
            `300-word limit (${wordCount} words)`,
        );
      }
    }
  }

  const usage: TokenUsage = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };

  return {
    data: parsed,
    usage,
    cost_usd: computeCost(usage),
    stage: 'adaptive_variant_generator',
    duration_ms: performance.now() - start,
  };
}
