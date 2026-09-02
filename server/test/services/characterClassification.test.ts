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
    expect(organizationParentName('食尸部队（Scavenger）')).toBe('暗部');
    expect(organizationParentName('BLOCK')).toBe('暗部');
    expect(organizationParentName('大蜘蛛')).toBe('武装无能力集团（Skill-Out）');
    expect(organizationParentName('黑鸦部队')).toBe('轨道电梯公司');
    expect(organizationParentName('必要之恶教会')).toBe('英国清教');
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
    expect(organizationIdentity({
      name: '才人工房（Clone Dolly）',
      type: 'research-project',
      relationship: 'former-subject',
    }).name).toBe('才人工房（Clone Dolly）前实验对象');
    expect(organizationIdentity({
      name: '常盘台中学',
      type: 'school',
      relationship: 'dorm-supervisor',
    }).name).toBe('常盘台中学舍监');
    expect(organizationIdentity({
      name: '统括理事会',
      type: 'government',
      relationship: 'chairman',
    }).name).toBe('统括理事会理事长');
    expect(organizationIdentity({
      name: 'R&C超自然公司',
      type: 'corporation',
      relationship: 'founder-ceo',
    }).name).toBe('R&C超自然公司创始人兼CEO');
    expect(organizationIdentity({
      name: '罗马正教',
      type: 'church',
      relationship: 'pope',
    }).name).toBe('罗马正教教皇');
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
