import { db } from './knex';
import { initDb } from './init';

async function run() {
  await initDb();
  await db.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
