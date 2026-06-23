import pg from 'pg';
const { Pool } = pg;

const useInMemory = process.env.DEV_INMEMORY === 'true';

// ── In-memory pg-mem adapter ───────────────────────────────────────────────

async function createInMemoryDb(): Promise<{
  pool: { query: (...args: unknown[]) => Promise<pg.QueryResult> };
  query: (text: string, params?: unknown[]) => Promise<pg.QueryResult>;
}> {
  const { newDb, DataType } = await import('pg-mem');
  const db = newDb({ autoCreateForeignKeyIndices: true });

  // Register gen_random_uuid() so CREATE TABLE defaults work
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => {
      // Simple v4 UUID
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    },
    impure: true,
  });

  // Register NOW() if not already present
  try {
    db.public.registerFunction({
      name: 'now',
      returns: DataType.timestamptz,
      implementation: () => new Date(),
      impure: true,
    });
  } catch {
    // already registered
  }

  // Load and execute migration SQL
  const fs = await import('fs');
  const path = await import('path');
  const migrationsDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../migrations',
  );
  const migrationPath = path.resolve(migrationsDir, '001_initial_schema.sql');
  const migration002Path = path.resolve(migrationsDir, '002_curriculum_studio.sql');

  let sql: string;
  try {
    sql = fs.readFileSync(migrationPath, 'utf-8');
  } catch (err) {
    console.warn('[dev/pg-mem] Could not read migration file:', migrationPath, err);
    sql = '';
  }

  // Append migration 002
  try {
    const sql002 = fs.readFileSync(migration002Path, 'utf-8');
    if (sql002) {
      sql = sql + '\n' + sql002;
    }
  } catch {
    console.warn('[dev/pg-mem] Could not read migration 002 (optional)');
  }

  if (sql) {
    // Strip all SQL comments, then split into statements
    const clean = sql
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const statements = clean
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const createTableStmts: string[] = [];
    const indexStmts: string[] = [];
    const alterStmts: string[] = [];

    for (const stmt of statements) {
      if (/^CREATE\s+TABLE/i.test(stmt)) {
        createTableStmts.push(stmt);
      } else if (/^CREATE\s+INDEX/i.test(stmt)) {
        indexStmts.push(stmt);
      } else if (/^ALTER\s+TABLE/i.test(stmt)) {
        alterStmts.push(stmt);
      }
    }

    // Strip REFERENCES clauses so table creation order doesn't matter
    const cleanedCreates = createTableStmts.map((stmt) =>
      stmt.replace(
        /\s+REFERENCES\s+\w+\s*\(\s*\w+\s*\)(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))*/gi,
        '',
      ),
    );

    let tableCount = 0;
    for (const stmt of cleanedCreates) {
      try {
        db.public.none(stmt);
        tableCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const name = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)?.[1] ?? '?';
        console.warn(`[dev/pg-mem] Skipped table ${name}: ${msg.slice(0, 80)}`);
      }
    }

    let indexCount = 0;
    for (const stmt of indexStmts) {
      try {
        db.public.none(stmt);
        indexCount++;
      } catch {
        // Expected for tables pg-mem couldn't create
      }
    }

    // Process ALTER TABLE statements (best-effort, pg-mem has limited ALTER support)
    let alterCount = 0;
    for (const stmt of alterStmts) {
      try {
        db.public.none(stmt);
        alterCount++;
      } catch {
        // pg-mem has limited ALTER TABLE support; skip gracefully
      }
    }

    console.log(`[dev/pg-mem] Schema loaded: ${tableCount} tables, ${indexCount} indexes, ${alterCount} alters`);
  }

  // Build query function that returns pg-compatible results.
  // createPg() returns { Pool, Client } constructors — instantiate Pool.
  const adapter = db.adapters.createPg();
  const memPool = new adapter.Pool() as pg.Pool;

  const queryFn = async (text: string, params?: unknown[]): Promise<pg.QueryResult> => {
    return memPool.query(text, params);
  };

  const poolProxy = {
    query: queryFn as (...args: unknown[]) => Promise<pg.QueryResult>,
  };

  return { pool: poolProxy, query: queryFn };
}

// ── Real PostgreSQL pool ───────────────────────────────────────────────────

function createRealDb(): {
  pool: pg.Pool;
  query: (text: string, params?: unknown[]) => Promise<pg.QueryResult>;
} {
  const realPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  realPool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(1);
  });

  const queryFn = async (text: string, params?: unknown[]): Promise<pg.QueryResult> => {
    return realPool.query(text, params);
  };

  return { pool: realPool, query: queryFn };
}

// ── Exports ────────────────────────────────────────────────────────────────

// Use a narrow type for pool that both pg.Pool and the in-memory proxy satisfy
type PoolLike = { query: (...args: unknown[]) => Promise<pg.QueryResult> };

let pool: PoolLike;
let query: (text: string, params?: unknown[]) => Promise<pg.QueryResult>;

if (useInMemory) {
  // Lazy-init: the in-memory DB is set up asynchronously. We expose a
  // proxy that waits for initialisation on first call.
  let initPromise: Promise<void> | null = null;
  let ready = false;

  const init = (): Promise<void> => {
    if (!initPromise) {
      initPromise = createInMemoryDb().then((mem) => {
        pool = mem.pool;
        query = mem.query;
        ready = true;
      });
    }
    return initPromise;
  };

  // Placeholder query that triggers init then delegates
  query = async (text: string, params?: unknown[]): Promise<pg.QueryResult> => {
    if (!ready) await init();
    return query(text, params);
  };

  pool = {
    query: async (...args: unknown[]): Promise<pg.QueryResult> => {
      if (!ready) await init();
      return pool.query(...args);
    },
  };

  // Start init eagerly so it's warm by the time the server boots
  init();
} else {
  const real = createRealDb();
  pool = real.pool;
  query = real.query;

  async function shutdown(): Promise<void> {
    console.log('Closing database pool...');
    await (pool as pg.Pool).end();
    console.log('Database pool closed.');
  }

  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });
}

export { pool, query };
