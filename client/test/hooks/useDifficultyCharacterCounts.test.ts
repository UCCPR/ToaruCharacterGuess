import { describe, expect, it } from 'vitest';
import { countCharactersByDifficulty } from '../../src/hooks/useDifficultyCharacterCounts';

describe('difficulty character counts', () => {
  it('counts each character once per difficulty', () => {
    expect(countCharactersByDifficulty([
      { difficulties: ['normal', 'easy', 'beginner'] },
      { difficulties: ['normal', 'easy'] },
      { difficulties: ['normal', 'normal'] },
      { difficulties: undefined },
    ])).toEqual({ normal: 3, easy: 2, beginner: 1 });
  });
});
