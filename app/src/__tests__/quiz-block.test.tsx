import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizBlock } from '../components/content/QuizBlock';

const baseProps = {
  id: 'quiz-1',
  question: 'What is the capital of Nigeria?',
  options: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'],
  correct_answer: 1,
  explanation: 'Abuja became Nigeria\'s capital in 1991.',
  bloom_level: 'remember' as const,
  onAnswer: vi.fn(),
};

describe('QuizBlock', () => {
  it('renders with options and a submit button', () => {
    render(<QuizBlock {...baseProps} />);

    // All four options visible
    expect(screen.getByText('Lagos')).toBeTruthy();
    expect(screen.getByText('Abuja')).toBeTruthy();
    expect(screen.getByText('Kano')).toBeTruthy();
    expect(screen.getByText('Port Harcourt')).toBeTruthy();

    // Submit button exists and is disabled before selection
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    expect(submitBtn).toBeTruthy();
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button after selecting an option', () => {
    render(<QuizBlock {...baseProps} />);

    // Click an option to select it
    fireEvent.click(screen.getByText('Abuja'));

    // Submit button should now be enabled
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows Correct feedback after submitting the right answer', () => {
    const onAnswer = vi.fn();
    render(<QuizBlock {...baseProps} onAnswer={onAnswer} />);

    // Select the correct option (index 1 = Abuja)
    fireEvent.click(screen.getByText('Abuja'));

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitBtn);

    // Should show "Correct!" feedback
    expect(screen.getByText('Correct!')).toBeTruthy();
    // Should show explanation
    expect(screen.getByText(/Abuja became Nigeria/)).toBeTruthy();
    // onAnswer should have been called
    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        quiz_block_id: 'quiz-1',
        selected_option: 1,
        is_correct: true,
      }),
    );
  });

  it('shows Incorrect feedback after submitting the wrong answer', () => {
    const onAnswer = vi.fn();
    render(<QuizBlock {...baseProps} onAnswer={onAnswer} />);

    // Select the wrong option (index 0 = Lagos)
    fireEvent.click(screen.getByText('Lagos'));

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitBtn);

    // Should show "Incorrect" feedback
    expect(screen.getByText('Incorrect')).toBeTruthy();
    // onAnswer should have been called with is_correct: false
    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        quiz_block_id: 'quiz-1',
        selected_option: 0,
        is_correct: false,
      }),
    );
  });
});
