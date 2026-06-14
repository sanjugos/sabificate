import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '..', 'migrations');

async function run(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Determine which migrations have already been applied
    const applied = await client.query<{ name: string }>('SELECT name FROM _migrations ORDER BY id');
    const appliedSet = new Set(applied.rows.map((r) => r.name));

    // Discover SQL files on disk
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    let ranCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  skip  ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      console.log(`  run   ${file} ...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        ranCount++;
        console.log(`  done  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  FAIL  ${file}:`, err);
        process.exit(1);
      }
    }

    if (ranCount === 0) {
      console.log('All migrations already applied.');
    } else {
      console.log(`\n${ranCount} migration(s) applied successfully.`);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
