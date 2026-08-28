import { beforeEach, describe, expect, it } from 'vitest';
import {
  addStaticGameRecord,
  clearStaticGameRecords,
  loadStaticGameRecords,
  summarizeStaticGameRecords,
  type StaticGameRecord,
} from '../../../static/src/stats';

const records: StaticGameRecord[] = [
  { id: 'a', mode: 'free', difficulty: 'easy', status: 'won', answerId: 1, guessIds: [2, 1], finishedAt: '2026-08-28T01:00:00.000Z' },
  { id: 'b', mode: 'daily', difficulty: 'normal', status: 'lost', answerId: 3, guessIds: [2, 4, 5], finishedAt: '2026-08-28T02:00:00.000Z' },
  { id: 'c', mode: 'free', difficulty: 'easy', status: 'won', answerId: 6, guessIds: [2], finishedAt: '2026-08-28T03:00:00.000Z' },
];

describe('static personal records', () => {
  beforeEach(() => localStorage.clear());

  it('stores completed games once and can clear the local history', () => {
    addStaticGameRecord(records[0]);
    addStaticGameRecord(records[0]);
    expect(loadStaticGameRecords()).toEqual([records[0]]);

    clearStaticGameRecords();
    expect(loadStaticGameRecords()).toEqual([]);
  });

  it('summarizes wins, guesses, and the most common first guess by difficulty', () => {
    const all = summarizeStaticGameRecords(records);
    expect(all).toMatchObject({
      totalGames: 3,
      wins: 2,
      losses: 1,
      winRate: 2 / 3,
      avgWinningGuesses: 1.5,
      bestGuesses: 1,
      firstGuess: { characterId: 2, percentage: 1 },
    });

    expect(summarizeStaticGameRecords(records, ['easy'])).toMatchObject({
      totalGames: 2,
      wins: 2,
      losses: 0,
    });
  });
});
