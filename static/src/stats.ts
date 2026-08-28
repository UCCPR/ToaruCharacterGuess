import type { StaticGameMode } from './game';

export type StaticGameRecord = {
  id: string;
  mode: StaticGameMode;
  difficulty: string;
  status: 'won' | 'lost';
  answerId: number;
  guessIds: number[];
  finishedAt: string;
};

export type StaticGameStats = {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWinningGuesses: number | null;
  bestGuesses: number | null;
  firstGuess: { characterId: number; percentage: number } | null;
};

const STORAGE_KEY = 'toaru-static-v2:records';
const MAX_RECORDS = 200;

function isRecord(value: unknown): value is StaticGameRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<StaticGameRecord>;
  return typeof record.id === 'string'
    && (record.mode === 'free' || record.mode === 'daily')
    && typeof record.difficulty === 'string'
    && (record.status === 'won' || record.status === 'lost')
    && Number.isInteger(record.answerId)
    && Array.isArray(record.guessIds)
    && record.guessIds.every(Number.isInteger)
    && typeof record.finishedAt === 'string';
}

export function loadStaticGameRecords(storage: Storage = localStorage): StaticGameRecord[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter(isRecord) : [];
  } catch {
    return [];
  }
}

export function addStaticGameRecord(
  record: StaticGameRecord,
  storage: Storage = localStorage,
): void {
  const records = loadStaticGameRecords(storage);
  if (records.some((item) => item.id === record.id)) return;
  storage.setItem(STORAGE_KEY, JSON.stringify([record, ...records].slice(0, MAX_RECORDS)));
}

export function clearStaticGameRecords(storage: Storage = localStorage): void {
  storage.removeItem(STORAGE_KEY);
}

export function summarizeStaticGameRecords(
  records: StaticGameRecord[],
  difficulties?: readonly string[],
): StaticGameStats {
  const accepted = difficulties ? new Set(difficulties) : null;
  const filtered = accepted
    ? records.filter((record) => accepted.has(record.difficulty))
    : records;
  const wins = filtered.filter((record) => record.status === 'won');
  const firstGuessCounts = new Map<number, number>();
  for (const record of filtered) {
    const firstGuess = record.guessIds[0];
    if (firstGuess !== undefined) {
      firstGuessCounts.set(firstGuess, (firstGuessCounts.get(firstGuess) ?? 0) + 1);
    }
  }
  const firstGuess = [...firstGuessCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0] - right[0])[0];

  return {
    totalGames: filtered.length,
    wins: wins.length,
    losses: filtered.length - wins.length,
    winRate: filtered.length ? wins.length / filtered.length : 0,
    avgWinningGuesses: wins.length
      ? wins.reduce((total, record) => total + record.guessIds.length, 0) / wins.length
      : null,
    bestGuesses: wins.length ? Math.min(...wins.map((record) => record.guessIds.length)) : null,
    firstGuess: firstGuess
      ? { characterId: firstGuess[0], percentage: firstGuess[1] / filtered.length }
      : null,
  };
}
