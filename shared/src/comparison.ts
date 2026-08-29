import { characterIdentityKey, type CharacterIdentity } from './classification.js';

export type FeedbackLevel = 'correct' | 'close' | 'wrong';
export type DirectionHint = 'higher' | 'lower';

export interface AttributeFeedback<T extends string | number | boolean> {
  value: T;
  level: FeedbackLevel;
  hint?: DirectionHint;
}

export interface OrganizationReference {
  name: string;
  parent: string | null;
}

export interface ComparableCharacter {
  id: number;
  primarySide: string;
  sides: readonly string[];
  location: string;
  organizations: readonly OrganizationReference[];
  identities: readonly CharacterIdentity[];
  gender: string | number;
  debutWork: string;
  debutYear: number;
}

export interface CommonComparison {
  correct: boolean;
  side: AttributeFeedback<string>;
  location: AttributeFeedback<string>;
  organization: AttributeFeedback<string>;
  identity: AttributeFeedback<string>;
  gender: AttributeFeedback<string | number>;
  debutWork: AttributeFeedback<string>;
  debutYear: AttributeFeedback<number>;
}

export const MAX_GUESSES = 8;
export const DEBUT_YEAR_CLOSE_RANGE = 3;

const REGION_CONTINENTS: Record<string, string> = {
  '学园都市': 'asia',
  '日本': 'asia',
  '中国': 'asia',
  '亚洲': 'asia',
  '英国': 'europe',
  '法国': 'europe',
  '意大利': 'europe',
  '梵蒂冈': 'europe',
  '欧洲': 'europe',
  '北欧': 'europe',
  '俄罗斯': 'europe',
  '德国': 'europe',
  '罗马尼亚': 'europe',
  '芬兰': 'europe',
  '西班牙': 'europe',
  '墨西哥': 'north-america',
  '美国': 'north-america',
  '洛杉矶': 'north-america',
  '夏威夷': 'north-america',
  '巴西': 'south-america',
  '埃及': 'africa',
  '南非': 'africa',
  '澳大利亚': 'oceania',
};

function stableIndex(length: number, guessId: number, targetId: number, salt: number): number {
  if (length <= 1) return 0;
  const mixed = Math.imul(guessId + salt, 1103515245) ^ Math.imul(targetId + 17, 12345);
  return Math.abs(mixed) % length;
}

export function compareExact<T extends string | number | boolean>(
  guess: T,
  target: T,
): AttributeFeedback<T> {
  return { value: guess, level: guess === target ? 'correct' : 'wrong' };
}

export function compareNumberWithin(
  guess: number,
  target: number,
  closeRange: number,
): AttributeFeedback<number> {
  if (guess === target) return { value: guess, level: 'correct' };
  return {
    value: guess,
    level: Math.abs(guess - target) <= closeRange ? 'close' : 'wrong',
    hint: target > guess ? 'higher' : 'lower',
  };
}

export function sameContinent(left: string, right: string): boolean {
  const leftContinent = REGION_CONTINENTS[left];
  return Boolean(leftContinent && leftContinent === REGION_CONTINENTS[right]);
}

export function organizationsAreRelated(
  left: OrganizationReference,
  right: OrganizationReference,
): boolean {
  if (left.name === right.name) return false;
  if (left.parent && left.parent === right.parent) return true;
  return left.parent === right.name || right.parent === left.name;
}

export function compareOrganizations(
  guess: ComparableCharacter,
  target: ComparableCharacter,
): AttributeFeedback<string> {
  if (!guess.organizations.length) {
    return {
      value: '无所属',
      level: target.organizations.length ? 'wrong' : 'correct',
    };
  }

  const exact = guess.organizations.filter((organization) =>
    target.organizations.some((targetOrganization) => targetOrganization.name === organization.name)
  );
  if (exact.length) {
    return {
      value: exact[stableIndex(exact.length, guess.id, target.id, 1)].name,
      level: 'correct',
    };
  }

  const related = guess.organizations.filter((organization) =>
    target.organizations.some((targetOrganization) =>
      organizationsAreRelated(organization, targetOrganization)
    )
  );
  if (related.length) {
    return {
      value: related[stableIndex(related.length, guess.id, target.id, 2)].name,
      level: 'close',
    };
  }

  return {
    value: guess.organizations[stableIndex(guess.organizations.length, guess.id, target.id, 3)].name,
    level: 'wrong',
  };
}

export function compareIdentities(
  guess: ComparableCharacter,
  target: ComparableCharacter,
): AttributeFeedback<string> {
  const exact = guess.identities.filter((identity) =>
    target.identities.some((targetIdentity) =>
      characterIdentityKey(targetIdentity) === characterIdentityKey(identity)
    )
  );
  if (exact.length) {
    return {
      value: exact[stableIndex(exact.length, guess.id, target.id, 4)].name,
      level: 'correct',
    };
  }

  const related = guess.identities.filter((identity) =>
    target.identities.some((targetIdentity) => targetIdentity.group === identity.group)
  );
  if (related.length) {
    return {
      value: related[stableIndex(related.length, guess.id, target.id, 5)].name,
      level: 'close',
    };
  }

  return {
    value: guess.identities[stableIndex(guess.identities.length, guess.id, target.id, 6)].name,
    level: 'wrong',
  };
}

function compareSide(guess: ComparableCharacter, target: ComparableCharacter): AttributeFeedback<string> {
  if (guess.primarySide === target.primarySide) {
    return { value: guess.primarySide, level: 'correct' };
  }
  return {
    value: guess.primarySide,
    level: guess.sides.some((side) => target.sides.includes(side)) ? 'close' : 'wrong',
  };
}

function compareLocation(guess: string, target: string): AttributeFeedback<string> {
  if (guess === target) return { value: guess, level: 'correct' };
  return { value: guess, level: sameContinent(guess, target) ? 'close' : 'wrong' };
}

function compareDebutYear(guess: number, target: number): AttributeFeedback<number> {
  return compareNumberWithin(guess, target, DEBUT_YEAR_CLOSE_RANGE);
}

export function compareCharacters(
  guess: ComparableCharacter,
  target: ComparableCharacter,
): CommonComparison {
  return {
    correct: guess.id === target.id,
    side: compareSide(guess, target),
    location: compareLocation(guess.location, target.location),
    organization: compareOrganizations(guess, target),
    identity: compareIdentities(guess, target),
    gender: compareExact(guess.gender, target.gender),
    debutWork: compareExact(guess.debutWork, target.debutWork),
    debutYear: compareDebutYear(guess.debutYear, target.debutYear),
  };
}
