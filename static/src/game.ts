export type Level = 'correct' | 'close' | 'wrong';
export type Character = { id: number; name: string; names: { zh: string; en: string; ja: string }; aliases: readonly string[]; difficulties: readonly string[]; side: string; sides: readonly string[]; location: string; organizations: readonly { name: string; parent: string | null }[]; identities: readonly { name: string; group: string }[]; gender: string; debutWork: string; debutYear: number };
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

const continent: Record<string, string> = { '学园都市':'asia','日本':'asia','英国':'europe','法国':'europe','意大利':'europe','俄罗斯':'europe','德国':'europe','罗马尼亚':'europe','美国':'north-america','夏威夷':'north-america','墨西哥':'north-america','巴西':'south-america','埃及':'africa','南非':'africa','澳大利亚':'oceania' };
const pick = <T,>(items: readonly T[], seed: number) => items[Math.abs(seed) % items.length];
const seed = (a: number, b: number, salt: number) => Math.imul(a + salt, 1103515245) ^ Math.imul(b + 17, 12345);
function organization(guess: Character, target: Character): Cell { if (!guess.organizations.length) return { value:'无所属', level:target.organizations.length ? 'wrong' : 'correct' }; const same=guess.organizations.filter((item)=>target.organizations.some((other)=>other.name===item.name)); if(same.length)return{value:pick(same,seed(guess.id,target.id,1)).name,level:'correct'}; const related=guess.organizations.filter((item)=>item.parent&&target.organizations.some((other)=>other.parent===item.parent&&other.name!==item.name)); if(related.length)return{value:pick(related,seed(guess.id,target.id,2)).name,level:'close',note:'organization'};return{value:pick(guess.organizations,seed(guess.id,target.id,3)).name,level:'wrong'}; }
function identity(guess: Character, target: Character): Cell { const same=guess.identities.filter((item)=>target.identities.some((other)=>other.name===item.name)); if(same.length)return{value:pick(same,seed(guess.id,target.id,4)).name,level:'correct'}; const related=guess.identities.filter((item)=>target.identities.some((other)=>other.group===item.group)); if(related.length)return{value:pick(related,seed(guess.id,target.id,5)).name,level:'close',note:'identity'};return{value:pick(guess.identities,seed(guess.id,target.id,6)).name,level:'wrong'}; }
export function compare(guess: Character, target: Character): Guess { const side=guess.side===target.side?'correct':guess.sides.some((value)=>target.sides.includes(value))?'close':'wrong'; const location=guess.location===target.location?'correct':continent[guess.location]&&continent[guess.location]===continent[target.location]?'close':'wrong'; const year=guess.debutYear===target.debutYear?'correct':Math.abs(guess.debutYear-target.debutYear)<=3?'close':'wrong'; return { character:guess,correct:guess.id===target.id,cells:{side:{value:guess.side,level:side},location:{value:guess.location,level:location},organization:organization(guess,target),identity:identity(guess,target),gender:{value:guess.gender,level:guess.gender===target.gender?'correct':'wrong'},work:{value:guess.debutWork,level:guess.debutWork===target.debutWork?'correct':'wrong'},year:{value:guess.debutYear||'待复核',level:year,hint:year==='correct'?undefined:target.debutYear>guess.debutYear?'higher':'lower'}}}; }
export function dailyTarget(list: Character[], difficulty: string, day: string) { const pool=list.filter((item)=>item.difficulties.includes(difficulty)); let hash=2166136261; for(const char of `${day}:${difficulty}`)hash=Math.imul(hash^char.charCodeAt(0),16777619); return pool[Math.abs(hash)%pool.length]; }
