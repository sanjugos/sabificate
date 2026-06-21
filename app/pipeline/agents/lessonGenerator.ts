/**
 * Stage 1 — Lesson Generator
 *
 * Takes an SME brief for a single lesson and produces an array of
 * TextBlock content. Each block respects the 300-word limit and
 * targets the specified Bloom's taxonomy levels.
 */
import { z } from 'zod';
import { TextBlockSchema } from '../schemas/contentSchema.ts';
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

// ── Output schema ────────────────────────────────────────────────────

const LessonOutputSchema = z.object({
  blocks: z.array(TextBlockSchema).min(1),
});

type LessonOutput = z.infer<typeof LessonOutputSchema>;

// ── Input ────────────────────────────────────────────────────────────

export interface LessonGeneratorInput {
  lesson: LessonBrief;
  moduleTitle: string;
  courseContext: Pick<
    CourseBrief,
    | 'title'
    | 'category'
    | 'difficulty_level'
    | 'professional_body'
    | 'industry_vertical'
    | 'additional_context'
  >;
  lessonId: string;
  sortIndex: number;
}

// ── System prompt ────────────────────────────────────────────────────

function buildSystemPrompt(input: LessonGeneratorInput): string {
  const { courseContext } = input;
  const profBody = courseContext.professional_body
    ? `Align content with ${courseContext.professional_body} competency frameworks.`
    : '';
  const extra = courseContext.additional_context ?? '';

  return `You are a senior instructional designer creating professional education content for Nigerian learners.

ROLE: Generate lesson text content as structured JSON.

CONSTRAINTS:
- Each text_block must be under 300 words.
- Use clear, professional English appropriate for ${courseContext.difficulty_level}-level Nigerian professionals.
- Include Nigerian examples, case studies, and references where relevant.
- Use Naira (NGN) for monetary examples.
- ${profBody}
- Target Bloom's taxonomy levels specified in the brief.
- Generate between 3-6 text blocks per lesson, ordered for pedagogical flow.
- Each block must have a unique id in the format: "tb-{lessonId}-{index}" (zero-padded index).

OUTPUT FORMAT:
Return ONLY valid JSON matching this structure:
{
  "blocks": [
    {
      "type": "text_block",
      "id": "tb-lesson-001-00",
      "content": "...",
      "difficulty_tier": "foundational" | "working" | "applied"
    }
  ]
}

${extra ? `ADDITIONAL CONTEXT FROM SME:\n${extra}` : ''}`;
}

function buildUserPrompt(input: LessonGeneratorInput): string {
  const { lesson, moduleTitle, lessonId, sortIndex } = input;

  return `Generate lesson content for:

COURSE MODULE: ${moduleTitle}
LESSON ${sortIndex + 1}: ${lesson.title}

LEARNING OBJECTIVE:
${lesson.learning_objective}

KEY TOPICS TO COVER:
${lesson.key_topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

TARGET BLOOM LEVELS: ${lesson.target_bloom_levels.join(', ')}
DIFFICULTY: ${input.courseContext.difficulty_level}
ESTIMATED DURATION: ${lesson.estimated_duration_minutes} minutes

LESSON ID FOR BLOCK IDS: ${lessonId}

${lesson.scenario_context ? `SCENARIO CONTEXT (for reference, scenario block generated separately):\n${lesson.scenario_context}` : ''}

Generate the text blocks now.`;
}

// ── Main function ────────────────────────────────────────────────────

export async function generateLesson(
  input: LessonGeneratorInput,
): Promise<StageResult<LessonOutput>> {
  const client = getClient();
  const start = performance.now();

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL_ID,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: buildSystemPrompt(input),
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    }),
  );

  const text = getResponseText(response);
  const raw = extractJson(text);
  const parsed = LessonOutputSchema.parse(raw);

  // Validate word counts
  for (const block of parsed.blocks) {
    const wordCount = block.content.split(/\s+/).length;
    if (wordCount > 300) {
      throw new Error(
        `Block ${block.id} exceeds 300-word limit (${wordCount} words)`,
      );
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
    stage: 'lesson_generator',
    duration_ms: performance.now() - start,
  };
}
