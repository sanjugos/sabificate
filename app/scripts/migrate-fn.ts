import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Client } = pg;

export async function runMigrations(connectionString: string): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = await client.query<{ name: string }>('SELECT name FROM _migrations ORDER BY id');
    const appliedSet = new Set(applied.rows.map((r) => r.name));

    const migrationsDir = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../migrations',
    );

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ranCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  [migrate] skip  ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`  [migrate] run   ${file} ...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        ranCount++;
        console.log(`  [migrate] done  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  [migrate] FAIL  ${file}:`, err);
        throw err;
      }
    }

    if (ranCount === 0) {
      console.log('  [migrate] All migrations already applied.');
    } else {
      console.log(`  [migrate] ${ranCount} migration(s) applied.`);
    }
  } finally {
    await client.end();
  }
}
