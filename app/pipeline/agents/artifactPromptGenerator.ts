/**
 * Stage 4 — Artifact Prompt Generator
 *
 * Takes lesson content and generates artifact_prompt_blocks —
 * practical, role-based exercises that learners complete as
 * downloadable artifacts (reports, plans, analyses, etc.).
 *
 * Only runs for lessons where include_artifact === true in the brief.
 */
import { z } from 'zod';
import { ArtifactPromptBlockSchema } from '../schemas/contentSchema.ts';
import type { TextBlockZ, QuizBlockZ } from '../schemas/contentSchema.ts';
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

const ArtifactOutputSchema = z.object({
  artifact_prompt_blocks: z.array(ArtifactPromptBlockSchema).min(1).max(2),
});

type ArtifactOutput = z.infer<typeof ArtifactOutputSchema>;

// ── Input ────────────────────────────────────────────────────────────

export interface ArtifactPromptInput {
  textBlocks: TextBlockZ[];
  quizBlocks: QuizBlockZ[];
  lesson: LessonBrief;
  courseContext: Pick<
    CourseBrief,
    | 'title'
    | 'difficulty_level'
    | 'professional_body'
    | 'industry_vertical'
    | 'target_career_level'
    | 'additional_context'
  >;
  lessonId: string;
}

// ── Prompts ──────────────────────────────────────────────────────────

function buildSystemPrompt(input: ArtifactPromptInput): string {
  const { courseContext } = input;

  return `You are a workplace learning designer creating practical artifact exercises for Nigerian professionals.

ROLE: Generate artifact prompt blocks — hands-on exercises where learners produce a professional deliverable.

CONTEXT:
- Industry: ${courseContext.industry_vertical}
- Career level: ${courseContext.target_career_level}
- Professional body: ${courseContext.professional_body ?? 'None specified'}

CONSTRAINTS:
- Generate 1-2 artifact prompt blocks per lesson.
- Each artifact should be a realistic workplace deliverable (memo, analysis, report, plan, presentation outline, etc.).
- The prompt must clearly describe what the learner should produce.
- target_role: the professional role that would normally produce this artifact.
- industry_vertical: "${courseContext.industry_vertical}".
- career_level: "${courseContext.target_career_level}".
- rubric: 4-6 evaluation criteria as short, assessable statements.
- Use Nigerian business contexts (companies, regulations, currency in NGN, cultural norms).
- IDs: "ap-{lessonId}-{index}" (zero-padded).

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "artifact_prompt_blocks": [
    {
      "type": "artifact_prompt_block",
      "id": "ap-lesson-001-00",
      "prompt": "Draft a credit risk assessment memo for...",
      "target_role": "Credit Analyst",
      "industry_vertical": "Banking",
      "career_level": "Mid-career",
      "rubric": [
        "Correctly identifies key risk factors",
        "References relevant CBN guidelines",
        "Uses appropriate financial ratios",
        "Provides actionable recommendations"
      ]
    }
  ]
}`;
}

function buildUserPrompt(input: ArtifactPromptInput): string {
  const { textBlocks, quizBlocks, lesson, lessonId } = input;

  const blockSummary = textBlocks
    .map((b, i) => `[Block ${i + 1}] ${b.content.slice(0, 200)}...`)
    .join('\n');

  const quizSummary = quizBlocks
    .map((q) => `- ${q.question} (${q.bloom_level})`)
    .join('\n');

  return `Generate artifact prompt(s) for this lesson:

LESSON: ${lesson.title}
LEARNING OBJECTIVE: ${lesson.learning_objective}
LESSON ID: ${lessonId}

${lesson.scenario_context ? `SCENARIO CONTEXT:\n${lesson.scenario_context}\n` : ''}
LESSON CONTENT SUMMARY:
${blockSummary}

QUIZ TOPICS COVERED:
${quizSummary}

Generate the artifact prompt block(s) now.`;
}

// ── Main function ────────────────────────────────────────────────────

export async function generateArtifactPrompts(
  input: ArtifactPromptInput,
): Promise<StageResult<ArtifactOutput>> {
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
  const parsed = ArtifactOutputSchema.parse(raw);

  const usage: TokenUsage = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };

  return {
    data: parsed,
    usage,
    cost_usd: computeCost(usage),
    stage: 'artifact_prompt_generator',
    duration_ms: performance.now() - start,
  };
}
