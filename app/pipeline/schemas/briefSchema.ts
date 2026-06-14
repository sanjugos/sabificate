/**
 * Zod schema for validating SME (Subject Matter Expert) briefs.
 * An SME brief is the input to the AI content pipeline — it describes
 * what course content Claude should generate.
 */
import { z } from 'zod';
import { DifficultyTierSchema, BloomLevelSchema } from './contentSchema.ts';

// ── Lesson Brief ─────────────────────────────────────────────────────

export const LessonBriefSchema = z.object({
  /** Human-readable title for the lesson. */
  title: z.string().min(1),

  /** Short description of what the learner will achieve. */
  learning_objective: z.string().min(1),

  /**
   * Key topics the lesson must cover.
   * Each topic should be a concise phrase or sentence.
   */
  key_topics: z.array(z.string().min(1)).min(1),

  /** Estimated lesson duration in minutes. */
  estimated_duration_minutes: z.number().int().min(1),

  /**
   * Bloom's taxonomy levels the lesson should target.
   * At least one level must be specified.
   */
  target_bloom_levels: z.array(BloomLevelSchema).min(1),

  /** Whether this lesson should include an artifact prompt exercise. */
  include_artifact: z.boolean().default(false),

  /**
   * Optional scenario context for scenario blocks.
   * When provided, the pipeline will generate a scenario block
   * tied to a Nigerian business context.
   */
  scenario_context: z.string().optional(),
});

// ── Module Brief ─────────────────────────────────────────────────────

export const ModuleBriefSchema = z.object({
  /** Human-readable module title. */
  title: z.string().min(1),

  /** One-paragraph description of the module scope. */
  description: z.string().min(1),

  /** Ordered list of lesson briefs within this module. */
  lessons: z.array(LessonBriefSchema).min(1),
});

// ── Course Brief (top-level SME input) ───────────────────────────────

export const CourseBriefSchema = z.object({
  /** Course title as it will appear in the catalogue. */
  title: z.string().min(1),

  /** URL-safe slug for the course. */
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens (e.g. "financial-analysis-101")',
  }),

  /** Marketing-ready description (1-3 sentences). */
  description: z.string().min(10),

  /** Subject category (e.g. "Finance", "HR Management", "Tax Compliance"). */
  category: z.string().min(1),

  /** Target difficulty for the default variant. */
  difficulty_level: DifficultyTierSchema,

  /** Nigerian professional body this course aligns with, if any. */
  professional_body: z.enum(['CIBN', 'ICAN', 'CITN', 'CIPM']).nullable().default(null),

  /** CPD hours this course qualifies for, if any. */
  cpd_hours: z.number().min(0).nullable().default(null),

  /** Industry vertical for artifact prompts (e.g. "Banking", "Oil & Gas"). */
  industry_vertical: z.string().min(1),

  /** Target career level (e.g. "Entry-level", "Mid-career", "Senior"). */
  target_career_level: z.string().min(1),

  /** Ordered list of module briefs. */
  modules: z.array(ModuleBriefSchema).min(1),

  /**
   * Additional context the SME wants Claude to keep in mind.
   * Regulatory details, cultural nuances, industry-specific terminology, etc.
   */
  additional_context: z.string().optional(),
});

// ── Inferred types ───────────────────────────────────────────────────

export type LessonBrief = z.infer<typeof LessonBriefSchema>;
export type ModuleBrief = z.infer<typeof ModuleBriefSchema>;
export type CourseBrief = z.infer<typeof CourseBriefSchema>;
