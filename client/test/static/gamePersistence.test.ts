import { describe, expect, it } from 'vitest';
import {
  clearStaticGame,
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
});
