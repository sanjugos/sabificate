import type { DifficultyTier, BloomLevel } from '../types';

export interface TextBlock {
  type: 'text_block';
  id: string;
  content: string;
  difficulty_tier: DifficultyTier;
}

export interface QuizBlock {
  type: 'quiz_block';
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  bloom_level: BloomLevel;
}

export interface ArtifactPromptBlock {
  type: 'artifact_prompt_block';
  id: string;
  prompt: string;
  target_role: string;
  industry_vertical: string;
  career_level: string;
  rubric: string[];
}

export interface DecisionNode {
  id: string;
  text: string;
  options: { label: string; next_node_id: string | null; feedback: string }[];
}

export interface ScenarioBlock {
  type: 'scenario_block';
  id: string;
  scenario: string;
  company_type: string;
  regulatory_body: string;
  cultural_notes: string;
  decision_tree: DecisionNode[];
}

export type ContentBlock = TextBlock | QuizBlock | ArtifactPromptBlock | ScenarioBlock;

export interface LessonContent {
  id: string;
  title: string;
  module_id: string;
  course_id: string;
  sort_order: number;
  estimated_duration_minutes: number;
  blocks: ContentBlock[];
  next_lesson_id: string | null;
  prev_lesson_id: string | null;
}

export interface CourseManifest {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty_level: DifficultyTier;
  estimated_duration_minutes: number;
  cpd_hours: number | null;
  professional_body: string | null;
  modules: ModuleManifest[];
}

export interface ModuleManifest {
  id: string;
  title: string;
  sort_order: number;
  lessons: LessonManifest[];
}

export interface LessonManifest {
  id: string;
  title: string;
  sort_order: number;
  estimated_duration_minutes: number;
  has_quiz: boolean;
  has_artifact: boolean;
}
