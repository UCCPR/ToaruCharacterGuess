import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const testDatabaseFiles = [
  fileURLToPath(new URL('../data/csgofriberg.test.sqlite3', import.meta.url)),
  fileURLToPath(new URL('../data/csgofriberg.test.sqlite3-shm', import.meta.url)),
  fileURLToPath(new URL('../data/csgofriberg.test.sqlite3-wal', import.meta.url)),
];

function removeTestDatabase(): void {
  for (const file of testDatabaseFiles) fs.rmSync(file, { force: true });
}

export default function setup(): () => void {
  removeTestDatabase();
  return removeTestDatabase;
}
