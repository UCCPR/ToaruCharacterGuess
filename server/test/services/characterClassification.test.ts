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
    })).toEqual({
      name: '科隆尊召唤者',
      group: 'status:科隆尊召唤者',
      kind: 'special-status',
      entity: '科隆尊召唤者',
      role: 'holder',
    });
    expect(organizationIdentity({
      name: '克劳利家族',
      type: 'family',
      relationship: 'daughter',
    })).toEqual({
      name: '克劳利家族女儿',
      group: 'family:克劳利家族',
      kind: 'family',
      entity: '克劳利家族',
      role: 'daughter',
    });
    expect(organizationIdentity({
      name: '绝对能力进化计划',
      type: 'research-project',
      relationship: 'researcher',
    })).toEqual({
      name: '绝对能力进化计划研究人员',
      group: 'research-project:绝对能力进化计划',
      kind: 'research-project',
      entity: '绝对能力进化计划',
      role: 'researcher',
    });
    expect(organizationIdentity({
      name: '克隆多莉计划',
      type: 'research-project',
      relationship: 'subject',
    }).group).toBe('research-project:克隆多莉计划');
  });

  it('classifies identity-only organization types and complete side identities', () => {
    expect(IDENTITY_ONLY_ORGANIZATION_TYPES.has('research-project')).toBe(true);
    expect(sideIdentity('gemstone-esper')).toEqual({
      name: '原石',
      group: 'esper',
      kind: 'side-affiliation',
      entity: null,
      role: 'gemstone-esper',
    });
  });
});
