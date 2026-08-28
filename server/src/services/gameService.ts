import {
  MAX_GUESSES,
  UNCLASSIFIED_IDENTITY,
  compareCharacters,
  compareExact,
  compareNumberWithin,
  type ComparableCharacter,
} from '@toaru-character-guess/shared';
import { Player, GuessFeedback } from '../types';

const AGE_CLOSE_RANGE = 1;

function comparableCharacter(player: Player): ComparableCharacter {
  return {
    id: player.id,
    primarySide: player.nationality,
    sides: player.side_affiliations?.length
      ? player.side_affiliations
      : [player.nationality],
    location: player.region,
    organizations: player.organizations ?? [],
    identities: player.identities?.length
      ? player.identities
      : [UNCLASSIFIED_IDENTITY],
    gender: player.major_championships,
    debutWork: player.debut_work,
    debutYear: player.major_appearances,
  };
}

/** 逐属性对比猜测角色与目标角色，通用字段由共享规则产出。 */
export function compareGuess(guess: Player, target: Player): GuessFeedback {
  const common = compareCharacters(comparableCharacter(guess), comparableCharacter(target));
  return {
    playerId: guess.id,
    nickname: guess.nickname,
    correct: common.correct,
    attributes: {
      nationality: common.side,
      region: common.location,
      team: common.organization,
      age: compareNumberWithin(guess.age, target.age, AGE_CLOSE_RANGE),
      // Legacy protocol name: this slot now carries normalized identity feedback.
      role: common.identity,
      // Legacy protocol name: this slot now carries exact gender feedback.
      majorChampionships: common.gender,
      majorAppearances: common.debutYear,
      debutWork: common.debutWork,
      isActive: compareExact(Boolean(guess.is_active), Boolean(target.is_active)),
    },
  };
}

export function refreshGuessFeedback(
  feedback: GuessFeedback,
  guess?: Player,
  target?: Player,
): GuessFeedback {
  if (!guess || !target) return feedback;
  return compareGuess(guess, target);
}

export { MAX_GUESSES };
