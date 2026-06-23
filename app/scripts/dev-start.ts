import 'dotenv/config';
import { seed } from './seed.js';
import { seedCourses } from './seed-courses.js';

async function main() {
  await seedCourses();
  await seed();

  // Dynamically import the server (which calls main() at module level)
  await import('../server/api/server.js');
}

main().catch((err) => {
  console.error('Dev startup failed:', err);
  process.exit(1);
});
