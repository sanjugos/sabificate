import { Queue, Worker } from 'bullmq';
import { connection } from '../queue/index.js';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { deliverLesson } from './lessonDelivery.js';
import { hasWhatsAppConsent } from './conversationState.js';

// ── Constants ───────────────────────────────────────────────────────────────

const SCHEDULER_QUEUE_NAME = 'whatsapp.lesson.schedule';

// ── Queue ───────────────────────────────────────────────────────────────────

const schedulerQueue = new Queue(SCHEDULER_QUEUE_NAME, { connection });

// ── Types ───────────────────────────────────────────────────────────────────

interface ScheduleJobData {
  user_id: string;
}

interface WhatsAppSubscription {
  id: string;
  user_id: string;
  preferred_time: string; // HH:MM format in user's timezone
  timezone: string;
  active: boolean;
  created_at: string;
}

// ── Schedule Management ─────────────────────────────────────────────────────

export async function scheduleDaily(
  userId: string,
  preferredTime: string, // HH:MM format
): Promise<void> {
  // Validate time format
  const timeMatch = preferredTime.match(/^(\d{2}):(\d{2})$/);
  if (!timeMatch) {
    throw new Error('Invalid time format. Expected HH:MM');
  }

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Invalid time value');
  }

  // Check consent
  const consented = await hasWhatsAppConsent(userId);
  if (!consented) {
    throw new Error('User has not consented to WhatsApp messages');
  }

  // Cancel existing schedule first
  await cancelSchedule(userId);

  // Read subscription timezone (default to WAT — West Africa Time)
  const subResult = await query(
    `SELECT timezone FROM ${TABLES.WHATSAPP_SUBSCRIPTIONS} WHERE user_id = $1 AND active = true`,
    [userId],
  );

  const timezone = subResult.rows.length > 0
    ? (subResult.rows[0] as { timezone: string }).timezone
    : 'Africa/Lagos';

  // Create BullMQ repeatable job
  // Cron uses UTC; we convert preferred time from user's timezone
  const utcTime = convertToUtcCron(hour, minute, timezone);

  const jobId = `daily-lesson-${userId}`;

  await schedulerQueue.add(
    'deliver-daily-lesson',
    { user_id: userId } satisfies ScheduleJobData,
    {
      jobId,
      repeat: {
        pattern: utcTime,
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 20 },
    },
  );

  // Update subscription record
  await query(
    `INSERT INTO ${TABLES.WHATSAPP_SUBSCRIPTIONS} (user_id, preferred_time, timezone, active, created_at)
     VALUES ($1, $2, $3, true, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET preferred_time = $2, timezone = $3, active = true, updated_at = NOW()`,
    [userId, preferredTime, timezone],
  );

  console.log(`Scheduled daily lesson for user ${userId} at ${preferredTime} (${timezone})`);
}

export async function cancelSchedule(userId: string): Promise<void> {
  const jobId = `daily-lesson-${userId}`;

  // Remove repeatable job by key
  const repeatableJobs = await schedulerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.id === jobId) {
      await schedulerQueue.removeRepeatableByKey(job.key);
    }
  }

  // Deactivate subscription record
  await query(
    `UPDATE ${TABLES.WHATSAPP_SUBSCRIPTIONS}
     SET active = false, updated_at = NOW()
     WHERE user_id = $1 AND active = true`,
    [userId],
  );

  console.log(`Cancelled daily lesson schedule for user ${userId}`);
}

// ── Worker ──────────────────────────────────────────────────────────────────

export function startSchedulerWorker(): Worker {
  const worker = new Worker(
    SCHEDULER_QUEUE_NAME,
    async (job) => {
      const data = job.data as ScheduleJobData;
      const userId = data.user_id;

      console.log(`Processing scheduled lesson delivery for user ${userId}`);

      // Verify subscription is still active
      const subResult = await query(
        `SELECT id FROM ${TABLES.WHATSAPP_SUBSCRIPTIONS}
         WHERE user_id = $1 AND active = true`,
        [userId],
      );

      if (subResult.rows.length === 0) {
        console.log(`Subscription no longer active for user ${userId}, skipping`);
        return;
      }

      // Verify consent is still valid
      const consented = await hasWhatsAppConsent(userId);
      if (!consented) {
        console.log(`WhatsApp consent revoked for user ${userId}, cancelling schedule`);
        await cancelSchedule(userId);
        return;
      }

      // Determine next lesson for user
      const nextLessonId = await getNextLessonForUser(userId);
      if (!nextLessonId) {
        console.log(`No next lesson available for user ${userId}`);
        return;
      }

      await deliverLesson(userId, nextLessonId);
    },
    { connection },
  );

  worker.on('failed', (job, err) => {
    console.error(`Scheduled lesson job ${job?.id} failed:`, err);
  });

  return worker;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getNextLessonForUser(userId: string): Promise<string | null> {
  // Find the user's active enrollment, then find the next incomplete lesson
  const result = await query(
    `SELECT l.id AS lesson_id
     FROM ${TABLES.ENROLLMENT} e
     JOIN ${TABLES.COURSES} c ON c.id = e.course_id
     JOIN ${TABLES.MODULES} m ON m.course_id = c.id
     JOIN ${TABLES.LESSONS} l ON l.module_id = m.id
     LEFT JOIN ${TABLES.LEARNER_PROGRESS} lp
       ON lp.user_id = e.user_id AND lp.lesson_id = l.id
     WHERE e.user_id = $1
       AND e.status = 'active'
       AND (lp.status IS NULL OR lp.status != 'completed')
     ORDER BY m.sort_order ASC, l.sort_order ASC
     LIMIT 1`,
    [userId],
  );

  if (result.rows.length === 0) return null;
  return (result.rows[0] as { lesson_id: string }).lesson_id;
}

function convertToUtcCron(hour: number, minute: number, timezone: string): string {
  // Simple UTC offset calculation for common African timezones
  // For production, use a proper timezone library like luxon or date-fns-tz
  const offsets: Record<string, number> = {
    'Africa/Lagos': 1,     // WAT (UTC+1)
    'Africa/Accra': 0,     // GMT (UTC+0)
    'Africa/Nairobi': 3,   // EAT (UTC+3)
    'Africa/Johannesburg': 2, // SAST (UTC+2)
    'Africa/Cairo': 2,     // EET (UTC+2)
    'UTC': 0,
  };

  const offset = offsets[timezone] ?? 1; // Default to WAT
  let utcHour = hour - offset;
  if (utcHour < 0) utcHour += 24;
  if (utcHour >= 24) utcHour -= 24;

  // Cron format: minute hour * * * (every day)
  return `${minute} ${utcHour} * * *`;
}

export { schedulerQueue };
