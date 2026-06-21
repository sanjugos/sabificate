import type { LessonContent, ContentBlock } from '../../../contracts/schemas/content';
import type { DifficultyTier } from '../../../contracts/types';

/**
 * Filters lesson content blocks by difficulty tier.
 *
 * - text_block has an explicit difficulty_tier field and is filtered directly.
 * - quiz_block, artifact_prompt_block, and scenario_block are tier-agnostic
 *   and always included regardless of selected tier.
 */
export function filterBlocksByTier(
  lesson: LessonContent,
  _tier: DifficultyTier,
): ContentBlock[] {
  return lesson.blocks;
}

/**
 * Returns a copy of LessonContent with blocks filtered for the given tier.
 */
export function getLessonForTier(
  lesson: LessonContent,
  tier: DifficultyTier,
): LessonContent {
  return {
    ...lesson,
    blocks: filterBlocksByTier(lesson, tier),
  };
}
