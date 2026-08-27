import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initRedis, redis, redisKey } from '../../src/redis';
import { db } from '../../src/db/knex';
import { ensureSchema } from '../../src/db/schema';
import {
  getPublicPlayerList,
  isDifficultyAvailable,
  invalidatePlayerCache,
  pickCachedTarget,
  refreshPlayerCache,
} from '../../src/services/playerCache';

async function createTestCharacter(nickname: string, difficulty?: string): Promise<number> {
  const [row] = await db('characters').insert({
    canonical_name_zh: nickname,
    gender: 'unknown',
    status: 'active',
    review_status: 'needs_review',
  }).returning('id');
  const id = Number(typeof row === 'object' ? row.id : row);
  await db('character_game_profiles').insert({
    character_id: id,
    is_enabled: true,
    review_status: 'needs_review',
  });
  if (difficulty) {
    await db('character_difficulties').insert({ character_id: id, difficulty_key: difficulty });
  }
  return id;
}

beforeAll(async () => {
  await ensureSchema();
  await initRedis();
});

afterAll(async () => {
  await db('characters').whereLike('canonical_name_zh', 'cache-test-%').del();
});

describe('character cache invalidation', () => {
  it('removes a disabled character before invalidation returns and changes the list version', async () => {
    const nickname = `cache-test-${Date.now()}`;
    const id = await createTestCharacter(nickname);

    await refreshPlayerCache();
    const before = await getPublicPlayerList();
    expect(before.players).toContainEqual({
      id,
      nickname,
      localizedNames: { zh: nickname, en: nickname, ja: nickname },
    });

    await db('character_game_profiles').where({ character_id: id }).update({ is_enabled: false });
    await invalidatePlayerCache();

    const after = await getPublicPlayerList();
    expect(after.version).not.toBe(before.version);
    expect(after.players.some((player) => player.id === id && player.nickname === nickname)).toBe(false);
  });

  it('refreshes a stale instance before serving the public list', async () => {
    const client = redis();
    if (!client) return;
    const nickname = `cache-test-cross-instance-${Date.now()}`;
    const id = await createTestCharacter(nickname);

    await refreshPlayerCache();
    expect((await getPublicPlayerList()).players.some(
      (player) => player.id === id && player.nickname === nickname,
    )).toBe(true);

    await db('character_game_profiles').where({ character_id: id }).update({ is_enabled: false });
    await client.incr(redisKey('players:revision'));

    expect((await getPublicPlayerList()).players.some(
      (player) => player.id === id && player.nickname === nickname,
    )).toBe(false);
  });

  it('serves targets from the beginner difficulty pool', async () => {
    await createTestCharacter(`cache-test-beginner-${Date.now()}`, 'beginner');
    await refreshPlayerCache();

    expect(isDifficultyAvailable('beginner')).toBe(true);
    expect(pickCachedTarget('beginner')?.difficulties).toContain('beginner');
  });
});
