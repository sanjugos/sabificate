import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(1);
});

async function query(text: string, params?: unknown[]): Promise<pg.QueryResult> {
  return pool.query(text, params);
}

async function shutdown(): Promise<void> {
  console.log('Closing database pool...');
  await pool.end();
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

export { pool, query };
