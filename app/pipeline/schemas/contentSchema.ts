/**
 * Zod schemas for SABIficate content types.
 * Mirrors the TypeScript interfaces in contracts/schemas/content.ts.
 */
import { z } from 'zod';

// ── Enums ────────────────────────────────────────────────────────────

export const DifficultyTierSchema = z.enum([
  'foundational',
  'working',
  'applied',
]);

export const BloomLevelSchema = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

// ── Content Blocks ───────────────────────────────────────────────────

export const TextBlockSchema = z.object({
  type: z.literal('text_block'),
  id: z.string().min(1),
  content: z.string().min(1),
  difficulty_tier: DifficultyTierSchema,
});

export const QuizBlockSchema = z.object({
  type: z.literal('quiz_block'),
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correct_answer: z.number().int().min(0),
  explanation: z.string().min(1),
  bloom_level: BloomLevelSchema,
});

export const ArtifactPromptBlockSchema = z.object({
  type: z.literal('artifact_prompt_block'),
  id: z.string().min(1),
  prompt: z.string().min(1),
  target_role: z.string().min(1),
  industry_vertical: z.string().min(1),
  career_level: z.string().min(1),
  rubric: z.array(z.string().min(1)).min(1),
});

export const DecisionNodeSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  options: z.array(
    z.object({
      label: z.string().min(1),
      next_node_id: z.string().nullable(),
      feedback: z.string().min(1),
    }),
  ).min(1),
});

export const ScenarioBlockSchema = z.object({
  type: z.literal('scenario_block'),
  id: z.string().min(1),
  scenario: z.string().min(1),
  company_type: z.string().min(1),
  regulatory_body: z.string().min(1),
  cultural_notes: z.string().min(1),
  decision_tree: z.array(DecisionNodeSchema).min(1),
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  QuizBlockSchema,
  ArtifactPromptBlockSchema,
  ScenarioBlockSchema,
]);

// ── Lesson & Course Structures ───────────────────────────────────────

export const LessonContentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  module_id: z.string().min(1),
  course_id: z.string().min(1),
  sort_order: z.number().int().min(0),
  estimated_duration_minutes: z.number().int().min(1),
  blocks: z.array(ContentBlockSchema).min(1),
  next_lesson_id: z.string().nullable(),
  prev_lesson_id: z.string().nullable(),
});

export const LessonManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sort_order: z.number().int().min(0),
  estimated_duration_minutes: z.number().int().min(1),
  has_quiz: z.boolean(),
  has_artifact: z.boolean(),
});

export const ModuleManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sort_order: z.number().int().min(0),
  lessons: z.array(LessonManifestSchema).min(1),
});

export const CourseManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  difficulty_level: DifficultyTierSchema,
  estimated_duration_minutes: z.number().int().min(1),
  cpd_hours: z.number().nullable(),
  professional_body: z.string().nullable(),
  modules: z.array(ModuleManifestSchema).min(1),
});

// ── Inferred types ───────────────────────────────────────────────────

export type TextBlockZ = z.infer<typeof TextBlockSchema>;
export type QuizBlockZ = z.infer<typeof QuizBlockSchema>;
export type ArtifactPromptBlockZ = z.infer<typeof ArtifactPromptBlockSchema>;
export type ScenarioBlockZ = z.infer<typeof ScenarioBlockSchema>;
export type ContentBlockZ = z.infer<typeof ContentBlockSchema>;
export type LessonContentZ = z.infer<typeof LessonContentSchema>;
export type CourseManifestZ = z.infer<typeof CourseManifestSchema>;
export type ModuleManifestZ = z.infer<typeof ModuleManifestSchema>;
export type LessonManifestZ = z.infer<typeof LessonManifestSchema>;
