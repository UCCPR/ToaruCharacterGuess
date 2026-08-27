import { describe, expect, it } from 'vitest';
import {
  IDENTITY_ONLY_ORGANIZATION_TYPES,
  organizationIdentity,
  organizationParentName,
  sideIdentity,
} from '../../src/services/characterClassification';

describe('shared character classification', () => {
  it('resolves curated organization parents without overriding explicit parents', () => {
    expect(organizationParentName('道具（ITEM）')).toBe('暗部');
    expect(organizationParentName('必要之恶教会', '英国清教')).toBe('英国清教');
  });

  it('builds exact identity labels and groups', () => {
    expect(organizationIdentity({
      name: '科隆尊召唤者',
      type: 'special-status',
      relationship: 'holder',
    })).toEqual({ name: '科隆尊召唤者', group: 'status:科隆尊召唤者' });
    expect(organizationIdentity({
      name: '克劳利家族',
      type: 'family',
      relationship: 'daughter',
    })).toEqual({ name: '克劳利家族女儿', group: 'family' });
  });

  it('classifies identity-only organization types and complete side identities', () => {
    expect(IDENTITY_ONLY_ORGANIZATION_TYPES.has('research-project')).toBe(true);
    expect(sideIdentity('gemstone-esper')).toEqual({ name: '原石', group: 'esper' });
  });
});
