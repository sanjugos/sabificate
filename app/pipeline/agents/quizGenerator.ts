/**
 * Stage 2 — Quiz Generator
 *
 * Takes lesson text blocks and produces quiz blocks (3-5 per lesson).
 * Enforces that at least 40% of quiz items target application/analysis
 * or higher Bloom's levels.
 */
import { z } from 'zod';
import { QuizBlockSchema } from '../schemas/contentSchema.ts';
import type { TextBlockZ } from '../schemas/contentSchema.ts';
import type { LessonBrief, CourseBrief } from '../schemas/briefSchema.ts';
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
import { CONTENT } from '../../contracts/shared/constants.ts';

// ── Output schema ────────────────────────────────────────────────────

const QuizOutputSchema = z.object({
  quiz_blocks: z
    .array(QuizBlockSchema)
    .min(CONTENT.MIN_QUIZ_ITEMS_PER_LESSON)
    .max(CONTENT.MAX_QUIZ_ITEMS_PER_LESSON),
});

type QuizOutput = z.infer<typeof QuizOutputSchema>;

// ── Input ────────────────────────────────────────────────────────────

export interface QuizGeneratorInput {
  textBlocks: TextBlockZ[];
  lesson: LessonBrief;
  courseContext: Pick<
    CourseBrief,
    'title' | 'difficulty_level' | 'professional_body' | 'additional_context'
  >;
  lessonId: string;
}

// ── Bloom level categories ───────────────────────────────────────────

const APPLICATION_AND_ABOVE = new Set([
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

// ── Prompts ──────────────────────────────────────────────────────────

function buildSystemPrompt(input: QuizGeneratorInput): string {
  const { courseContext } = input;
  const profBody = courseContext.professional_body
    ? `Questions should align with ${courseContext.professional_body} exam styles.`
    : '';

  return `You are an assessment designer for Nigerian professional education.

ROLE: Generate quiz questions based on lesson content.

CONSTRAINTS:
- Generate ${CONTENT.MIN_QUIZ_ITEMS_PER_LESSON} to ${CONTENT.MAX_QUIZ_ITEMS_PER_LESSON} quiz items.
- At least ${CONTENT.MIN_APPLICATION_QUIZ_PERCENT}% of quiz items must target "apply", "analyze", "evaluate", or "create" Bloom's levels.
- Each question must have 4 options (A-D).
- correct_answer is the 0-based index of the correct option.
- Explanations should reference Nigerian business contexts where applicable.
- ${profBody}
- Use IDs in format: "qb-{lessonId}-{index}" (zero-padded).

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "quiz_blocks": [
    {
      "type": "quiz_block",
      "id": "qb-lesson-001-00",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": 0,
      "explanation": "...",
      "bloom_level": "apply"
    }
  ]
}`;
}

function buildUserPrompt(input: QuizGeneratorInput): string {
  const { textBlocks, lesson, lessonId } = input;

  const blockTexts = textBlocks
    .map((b, i) => `[Block ${i + 1}] ${b.content}`)
    .join('\n\n');

  return `Generate quiz questions for this lesson:

LESSON: ${lesson.title}
LEARNING OBJECTIVE: ${lesson.learning_objective}
TARGET BLOOM LEVELS: ${lesson.target_bloom_levels.join(', ')}
LESSON ID: ${lessonId}

LESSON CONTENT:
${blockTexts}

Remember: at least ${CONTENT.MIN_APPLICATION_QUIZ_PERCENT}% of questions must be at "apply" level or higher.
Generate the quiz blocks now.`;
}

// ── Validation ───────────────────────────────────────────────────────

function validateBloomDistribution(blocks: QuizOutput['quiz_blocks']): void {
  const total = blocks.length;
  const higherOrder = blocks.filter((b) =>
    APPLICATION_AND_ABOVE.has(b.bloom_level),
  ).length;
  const percent = (higherOrder / total) * 100;

  if (percent < CONTENT.MIN_APPLICATION_QUIZ_PERCENT) {
    throw new Error(
      `Bloom distribution check failed: ${percent.toFixed(0)}% application+ ` +
        `(need >= ${CONTENT.MIN_APPLICATION_QUIZ_PERCENT}%). ` +
        `${higherOrder}/${total} items at apply/analyze/evaluate/create.`,
    );
  }
}

// ── Main function ────────────────────────────────────────────────────

export async function generateQuiz(
  input: QuizGeneratorInput,
): Promise<StageResult<QuizOutput>> {
  const client = getClient();
  const start = performance.now();

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL_ID,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: buildSystemPrompt(input),
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    }),
  );

  const text = getResponseText(response);
  const raw = extractJson(text);
  const parsed = QuizOutputSchema.parse(raw);

  // Enforce Bloom's distribution
  validateBloomDistribution(parsed.quiz_blocks);

  const usage: TokenUsage = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };

  return {
    data: parsed,
    usage,
    cost_usd: computeCost(usage),
    stage: 'quiz_generator',
    duration_ms: performance.now() - start,
  };
}
