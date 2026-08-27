import { ensureSchema } from './schema';
import { syncCuratedCharacterCatalog } from './syncCharacterCatalog';

export async function initDb(): Promise<void> {
  await ensureSchema();
  const cataloged = await syncCuratedCharacterCatalog();
  console.log(`[catalog] 已同步 ${cataloged} 名可玩角色`);
}
