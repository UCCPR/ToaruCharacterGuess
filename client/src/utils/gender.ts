export type GenderLabelKey = 'player.male' | 'player.female' | 'player.none' | 'player.unknown';

/** Maps the temporary numeric database projection to a user-facing lore state. */
export function genderLabelKey(value: number | string | undefined): GenderLabelKey {
  if (String(value) === '1') return 'player.male';
  if (String(value) === '0') return 'player.female';
  if (String(value) === '3') return 'player.none';
  return 'player.unknown';
}
