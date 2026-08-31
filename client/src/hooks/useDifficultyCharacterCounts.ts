import { useEffect, useState } from 'react';
import {
  getPlayerList,
  subscribePlayerList,
  type PlayerSuggestion,
} from '../api/playerList';

export type DifficultyCharacterCounts = Readonly<Record<string, number>>;

export function countCharactersByDifficulty(
  players: readonly Pick<PlayerSuggestion, 'difficulties'>[],
): DifficultyCharacterCounts {
  const counts: Record<string, number> = {};
  for (const player of players) {
    for (const difficulty of new Set(player.difficulties ?? [])) {
      counts[difficulty] = (counts[difficulty] ?? 0) + 1;
    }
  }
  return counts;
}

export function useDifficultyCharacterCounts(): DifficultyCharacterCounts | null {
  const [counts, setCounts] = useState<DifficultyCharacterCounts | null>(null);

  useEffect(() => {
    let mounted = true;
    const apply = (players: PlayerSuggestion[]) => {
      if (mounted) setCounts(countCharactersByDifficulty(players));
    };
    const unsubscribe = subscribePlayerList(apply);
    void getPlayerList().then(apply).catch(() => undefined);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return counts;
}
