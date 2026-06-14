import { Queue, Worker } from 'bullmq';
import type { Processor } from 'bullmq';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const parsed = new URL(redisUrl);

export const connection = {
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 6379,
  ...(parsed.password ? { password: parsed.password } : {}),
};

type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const queues: Record<QueueName, Queue> = Object.fromEntries(
  Object.values(QUEUE_NAMES).map((name) => [name, new Queue(name, { connection })]),
) as Record<QueueName, Queue>;

export function createWorker(queueName: string, processor: Processor): Worker {
  return new Worker(queueName, processor, { connection });
}

export async function closeAll(): Promise<void> {
  await Promise.all(Object.values(queues).map((q) => q.close()));
}
