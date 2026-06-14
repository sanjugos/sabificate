/**
 * In-memory Redis mock for local development without a Redis server.
 * Implements the subset of ioredis methods used by rate-limiter and conversationState.
 */

interface StoreEntry {
  value: string;
  timer?: ReturnType<typeof setTimeout>;
}

export interface MockRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: (string | number)[]): Promise<'OK'>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  ping(): Promise<string>;
}

export function createMockRedis(): MockRedis {
  const store = new Map<string, StoreEntry>();
  const expiries = new Map<string, number>(); // key -> absolute epoch ms

  function clearEntry(key: string): void {
    const entry = store.get(key);
    if (entry?.timer) clearTimeout(entry.timer);
    store.delete(key);
    expiries.delete(key);
  }

  function isExpired(key: string): boolean {
    const exp = expiries.get(key);
    if (exp === undefined) return false;
    if (Date.now() >= exp) {
      clearEntry(key);
      return true;
    }
    return false;
  }

  function getEntry(key: string): StoreEntry | undefined {
    if (isExpired(key)) return undefined;
    return store.get(key);
  }

  function setExpiry(key: string, seconds: number): void {
    const entry = store.get(key);
    if (!entry) return;
    if (entry.timer) clearTimeout(entry.timer);
    const ms = seconds * 1000;
    expiries.set(key, Date.now() + ms);
    entry.timer = setTimeout(() => clearEntry(key), ms);
  }

  const mock: MockRedis = {
    async get(key: string): Promise<string | null> {
      const entry = getEntry(key);
      return entry ? entry.value : null;
    },

    async set(key: string, value: string, ...args: (string | number)[]): Promise<'OK'> {
      // Clear any existing timer
      const existing = store.get(key);
      if (existing?.timer) clearTimeout(existing.timer);

      const entry: StoreEntry = { value };
      store.set(key, entry);
      expiries.delete(key);

      // Parse EX / PX options
      for (let i = 0; i < args.length; i++) {
        const flag = String(args[i]).toUpperCase();
        if (flag === 'EX' && i + 1 < args.length) {
          setExpiry(key, Number(args[i + 1]));
          i++;
        } else if (flag === 'PX' && i + 1 < args.length) {
          setExpiry(key, Number(args[i + 1]) / 1000);
          i++;
        }
      }

      return 'OK';
    },

    async del(...keys: string[]): Promise<number> {
      let count = 0;
      for (const key of keys) {
        if (store.has(key) && !isExpired(key)) {
          count++;
        }
        clearEntry(key);
      }
      return count;
    },

    async incr(key: string): Promise<number> {
      const entry = getEntry(key);
      const current = entry ? parseInt(entry.value, 10) : 0;
      const next = (isNaN(current) ? 0 : current) + 1;

      if (entry) {
        entry.value = String(next);
      } else {
        store.set(key, { value: String(next) });
      }

      return next;
    },

    async expire(key: string, seconds: number): Promise<number> {
      if (!getEntry(key)) return 0;
      setExpiry(key, seconds);
      return 1;
    },

    async ttl(key: string): Promise<number> {
      if (isExpired(key)) return -2;
      const exp = expiries.get(key);
      if (exp === undefined) {
        return store.has(key) ? -1 : -2;
      }
      return Math.max(0, Math.ceil((exp - Date.now()) / 1000));
    },

    async ping(): Promise<string> {
      return 'PONG';
    },
  };

  return mock;
}
