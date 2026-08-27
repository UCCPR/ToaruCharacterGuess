import { evalCommandScript, redis, redisKey } from '../redis';

const WINDOW_SECONDS = 60;
const PERSIST_LIMIT = 4;
const MAX_MEMORY_IDENTITIES = 10_000;

interface MemoryLimit {
  expiresAt: number;
  count: number;
  decisions: Map<string, boolean>;
}

const memoryLimits = new Map<string, MemoryLimit>();

function memoryDecision(identityKey: string, gameId: string): boolean {
  const now = Date.now();
  let limit = memoryLimits.get(identityKey);
  if (!limit || limit.expiresAt <= now) {
    limit = {
      expiresAt: now + WINDOW_SECONDS * 1000,
      count: 0,
      decisions: new Map(),
    };
    memoryLimits.set(identityKey, limit);
  }

  const existing = limit.decisions.get(gameId);
  if (existing !== undefined) return existing;

  limit.count += 1;
  const allowed = limit.count <= PERSIST_LIMIT;
  limit.decisions.set(gameId, allowed);

  if (memoryLimits.size > MAX_MEMORY_IDENTITIES) {
    for (const [key, entry] of memoryLimits) {
      if (entry.expiresAt <= now || key !== identityKey) memoryLimits.delete(key);
      if (memoryLimits.size <= MAX_MEMORY_IDENTITIES) break;
    }
  }
  return allowed;
}

/** Returns whether this completed single-player game should be persisted. */
export async function shouldPersistSingleSettlement(
  identityKey: string,
  gameId: string
): Promise<boolean> {
  if (!redis()) return memoryDecision(identityKey, gameId);

  const result = await evalCommandScript(
    'single-settlement-soft-limit-v1',
    `local field = 'game:' .. ARGV[1]
     local existing = redis.call('HGET', KEYS[1], field)
     if existing then return tonumber(existing) end
     local count = tonumber(redis.call('HGET', KEYS[1], 'count') or 0) + 1
     local allowed = count <= tonumber(ARGV[2]) and 1 or 0
     redis.call('HSET', KEYS[1], 'count', tostring(count), field, tostring(allowed))
     if count == 1 or redis.call('TTL', KEYS[1]) < 0 then
       redis.call('EXPIRE', KEYS[1], ARGV[3])
     end
     return allowed`,
    [redisKey(`single:settlement-limit:${identityKey}`)],
    [gameId, String(PERSIST_LIMIT), String(WINDOW_SECONDS)]
  );
  return Number(result) === 1;
}
