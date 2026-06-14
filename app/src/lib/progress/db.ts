import Dexie, { type EntityTable } from 'dexie';

export interface LessonProgressRecord {
  id?: number;
  lessonId: string;
  courseId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  timeSpentSeconds: number;
  lastBlockIndex: number;
  difficulty: string;
  updatedAt: string;
}

export interface QuizAnswerRecord {
  id?: number;
  lessonId: string;
  quizBlockId: string;
  selectedOption: number;
  isCorrect: boolean;
  answeredAt: string;
  difficulty: string;
  synced: 0 | 1;
}

export interface SyncQueueRecord {
  id?: number;
  type: 'lesson_progress' | 'quiz_answer';
  payload: string;
  createdAt: string;
  synced: 0 | 1;
}

const db = new Dexie('sabificate-progress') as Dexie & {
  lessonProgress: EntityTable<LessonProgressRecord, 'id'>;
  quizAnswers: EntityTable<QuizAnswerRecord, 'id'>;
  syncQueue: EntityTable<SyncQueueRecord, 'id'>;
};

db.version(1).stores({
  lessonProgress: '++id, lessonId, courseId, [lessonId+courseId], updatedAt',
  quizAnswers: '++id, lessonId, quizBlockId, [lessonId+quizBlockId], synced',
  syncQueue: '++id, type, synced, createdAt',
});

export { db };
