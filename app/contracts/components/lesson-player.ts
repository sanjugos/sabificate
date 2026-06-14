import type { ContentBlock, LessonContent } from '../schemas/content';
import type { DifficultyTier, DataSaverMode } from '../types';
import type { QuizAnswer } from '../api/progress';

export interface LessonPlayerProps {
  lesson: LessonContent;
  difficulty: DifficultyTier;
  onProgressUpdate: (progress: ProgressUpdate) => void;
  onQuizSubmit: (answer: QuizAnswer) => void;
  onLessonComplete: () => void;
  dataSaverMode: DataSaverMode;
  isOffline: boolean;
}

export interface ProgressUpdate {
  lesson_id: string;
  block_index: number;
  time_spent_seconds: number;
  progress_percent: number;
}

export interface ContentBlockRendererProps {
  block: ContentBlock;
  dataSaverMode: DataSaverMode;
  onQuizAnswer?: (answer: QuizAnswer) => void;
}

export interface QuizBlockProps {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  bloom_level: string;
  onAnswer: (answer: QuizAnswer) => void;
  previousAnswer?: QuizAnswer;
}

export interface ArtifactPromptProps {
  id: string;
  prompt: string;
  target_role: string;
  industry_vertical: string;
  career_level: string;
  rubric: string[];
  onSubmit: (text: string) => void;
}

export interface CourseCatalogCardProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  difficulty_level: DifficultyTier;
  estimated_duration_minutes: number;
  lesson_count: number;
  cpd_hours: number | null;
}
