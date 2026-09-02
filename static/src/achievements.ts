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

export type StaticAchievementLifetime = {
  totalGames: number;
  wins: number;
  oneGuessWins: number;
  dailyWins: number;
  wonDifficulties: string[];
  wonAnswerIds: number[];
  currentWinStreak: number;
  longestWinStreak: number;
  processedGameIds: string[];
};

const STORAGE_KEY = 'toaru-static-v2:achievements';
const VIEWED_STORAGE_KEY = 'toaru-static-v2:achievement-views';
const LIFETIME_STORAGE_KEY = 'toaru-static-v2:achievement-lifetime';
const MAX_PROCESSED_GAME_IDS = 256;
const achievementIds = new Set<StaticAchievementId>(
  STATIC_ACHIEVEMENTS.map((achievement) => achievement.id),
);

function isAchievementId(value: string): value is StaticAchievementId {
  return achievementIds.has(value as StaticAchievementId);
}

function emptyStaticAchievementLifetime(): StaticAchievementLifetime {
  return {
    totalGames: 0,
    wins: 0,
    oneGuessWins: 0,
    dailyWins: 0,
    wonDifficulties: [],
    wonAnswerIds: [],
    currentWinStreak: 0,
    longestWinStreak: 0,
    processedGameIds: [],
  };
}

function achievementCurrent(
  id: StaticAchievementId,
  lifetime: StaticAchievementLifetime,
): number {
  switch (id) {
    case 'firstGame': return lifetime.totalGames;
    case 'firstWin': return lifetime.wins;
    case 'oneGuess': return lifetime.oneGuessWins;
    case 'dailyWin': return lifetime.dailyWins;
    case 'allDifficulties': return lifetime.wonDifficulties.length;
    case 'tenCharacters': return lifetime.wonAnswerIds.length;
    case 'twentyCharacters': return lifetime.wonAnswerIds.length;
    case 'fiftyCharacters': return lifetime.wonAnswerIds.length;
    case 'threeWinStreak': return lifetime.longestWinStreak;
    case 'tenGames': return lifetime.totalGames;
    case 'twentyFiveWins': return lifetime.wins;
  }
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

export function loadStaticAchievementLifetime(
  storage: Storage = localStorage,
): StaticAchievementLifetime {
  try {
    const value = JSON.parse(storage.getItem(LIFETIME_STORAGE_KEY) ?? 'null') as Partial<StaticAchievementLifetime> | null;
    if (!value
      || !isNonNegativeInteger(value.totalGames)
      || !isNonNegativeInteger(value.wins)
      || !isNonNegativeInteger(value.oneGuessWins)
      || !isNonNegativeInteger(value.dailyWins)
      || !isNonNegativeInteger(value.currentWinStreak)
      || !isNonNegativeInteger(value.longestWinStreak)
      || !Array.isArray(value.wonDifficulties)
      || !value.wonDifficulties.every((item) => typeof item === 'string')
      || !Array.isArray(value.wonAnswerIds)
      || !value.wonAnswerIds.every(Number.isInteger)
      || !Array.isArray(value.processedGameIds)
      || !value.processedGameIds.every((item) => typeof item === 'string')) {
      return emptyStaticAchievementLifetime();
    }
    return {
      totalGames: value.totalGames,
      wins: value.wins,
      oneGuessWins: value.oneGuessWins,
      dailyWins: value.dailyWins,
      wonDifficulties: [...new Set(value.wonDifficulties)],
      wonAnswerIds: [...new Set(value.wonAnswerIds)],
      currentWinStreak: value.currentWinStreak,
      longestWinStreak: value.longestWinStreak,
      processedGameIds: [...new Set(value.processedGameIds)].slice(-MAX_PROCESSED_GAME_IDS),
    };
  } catch {
    return emptyStaticAchievementLifetime();
  }
}

export function reconcileStaticAchievementLifetime(
  records: readonly StaticGameRecord[],
  lifetime: StaticAchievementLifetime,
): StaticAchievementLifetime {
  const processed = new Set(lifetime.processedGameIds);
  const pending = records
    .filter((record) => !processed.has(record.id))
    .sort((left, right) => Date.parse(left.finishedAt) - Date.parse(right.finishedAt));
  if (!pending.length) return lifetime;

  const next: StaticAchievementLifetime = {
    ...lifetime,
    wonDifficulties: [...lifetime.wonDifficulties],
    wonAnswerIds: [...lifetime.wonAnswerIds],
    processedGameIds: [...lifetime.processedGameIds],
  };
  const difficulties = new Set(next.wonDifficulties);
  const answers = new Set(next.wonAnswerIds);
  for (const record of pending) {
    next.totalGames += 1;
    next.processedGameIds.push(record.id);
    if (record.status === 'won') {
      next.wins += 1;
      next.oneGuessWins += Number(record.guessIds.length === 1);
      next.dailyWins += Number(record.mode === 'daily');
      next.currentWinStreak += 1;
      next.longestWinStreak = Math.max(next.longestWinStreak, next.currentWinStreak);
      difficulties.add(record.difficulty);
      answers.add(record.answerId);
    } else {
      next.currentWinStreak = 0;
    }
  }
  next.wonDifficulties = [...difficulties];
  next.wonAnswerIds = [...answers];
  next.processedGameIds = [...new Set(next.processedGameIds)].slice(-MAX_PROCESSED_GAME_IDS);
  return next;
}

export function syncStaticAchievementLifetime(
  records: readonly StaticGameRecord[],
  storage: Storage = localStorage,
): StaticAchievementLifetime {
  const current = loadStaticAchievementLifetime(storage);
  const next = reconcileStaticAchievementLifetime(records, current);
  if (next !== current) storage.setItem(LIFETIME_STORAGE_KEY, JSON.stringify(next));
  return next;
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

export function loadViewedStaticAchievements(
  storage: Storage = localStorage,
): StaticAchievementId[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(VIEWED_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is StaticAchievementId => (
      typeof id === 'string' && isAchievementId(id)
    )))];
  } catch {
    return [];
  }
}

export function saveViewedStaticAchievements(
  ids: readonly StaticAchievementId[],
  storage: Storage = localStorage,
): void {
  storage.setItem(VIEWED_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

export function getUnseenStaticAchievements(
  unlocks: StaticAchievementUnlocks,
  viewed: readonly StaticAchievementId[],
): StaticAchievementId[] {
  const viewedIds = new Set(viewed);
  return STATIC_ACHIEVEMENTS
    .map((achievement) => achievement.id)
    .filter((id) => Boolean(unlocks[id]) && !viewedIds.has(id));
}

export function getNewlyUnlockedStaticAchievements(
  previous: StaticAchievementUnlocks,
  next: StaticAchievementUnlocks,
): StaticAchievementId[] {
  return STATIC_ACHIEVEMENTS
    .map((achievement) => achievement.id)
    .filter((id) => !previous[id] && Boolean(next[id]));
}

export function unlockEarnedStaticAchievements(
  records: readonly StaticGameRecord[],
  unlocks: StaticAchievementUnlocks,
  unlockedAt = new Date().toISOString(),
  lifetime = reconcileStaticAchievementLifetime(records, emptyStaticAchievementLifetime()),
): StaticAchievementUnlocks {
  const next = { ...unlocks };
  let changed = false;
  for (const achievement of STATIC_ACHIEVEMENTS) {
    if (next[achievement.id] || achievementCurrent(achievement.id, lifetime) < achievement.target) continue;
    next[achievement.id] = unlockedAt;
    changed = true;
  }
  return changed ? next : unlocks;
}

export function getStaticAchievementProgress(
  records: readonly StaticGameRecord[],
  unlocks: StaticAchievementUnlocks,
  lifetime = reconcileStaticAchievementLifetime(records, emptyStaticAchievementLifetime()),
): StaticAchievementProgress[] {
  return STATIC_ACHIEVEMENTS.map((achievement) => {
    const unlocked = Boolean(unlocks[achievement.id]);
    return {
      ...achievement,
      current: unlocked
        ? achievement.target
        : Math.min(achievementCurrent(achievement.id, lifetime), achievement.target),
      unlocked,
      unlockedAt: unlocks[achievement.id] ?? null,
    };
  });
}
