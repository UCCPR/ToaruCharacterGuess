import { describe, it, expect } from 'vitest';
import { compareGuess } from '../../src/services/gameService';
import { Player } from '../../src/types';
import type { CharacterIdentity } from '@toaru-character-guess/shared';

function identity(
  name: string,
  group: string,
  kind: string,
  entity: string | null,
  role: string,
): CharacterIdentity {
  return { name, group, kind, entity, role };
}

function makePlayer(overrides: Partial<Player>): Player {
  return {
    id: 1,
    nickname: '御坂美琴',
    nationality: '科学侧',
    region: '学园都市',
    team: '常盘台中学',
    team_history: [],
    age: 5,
    role: '电击使',
    major_championships: 0,
    major_appearances: 2004,
    debut_work: '魔法禁书目录（旧约）',
    side_affiliations: ['科学侧'],
    organizations: [{ name: '常盘台中学', parent: null }],
    identities: [
      identity('常盘台中学学生', 'student', 'school', '常盘台中学', 'student'),
      identity('能力者', 'esper', 'side-affiliation', null, 'esper'),
    ],
    is_active: true,
    is_enabled: true,
    created_at: '',
    ...overrides,
  };
}

describe('compareGuess', () => {
  const target = makePlayer({ id: 10 });

  it('猜中时所有属性 correct', () => {
    const feedback = compareGuess(target, target);
    expect(feedback.correct).toBe(true);
    expect(Object.values(feedback.attributes).every((attribute) => attribute.level === 'correct'))
      .toBe(true);
  });

  it('阵营只在完全相同时给 correct', () => {
    const guess = makePlayer({ id: 2, nationality: '魔法侧', side_affiliations: ['魔法侧'] });
    expect(compareGuess(guess, target).attributes.nationality.level).toBe('wrong');
  });

  it('角色跨足的相关阵营与另一方重合时给 close', () => {
    const dualSideGuess = makePlayer({
      id: 2,
      nationality: '科学侧',
      side_affiliations: ['科学侧', '魔法侧'],
    });
    const magicTarget = makePlayer({
      id: 10,
      nationality: '魔法侧',
      side_affiliations: ['魔法侧'],
    });
    expect(compareGuess(dualSideGuess, magicTarget).attributes.nationality.level).toBe('close');
    expect(compareGuess(magicTarget, dualSideGuess).attributes.nationality.level).toBe('close');
  });

  it('活动地区不同但同属亚洲时给 close', () => {
    expect(compareGuess(makePlayer({ id: 2, region: '日本' }), target).attributes.region.level)
      .toBe('close');
  });

  it('梵蒂冈与其他欧洲地区给 close', () => {
    const vatican = makePlayer({ id: 2, region: '梵蒂冈' });
    const unitedKingdom = makePlayer({ id: 10, region: '英国' });
    expect(compareGuess(vatican, unitedKingdom).attributes.region.level).toBe('close');
  });

  it('洛杉矶与其他北美地区给 close', () => {
    const losAngeles = makePlayer({ id: 2, region: '洛杉矶' });
    const unitedStates = makePlayer({ id: 10, region: '美国' });
    expect(compareGuess(losAngeles, unitedStates).attributes.region.level).toBe('close');
  });

  it('活动地区不在同一大洲时给 wrong', () => {
    expect(compareGuess(makePlayer({ id: 2, region: '英国' }), target).attributes.region.level)
      .toBe('wrong');
  });

  it('任一标准化组织相同为 correct', () => {
    const targetWithSeveralOrganizations = makePlayer({
      organizations: [
        { name: '风纪委员第177支部', parent: '风纪委员' },
        { name: '常盘台中学', parent: null },
      ],
    });
    expect(compareGuess(makePlayer({ id: 2 }), targetWithSeveralOrganizations).attributes.team).toEqual({
      value: '常盘台中学',
      level: 'correct',
    });
  });

  it('不同组织有同一个直接上级时为 close', () => {
    const item = makePlayer({ id: 2, organizations: [{ name: '道具（ITEM）', parent: '暗部' }] });
    const group = makePlayer({ id: 10, organizations: [{ name: '集团（GROUP）', parent: '暗部' }] });
    expect(compareGuess(item, group).attributes.team)
      .toEqual({ value: '道具（ITEM）', level: 'close' });
  });

  it('直属上级组织与其子组织互相为 close', () => {
    const branch = makePlayer({
      id: 2,
      organizations: [{ name: '必要之恶教会', parent: '英国清教' }],
    });
    const parent = makePlayer({
      id: 10,
      organizations: [{ name: '英国清教', parent: null }],
    });
    expect(compareGuess(branch, parent).attributes.team)
      .toEqual({ value: '必要之恶教会', level: 'close' });
    expect(compareGuess(parent, branch).attributes.team)
      .toEqual({ value: '英国清教', level: 'close' });
  });

  it('学校之间没有共同直接上级时为 wrong', () => {
    const guess = makePlayer({ id: 2, organizations: [{ name: '栅川中学', parent: null }] });
    expect(compareGuess(guess, target).attributes.team.level).toBe('wrong');
  });

  it('无所属与有组织角色为 wrong 且不会变成 close', () => {
    const guess = makePlayer({ id: 2, organizations: [] });
    expect(compareGuess(guess, target).attributes.team)
      .toEqual({ value: '无所属', level: 'wrong' });
  });

  it('首次登场年份相差 1 给 close 并带方向提示', () => {
    const feedback = compareGuess(makePlayer({ id: 2, major_appearances: 2003 }), target);
    expect(feedback.attributes.majorAppearances.level).toBe('close');
    expect(feedback.attributes.majorAppearances.hint).toBe('higher');
  });

  it('首次登场年份相差 2 仍给 close', () => {
    const feedback = compareGuess(makePlayer({ id: 2, major_appearances: 2002 }), target);
    expect(feedback.attributes.majorAppearances.level).toBe('close');
  });

  it('首次登场年份相差 3 仍给 close', () => {
    const feedback = compareGuess(makePlayer({ id: 2, major_appearances: 2001 }), target);
    expect(feedback.attributes.majorAppearances.level).toBe('close');
  });

  it('首次登场年份相差 4 给 wrong', () => {
    expect(compareGuess(makePlayer({ id: 2, major_appearances: 2000 }), target)
      .attributes.majorAppearances.level).toBe('wrong');
  });

  it('性别不同直接给 wrong，不提供数值方向', () => {
    const feedback = compareGuess(makePlayer({ id: 2, major_championships: 1 }), target);
    expect(feedback.attributes.majorChampionships.level).toBe('wrong');
    expect(feedback.attributes.majorChampionships.hint).toBeUndefined();
  });

  it('从多重身份中优先显示完全相同的身份', () => {
    const guess = makePlayer({
      id: 2,
      identities: [
        identity('英国清教成员', 'religious', 'church', '英国清教', 'member'),
        identity('常盘台中学学生', 'student', 'school', '常盘台中学', 'student'),
      ],
    });
    expect(compareGuess(guess, target).attributes.role)
      .toEqual({ value: '常盘台中学学生', level: 'correct' });
  });

  it('没有相同身份时优先显示同类身份为 close', () => {
    const guess = makePlayer({
      id: 2,
      identities: [
        identity('魔法师', 'magician', 'side-affiliation', null, 'magician'),
        identity('栅川中学学生', 'student', 'school', '栅川中学', 'student'),
      ],
    });
    expect(compareGuess(guess, target).attributes.role)
      .toEqual({ value: '栅川中学学生', level: 'close' });
  });

  it('不同研究计划及人工生命身份之间不会误判为 close', () => {
    const researcher = makePlayer({
      id: 2,
      identities: [identity(
        '绝对能力进化计划研究人员',
        'research-project:绝对能力进化计划',
        'research-project',
        '绝对能力进化计划',
        'researcher',
      )],
    });
    const artificialBeing = makePlayer({
      id: 10,
      identities: [
        identity('人工生命', 'artificial-being', 'side-affiliation', null, 'artificial-being'),
        identity('克隆多莉计划实验对象', 'research-project:克隆多莉计划', 'research-project', '克隆多莉计划', 'subject'),
      ],
    });
    expect(compareGuess(researcher, artificialBeing).attributes.role.level).toBe('wrong');
  });

  it('同一研究计划中的不同身份仍为 close', () => {
    const researcher = makePlayer({
      id: 2,
      identities: [identity(
        '绝对能力进化计划研究人员',
        'research-project:绝对能力进化计划',
        'research-project',
        '绝对能力进化计划',
        'researcher',
      )],
    });
    const subject = makePlayer({
      id: 10,
      identities: [identity(
        '绝对能力进化计划实验对象',
        'research-project:绝对能力进化计划',
        'research-project',
        '绝对能力进化计划',
        'subject',
      )],
    });
    expect(compareGuess(researcher, subject).attributes.role.level).toBe('close');
  });

  it('显示名称相同但结构化身份不同不会误判为 correct', () => {
    const firstProject = makePlayer({
      id: 2,
      identities: [identity(
        '研究人员',
        'research-project:绝对能力进化计划',
        'research-project',
        '绝对能力进化计划',
        'researcher',
      )],
    });
    const secondProject = makePlayer({
      id: 10,
      identities: [identity(
        '研究人员',
        'research-project:克隆多莉计划',
        'research-project',
        '克隆多莉计划',
        'researcher',
      )],
    });
    expect(compareGuess(firstProject, secondProject).attributes.role.level).toBe('wrong');
  });

  it('身份均无关系时稳定选择一个灰色身份', () => {
    const guess = makePlayer({
      id: 2,
      identities: [
        identity('魔法师', 'magician', 'side-affiliation', null, 'magician'),
        identity('王室成员', 'royalty', 'side-affiliation', null, 'royalty'),
      ],
    });
    const first = compareGuess(guess, target).attributes.role;
    const second = compareGuess(guess, target).attributes.role;
    expect(first.level).toBe('wrong');
    expect(second).toEqual(first);
  });

  it('首次出场作品只在相同时给 correct', () => {
    const feedback = compareGuess(makePlayer({ id: 2, debut_work: '新约 魔法禁书目录' }), target);
    expect(feedback.attributes.debutWork.level).toBe('wrong');
  });

  it('兼容状态不同时给 wrong', () => {
    const feedback = compareGuess(makePlayer({ id: 2, is_active: false }), target);
    expect(feedback.attributes.isActive.level).toBe('wrong');
  });
});
