import { describe, expect, it } from 'vitest';
import { catalog } from '../../../static/src/generated/catalog';
import { compare } from '../../../static/src/game';

function character(name: string) {
  const result = catalog.find((entry) => entry.name === name);
  if (!result) throw new Error(`Missing static character: ${name}`);
  return result;
}

describe('static character classification', () => {
  it('uses actual publication years and appearances for the audited characters', () => {
    expect(character('土御门元春')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2004 });
    expect(character('土御门舞夏')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2004 });
    expect(character('芳川桔梗')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2005 });
    expect(character('萝拉·斯图亚特')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2005 });
    expect(character('安洁莉娜')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2005 });
    expect(character('露琪亚')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2005 });
    expect(character('黄泉川爱穗')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2005 });
    expect(character('御坂美铃')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2006 });
    expect(character('后方之水')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2007 });
    expect(character('骑士团长')).toMatchObject({ debutWork: '魔法禁书目录 SS', debutYear: 2007 });
    expect(character('五和')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2006 });
    expect(character('滨面仕上')).toMatchObject({ debutWork: '魔法禁书目录 SS', debutYear: 2007 });
    expect(character('玛丽安·斯琳格奈亚')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2011 });
    expect(character('莎洛妮亚·A.以黎维卡')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2011 });
    expect(character('蜜蚁爱愉')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2014 });
    expect(character('亲船最中')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2007 });
    expect(character('埃斯特·罗森塔尔')).toMatchObject({ debutWork: '某科学的一方通行（漫画）', debutYear: 2013 });
    expect(character('芙蕾梅亚·塞维伦')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2011 });
    expect(character('木原唯一')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2012 });
    expect(character('米娜·马瑟斯')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2017 });
    expect(character('僧正')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2014 });
    expect(character('奈芙蒂斯')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2014 });
    expect(character('娘娘')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2014 });
    expect(character('枝先绊理')).toMatchObject({ debutWork: '某科学的超电磁炮（漫画）', debutYear: 2008 });
    expect(character('兰西丝')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2009 });
    expect(character('云川芹亚')).toMatchObject({ debutWork: '魔法禁书目录 SS2', debutYear: 2008 });
    expect(character('蕾莎')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2009 });
    expect(character('贝萝普')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2009 });
    expect(character('芙罗莉丝')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2009 });
    expect(character('蕾薇妮雅·柏德蔚')).toMatchObject({ debutWork: '魔法禁书目录 SS：史提尔篇', debutYear: 2007 });
    expect(character('布伦希尔德·艾克特贝尔')).toMatchObject({ debutWork: '魔法禁书目录 SS：神裂火织篇', debutYear: 2010 });
    expect(character('芙罗兰·克洛伊杜尼')).toMatchObject({ debutWork: '新约 魔法禁书目录', debutYear: 2012 });
    expect(character('博洛尼魅魔')).toMatchObject({ debutWork: '创约 魔法禁书目录', debutYear: 2021 });
    expect(character('弓箭猎虎')).toMatchObject({ debutWork: '某科学的超电磁炮（漫画）', debutYear: 2015 });
    expect(character('亲船素甘')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2007 });
    expect(character('倾国之女')).toMatchObject({ debutWork: '魔法禁书目录（旧约）', debutYear: 2010 });
    expect(character('美山写影')).toMatchObject({ debutWork: '某科学的超电磁炮（漫画）', debutYear: 2014 });
  });

  it('uses the original Stiyl SS publication for Mark Space', () => {
    expect(character('马克·史佩斯')).toMatchObject({
      debutWork: '魔法禁书目录 SS：史提尔篇',
      debutYear: 2008,
    });
  });

  it('uses the shared direct-parent hierarchy for organization feedback', () => {
    expect(character('麦野沉利').organizations).toContainEqual({
      name: '道具（ITEM）',
      parent: '暗部',
    });
    expect(character('土御门元春').organizations).toContainEqual({
      name: '集团（GROUP）',
      parent: '暗部',
    });
    expect(character('饭栖莉泽').organizations).toContainEqual({
      name: '食尸部队（Scavenger）',
      parent: '暗部',
    });
    expect(character('佐久辰彦').organizations).toContainEqual({
      name: 'BLOCK',
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
    expect(character('一方通行').identities).toContainEqual({
      name: '统括理事会理事长',
      group: 'government:chairman',
      kind: 'government',
      entity: '统括理事会',
      role: 'chairman',
    });
    expect(character('安娜·施普伦格尔').identities).toContainEqual({
      name: 'R&C超自然公司创始人兼CEO',
      group: 'corporation:founder-ceo',
      kind: 'corporation',
      entity: 'R&C超自然公司',
      role: 'founder-ceo',
    });
    expect(character('马太·利斯').identities).toContainEqual({
      name: '罗马正教教皇',
      group: 'religious',
      kind: 'church',
      entity: '罗马正教',
      role: 'pope',
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
    expect(character('一方通行').identities).toContainEqual({
      name: '绝对能力进化计划核心人物',
      group: 'research-project:绝对能力进化计划',
      kind: 'research-project',
      entity: '绝对能力进化计划',
      role: 'central-subject',
    });
    expect(character('御坂10032号').identities).toContainEqual({
      name: '绝对能力进化计划实验对象',
      group: 'research-project:绝对能力进化计划',
      kind: 'research-project',
      entity: '绝对能力进化计划',
      role: 'subject',
    });
    expect(character('木山春生').identities).toContainEqual({
      name: 'AIM扩散力场控制实验前研究人员',
      group: 'research-project:AIM扩散力场控制实验',
      kind: 'research-project',
      entity: 'AIM扩散力场控制实验',
      role: 'former-researcher',
    });
    expect(character('木原幻生').identities).toContainEqual({
      name: 'AIM扩散力场控制实验领导者',
      group: 'research-project:AIM扩散力场控制实验',
      kind: 'research-project',
      entity: 'AIM扩散力场控制实验',
      role: 'leader',
    });
    expect(character('枝先绊理').identities).toContainEqual({
      name: 'AIM扩散力场控制实验实验对象',
      group: 'research-project:AIM扩散力场控制实验',
      kind: 'research-project',
      entity: 'AIM扩散力场控制实验',
      role: 'subject',
    });
  });

  it('keeps the audited Kumokawa school memberships', () => {
    expect(character('云川芹亚').organizations).toContainEqual({ name: '某高中', parent: null });
    expect(character('云川鞠亚').organizations).toContainEqual({ name: '女仆学校', parent: null });
  });

  it('relates participants only through the same audited research project', () => {
    expect(compare(character('木山春生'), character('枝先绊理')).cells.identity.level).toBe('close');
    expect(compare(character('木原幻生'), character('枝先绊理')).cells.identity.level).toBe('close');
    expect(compare(character('一方通行'), character('御坂10032号')).cells.identity.level).toBe('close');
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
