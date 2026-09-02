import { beforeEach, describe, expect, it } from 'vitest';
import {
  getStaticAchievementProgress,
  getNewlyUnlockedStaticAchievements,
  getUnseenStaticAchievements,
  loadStaticAchievementUnlocks,
  loadStaticAchievementLifetime,
  loadViewedStaticAchievements,
  reconcileStaticAchievementLifetime,
  saveStaticAchievementUnlocks,
  saveViewedStaticAchievements,
  unlockEarnedStaticAchievements,
} from '../../../static/src/achievements';
import type { StaticGameRecord } from '../../../static/src/stats';

const records: StaticGameRecord[] = [
  { id: '1', mode: 'free', difficulty: 'beginner', status: 'won', answerId: 1, guessIds: [1], finishedAt: '2026-08-28T01:00:00.000Z' },
  { id: '2', mode: 'free', difficulty: 'easy', status: 'won', answerId: 2, guessIds: [3, 2], finishedAt: '2026-08-28T02:00:00.000Z' },
  { id: '3', mode: 'daily', difficulty: 'normal', status: 'won', answerId: 3, guessIds: [4, 3], finishedAt: '2026-08-28T03:00:00.000Z' },
];

describe('static achievements', () => {
  beforeEach(() => localStorage.clear());

  it('unlocks achievements from completed-game history and reports progress', () => {
    const unlocks = unlockEarnedStaticAchievements(records, {}, '2026-08-28T04:00:00.000Z');
    const progress = getStaticAchievementProgress(records, unlocks);

    expect(progress.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id))
      .toEqual([
        'firstGame', 'firstWin', 'oneGuess', 'dailyWin', 'allDifficulties', 'threeWinStreak',
      ]);
    expect(progress.find((achievement) => achievement.id === 'tenGames')).toMatchObject({
      current: 3,
      target: 10,
      unlocked: false,
    });
  });

  it('keeps unlocked achievements after game records are cleared', () => {
    const unlocks = unlockEarnedStaticAchievements(records, {}, '2026-08-28T04:00:00.000Z');
    saveStaticAchievementUnlocks(unlocks);
    const restored = loadStaticAchievementUnlocks();

    expect(getStaticAchievementProgress([], restored).find((achievement) => achievement.id === 'firstWin'))
      .toMatchObject({ current: 1, target: 1, unlocked: true, unlockedAt: '2026-08-28T04:00:00.000Z' });
  });

  it('persists which unlocked achievements have been viewed', () => {
    const unlocks = unlockEarnedStaticAchievements(records, {}, '2026-08-28T04:00:00.000Z');
    expect(getNewlyUnlockedStaticAchievements({}, unlocks)).toEqual([
      'firstGame', 'firstWin', 'oneGuess', 'dailyWin', 'allDifficulties', 'threeWinStreak',
    ]);
    expect(getUnseenStaticAchievements(unlocks, [])).toHaveLength(6);

    saveViewedStaticAchievements(['firstGame', 'firstWin', 'firstGame']);
    const viewed = loadViewedStaticAchievements();
    expect(viewed).toEqual(['firstGame', 'firstWin']);
    expect(getUnseenStaticAchievements(unlocks, viewed)).not.toContain('firstGame');
    expect(getUnseenStaticAchievements(unlocks, viewed)).toHaveLength(4);
  });

  it('counts distinct winning answers instead of repeated wins against one character', () => {
    const repeated = Array.from({ length: 12 }, (_, index): StaticGameRecord => ({
      id: `repeat-${index}`,
      mode: 'free',
      difficulty: 'normal',
      status: 'won',
      answerId: 1,
      guessIds: [1],
      finishedAt: new Date(Date.UTC(2026, 7, 29, 0, index)).toISOString(),
    }));
    const distinct = Array.from({ length: 50 }, (_, index): StaticGameRecord => ({
      id: `distinct-${index}`,
      mode: 'free',
      difficulty: 'normal',
      status: 'won',
      answerId: index + 1,
      guessIds: [index + 1],
      finishedAt: new Date(Date.UTC(2026, 7, 30, 0, index)).toISOString(),
    }));

    const repeatedProgress = getStaticAchievementProgress(repeated, {});
    expect(repeatedProgress.find((achievement) => achievement.id === 'tenCharacters'))
      .toMatchObject({ current: 1, target: 10, unlocked: false });

    const unlocks = unlockEarnedStaticAchievements(distinct, {}, '2026-08-31T00:00:00.000Z');
    const collectionProgress = getStaticAchievementProgress(distinct, unlocks);
    expect(collectionProgress.filter((achievement) => (
      ['tenCharacters', 'twentyCharacters', 'fiftyCharacters'].includes(achievement.id)
    ))).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'tenCharacters', current: 10, unlocked: true }),
      expect.objectContaining({ id: 'twentyCharacters', current: 20, unlocked: true }),
      expect.objectContaining({ id: 'fiftyCharacters', current: 50, unlocked: true }),
    ]));
  });

  it('keeps lifetime achievement totals after older game records rotate out', () => {
    let lifetime = loadStaticAchievementLifetime();
    let recent: StaticGameRecord[] = [];
    for (let index = 0; index < 250; index += 1) {
      const won = index % 5 === 0;
      const record: StaticGameRecord = {
        id: `lifetime-${index}`,
        mode: 'free',
        difficulty: 'normal',
        status: won ? 'won' : 'lost',
        answerId: won ? index / 5 + 1 : 1,
        guessIds: won ? [index / 5 + 1] : [1, 2],
        finishedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      };
      recent = [record, ...recent].slice(0, 200);
      lifetime = reconcileStaticAchievementLifetime(recent, lifetime);
    }

    expect(recent.filter((record) => record.status === 'won')).toHaveLength(40);
    expect(lifetime).toMatchObject({ totalGames: 250, wins: 50 });
    expect(lifetime.wonAnswerIds).toHaveLength(50);
    expect(getStaticAchievementProgress(recent, {}, lifetime)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'fiftyCharacters', current: 50 }),
      expect.objectContaining({ id: 'twentyFiveWins', current: 25 }),
    ]));
  });
});
