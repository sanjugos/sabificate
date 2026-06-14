import { useState, useEffect, useRef, useCallback } from 'react';
import type { LessonPlayerProps, ProgressUpdate } from '../../../contracts/components/lesson-player';
import type { QuizAnswer } from '../../../contracts/api/progress';
import type { DifficultyTier } from '../../../contracts/types';
import { ContentBlockRenderer } from '../content/ContentBlockRenderer';
import { LessonNav } from './LessonNav';
import { filterBlocksByTier } from '../../lib/content/contentParser';

const DIFFICULTY_OPTIONS: { value: DifficultyTier; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
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
  dataSaverMode,
  onNavigate,
}: LessonPlayerExtendedProps) {
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyTier>(difficulty);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const timeStartRef = useRef<number>(Date.now());

  const filteredBlocks = filterBlocksByTier(lesson, currentDifficulty);
  const totalBlocks = filteredBlocks.length;
  const progressPercent = totalBlocks > 0
    ? Math.round((completedBlocks.size / totalBlocks) * 100)
    : 0;

  // Reset state when lesson changes
  useEffect(() => {
    setCompletedBlocks(new Set());
    setQuizAnswers(new Map());
    timeStartRef.current = Date.now();
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [lesson.id]);

  // Track block visibility via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-block-index'));
            if (!isNaN(index)) {
              setCompletedBlocks((prev) => {
                if (prev.has(index)) return prev;
                const next = new Set(prev);
                next.add(index);
                return next;
              });
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      },
    );

    blockRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [lesson.id, currentDifficulty, filteredBlocks.length]);

  // Report progress when completedBlocks changes
  useEffect(() => {
    const timeSpent = Math.round((Date.now() - timeStartRef.current) / 1000);
    const maxBlockIndex = completedBlocks.size > 0
      ? Math.max(...completedBlocks)
      : 0;

    const update: ProgressUpdate = {
      lesson_id: lesson.id,
      block_index: maxBlockIndex,
      time_spent_seconds: timeSpent,
      progress_percent: progressPercent,
    };

    onProgressUpdate(update);

    if (progressPercent >= 100 && completedBlocks.size === totalBlocks) {
      onLessonComplete();
    }
  }, [completedBlocks.size, progressPercent, totalBlocks, lesson.id, onProgressUpdate, onLessonComplete]);

  const handleQuizAnswer = useCallback(
    (answer: QuizAnswer) => {
      setQuizAnswers((prev) => {
        const next = new Map(prev);
        next.set(answer.quiz_block_id, answer);
        return next;
      });
      onQuizSubmit(answer);
    },
    [onQuizSubmit],
  );

  const setBlockRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (el) {
        blockRefs.current.set(index, el);
      } else {
        blockRefs.current.delete(index);
      }
    },
    [],
  );

  return (
    <div className="flex flex-col h-full min-w-[360px]">
      {/* Top bar: progress + difficulty */}
      <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)]">
        {/* Progress bar */}
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
              {progressPercent}% complete
              {lesson.estimated_duration_minutes > 0 &&
                ` · ~${lesson.estimated_duration_minutes} min`}
            </p>
          </div>

          {/* Difficulty selector */}
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

      {/* Content blocks */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="divide-y divide-[var(--border)]">
          {filteredBlocks.map((block, index) => (
            <div
              key={block.id}
              ref={setBlockRef(index)}
              data-block-index={index}
            >
              <ContentBlockRenderer
                block={block}
                dataSaverMode={dataSaverMode}
                onQuizAnswer={handleQuizAnswer}
                previousQuizAnswer={
                  block.type === 'quiz_block'
                    ? quizAnswers.get(block.id)
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredBlocks.length === 0 && (
          <div className="flex items-center justify-center py-16 px-4">
            <p className="text-sm text-[var(--text)] text-center">
              No content available for the {currentDifficulty} level. Try
              selecting a different difficulty.
            </p>
          </div>
        )}

        {/* Lesson navigation */}
        <LessonNav
          prevLessonId={lesson.prev_lesson_id}
          nextLessonId={lesson.next_lesson_id}
          onNavigate={(lessonId) => onNavigate?.(lessonId)}
        />
      </div>
    </div>
  );
}
