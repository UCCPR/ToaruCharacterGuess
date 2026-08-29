import { describe, expect, it } from 'vitest';
import { catalog } from '../../../static/src/generated/catalog';

function character(name: string) {
  const result = catalog.find((entry) => entry.name === name);
  if (!result) throw new Error(`Missing static character: ${name}`);
  return result;
}

describe('static character classification', () => {
  it('uses the shared direct-parent hierarchy for organization feedback', () => {
    expect(character('麦野沉利').organizations).toContainEqual({
      name: '道具（ITEM）',
      parent: '暗部',
    });
    expect(character('土御门元春').organizations).toContainEqual({
      name: '集团（GROUP）',
      parent: '暗部',
    });
    expect(character('黑妻绵流').organizations).toContainEqual({
      name: '大蜘蛛',
      parent: '武装无能力集团（Skill-Out）',
    });
    expect(character('莎特奥拉·塞克温茨雅').organizations).toContainEqual({
      name: '黑鸦部队',
      parent: '轨道电梯公司',
    });
    expect(character('茵蒂克丝').organizations).toContainEqual({
      name: '必要之恶教会',
      parent: '英国清教',
    });
  });

  it('keeps identity-only entries out of the organization column', () => {
    const mathers = character('山缪·李德·麦奎恩·马瑟斯');
    expect(mathers.organizations.map((organization) => organization.name))
      .not.toContain('科隆尊召唤者');
    expect(mathers.identities).toContainEqual({
      name: '科隆尊召唤者',
      group: 'status:科隆尊召唤者',
      kind: 'special-status',
      entity: '科隆尊召唤者',
      role: 'holder',
    });
  });

  it('shares relationship labels and side identities with the server edition', () => {
    expect(character('莉莉丝').identities.map((identity) => identity.name))
      .toContain('克劳利家族女儿');
    expect(character('莉莉丝').identities).toContainEqual({
      name: '克劳利家族女儿',
      group: 'family:克劳利家族',
      kind: 'family',
      entity: '克劳利家族',
      role: 'daughter',
    });
    expect(character('削板军霸').identities).toContainEqual({
      name: '原石',
      group: 'esper',
      kind: 'side-affiliation',
      entity: null,
      role: 'gemstone-esper',
    });
  });

  it('scopes research identities to their exact project', () => {
    expect(character('芳川桔梗').identities).toContainEqual({
      name: '绝对能力进化计划前研究人员',
      group: 'research-project:绝对能力进化计划',
      kind: 'research-project',
      entity: '绝对能力进化计划',
      role: 'former-researcher',
    });
    expect(character('多莉').identities).toContainEqual({
      name: '克隆多莉计划产物',
      group: 'research-project:克隆多莉计划',
      kind: 'research-project',
      entity: '克隆多莉计划',
      role: 'product',
    });
    expect(character('多莉').organizations.map((organization) => organization.name))
      .not.toContain('御坂网络');
    expect(character('最后之作').organizations.map((organization) => organization.name))
      .toEqual(expect.arrayContaining(['御坂网络', '妹妹们（SISTERS）']));
    expect(character('枝先绊理').organizations.map((organization) => organization.name))
      .not.toContain('抛弃物儿童（Child Error）');
    expect(character('枝先绊理').identities).toContainEqual({
      name: '抛弃物儿童（Child Error）',
      group: 'status:抛弃物儿童（Child Error）',
      kind: 'special-status',
      entity: '抛弃物儿童（Child Error）',
      role: 'holder',
    });
  });

  it('includes the Genesis Testament batch with identity-only relations separated', () => {
    const maidono = character('舞殿星见');
    expect(maidono.organizations.map((organization) => organization.name))
      .not.toContain('根丘则斗势力');
    expect(maidono.identities).toContainEqual({
      name: '根丘则斗势力成员',
      group: 'status:根丘则斗势力',
      kind: 'special-status',
      entity: '根丘则斗势力',
      role: 'agent',
    });

    const mary = character('古老善良的玛利亚');
    expect(mary.organizations).toContainEqual({ name: '桥架结社', parent: null });
    expect(mary.identities).toContainEqual({
      name: '超绝者',
      group: 'status:超绝者',
      kind: 'special-status',
      entity: '超绝者',
      role: 'holder',
    });
  });

  it('includes the recognizable-character batch and scoped project identities', () => {
    expect(character('菲布理').identities).toContainEqual({
      name: '化学造人计划产物',
      group: 'research-project:化学造人计划',
      kind: 'research-project',
      entity: '化学造人计划',
      role: 'product',
    });
    expect(character('珍妮').identities).toContainEqual({
      name: '化学造人计划产物',
      group: 'research-project:化学造人计划',
      kind: 'research-project',
      entity: '化学造人计划',
      role: 'product',
    });
    expect(character('御坂9982号').identities).toContainEqual({
      name: '绝对能力进化计划实验对象',
      group: 'research-project:绝对能力进化计划',
      kind: 'research-project',
      entity: '绝对能力进化计划',
      role: 'subject',
    });
  });
});
