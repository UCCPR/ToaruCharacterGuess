import {
  compareCharacters,
  type CharacterIdentity,
  type ComparableCharacter,
} from '@toaru-character-guess/shared';

export type Level = 'correct' | 'close' | 'wrong';
export type Character = { id: number; name: string; names: { zh: string; en: string; ja: string }; aliases: readonly string[]; difficulties: readonly string[]; side: string; sides: readonly string[]; location: string; organizations: readonly { name: string; parent: string | null }[]; identities: readonly CharacterIdentity[]; gender: string; debutWork: string; debutYear: number };
export type Cell = { value: string | number; level: Level; hint?: 'higher' | 'lower'; note?: string };
export type Guess = { character: Character; correct: boolean; cells: Record<'side' | 'location' | 'organization' | 'identity' | 'gender' | 'work' | 'year', Cell> };

export type StaticGameMode = 'daily' | 'free';

export type StaticSavedGame = {
  gameId?: string;
  targetId: number;
  guessIds: number[];
  status: 'playing' | 'won' | 'lost';
  startedAt?: string;
  updatedAt?: number;
};

export type UnfinishedStaticGame = {
  key: string;
  mode: StaticGameMode;
  difficulty: string;
  game: StaticSavedGame;
};

const STORAGE_PREFIX = 'toaru-static-v2';

function dateKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

export function staticGameStorageKey(
  mode: StaticGameMode,
  difficulty: string,
  day = dateKey(),
): string {
  return `${STORAGE_PREFIX}:${mode}:${difficulty}:${mode === 'daily' ? day : 'free'}`;
}

export function clearStaticGame(mode: StaticGameMode, difficulty: string): void {
  localStorage.removeItem(staticGameStorageKey(mode, difficulty));
}

function isSavedGame(value: unknown): value is StaticSavedGame {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<StaticSavedGame>;
  return Number.isInteger(game.targetId)
    && Array.isArray(game.guessIds)
    && game.guessIds.every(Number.isInteger)
    && ['playing', 'won', 'lost'].includes(game.status ?? '');
}

export function latestUnfinishedStaticGame(
  storage: Storage = localStorage,
  day = dateKey(),
): UnfinishedStaticGame | null {
  const candidates: UnfinishedStaticGame[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    const [prefix, rawMode, difficulty, scope, ...extra] = key.split(':');
    if (
      prefix !== STORAGE_PREFIX
      || (rawMode !== 'free' && rawMode !== 'daily')
      || !difficulty
      || extra.length
      || (rawMode === 'free' && scope !== 'free')
      || (rawMode === 'daily' && scope !== day)
    ) continue;

    try {
      const game: unknown = JSON.parse(storage.getItem(key) ?? 'null');
      if (!isSavedGame(game) || game.status !== 'playing') continue;
      candidates.push({ key, mode: rawMode, difficulty, game });
    } catch {
      continue;
    }
  }

  return candidates.sort((left, right) =>
    (right.game.updatedAt ?? 0) - (left.game.updatedAt ?? 0)
    || right.game.guessIds.length - left.game.guessIds.length
    || left.key.localeCompare(right.key)
  )[0] ?? null;
}

function comparableCharacter(character: Character): ComparableCharacter {
  return {
    id: character.id,
    primarySide: character.side,
    sides: character.sides,
    location: character.location,
    organizations: character.organizations,
    identities: character.identities,
    gender: character.gender,
    debutWork: character.debutWork,
    debutYear: character.debutYear,
  };
}

export function compare(guess: Character, target: Character): Guess {
  const common = compareCharacters(comparableCharacter(guess), comparableCharacter(target));
  return {
    character: guess,
    correct: common.correct,
    cells: {
      side: common.side,
      location: common.location,
      organization: {
        ...common.organization,
        note: common.organization.level === 'close' ? 'organization' : undefined,
      },
      identity: {
        ...common.identity,
        note: common.identity.level === 'close' ? 'identity' : undefined,
      },
      gender: common.gender,
      work: common.debutWork,
      year: {
        ...common.debutYear,
        value: common.debutYear.value || '待复核',
      },
    },
  };
}
export function dailyTarget(list: Character[], difficulty: string, day: string) { const pool=list.filter((item)=>item.difficulties.includes(difficulty)); let hash=2166136261; for(const char of `${day}:${difficulty}`)hash=Math.imul(hash^char.charCodeAt(0),16777619); return pool[Math.abs(hash)%pool.length]; }
