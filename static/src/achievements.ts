import type { StaticGameRecord } from './stats';

export const STATIC_ACHIEVEMENTS = [
  { id: 'firstGame', target: 1 },
  { id: 'firstWin', target: 1 },
  { id: 'oneGuess', target: 1 },
  { id: 'dailyWin', target: 1 },
  { id: 'allDifficulties', target: 3 },
  { id: 'tenCharacters', target: 10 },
  { id: 'twentyCharacters', target: 20 },
  { id: 'fiftyCharacters', target: 50 },
  { id: 'threeWinStreak', target: 3 },
  { id: 'tenGames', target: 10 },
  { id: 'twentyFiveWins', target: 25 },
] as const;

export type StaticAchievementId = typeof STATIC_ACHIEVEMENTS[number]['id'];
export type StaticAchievementUnlocks = Partial<Record<StaticAchievementId, string>>;

export type StaticAchievementProgress = {
  id: StaticAchievementId;
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

const STORAGE_KEY = 'toaru-static-v2:achievements';
const achievementIds = new Set<StaticAchievementId>(
  STATIC_ACHIEVEMENTS.map((achievement) => achievement.id),
);

function isAchievementId(value: string): value is StaticAchievementId {
  return achievementIds.has(value as StaticAchievementId);
}

function longestWinStreak(records: readonly StaticGameRecord[]): number {
  let longest = 0;
  let current = 0;
  const chronological = [...records].sort((left, right) => (
    Date.parse(left.finishedAt) - Date.parse(right.finishedAt)
  ));
  for (const record of chronological) {
    current = record.status === 'won' ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

function achievementCurrent(
  id: StaticAchievementId,
  records: readonly StaticGameRecord[],
): number {
  const wins = records.filter((record) => record.status === 'won');
  const uniqueAnswers = new Set(wins.map((record) => record.answerId)).size;
  switch (id) {
    case 'firstGame': return records.length;
    case 'firstWin': return wins.length;
    case 'oneGuess': return wins.filter((record) => record.guessIds.length === 1).length;
    case 'dailyWin': return wins.filter((record) => record.mode === 'daily').length;
    case 'allDifficulties': return new Set(wins.map((record) => record.difficulty)).size;
    case 'tenCharacters': return uniqueAnswers;
    case 'twentyCharacters': return uniqueAnswers;
    case 'fiftyCharacters': return uniqueAnswers;
    case 'threeWinStreak': return longestWinStreak(records);
    case 'tenGames': return records.length;
    case 'twentyFiveWins': return wins.length;
  }
}

export function loadStaticAchievementUnlocks(
  storage: Storage = localStorage,
): StaticAchievementUnlocks {
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(([id, unlockedAt]) => isAchievementId(id) && typeof unlockedAt === 'string'),
    ) as StaticAchievementUnlocks;
  } catch {
    return {};
  }
}

export function saveStaticAchievementUnlocks(
  unlocks: StaticAchievementUnlocks,
  storage: Storage = localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(unlocks));
}

export function unlockEarnedStaticAchievements(
  records: readonly StaticGameRecord[],
  unlocks: StaticAchievementUnlocks,
  unlockedAt = new Date().toISOString(),
): StaticAchievementUnlocks {
  const next = { ...unlocks };
  let changed = false;
  for (const achievement of STATIC_ACHIEVEMENTS) {
    if (next[achievement.id] || achievementCurrent(achievement.id, records) < achievement.target) continue;
    next[achievement.id] = unlockedAt;
    changed = true;
  }
  return changed ? next : unlocks;
}

export function getStaticAchievementProgress(
  records: readonly StaticGameRecord[],
  unlocks: StaticAchievementUnlocks,
): StaticAchievementProgress[] {
  return STATIC_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    current: Math.min(achievementCurrent(achievement.id, records), achievement.target),
    unlocked: Boolean(unlocks[achievement.id]),
    unlockedAt: unlocks[achievement.id] ?? null,
  }));
}
