import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createOrResumeSingleGameWithStatus,
  deleteSingleGame,
  loadSingleGame,
  saveSingleGame,
} from '../../src/services/singleGameStore';

type CreateInput = Parameters<typeof createOrResumeSingleGameWithStatus>[0];

async function createGame(input: CreateInput) {
  return (await createOrResumeSingleGameWithStatus(input)).game;
}

describe('singleGameStore', () => {
  afterEach(() => vi.useRealTimers());

  it('stores active games in memory when Redis is unavailable', async () => {
    const identityKey = `g:memory-${Date.now()}`;
    const game = await createGame({
      identityKey,
      userId: null,
      guestKey: identityKey.slice(2),
      mode: 'easy',
      targetPlayerId: 1,
    });
    expect(await loadSingleGame(game.id, identityKey)).toMatchObject({ id: game.id });
    await deleteSingleGame(game);
    expect(await loadSingleGame(game.id, identityKey)).toBeNull();
  });

  it('restores the same active game and guesses until it is explicitly deleted', async () => {
    const identityKey = `g:single-resume-${Date.now()}`;
    const created = await createGame({
      identityKey,
      userId: null,
      guestKey: identityKey.slice(2),
      mode: 'easy',
      targetPlayerId: 1,
    });
    created.guesses.push({ playerId: 2, nickname: 'test' } as any);
    await saveSingleGame(created);

    const restored = await createGame({
      identityKey,
      userId: null,
      guestKey: identityKey.slice(2),
      mode: 'easy',
      targetPlayerId: 3,
    });
    expect(restored.id).toBe(created.id);
    expect(restored.targetPlayerId).toBe(1);
    expect(restored.guesses).toEqual(created.guesses);
    expect(restored.guessTimes).toEqual([null]);

    await deleteSingleGame(restored);
    expect(await loadSingleGame(restored.id, identityKey)).toBeNull();
  });

  it('removes expired games once last activity is older than thirty minutes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2098-01-01T00:00:00Z'));
    const identityKey = `g:single-stale-${Date.now()}`;
    const created = await createGame({
      identityKey,
      userId: null,
      guestKey: identityKey.slice(2),
      mode: 'normal',
      targetPlayerId: 1,
    });
    vi.advanceTimersByTime(1_801_000);

    expect(await loadSingleGame(created.id, identityKey)).toBeNull();
    expect((await createGame({
      identityKey,
      userId: null,
      guestKey: identityKey.slice(2),
      mode: 'normal',
      targetPlayerId: 2,
    })).id).not.toBe(created.id);
  });

  it('keeps fixed-window daily games until their absolute expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2098-01-01T00:00:00Z'));
    const identityKey = `g:daily-window-${Date.now()}`;
    const expiresAt = Date.now() + 120_000;
    const created = await createGame({
      identityKey,
      userId: null,
      guestKey: identityKey.slice(2),
      mode: 'daily:2099-01-01:easy',
      targetPlayerId: 1,
      kind: 'daily',
      expiresAt,
    });

    vi.advanceTimersByTime(90_000);
    const restored = await loadSingleGame(created.id, identityKey);
    expect(restored).toMatchObject({ id: created.id, kind: 'daily', expiresAt });
    await deleteSingleGame(created);
  });
});
