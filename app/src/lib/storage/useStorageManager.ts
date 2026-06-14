import { useState, useEffect, useCallback } from 'react';
import { db } from '../progress/db';
import { SYNC } from '../../../contracts/shared/constants';

// ── Types ─────────────────────────────────────────────────────────────────

interface CourseStorageEntry {
  courseId: string;
  courseTitle: string;
  bytes: number;
}

export interface UseStorageManagerReturn {
  usedBytes: number;
  totalBytes: number;
  usagePercent: number;
  courseStorageMap: CourseStorageEntry[];
  canDownload: (estimatedBytes: number) => boolean;
  evictCourse: (courseId: string) => Promise<void>;
  refreshEstimates: () => Promise<void>;
  isWarning: boolean;
  offlineCourseCount: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useStorageManager(): UseStorageManagerReturn {
  const [usedBytes, setUsedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [courseStorageMap, setCourseStorageMap] = useState<CourseStorageEntry[]>([]);

  const refreshEstimates = useCallback(async () => {
    // Check navigator.storage.estimate() if available
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        setUsedBytes(estimate.usage ?? 0);
        setTotalBytes(estimate.quota ?? 0);
      } catch {
        // Storage API not available — use defaults
        setUsedBytes(0);
        setTotalBytes(0);
      }
    }

    // Build per-course storage usage from Dexie
    try {
      const allProgress = await db.lessonProgress.toArray();
      const courseMap = new Map<string, { title: string; bytes: number }>();

      for (const record of allProgress) {
        const existing = courseMap.get(record.courseId);
        // Estimate storage: ~500 bytes per progress record as a rough measure
        const recordBytes = new Blob([JSON.stringify(record)]).size;
        if (existing) {
          existing.bytes += recordBytes;
        } else {
          courseMap.set(record.courseId, {
            title: record.courseId, // We only have courseId in progress DB
            bytes: recordBytes,
          });
        }
      }

      // Add quiz answer storage
      const allQuizzes = await db.quizAnswers.toArray();
      for (const quiz of allQuizzes) {
        const courseProgress = allProgress.find(
          (p) => p.lessonId === quiz.lessonId,
        );
        if (courseProgress) {
          const existing = courseMap.get(courseProgress.courseId);
          const quizBytes = new Blob([JSON.stringify(quiz)]).size;
          if (existing) {
            existing.bytes += quizBytes;
          }
        }
      }

      setCourseStorageMap(
        Array.from(courseMap.entries()).map(([courseId, data]) => ({
          courseId,
          courseTitle: data.title,
          bytes: data.bytes,
        })),
      );
    } catch {
      setCourseStorageMap([]);
    }
  }, []);

  // Refresh on mount
  useEffect(() => {
    void refreshEstimates();
  }, [refreshEstimates]);

  const usagePercent = totalBytes > 0 ? usedBytes / totalBytes : 0;
  const isWarning = usagePercent >= SYNC.STORAGE_WARNING_THRESHOLD;

  const canDownload = useCallback(
    (estimatedBytes: number): boolean => {
      if (totalBytes === 0) return true; // Can't estimate, allow it

      const availableBytes = totalBytes - usedBytes - SYNC.RESERVED_PARTITION_BYTES;
      if (estimatedBytes > availableBytes) return false;

      // Check offline course limit on constrained devices
      const freeBytes = totalBytes - usedBytes;
      if (freeBytes < 5 * 1024 * 1024 * 1024) {
        // Less than 5GB free
        if (courseStorageMap.length >= SYNC.MAX_OFFLINE_COURSES) return false;
      }

      return true;
    },
    [totalBytes, usedBytes, courseStorageMap.length],
  );

  const evictCourse = useCallback(
    async (courseId: string) => {
      try {
        // Remove all progress records for this course
        await db.lessonProgress.where('courseId').equals(courseId).delete();

        // Remove quiz answers for lessons in this course
        // (We need to find lesson IDs first)
        const lessonIds = (
          await db.lessonProgress.where('courseId').equals(courseId).toArray()
        ).map((p) => p.lessonId);

        if (lessonIds.length > 0) {
          await db.quizAnswers
            .where('lessonId')
            .anyOf(lessonIds)
            .delete();
        }

        // Remove synced queue items for this course
        // (Pending items are kept to ensure data isn't lost)
        const syncItems = await db.syncQueue.where('synced').equals(1).toArray();
        const courseItemIds = syncItems
          .filter((item) => {
            try {
              const payload = JSON.parse(item.payload) as { courseId?: string };
              return payload.courseId === courseId;
            } catch {
              return false;
            }
          })
          .map((item) => item.id)
          .filter((id): id is number => id !== undefined);

        if (courseItemIds.length > 0) {
          await db.syncQueue.where('id').anyOf(courseItemIds).delete();
        }

        // Refresh storage estimates
        await refreshEstimates();
      } catch (err) {
        console.error('[storage] Failed to evict course:', err);
      }
    },
    [refreshEstimates],
  );

  return {
    usedBytes,
    totalBytes,
    usagePercent,
    courseStorageMap,
    canDownload,
    evictCourse,
    refreshEstimates,
    isWarning,
    offlineCourseCount: courseStorageMap.length,
  };
}
