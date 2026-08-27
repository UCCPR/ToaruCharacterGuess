import { Player, GuessFeedback, AttributeFeedback } from '../types';
import { sameContinent } from './characterClassification';

const AGE_CLOSE_RANGE = 1;
const MAJOR_APPEARANCES_CLOSE_RANGE = 3;

function textAttr(guess: string, target: string): AttributeFeedback {
  return { value: guess, level: guess === target ? 'correct' : 'wrong' };
}

function stableIndex(length: number, guessId: number, targetId: number, salt: number): number {
  if (length <= 1) return 0;
  const mixed = Math.imul(guessId + salt, 1103515245) ^ Math.imul(targetId + 17, 12345);
  return Math.abs(mixed) % length;
}

function teamAttr(guess: Player, target: Player): AttributeFeedback {
  const guessOrganizations = guess.organizations ?? [];
  const targetOrganizations = target.organizations ?? [];
  if (!guessOrganizations.length) {
    return {
      value: '无所属',
      level: targetOrganizations.length ? 'wrong' : 'correct',
    };
  }
  const exact = guessOrganizations.filter((organization) =>
    targetOrganizations.some((targetOrganization) => targetOrganization.name === organization.name)
  );
  if (exact.length) {
    const selected = exact[stableIndex(exact.length, guess.id, target.id, 1)];
    return { value: selected.name, level: 'correct' };
  }
  const related = guessOrganizations.filter((organization) => organization.parent &&
    targetOrganizations.some((targetOrganization) =>
      targetOrganization.parent === organization.parent && targetOrganization.name !== organization.name
    ));
  if (related.length) {
    const selected = related[stableIndex(related.length, guess.id, target.id, 2)];
    return { value: selected.name, level: 'close' };
  }
  const selected = guessOrganizations[stableIndex(guessOrganizations.length, guess.id, target.id, 3)];
  return { value: selected.name, level: 'wrong' };
}

function regionAttr(guess: string, target: string): AttributeFeedback {
  if (guess === target) return { value: guess, level: 'correct' };
  return { value: guess, level: sameContinent(guess, target) ? 'close' : 'wrong' };
}

function identityAttr(guess: Player, target: Player): AttributeFeedback {
  const guessIdentities = guess.identities?.length
    ? guess.identities
    : [{ name: '身份未分类', group: 'unclassified' }];
  const targetIdentities = target.identities?.length
    ? target.identities
    : [{ name: '身份未分类', group: 'unclassified' }];
  const exact = guessIdentities.filter((identity) =>
    targetIdentities.some((targetIdentity) => targetIdentity.name === identity.name)
  );
  if (exact.length) {
    const selected = exact[stableIndex(exact.length, guess.id, target.id, 4)];
    return { value: selected.name, level: 'correct' };
  }
  const related = guessIdentities.filter((identity) =>
    targetIdentities.some((targetIdentity) => targetIdentity.group === identity.group)
  );
  if (related.length) {
    const selected = related[stableIndex(related.length, guess.id, target.id, 5)];
    return { value: selected.name, level: 'close' };
  }
  const selected = guessIdentities[stableIndex(guessIdentities.length, guess.id, target.id, 6)];
  return { value: selected.name, level: 'wrong' };
}

function numberAttr(
  guessVal: number,
  targetVal: number,
  closeRange: number
): AttributeFeedback {
  if (guessVal === targetVal) return { value: guessVal, level: 'correct' };
  const level = Math.abs(guessVal - targetVal) <= closeRange ? 'close' : 'wrong';
  return {
    value: guessVal,
    level,
    hint: targetVal > guessVal ? 'higher' : 'lower',
  };
}

function sideAttr(guess: Player, target: Player): AttributeFeedback {
  if (guess.nationality === target.nationality) {
    return { value: guess.nationality, level: 'correct' };
  }
  const guessSides = new Set(guess.side_affiliations?.length
    ? guess.side_affiliations
    : [guess.nationality]);
  const targetSides = target.side_affiliations?.length
    ? target.side_affiliations
    : [target.nationality];
  return {
    value: guess.nationality,
    level: targetSides.some((side) => guessSides.has(side)) ? 'close' : 'wrong',
  };
}

function exactNumberAttr(guessVal: number, targetVal: number): AttributeFeedback {
  return { value: guessVal, level: guessVal === targetVal ? 'correct' : 'wrong' };
}

/** 逐属性对比猜测选手与目标选手,产出反馈 */
export function compareGuess(guess: Player, target: Player): GuessFeedback {
  const correct = guess.id === target.id;
  return {
    playerId: guess.id,
    nickname: guess.nickname,
    correct,
    attributes: {
      nationality: sideAttr(guess, target),
      region: regionAttr(guess.region, target.region),
      team: teamAttr(guess, target),
      age: numberAttr(guess.age, target.age, AGE_CLOSE_RANGE),
      // The legacy `role` feedback slot now carries the closest identity.
      // Ability names and numeric levels no longer influence visible gameplay.
      role: identityAttr(guess, target),
      // The legacy numeric column currently represents gender. It is a
      // category, so it has no "close" state or directional hint.
      majorChampionships: exactNumberAttr(
        guess.major_championships,
        target.major_championships
      ),
      majorAppearances: numberAttr(
        guess.major_appearances,
        target.major_appearances,
        MAJOR_APPEARANCES_CLOSE_RANGE
      ),
      debutWork: textAttr(guess.debut_work, target.debut_work),
      isActive: {
        value: Boolean(guess.is_active),
        level: Boolean(guess.is_active) === Boolean(target.is_active) ? 'correct' : 'wrong',
      },
    },
  };
}

export function refreshGuessFeedback(
  feedback: GuessFeedback,
  guess?: Player,
  target?: Player
): GuessFeedback {
  if (!guess || !target) return feedback;
  return compareGuess(guess, target);
}

export const MAX_GUESSES = 8;
