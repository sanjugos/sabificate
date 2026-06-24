import 'dotenv/config';
import EmbeddedPostgres from 'embedded-postgres';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'pgdata');
const PG_PORT = Number(process.env.PG_PORT ?? 5433);
const DATABASE_URL = `postgresql://postgres:postgres@localhost:${PG_PORT}/sabificate`;

async function main() {
  console.log('── SABIficate Production Start ──────────────────────\n');

  // 1. Start embedded PostgreSQL
  console.log(`[pg] Data dir: ${DATA_DIR}`);
  console.log(`[pg] Port: ${PG_PORT}`);

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PG_PORT,
    persistent: true,
  });

  const isFirstRun = !fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));

  if (isFirstRun) {
    console.log('[pg] First run — initializing database...');
    await pg.initialise();
  }

  await pg.start();
  console.log('[pg] PostgreSQL started.\n');

  // Create the database if it doesn't exist
  try {
    await pg.createDatabase('sabificate');
    console.log('[pg] Database "sabificate" created.');
  } catch {
    console.log('[pg] Database "sabificate" already exists.');
  }

  // Set DATABASE_URL for downstream modules
  process.env.DATABASE_URL = DATABASE_URL;
  process.env.DEV_INMEMORY = 'false';

  // 2. Run migrations
  console.log('\n── Migrations ──────────────────────────────────────\n');
  const { runMigrations } = await import('./migrate-fn.js');
  await runMigrations(DATABASE_URL);

  // 3. Seed data
  console.log('── Seeding ─────────────────────────────────────────\n');
  const { seedCourses } = await import('./seed-courses.js');
  const { seed } = await import('./seed.js');
  await seedCourses();
  await seed();

  // 4. Start the app server
  console.log('── Starting Server ─────────────────────────────────\n');
  await import('../server/api/server.js');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[shutdown] Stopping server...');
    await pg.stop();
    console.log('[shutdown] PostgreSQL stopped.');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Production start failed:', err?.message ?? err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
