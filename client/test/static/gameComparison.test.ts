import { describe, expect, it } from 'vitest';
import { compare, type Character } from '../../../static/src/game';

type CharacterIdentity = Character['identities'][number];

function identity(
  name: string,
  group: string,
  kind: string,
  entity: string | null,
  role: string,
): CharacterIdentity {
  return { name, group, kind, entity, role };
}

function character(overrides: Partial<Character>): Character {
  return {
    id: 1,
    name: '测试角色',
    names: { zh: '测试角色', en: 'Test Character', ja: 'テスト' },
    aliases: [],
    difficulties: ['normal'],
    side: '科学侧',
    sides: ['科学侧'],
    location: '学园都市',
    organizations: [],
    identities: [{
      name: '身份未分类',
      group: 'unclassified',
      kind: 'unclassified',
      entity: null,
      role: 'unclassified',
    }],
    gender: 'unknown',
    debutWork: '待复核',
    debutYear: 0,
    ...overrides,
  };
}

describe('static shared comparison adapter', () => {
  it('treats Vatican City and the United Kingdom as European locations', () => {
    const vatican = character({ id: 2, location: '梵蒂冈' });
    const unitedKingdom = character({ id: 10, location: '英国' });
    expect(compare(vatican, unitedKingdom).cells.location.level).toBe('close');
  });

  it('treats Los Angeles and the United States as North American locations', () => {
    const losAngeles = character({ id: 2, location: '洛杉矶' });
    const unitedStates = character({ id: 10, location: '美国' });
    expect(compare(losAngeles, unitedStates).cells.location.level).toBe('close');
  });

  it('treats a direct parent and child organization as close', () => {
    const branch = character({
      id: 2,
      organizations: [{ name: '必要之恶教会', parent: '英国清教' }],
    });
    const parent = character({
      id: 10,
      organizations: [{ name: '英国清教', parent: null }],
    });
    expect(compare(branch, parent).cells.organization.level).toBe('close');
    expect(compare(parent, branch).cells.organization.level).toBe('close');
  });

  it('does not relate identities from different research projects', () => {
    const researcher = character({
      id: 2,
      identities: [identity(
        '绝对能力进化计划研究人员',
        'research-project:绝对能力进化计划',
        'research-project',
        '绝对能力进化计划',
        'researcher',
      )],
    });
    const artificialBeing = character({
      id: 10,
      identities: [
        identity('人工生命', 'artificial-being', 'side-affiliation', null, 'artificial-being'),
        identity('克隆多莉计划实验对象', 'research-project:克隆多莉计划', 'research-project', '克隆多莉计划', 'subject'),
      ],
    });
    expect(compare(researcher, artificialBeing).cells.identity.level).toBe('wrong');
  });
});
