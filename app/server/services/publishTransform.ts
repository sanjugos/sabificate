// ── Publish Transform ──────────────────────────────────────────────────────
// Pure function that converts Studio authoring_tracks data into
// learner-facing records (course, modules, lessons, lesson_content).
// No DB access — returns structured data ready for insertion.

import type { SpineNode, ContentBlock } from './curriculumAI.js';

// ── Input / Output types ──────────────────────────────────────────────────

export interface PublishTransformInput {
  trackId: string;
  name: string;
  vertical: string;
  customerTier: string;
  tierTreatment: string;
  credentialType: string;
  paywallLessonIndex: number;
  spine: SpineNode[];
}

export interface CourseRecord {
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty_level: string;
  customer_tier_treatment: string;
  credential_type: string;
  is_published: boolean;
}

export interface ModuleRecord {
  title: string;
  sort_order: number;
}

export interface LessonRecord {
  title: string;
  sort_order: number;
  estimated_duration_minutes: number;
  has_quiz: boolean;
  is_free: boolean;
  is_published: boolean;
  moduleIndex: number;
  content_foundational: { blocks: ContentBlock[] };
  content_working: { blocks: ContentBlock[] };
  content_applied: { blocks: ContentBlock[] };
}

export interface LessonContentRecord {
  difficulty_tier: 'foundational' | 'working' | 'applied';
  content_blocks: ContentBlock[];
  lessonIndex: number;
}

export interface PublishTransformOutput {
  course: CourseRecord;
  modules: ModuleRecord[];
  lessons: LessonRecord[];
  lessonContents: LessonContentRecord[];
  trackStatus: 'published';
}

// ── Slug generator ────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

// ── Transform ─────────────────────────────────────────────────────────────

export function publishTransform(input: PublishTransformInput): PublishTransformOutput {
  const { name, vertical, tierTreatment, credentialType, paywallLessonIndex, spine } = input;

  // ── Course ────────────────────────────────────────────────────────────
  const course: CourseRecord = {
    title: name,
    slug: toSlug(name),
    description: `Auto-published from authoring track: ${name}`,
    category: vertical,
    difficulty_level: 'working',
    customer_tier_treatment: tierTreatment,
    credential_type: credentialType,
    is_published: true,
  };

  // ── Modules, Lessons, LessonContents ──────────────────────────────────
  const modules: ModuleRecord[] = [];
  const lessons: LessonRecord[] = [];
  const lessonContents: LessonContentRecord[] = [];

  const TIERS = ['foundational', 'working', 'applied'] as const;

  for (let i = 0; i < spine.length; i++) {
    const node = spine[i];
    const depthCards = node.depth_cards;

    // One module per spine node
    modules.push({
      title: node.title,
      sort_order: node.index,
    });

    // Resolve depth card content (empty blocks if null)
    const foundational = depthCards?.foundational ?? { blocks: [] };
    const working = depthCards?.working ?? { blocks: [] };
    const applied = depthCards?.applied ?? { blocks: [] };

    const isFree = node.index < paywallLessonIndex;

    // One lesson per spine node
    lessons.push({
      title: node.title,
      sort_order: node.index,
      estimated_duration_minutes: 20,
      has_quiz: true,
      is_free: isFree,
      is_published: true,
      moduleIndex: i,
      content_foundational: foundational,
      content_working: working,
      content_applied: applied,
    });

    // Three lesson_content records per lesson (one per depth tier)
    const tierData: Record<typeof TIERS[number], { blocks: ContentBlock[] }> = {
      foundational,
      working,
      applied,
    };

    for (const tier of TIERS) {
      lessonContents.push({
        difficulty_tier: tier,
        content_blocks: tierData[tier].blocks,
        lessonIndex: i,
      });
    }
  }

  return {
    course,
    modules,
    lessons,
    lessonContents,
    trackStatus: 'published',
  };
}
