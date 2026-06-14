import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from './db';
import type { LessonProgressRecord, QuizAnswerRecord, SyncQueueRecord } from './db';
import type { QuizAnswer } from '../../../contracts/api/progress';
import type { LessonStatus } from '../../../contracts/types';

interface LessonProgress {
  lessonId: string;
  courseId: string;
  status: LessonStatus;
  progressPercent: number;
  timeSpentSeconds: number;
  lastBlockIndex: number;
  difficulty: string;
}

interface UseProgressReturn {
  progress: LessonProgress | null;
  loading: boolean;
  saveProgress: (update: Partial<LessonProgress> & { lessonId: string; courseId: string }) => Promise<void>;
  saveQuizAnswer: (lessonId: string, answer: QuizAnswer, difficulty: string) => Promise<void>;
  getPendingSyncItems: () => Promise<SyncQueueRecord[]>;
}

export function useProgress(lessonId: string, courseId: string): UseProgressReturn {
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load existing progress on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const existing = await db.lessonProgress
          .where('[lessonId+courseId]')
          .equals([lessonId, courseId])
          .first();

        if (cancelled) return;

        if (existing) {
          setProgress({
            lessonId: existing.lessonId,
            courseId: existing.courseId,
            status: existing.status,
            progressPercent: existing.progressPercent,
            timeSpentSeconds: existing.timeSpentSeconds,
            lastBlockIndex: existing.lastBlockIndex,
            difficulty: existing.difficulty,
          });
          timerRef.current = existing.timeSpentSeconds;
        } else {
          setProgress(null);
          timerRef.current = 0;
        }
      } catch {
        // IndexedDB unavailable -- degrade gracefully
        setProgress(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [lessonId, courseId]);

  // Track time spent (tick every second while mounted)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      timerRef.current += 1;
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const saveProgress = useCallback(
    async (update: Partial<LessonProgress> & { lessonId: string; courseId: string }) => {
      const now = new Date().toISOString();
      const timeSpent = timerRef.current;

      try {
        const existing = await db.lessonProgress
          .where('[lessonId+courseId]')
          .equals([update.lessonId, update.courseId])
          .first();

        const record: LessonProgressRecord = {
          ...(existing?.id ? { id: existing.id } : {}),
          lessonId: update.lessonId,
          courseId: update.courseId,
          status: update.status ?? existing?.status ?? 'in_progress',
          progressPercent: update.progressPercent ?? existing?.progressPercent ?? 0,
          timeSpentSeconds: timeSpent,
          lastBlockIndex: update.lastBlockIndex ?? existing?.lastBlockIndex ?? 0,
          difficulty: update.difficulty ?? existing?.difficulty ?? 'beginner',
          updatedAt: now,
        };

        await db.lessonProgress.put(record);

        // Enqueue for sync
        const syncItem: SyncQueueRecord = {
          type: 'lesson_progress',
          payload: JSON.stringify(record),
          createdAt: now,
          synced: 0,
        };
        await db.syncQueue.add(syncItem);

        setProgress({
          lessonId: record.lessonId,
          courseId: record.courseId,
          status: record.status,
          progressPercent: record.progressPercent,
          timeSpentSeconds: record.timeSpentSeconds,
          lastBlockIndex: record.lastBlockIndex,
          difficulty: record.difficulty,
        });
      } catch {
        // IndexedDB write failed -- silent degrade
      }
    },
    [],
  );

  const saveQuizAnswer = useCallback(
    async (quizLessonId: string, answer: QuizAnswer, difficulty: string) => {
      const now = new Date().toISOString();

      try {
        const record: QuizAnswerRecord = {
          lessonId: quizLessonId,
          quizBlockId: answer.quiz_block_id,
          selectedOption: answer.selected_option,
          isCorrect: answer.is_correct,
          answeredAt: answer.answered_at,
          difficulty,
          synced: 0,
        };

        await db.quizAnswers.add(record);

        // Also enqueue for sync
        const syncItem: SyncQueueRecord = {
          type: 'quiz_answer',
          payload: JSON.stringify(record),
          createdAt: now,
          synced: 0,
        };
        await db.syncQueue.add(syncItem);
      } catch {
        // IndexedDB write failed -- silent degrade
      }
    },
    [],
  );

  const getPendingSyncItems = useCallback(async (): Promise<SyncQueueRecord[]> => {
    try {
      return await db.syncQueue.where('synced').equals(0).toArray();
    } catch {
      return [];
    }
  }, []);

  return { progress, loading, saveProgress, saveQuizAnswer, getPendingSyncItems };
}
