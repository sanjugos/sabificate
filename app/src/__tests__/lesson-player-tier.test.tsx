import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LessonPlayer } from '../components/course/LessonPlayer';
import type { LessonContent } from '../../contracts/schemas/content';

const mockLesson: LessonContent = {
  id: 'lesson-1',
  title: 'Introduction to Banking Compliance',
  module_id: 'mod-1',
  course_id: 'course-1',
  sort_order: 1,
  estimated_duration_minutes: 15,
  next_lesson_id: null,
  prev_lesson_id: null,
  blocks: [
    {
      type: 'text_block',
      id: 'block-1',
      content: 'Welcome to the foundational lesson on compliance.',
      difficulty_tier: 'foundational',
    },
    {
      type: 'quiz_block',
      id: 'block-2',
      question: 'What does KYC stand for?',
      options: ['Know Your Customer', 'Keep Your Cash', 'Key Yearly Compliance'],
      correct_answer: 0,
      explanation: 'KYC stands for Know Your Customer.',
      bloom_level: 'remember',
    },
  ],
};

describe('LessonPlayer with proficiency tier', () => {
  it('renders content blocks for foundational proficiency', () => {
    render(
      <LessonPlayer
        lesson={mockLesson}
        difficulty="foundational"
        dataSaverMode="full"
        isOffline={false}
        onProgressUpdate={vi.fn()}
        onQuizSubmit={vi.fn()}
        onLessonComplete={vi.fn()}
      />,
    );

    // Lesson title should be displayed
    expect(screen.getByText('Introduction to Banking Compliance')).toBeTruthy();

    // The first block content should be visible
    // TextBlock renders the content text
    expect(screen.getByText(/Welcome to the foundational lesson/)).toBeTruthy();
  });

  it('shows the difficulty selector with foundational selected', () => {
    render(
      <LessonPlayer
        lesson={mockLesson}
        difficulty="foundational"
        dataSaverMode="full"
        isOffline={false}
        onProgressUpdate={vi.fn()}
        onQuizSubmit={vi.fn()}
        onLessonComplete={vi.fn()}
      />,
    );

    const select = screen.getByDisplayValue('Foundational');
    expect(select).toBeTruthy();
  });
});
