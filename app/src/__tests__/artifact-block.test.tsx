import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ArtifactPromptBlock } from '../components/content/ArtifactPromptBlock';

const baseProps = {
  id: 'artifact-1',
  prompt: 'Draft a compliance checklist for a fintech startup.',
  target_role: 'Compliance Officer',
  industry_vertical: 'Fintech',
  career_level: 'Mid-level',
  rubric: ['Covers KYC requirements', 'Includes AML provisions'],
  onSubmit: vi.fn(),
};

describe('ArtifactPromptBlock', () => {
  it('shows char count and keeps submit disabled when text is under 50 characters', () => {
    render(<ArtifactPromptBlock {...baseProps} />);

    const textarea = screen.getByPlaceholderText(/write your artifact/i);

    // Type 30 characters
    fireEvent.change(textarea, { target: { value: 'A'.repeat(30) } });

    // Should show character count indicating 30/50
    expect(screen.getByText(/30\s*\/\s*50/)).toBeTruthy();

    // Submit button should be disabled
    const submitBtn = screen.getByRole('button', { name: /submit artifact/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button when text reaches 50 characters', () => {
    render(<ArtifactPromptBlock {...baseProps} />);

    const textarea = screen.getByPlaceholderText(/write your artifact/i);

    // Type exactly 50 characters
    fireEvent.change(textarea, { target: { value: 'A'.repeat(50) } });

    // Submit should be enabled
    const submitBtn = screen.getByRole('button', { name: /submit artifact/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with the text when submit is clicked', () => {
    const onSubmit = vi.fn();
    render(<ArtifactPromptBlock {...baseProps} onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/write your artifact/i);
    const longText = 'This is a sufficiently long response for the artifact prompt block.';
    fireEvent.change(textarea, { target: { value: longText } });

    const submitBtn = screen.getByRole('button', { name: /submit artifact/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith(longText);
  });
});
