import { describe, expect, it } from 'vitest';
import {
  clearStaticGame,
  latestUnfinishedStaticGame,
  staticGameStorageKey,
} from '../../../static/src/game';

describe('static game persistence', () => {
  it('clears only the game being left so a finished round cannot be restored', () => {
    const currentKey = staticGameStorageKey('free', 'normal');
    const otherKey = staticGameStorageKey('free', 'easy');
    localStorage.setItem(currentKey, JSON.stringify({ status: 'lost' }));
    localStorage.setItem(otherKey, JSON.stringify({ status: 'playing' }));

    clearStaticGame('free', 'normal');

    expect(localStorage.getItem(currentKey)).toBeNull();
    expect(localStorage.getItem(otherKey)).not.toBeNull();
  });

  it('uses the supplied Shanghai day for daily-game storage keys', () => {
    expect(staticGameStorageKey('daily', 'easy', '2026-08-28'))
      .toBe('toaru-static-v2:daily:easy:2026-08-28');
  });

  it('finds the most recently updated unfinished game and ignores completed or expired daily games', () => {
    localStorage.setItem(staticGameStorageKey('free', 'easy'), JSON.stringify({
      targetId: 1, guessIds: [2], status: 'playing', updatedAt: 100,
    }));
    localStorage.setItem(staticGameStorageKey('free', 'normal'), JSON.stringify({
      targetId: 2, guessIds: [], status: 'won', updatedAt: 300,
    }));
    localStorage.setItem(staticGameStorageKey('daily', 'normal', '2026-08-27'), JSON.stringify({
      targetId: 3, guessIds: [1, 2], status: 'playing', updatedAt: 400,
    }));
    localStorage.setItem(staticGameStorageKey('daily', 'normal', '2026-08-28'), JSON.stringify({
      targetId: 4, guessIds: [1, 2], status: 'playing', updatedAt: 200,
    }));

    expect(latestUnfinishedStaticGame(localStorage, '2026-08-28')).toMatchObject({
      mode: 'daily',
      difficulty: 'normal',
      game: { targetId: 4, status: 'playing' },
    });
  });
});
