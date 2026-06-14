import type { DifficultyTier, ProfessionalBody, Pagination } from '../types';

export interface CourseListRequest {
  query?: string;
  category?: string;
  difficulty?: DifficultyTier;
  page?: number;
  limit?: number;
}

export interface CourseListResponse {
  courses: CourseSummary[];
  pagination: Pagination;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: { id: string; name: string; slug: string };
  difficulty_level: DifficultyTier;
  estimated_duration_minutes: number;
  cpd_hours: number | null;
  professional_body: ProfessionalBody;
  lesson_count: number;
  module_count: number;
}

export interface CourseDetail extends CourseSummary {
  learning_objectives: string[];
  prerequisites: string[];
  modules: {
    id: string;
    title: string;
    sort_order: number;
    lessons: {
      id: string;
      title: string;
      sort_order: number;
      estimated_duration_minutes: number;
      has_quiz: boolean;
      has_artifact: boolean;
    }[];
  }[];
  enrollment_status: 'enrolled' | 'not_enrolled' | null;
}

export interface CategoryListResponse {
  categories: {
    id: string;
    name: string;
    slug: string;
    course_count: number;
  }[];
}
