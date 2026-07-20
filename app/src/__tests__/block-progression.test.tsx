import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LessonPlayer } from '../components/course/LessonPlayer';
import type { LessonContent } from '../../contracts/schemas/content';

/**
 * T-007 — Block Progression and Tier Enforcement
 * Traces to: FR-4 / AC-4.6, AC-4.7
 *
 * Blocks in a lesson must be completed sequentially:
 *   - Only the current block (first uncompleted) is active/interactive
 *   - Blocks beyond (current completed + 1) are locked (dimmed/disabled)
 *   - Completing a block unlocks the next one
 *   - Clicking a locked block dot does not navigate to it
 */

const mockLesson: LessonContent = {
  id: 'lesson-prog-1',
  title: 'Sequential Progression Test',
  module_id: 'mod-1',
  course_id: 'course-1',
  sort_order: 1,
  estimated_duration_minutes: 10,
  next_lesson_id: null,
  prev_lesson_id: null,
  blocks: [
    {
      type: 'text_block',
      id: 'text-1',
      content: 'Welcome to the first block.',
      difficulty_tier: 'foundational',
    },
    {
      type: 'quiz_block',
      id: 'quiz-1',
      question: 'What is 2+2?',
      options: ['3', '4', '5'],
      correct_answer: 1,
      explanation: '2+2 equals 4.',
      bloom_level: 'remember',
    },
    {
      type: 'scenario_block',
      id: 'scenario-1',
      scenario: 'A customer complains about service.',
      company_type: 'Bank',
      regulatory_body: 'CBN',
      cultural_notes: 'Nigerian banking context.',
      decision_tree: [
        {
          id: 'node-1',
          text: 'How do you respond?',
          options: [
            { label: 'Apologize', next_node_id: null, feedback: 'Good choice.' },
          ],
        },
      ],
    },
  ],
};

const defaultProps = {
  lesson: mockLesson,
  difficulty: 'foundational' as const,
  dataSaverMode: 'full' as const,
  isOffline: false,
  onProgressUpdate: vi.fn(),
  onQuizSubmit: vi.fn(),
  onLessonComplete: vi.fn(),
};

describe('Block Progression and Tier Enforcement (T-007)', () => {
  it('renders the first block as active and shows later blocks as locked in the dot indicators', () => {
    render(<LessonPlayer {...defaultProps} />);

    // First block content should be visible
    expect(screen.getByText(/Welcome to the first block/)).toBeTruthy();

    // Card dots should exist (3 blocks <= 15, so dots render)
    const dots = screen.getAllByRole('button', { name: /Go to card/ });
    expect(dots).toHaveLength(3);

    // The third dot (locked block) should have the data-locked attribute
    // indicating it is non-interactive
    expect(dots[2]).toHaveAttribute('data-locked', 'true');
  });

  it('unlocks the second block after completing the first block via Next', () => {
    render(<LessonPlayer {...defaultProps} />);

    // The first block is a text block — it auto-completes on view.
    // The Next button should be enabled because the text block is auto-completed.
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).not.toBeDisabled();

    // Click Next to move to block 2
    fireEvent.click(nextButton);

    // Now the quiz block should be visible
    expect(screen.getByText('What is 2+2?')).toBeTruthy();

    // The second dot should now be active (current), third should still be locked
    const dots = screen.getAllByRole('button', { name: /Go to card/ });
    expect(dots[2]).toHaveAttribute('data-locked', 'true');
  });

  it('prevents navigation when clicking a locked block dot', () => {
    render(<LessonPlayer {...defaultProps} />);

    // First block content is visible
    expect(screen.getByText(/Welcome to the first block/)).toBeTruthy();

    // Click the third dot (locked scenario block)
    const dots = screen.getAllByRole('button', { name: /Go to card/ });
    fireEvent.click(dots[2]);

    // Should still show the first block — no navigation occurred
    expect(screen.getByText(/Welcome to the first block/)).toBeTruthy();
  });

  it('disables the Next button when the current block requires interaction and is not yet completed', () => {
    render(<LessonPlayer {...defaultProps} />);

    // Navigate to the quiz block (block index 1) by clicking Next
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    // Now on the quiz block — the Next button should be disabled until
    // the quiz is answered
    const nextButton2 = screen.getByRole('button', { name: 'Next' });
    expect(nextButton2).toBeDisabled();
  });

  it('enables the Next button after answering the quiz', () => {
    render(<LessonPlayer {...defaultProps} />);

    // Go to quiz block
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Answer the quiz: select option '4' (correct) and submit
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));

    // Now the Next button should be enabled
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).not.toBeDisabled();
  });
});
