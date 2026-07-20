import { useState } from 'react';
import type { QuizAnswer } from '../../../contracts/api/progress';
import type { QuizBlockProps } from '../../../contracts/components/lesson-player';

const BLOOM_COLORS: Record<string, string> = {
  remember: 'bg-blue-100 text-blue-800',
  understand: 'bg-green-100 text-green-800',
  apply: 'bg-yellow-100 text-yellow-800',
  analyze: 'bg-orange-100 text-orange-800',
  evaluate: 'bg-red-100 text-red-800',
  create: 'bg-purple-100 text-purple-800',
};

export function QuizBlock({
  id,
  question,
  options,
  correct_answer,
  explanation,
  bloom_level,
  onAnswer,
  previousAnswer,
}: QuizBlockProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(
    previousAnswer?.selected_option ?? null,
  );
  const [answered, setAnswered] = useState(!!previousAnswer);
  const isCorrect = selectedOption === correct_answer;

  function handleSelect(optionIndex: number) {
    if (answered) return;
    setSelectedOption(optionIndex);
  }

  function handleSubmit() {
    if (selectedOption === null || answered) return;

    setAnswered(true);

    const answer: QuizAnswer = {
      quiz_block_id: id,
      selected_option: selectedOption,
      is_correct: selectedOption === correct_answer,
      answered_at: new Date().toISOString(),
    };

    onAnswer(answer);
  }

  function optionStyle(index: number): string {
    const base =
      'w-full min-h-[44px] px-4 py-3 text-left rounded-lg border text-sm transition-colors';

    if (!answered) {
      if (index === selectedOption) {
        return `${base} border-[var(--accent)] bg-[var(--accent-bg)] ring-1 ring-[var(--accent-border)] cursor-pointer`;
      }
      return `${base} border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] active:bg-[var(--accent-bg)] cursor-pointer`;
    }

    if (index === correct_answer) {
      return `${base} border-green-500 bg-green-50 text-green-900`;
    }

    if (index === selectedOption && index !== correct_answer) {
      return `${base} border-red-500 bg-red-50 text-red-900`;
    }

    return `${base} border-[var(--border)] opacity-50 cursor-default`;
  }

  return (
    <div className="px-4 py-4">
      {/* Bloom level badge */}
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mb-3 ${BLOOM_COLORS[bloom_level] ?? 'bg-gray-100 text-gray-800'}`}
      >
        {bloom_level.charAt(0).toUpperCase() + bloom_level.slice(1)}
      </span>

      {/* Question */}
      <p className="text-base font-medium text-[var(--text-h)] mb-4">
        {question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            disabled={answered}
            onClick={() => handleSelect(index)}
            className={optionStyle(index)}
          >
            <span className="inline-flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Submit button */}
      {!answered && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedOption === null}
          className="mt-4 w-full min-h-[44px] rounded-lg bg-[var(--accent)] text-white text-sm font-medium transition-opacity disabled:opacity-40 active:opacity-80"
        >
          Submit Answer
        </button>
      )}

      {/* Feedback */}
      {answered && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            isCorrect
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <p className="font-semibold mb-1">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}
