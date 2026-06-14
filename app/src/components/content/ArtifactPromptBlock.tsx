import { useState } from 'react';
import type { ArtifactPromptProps } from '../../../contracts/components/lesson-player';

export function ArtifactPromptBlock({
  prompt,
  target_role,
  industry_vertical,
  career_level,
  rubric,
  onSubmit,
}: ArtifactPromptProps) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    () => rubric.map(() => false),
  );

  function handleSubmit() {
    if (!text.trim() || submitted) return;
    setSubmitted(true);
    onSubmit(text);
  }

  function toggleRubricItem(index: number) {
    setCheckedItems((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  return (
    <div className="px-4 py-4">
      {/* Context badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)] px-2.5 py-0.5 text-xs font-medium">
          {target_role}
        </span>
        <span className="inline-flex items-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)] px-2.5 py-0.5 text-xs font-medium">
          {industry_vertical}
        </span>
        <span className="inline-flex items-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)] px-2.5 py-0.5 text-xs font-medium">
          {career_level}
        </span>
      </div>

      {/* Prompt */}
      <div className="bg-[var(--code-bg)] rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-[var(--text-h)] mb-1">
          Artifact Prompt
        </p>
        <p className="text-sm text-[var(--text)] leading-relaxed">{prompt}</p>
      </div>

      {/* Rubric checklist */}
      {rubric.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-2">
            Rubric
          </p>
          <ul className="space-y-2">
            {rubric.map((item, index) => (
              <li key={index}>
                <label className="flex items-start gap-2 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedItems[index]}
                    onChange={() => toggleRubricItem(index)}
                    className="mt-1 w-5 h-5 rounded border-[var(--border)] accent-[var(--accent)] flex-shrink-0"
                  />
                  <span className="text-sm text-[var(--text)] leading-relaxed">
                    {item}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitted}
        placeholder="Write your artifact response here..."
        rows={6}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text-h)] placeholder:text-[var(--text)] resize-y focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] disabled:opacity-50"
      />

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!text.trim() || submitted}
        className="mt-3 w-full min-h-[44px] rounded-lg bg-[var(--accent)] text-white text-sm font-medium transition-opacity disabled:opacity-40 active:opacity-80"
      >
        {submitted ? 'Submitted' : 'Submit Artifact'}
      </button>

      {submitted && (
        <p className="mt-2 text-xs text-green-600 text-center">
          Your response has been saved.
        </p>
      )}
    </div>
  );
}
