import { randomInt } from 'crypto';
import { db } from '../db/knex';
import { redis, redisKey, redisPublisher, redisSubscriber } from '../redis';
import { Player } from '../types';
import { DIFFICULTY_LEVELS } from '../difficulties';
import {
  GENDER_CODES,
  IDENTITY_ONLY_ORGANIZATION_TYPES,
  SIDE_TITLES,
  characterIdentityKey,
  organizationIdentity,
  sideIdentity,
} from './characterClassification';

const INVALIDATE_CHANNEL = redisKey('players:invalidate');
const VERSION_KEY = redisKey('players:revision');
const REFRESH_DEBOUNCE_MS = 100;

type PublicPlayer = {
  id: number;
  nickname: string;
  localizedNames: { zh: string; en: string; ja: string };
};
type SearchablePlayer = { player: Player; search: string };
type OrganizationRow = {
  player_id: number;
  name: string;
  parent_name: string | null;
  organization_type: string;
  relationship_type: string;
  is_primary: boolean | number;
};
type SideRow = {
  player_id: number;
  side_key: string;
  relationship_type: string;
  is_primary: boolean | number;
};
type LocationRow = { player_id: number; name: string; is_primary: boolean | number };
type AppearanceRow = { player_id: number; debut_year: number | null; debut_work: string | null };
let playersById = new Map<number, Player>();
let allPlayers: Player[] = [];
let playersByDifficulty = new Map<string, Player[]>();
let searchablePlayers: SearchablePlayer[] = [];
let publicList: { version: string; players: PublicPlayer[] } = { version: '1', players: [] };
let refreshPromise: Promise<void> | null = null;
let refreshTimer: NodeJS.Timeout | null = null;
let refreshGeneration = 0;
let pendingVersion: string | null = null;

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export async function refreshPlayerCache(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    let appliedGeneration = -1;
    while (appliedGeneration !== refreshGeneration) {
      const requestedGeneration = refreshGeneration;
      const [rows, memberships, sideRows, organizationRows, locationRows, appearanceRows, storedVersion] = await Promise.all([
        db('characters as character')
          .join('character_game_profiles as profile', 'profile.character_id', 'character.id')
          .orderBy('character.canonical_name_zh')
          .select(
            'character.id',
            'character.canonical_name_zh as nickname',
            'character.name_en',
            'character.name_ja',
            'character.gender',
            'character.status',
            'character.created_at',
            'profile.is_enabled'
          ),
        db('character_difficulties').select('character_id as player_id', 'difficulty_key'),
        db('characters as character')
          .join('character_sides as side', 'side.character_id', 'character.id')
          .where('side.review_status', 'community_sourced')
          .select('character.id as player_id', 'side.side_key', 'side.relationship_type', 'side.is_primary'),
        db('characters as character')
          .join('character_organizations as membership', 'membership.character_id', 'character.id')
          .join('organizations as organization', 'organization.id', 'membership.organization_id')
          .leftJoin('organizations as parent', 'parent.id', 'organization.parent_id')
          .where('membership.review_status', 'community_sourced')
          .select(
            'character.id as player_id',
            'organization.name_zh as name',
            'parent.name_zh as parent_name',
            'organization.organization_type',
            'membership.relationship_type',
            'membership.is_primary'
          ),
        db('characters as character')
          .join('character_locations as membership', 'membership.character_id', 'character.id')
          .join('locations as location', 'location.id', 'membership.location_id')
          .where('membership.review_status', 'community_sourced')
          .select('character.id as player_id', 'location.name_zh as name', 'membership.is_primary'),
        db('characters as character')
          .join('character_appearances as appearance', 'appearance.character_id', 'character.id')
          .leftJoin('works as work', 'work.id', 'appearance.work_id')
          .where('appearance.is_first', true)
          .where('appearance.review_status', 'community_sourced')
          .select('character.id as player_id', 'appearance.debut_year', 'work.title_zh as debut_work'),
        redis()?.get(VERSION_KEY) ?? Promise.resolve(null),
      ]);
      const sidesByPlayer = new Map<number, Set<string>>();
      const primarySideByPlayer = new Map<number, string>();
      const identitiesByPlayer = new Map<number, Map<string, ReturnType<typeof organizationIdentity>>>();
      for (const row of sideRows as SideRow[]) {
        const playerId = Number(row.player_id);
        const name = SIDE_TITLES[String(row.side_key)];
        if (!name) continue;
        const sides = sidesByPlayer.get(playerId) ?? new Set<string>();
        sides.add(name);
        sidesByPlayer.set(playerId, sides);
        if (Boolean(row.is_primary) || !primarySideByPlayer.has(playerId)) {
          primarySideByPlayer.set(playerId, name);
        }
        const identity = sideIdentity(String(row.relationship_type));
        if (identity) {
          const identities = identitiesByPlayer.get(playerId) ?? new Map();
          identities.set(characterIdentityKey(identity), identity);
          identitiesByPlayer.set(playerId, identities);
        }
      }
      const organizationsByPlayer = new Map<number, Array<{ name: string; parent: string | null }>>();
      const primaryOrganizationByPlayer = new Map<number, string>();
      for (const row of organizationRows as OrganizationRow[]) {
        const playerId = Number(row.player_id);
        const identities = identitiesByPlayer.get(playerId) ?? new Map();
        const identity = organizationIdentity({
          name: String(row.name),
          type: String(row.organization_type),
          relationship: String(row.relationship_type),
        });
        identities.set(characterIdentityKey(identity), identity);
        identitiesByPlayer.set(playerId, identities);
        if (IDENTITY_ONLY_ORGANIZATION_TYPES.has(String(row.organization_type))) continue;
        const organizations = organizationsByPlayer.get(playerId) ?? [];
        if (!organizations.some((entry) => entry.name === row.name)) {
          organizations.push({ name: String(row.name), parent: row.parent_name ? String(row.parent_name) : null });
        }
        organizationsByPlayer.set(playerId, organizations);
        if (Boolean(row.is_primary) || !primaryOrganizationByPlayer.has(playerId)) {
          primaryOrganizationByPlayer.set(playerId, String(row.name));
        }
      }
      const primaryLocationByPlayer = new Map<number, string>();
      for (const row of locationRows as LocationRow[]) {
        const playerId = Number(row.player_id);
        if (Boolean(row.is_primary) || !primaryLocationByPlayer.has(playerId)) {
          primaryLocationByPlayer.set(playerId, String(row.name));
        }
      }
      const appearanceByPlayer = new Map<number, AppearanceRow>();
      for (const row of appearanceRows as AppearanceRow[]) {
        if (!appearanceByPlayer.has(Number(row.player_id))) {
          appearanceByPlayer.set(Number(row.player_id), row);
        }
      }
      const hydrated: Player[] = rows.map((row) => {
        const playerId = Number(row.id);
        const primarySide = primarySideByPlayer.get(playerId) ?? '未知';
        const appearance = appearanceByPlayer.get(playerId);
        return {
          id: playerId,
          nickname: String(row.nickname),
          localized_names: {
            zh: String(row.nickname),
            en: String(row.name_en || row.nickname),
            ja: String(row.name_ja || row.nickname),
          },
          nationality: primarySide,
          region: primaryLocationByPlayer.get(playerId) ?? '',
          team: primaryOrganizationByPlayer.get(playerId) ?? '',
          team_history: [],
          age: 0,
          role: '',
          major_championships: GENDER_CODES[String(row.gender)] ?? GENDER_CODES.unknown,
          major_appearances: Number(appearance?.debut_year ?? 0),
          debut_work: String(appearance?.debut_work ?? ''),
          side_affiliations: [...(sidesByPlayer.get(playerId) ?? new Set([primarySide]))],
          organizations: organizationsByPlayer.get(playerId) ?? [],
          identities: [...(identitiesByPlayer.get(playerId)?.values() ?? [])],
          difficulties: [],
          is_active: String(row.status) === 'active',
          is_enabled: Boolean(row.is_enabled),
          created_at: String(row.created_at),
        };
      });
      const hydratedById = new Map(hydrated.map((player) => [Number(player.id), player]));
      playersByDifficulty = new Map(
        DIFFICULTY_LEVELS
          .filter((difficulty) => difficulty.isEnabled)
          .map((difficulty) => [difficulty.key, [] as Player[]])
      );
      for (const membership of memberships) {
        const player = hydratedById.get(Number(membership.player_id));
        if (!player) continue;
        const difficultyKey = String(membership.difficulty_key);
        player.difficulties!.push(difficultyKey);
        if (Boolean(player.is_enabled)) playersByDifficulty.get(difficultyKey)?.push(player);
      }
      allPlayers = hydrated.filter((player) => Boolean(player.is_enabled));
      playersById = new Map(hydrated.map((player) => [player.id, player]));
      searchablePlayers = allPlayers.map((player) => ({
        player,
        search: normalizeSearch([
          player.nickname,
          player.localized_names?.en,
          player.localized_names?.ja,
          player.team,
        ].filter(Boolean).join('\0')),
      }));
      publicList = {
        version: pendingVersion || storedVersion || String(Date.now()),
        players: allPlayers.map((player) => ({
          id: player.id,
          nickname: player.nickname,
          localizedNames: player.localized_names!,
        })),
      };
      pendingVersion = null;
      appliedGeneration = requestedGeneration;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function schedulePlayerCacheRefresh(): void {
  refreshGeneration += 1;
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refreshPlayerCache().catch((err) => console.error('[players] refresh failed', err));
  }, REFRESH_DEBOUNCE_MS);
  refreshTimer.unref?.();
}

export async function initPlayerCache(): Promise<void> {
  const client = redis();
  if (client) {
    await client.set(VERSION_KEY, '1', { NX: true });
    const subscriber = redisSubscriber();
    if (subscriber) await subscriber.subscribe(INVALIDATE_CHANNEL, schedulePlayerCacheRefresh);
  }
  await refreshPlayerCache();
}

export function getPlayer(id: number): Player | undefined {
  return playersById.get(id);
}

export function getEnabledPlayer(id: number): Player | undefined {
  const player = playersById.get(id);
  return player && Boolean(player.is_enabled) ? player : undefined;
}

export function getDifficultyPlayers(key: string): Player[] {
  return playersByDifficulty.get(key) ?? [];
}

export function getAllCachedPlayers(): Player[] {
  return [...allPlayers];
}

export function pickCachedTarget(mode: string, excludedIds: ReadonlySet<number> = new Set()): Player | null {
  const pool = playersByDifficulty.get(mode) ?? [];
  if (!pool.length) return null;
  const candidates = excludedIds.size
    ? pool.filter((player) => !excludedIds.has(player.id))
    : pool;
  const source = candidates.length ? candidates : pool;
  return source[randomInt(source.length)];
}

export function isDifficultyAvailable(key: string): boolean {
  const difficulty = DIFFICULTY_LEVELS.find((item) => item.key === key);
  return Boolean(difficulty?.isEnabled && (playersByDifficulty.get(key)?.length ?? 0) > 0);
}

export function searchCachedPlayers(search: string, limit: number): Player[] {
  const normalized = normalizeSearch(search);
  if (!normalized) return allPlayers.slice(0, limit);
  const result: Player[] = [];
  for (const entry of searchablePlayers) {
    if (!entry.search.includes(normalized)) continue;
    result.push(entry.player);
    if (result.length >= limit) break;
  }
  return result;
}

export async function getPublicPlayerList(): Promise<typeof publicList> {
  const storedVersion = await redis()?.get(VERSION_KEY);
  if (storedVersion && storedVersion !== publicList.version) {
    pendingVersion = storedVersion;
    refreshGeneration += 1;
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    await refreshPlayerCache();
  }
  return publicList;
}

export async function invalidatePlayerCache(): Promise<void> {
  const client = redis();
  let nextVersion = String(Date.now());
  if (client) {
    try {
      nextVersion = String(await client.incr(VERSION_KEY));
    } catch (err) {
      console.warn('[players] cache revision update failed', err instanceof Error
        ? err.message
        : err);
    }
  }
  pendingVersion = nextVersion;
  refreshGeneration += 1;
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  await refreshPlayerCache();
  if (client) {
    try {
      await redisPublisher()?.publish(INVALIDATE_CHANNEL, nextVersion);
    } catch (err) {
      console.warn('[players] cache invalidation notification failed', err instanceof Error
        ? err.message
        : err);
    }
  }
}
