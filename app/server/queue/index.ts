import { Queue, Worker } from 'bullmq';
import type { Processor } from 'bullmq';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';

const useInMemory = process.env.DEV_INMEMORY === 'true';

type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ── Stub queue for in-memory dev mode ──────────────────────────────────────

interface StubQueue {
  name: string;
  add(jobName: string, data: unknown): Promise<{ id: string; name: string }>;
  close(): Promise<void>;
}

function createStubQueue(name: string): StubQueue {
  return {
    name,
    async add(jobName: string, data: unknown) {
      console.log(`[dev/queue] ${name} » ${jobName}`, JSON.stringify(data).slice(0, 200));
      return { id: `dev-${Date.now()}`, name: jobName };
    },
    async close() {
      /* noop */
    },
  };
}

// ── Real BullMQ setup ──────────────────────────────────────────────────────

function createRealQueues(): {
  connection: { host: string; port: number; password?: string };
  queues: Record<QueueName, Queue>;
  createWorker: (queueName: string, processor: Processor) => Worker;
  closeAll: () => Promise<void>;
} {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const parsed = new URL(redisUrl);

  const conn = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    ...(parsed.password ? { password: parsed.password } : {}),
  };

  const qs = Object.fromEntries(
    Object.values(QUEUE_NAMES).map((name) => [name, new Queue(name, { connection: conn })]),
  ) as Record<QueueName, Queue>;

  return {
    connection: conn,
    queues: qs,
    createWorker(queueName: string, processor: Processor): Worker {
      return new Worker(queueName, processor, { connection: conn });
    },
    async closeAll(): Promise<void> {
      await Promise.all(Object.values(qs).map((q) => q.close()));
    },
  };
}

// ── Exports ────────────────────────────────────────────────────────────────

let connection: { host: string; port: number; password?: string };
let queues: Record<QueueName, Queue | StubQueue>;
let createWorker: (queueName: string, processor: Processor) => Worker | { close(): Promise<void> };
let closeAll: () => Promise<void>;

if (useInMemory) {
  connection = { host: 'localhost', port: 6379 };

  queues = Object.fromEntries(
    Object.values(QUEUE_NAMES).map((name) => [name, createStubQueue(name)]),
  ) as Record<QueueName, StubQueue>;

  createWorker = (queueName: string, _processor: Processor) => {
    console.log(`[dev/queue] Stub worker registered for "${queueName}"`);
    return { close: async () => {} };
  };

  closeAll = async () => {
    /* noop */
  };
} else {
  const real = createRealQueues();
  connection = real.connection;
  queues = real.queues;
  createWorker = real.createWorker;
  closeAll = real.closeAll;
}

export { connection, queues, createWorker, closeAll };
