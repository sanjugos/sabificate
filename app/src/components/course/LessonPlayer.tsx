import { useState, useEffect, useRef, useCallback } from 'react';
import type { LessonPlayerProps, ProgressUpdate } from '../../../contracts/components/lesson-player';
import type { QuizAnswer } from '../../../contracts/api/progress';
import type { DifficultyTier } from '../../../contracts/types';
import { ContentBlockRenderer } from '../content/ContentBlockRenderer';
import { filterBlocksByTier } from '../../lib/content/contentParser';

const DIFFICULTY_OPTIONS: { value: DifficultyTier; label: string }[] = [
  { value: 'foundational', label: 'Foundational' },
  { value: 'working', label: 'Working' },
  { value: 'applied', label: 'Applied' },
];

interface LessonPlayerExtendedProps extends LessonPlayerProps {
  onNavigate?: (lessonId: string) => void;
}

export function LessonPlayer({
  lesson,
  difficulty,
  onProgressUpdate,
  onQuizSubmit,
  onLessonComplete,
  onArtifactSubmit,
  onScenarioComplete,
  dataSaverMode,
  onNavigate,
}: LessonPlayerExtendedProps) {
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyTier>(difficulty);
  const [cardIndex, setCardIndex] = useState(0);
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]));
  const [quizAnswers, setQuizAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const timeStartRef = useRef<number>(Date.now());
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const completeFiredRef = useRef(false);

  const blocks = filterBlocksByTier(lesson, currentDifficulty);
  const totalCards = blocks.length;
  const currentBlock = blocks[cardIndex];
  const isLastCard = cardIndex === totalCards - 1;
  const isFirstCard = cardIndex === 0;

  // A block is considered completed if it's in the completedBlocks set
  // OR if it's a text_block that has been viewed (text blocks auto-complete on view).
  const isBlockCompleted = useCallback((index: number): boolean => {
    if (completedBlocks.has(index)) return true;
    // Text blocks are auto-completed once viewed
    const block = blocks[index];
    return block?.type === 'text_block' && viewedCards.has(index);
  }, [completedBlocks, blocks, viewedCards]);

  // Sequential lock: a block is unlocked if all blocks before it are completed
  // maxUnlockedIndex = first index where the block is not completed, i.e. highest
  // contiguous completed index + 1
  const maxUnlockedIndex = (() => {
    let max = 0;
    for (let i = 0; i < totalCards; i++) {
      if (isBlockCompleted(i)) {
        max = i + 1;
      } else {
        break;
      }
    }
    return max;
  })();

  const isBlockLocked = (index: number): boolean => index > maxUnlockedIndex;
  const isCurrentBlockCompleted = isBlockCompleted(cardIndex);

  const progressPercent = totalCards > 0
    ? Math.round((viewedCards.size / totalCards) * 100)
    : 0;

  // Reset on lesson change
  useEffect(() => {
    setCardIndex(0);
    setViewedCards(new Set([0]));
    setQuizAnswers(new Map());
    setCompletedBlocks(new Set());
    timeStartRef.current = Date.now();
    completeFiredRef.current = false;
  }, [lesson.id]);

  // Mark card as viewed when index changes
  useEffect(() => {
    setViewedCards((prev) => {
      if (prev.has(cardIndex)) return prev;
      const next = new Set(prev);
      next.add(cardIndex);
      return next;
    });
  }, [cardIndex]);

  // Report progress when viewed cards change
  useEffect(() => {
    const timeSpent = Math.round((Date.now() - timeStartRef.current) / 1000);
    const update: ProgressUpdate = {
      lesson_id: lesson.id,
      block_index: cardIndex,
      time_spent_seconds: timeSpent,
      progress_percent: progressPercent,
    };
    onProgressUpdate(update);

    if (viewedCards.size >= totalCards && totalCards > 0 && !completeFiredRef.current) {
      completeFiredRef.current = true;
      onLessonComplete();
    }
  }, [viewedCards.size, cardIndex, progressPercent, totalCards, lesson.id, onProgressUpdate, onLessonComplete]);

  const goNext = useCallback(() => {
    if (cardIndex < totalCards - 1 && isCurrentBlockCompleted) setCardIndex((i) => i + 1);
  }, [cardIndex, totalCards, isCurrentBlockCompleted]);

  const goPrev = useCallback(() => {
    if (cardIndex > 0) setCardIndex((i) => i - 1);
  }, [cardIndex]);

  // Touch swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      const dt = Date.now() - touchRef.current.t;
      touchRef.current = null;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && dt < 500) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev],
  );

  const handleQuizAnswer = useCallback(
    (answer: QuizAnswer) => {
      setQuizAnswers((prev) => {
        const next = new Map(prev);
        next.set(answer.quiz_block_id, answer);
        return next;
      });
      // Mark the current block as completed when a quiz is answered
      setCompletedBlocks((prev) => {
        if (prev.has(cardIndex)) return prev;
        const next = new Set(prev);
        next.add(cardIndex);
        return next;
      });
      onQuizSubmit(answer);
    },
    [onQuizSubmit, cardIndex],
  );

  const handleScenarioComplete = useCallback(
    (blockId: string, decisions: { nodeId: string; choiceLabel: string; feedback: string }[]) => {
      // Mark the current block as completed when a scenario finishes
      setCompletedBlocks((prev) => {
        if (prev.has(cardIndex)) return prev;
        const next = new Set(prev);
        next.add(cardIndex);
        return next;
      });
      onScenarioComplete?.(blockId, decisions);
    },
    [onScenarioComplete, cardIndex],
  );

  const handleArtifactSubmit = useCallback(
    (blockId: string, text: string) => {
      // Mark the current block as completed when an artifact is submitted
      setCompletedBlocks((prev) => {
        if (prev.has(cardIndex)) return prev;
        const next = new Set(prev);
        next.add(cardIndex);
        return next;
      });
      onArtifactSubmit?.(blockId, text);
    },
    [onArtifactSubmit, cardIndex],
  );

  return (
    <div className="flex flex-col h-full min-w-[360px]">
      {/* Top bar: progress + title */}
      <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)]">
        <div className="h-1 bg-[var(--border)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-[var(--text-h)] truncate">
              {lesson.title}
            </h1>
            <p className="text-xs text-[var(--text)]">
              {cardIndex + 1} of {totalCards}
              {lesson.estimated_duration_minutes > 0 &&
                ` · ~${lesson.estimated_duration_minutes} min`}
            </p>
          </div>

          <select
            value={currentDifficulty}
            onChange={(e) =>
              setCurrentDifficulty(e.target.value as DifficultyTier)
            }
            className="ml-3 min-h-[44px] px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card content — single block at a time */}
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentBlock ? (
          <ContentBlockRenderer
            block={currentBlock}
            dataSaverMode={dataSaverMode}
            onQuizAnswer={handleQuizAnswer}
            onArtifactSubmit={handleArtifactSubmit}
            onScenarioComplete={handleScenarioComplete}
            previousQuizAnswer={
              currentBlock.type === 'quiz_block'
                ? quizAnswers.get(currentBlock.id)
                : undefined
            }
          />
        ) : (
          <div className="flex items-center justify-center py-16 px-4">
            <p className="text-sm text-[var(--text)] text-center">
              No content available for the {currentDifficulty} level. Try
              selecting a different difficulty.
            </p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-[var(--border)] bg-[var(--bg)]">
        {/* Card dots — only show when <= 15 cards */}
        {totalCards > 0 && totalCards <= 15 && (
          <div className="flex justify-center gap-1.5 pt-3 pb-2 px-4">
            {blocks.map((_, i) => {
              const locked = isBlockLocked(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (!locked) setCardIndex(i); }}
                  data-locked={locked ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    locked
                      ? 'bg-[var(--border)] opacity-30 w-2 cursor-not-allowed'
                      : i === cardIndex
                        ? 'bg-[var(--accent)] w-4'
                        : viewedCards.has(i)
                          ? 'bg-[var(--accent)] opacity-40 w-2'
                          : 'bg-[var(--border)] w-2'
                  }`}
                  aria-label={`Go to card ${i + 1}`}
                />
              );
            })}
          </div>
        )}

        {/* Prev / Next buttons */}
        <div className="flex gap-3 px-4 pb-4 pt-1">
          <button
            type="button"
            disabled={isFirstCard}
            onClick={goPrev}
            className="flex-1 min-h-[44px] rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-h)] transition-colors active:bg-[var(--accent-bg)] disabled:opacity-30 disabled:cursor-default"
          >
            Previous
          </button>

          {isLastCard ? (
            lesson.next_lesson_id ? (
              <button
                type="button"
                onClick={() => onNavigate?.(lesson.next_lesson_id!)}
                className="flex-1 min-h-[44px] rounded-lg bg-[var(--accent)] text-white text-sm font-medium transition-opacity active:opacity-80"
              >
                Next Lesson
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex-1 min-h-[44px] rounded-lg bg-green-600 text-white text-sm font-medium"
              >
                Complete
              </button>
            )
          ) : (
            <button
              type="button"
              disabled={!isCurrentBlockCompleted}
              onClick={goNext}
              className={`flex-1 min-h-[44px] rounded-lg text-white text-sm font-medium transition-opacity ${
                isCurrentBlockCompleted
                  ? 'bg-[var(--accent)] active:opacity-80'
                  : 'bg-[var(--accent)] opacity-40 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
