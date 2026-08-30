import knex from 'knex';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureSchema } from '../../src/db/schema';
import { syncCuratedCharacterCatalog } from '../../src/db/syncCharacterCatalog';
import catalog from '../../src/db/seeds/characterCatalog.json';
import roster from '../../src/db/seeds/players.json';

const instances: ReturnType<typeof knex>[] = [];
const expectedCharacterCount = catalog.length;
const expectedDifficultyCount = roster.reduce((total, entry) => total + new Set(entry.difficulties).size, 0);

afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
});

describe('playable character catalog', () => {
  it('keeps the playable manifest and normalized catalog one-to-one', () => {
    const rosterNames = roster.map((entry) => entry.nickname);
    const catalogNames = catalog.map((entry) => entry.nickname);

    expect(new Set(rosterNames).size).toBe(rosterNames.length);
    expect(new Set(catalogNames).size).toBe(catalogNames.length);
    expect(new Set(rosterNames)).toEqual(new Set(catalogNames));
  });

  it('uses one canonical type for every organization name', () => {
    const organizationTypes = new Map<string, string>();
    const conflicts: string[] = [];

    for (const character of catalog) {
      for (const organization of character.organizations) {
        const existingType = organizationTypes.get(organization.name);
        if (existingType && existingType !== organization.type) {
          conflicts.push(`${organization.name}: ${existingType} / ${organization.type}`);
        } else {
          organizationTypes.set(organization.name, organization.type);
        }
      }
    }

    expect(conflicts).toEqual([]);
  });

  it('keeps audited early-character facts in the normalized seed', () => {
    const entry = (name: string) => catalog.find((character) => character.nickname === name);

    expect(entry('上条当麻')?.sides).toContainEqual({ key: 'science', relationship: 'level-zero', primary: true });
    expect(entry('佐天泪子')?.sides).toContainEqual({ key: 'science', relationship: 'level-zero', primary: true });
    expect(entry('茵蒂克丝')?.sides).toContainEqual({ key: 'magic', relationship: 'nun', primary: true });
    expect(entry('吹寄制理')?.sides).toContainEqual({ key: 'science', relationship: 'esper', primary: true });
    expect(entry('吹寄制理')?.appearance).toEqual({ work: 'index-ot', reference: '第9卷', year: 2006 });
    expect(entry('五和')?.appearance).toEqual({ work: 'index-ot', reference: '第11卷', year: 2006 });
    expect(entry('滨面仕上')?.appearance).toEqual({ work: 'index-ss', reference: 'SS', year: 2007 });
    expect(entry('婚后光子')?.appearance).toEqual({ work: 'index-ot', reference: '第8卷', year: 2006 });
    expect(entry('瓦希莉莎')?.appearance).toEqual({ work: 'index-ot', reference: '第12卷', year: 2007 });
    expect(entry('木原幻生')?.appearance).toEqual({ work: 'railgun-manga', reference: '第14话', year: 2008 });
    expect(entry('操齿凉子')?.appearance).toEqual({ work: 'railgun-manga', reference: '第79话', year: 2015 });
    expect(entry('分身')?.appearance).toEqual({ work: 'railgun-manga', reference: '第85话', year: 2016 });
    expect(entry('菱形干比古')?.appearance).toEqual({ work: 'accelerator-manga', reference: '第2话', year: 2014 });
    expect(entry('菱形蛭魅')?.appearance).toEqual({ work: 'accelerator-manga', reference: '第2话', year: 2014 });
    expect(entry('爱华斯')?.appearance).toEqual({ work: 'index-ot', reference: '第19卷（第7卷仅名字）', year: 2009 });
    expect(entry('木原脑干')?.appearance).toEqual({ work: 'index-nt', reference: '新约第7卷（第4卷仅名字／第11卷全名）', year: 2013 });
    expect(entry('爱丽丝·异典')?.appearance).toEqual({ work: 'index-gt', reference: '创约第5卷（第4卷仅名字）', year: 2021 });
    expect(entry('玛丽安·斯琳格奈亚')?.appearance).toEqual({ work: 'index-nt', reference: '新约第3卷', year: 2011 });
    expect(entry('莎洛妮亚·A.以黎维卡')?.appearance).toEqual({ work: 'index-nt', reference: '新约第3卷', year: 2011 });
    expect(entry('蜜蚁爱愉')?.appearance).toEqual({ work: 'index-nt', reference: '新约第11卷', year: 2014 });
    expect(entry('亲船最中')?.appearance).toEqual({ work: 'index-ot', reference: '第14卷', year: 2007 });
    expect(entry('埃斯特·罗森塔尔')?.appearance).toEqual({ work: 'accelerator-manga', reference: '第1话', year: 2013 });
    expect(entry('芙蕾梅亚·塞维伦')?.appearance).toEqual({ work: 'index-nt', reference: '新约第1卷', year: 2011 });
    expect(entry('木原唯一')?.appearance).toEqual({ work: 'index-nt', reference: '新约第4卷', year: 2012 });
    expect(entry('米娜·马瑟斯')?.appearance).toEqual({ work: 'index-nt', reference: '新约第18卷', year: 2017 });
    expect(entry('马克·史佩斯')?.appearance).toEqual({ work: 'index-stiyl-ss', reference: '史提尔篇番外篇', year: 2008 });
    expect(entry('华野超美')?.appearance).toEqual({
      work: 'item-novel',
      reference: '《某暗部的少女共栖》第1卷',
      year: 2023,
    });
    expect(entry('华野超美')?.organizations).toContainEqual({
      name: '道具（ITEM）',
      type: 'dark-side-group',
      relationship: 'member',
      primary: true,
    });
    expect(entry('莉莉丝')?.appearance).toEqual({
      work: 'index-nt',
      reference: '新约第18卷回忆中登场（旧约第7卷仅名字／第19卷现世登场）',
      year: 2017,
    });
    expect(entry('山缪·李德·麦奎恩·马瑟斯')?.appearance).toEqual({
      work: 'index-nt',
      reference: '新约第18卷再现影像登场（第12卷仅名字／第20卷末复现体登场）',
      year: 2017,
    });
    expect(entry('吠达特里')?.appearance).toEqual({
      work: 'index-gt',
      reference: '创约第10卷（第8卷仅名字）',
      year: 2024,
    });
    expect(entry('花束之布洛代韦德')?.appearance).toEqual({
      work: 'index-gt',
      reference: '创约第10卷（第8卷仅名字）',
      year: 2024,
    });
    expect(entry('介旅初矢')?.appearance).toEqual({ work: 'railgun-manga', reference: '第4话', year: 2007 });
    expect(entry('上里翔流')?.appearance).toEqual({ work: 'index-nt', reference: '新约第13卷终章', year: 2015 });
    expect(entry('多莉')?.organizations.map((organization) => organization.name)).not.toContain('御坂网络');
    expect(entry('最后之作')?.organizations.map((organization) => organization.name))
      .toEqual(expect.arrayContaining(['御坂网络', '妹妹们（SISTERS）']));
  });

  it('keeps recognition pools cumulative and aligned with the series-based policy', () => {
    const namesFor = (difficulty: string) => new Set(
      roster.filter((entry) => entry.difficulties.includes(difficulty)).map((entry) => entry.nickname),
    );
    const beginner = namesFor('beginner');
    const easy = namesFor('easy');
    const normal = namesFor('normal');

    expect([...beginner].every((name) => easy.has(name))).toBe(true);
    expect([...easy].every((name) => normal.has(name))).toBe(true);
    expect(normal.size).toBe(roster.length);

    expect([...beginner]).toEqual(expect.arrayContaining([
      '上条当麻', '茵蒂克丝', '御坂美琴', '一方通行',
      '白井黑子', '初春饰利', '佐天泪子', '食蜂操祈',
    ]));
    expect(beginner.has('欧提努斯')).toBe(false);
    expect(beginner.has('埃斯特·罗森塔尔')).toBe(false);

    expect([...easy]).toEqual(expect.arrayContaining([
      '欧提努斯', '帆风润子', '鸣护艾丽莎', '操齿凉子',
      '御坂网络整体意识',
      '山缪·李德·麦奎恩·马瑟斯',
      '雪莉·克伦威尔', '丽多薇雅·罗伦婕蒂',
      '湾内绢保', '泡浮万彬', '清清太郎丸', '药丸医月',
      '蕾莎', '御坂美铃', '驹场利德', '枝先绊理', '铁装缀里',
      '常盘台舍监', '蓝发耳环', '土御门舞夏', '上条刀夜', '上条诗菜',
      '海原光贵', '天井亚雄', '马场芳郎', '心理定规', '舞殿星见',
    ]));
    for (const name of [
      '玛丽安·斯琳格奈亚', '安娜·施普伦格尔', '雷蒂丽·坦格洛德',
      '埃斯特·罗森塔尔', '菱形干比古', '菱形蛭魅', '芙罗兰·克洛伊杜尼',
      '圣日耳曼', '伊莉莎', '莉梅亚', '奥雷欧斯·伊萨德',
      '安娜·金斯福德', '爱丽丝·异典', '阿拉迪娅', '博洛尼魅魔',
      '逆源质拼图545', '米娜·马瑟斯', '莉莉丝', '约翰·瓦伦汀·安德烈',
      '莎特奥拉·塞克温茨雅', '人皮挟美', '饭栖莉泽', '作乐木鸣羽',
      '杠林檎', '雅王院司', '华野超美', '悠里千夜',
    ]) {
      expect(easy.has(name)).toBe(false);
    }
    expect(easy.has('木寺实莉')).toBe(false);
    expect(easy.has('木原乱数')).toBe(false);
    expect(easy.has('服部半藏')).toBe(false);
    expect(easy.has('蛇谷次雄')).toBe(false);
    expect(easy.has('迪翁·福春')).toBe(false);
  });

  it('seeds the normalized catalog directly and remains idempotent', async () => {
    const instance = knex({
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    instances.push(instance);
    await ensureSchema(instance);

    expect(await syncCuratedCharacterCatalog(instance)).toBe(expectedCharacterCount);
    expect(await syncCuratedCharacterCatalog(instance)).toBe(expectedCharacterCount);
    expect(await instance.schema.hasTable('players')).toBe(false);
    expect(await instance.schema.hasTable('abilities')).toBe(false);
    expect(Number((await instance('characters').count({ count: '*' }).first())?.count)).toBe(expectedCharacterCount);
    expect(Number((await instance('character_game_profiles').count({ count: '*' }).first())?.count)).toBe(expectedCharacterCount);
    expect(Number((await instance('character_difficulties').count({ count: '*' }).first())?.count)).toBe(expectedDifficultyCount);

    const accelerator = await instance('characters').where({ canonical_name_zh: '一方通行' }).first();
    expect(accelerator).toMatchObject({ gender: 'unknown', review_status: 'community_sourced' });
    const aiwass = await instance('characters').where({ canonical_name_zh: '爱华斯' }).first();
    expect(aiwass.gender).toBe('none');

    const latestBatch = await instance('characters')
      .whereIn('canonical_name_zh', [
        '木原加群', '木原病理', '木原圆周', '罗伯特·卡崔',
        '阿拉迪娅', '博洛尼魅魔', 'H.T.特利斯墨吉斯忒斯', '逆源质拼图545',
      ])
      .pluck('canonical_name_zh');
    expect(latestBatch).toHaveLength(8);

    const preGenesisBatch = await instance('characters')
      .whereIn('canonical_name_zh', [
        '米娜·马瑟斯', '莉莉丝', '芙蕾雅', '发源检体',
        '木原乱数', '木寺实莉', '御坂网络整体意识', '迪翁·福春',
      ])
      .pluck('canonical_name_zh');
    expect(preGenesisBatch).toHaveLength(8);

    const genesisBatch = await instance('characters')
      .whereIn('canonical_name_zh', [
        '舞殿星见', '根丘则斗', '梅尔莎白·格萝瑟利', '古老善良的玛利亚',
        '姆特·忒拜', '吠达特里', '花束之布洛代韦德', '约翰·瓦伦汀·安德烈',
      ])
      .pluck('canonical_name_zh');
    expect(genesisBatch).toHaveLength(8);

    const recognizableBatch = await instance('characters')
      .whereIn('canonical_name_zh', [
        '莎特奥拉·塞克温茨雅', '菲布理', '珍妮', '有富春树',
        '黑妻绵流', '蛇谷次雄', '春暖嬉美', '御坂9982号',
      ])
      .pluck('canonical_name_zh');
    expect(recognizableBatch).toHaveLength(8);

    const transcendents = await instance('character_organizations as membership')
      .join('characters as character', 'character.id', 'membership.character_id')
      .join('organizations as organization', 'organization.id', 'membership.organization_id')
      .whereIn('character.canonical_name_zh', [
        '古老善良的玛利亚', '姆特·忒拜', '吠达特里', '花束之布洛代韦德',
      ])
      .where({ 'organization.name_zh': '桥架结社' })
      .pluck('character.canonical_name_zh');
    expect(transcendents).toHaveLength(4);

    const mathersOrganizations = await instance('character_organizations as membership')
      .join('characters as character', 'character.id', 'membership.character_id')
      .join('organizations as organization', 'organization.id', 'membership.organization_id')
      .where({ 'character.canonical_name_zh': '山缪·李德·麦奎恩·马瑟斯' })
      .pluck('organization.name_zh');
    expect(mathersOrganizations).toEqual(expect.arrayContaining(['黄金黎明', '科隆尊召唤者']));

    const preGenesisWorks = await instance('works')
      .whereIn('key', ['index-biohacker', 'accelerator-anime'])
      .orderBy('key')
      .pluck('key');
    expect(preGenesisWorks).toEqual(['accelerator-anime', 'index-biohacker']);

    const itemWorks = await instance('works')
      .whereLike('key', 'item-%')
      .select('key', 'medium');
    expect(itemWorks).toEqual([{ key: 'item-novel', medium: 'novel' }]);

    const coronzonAliases = await instance('character_aliases as alias')
      .join('characters as character', 'character.id', 'alias.character_id')
      .where({ 'character.canonical_name_zh': '萝拉·斯图亚特' })
      .whereIn('alias.name', ['科隆尊', 'Coronzon'])
      .pluck('alias.name');
    expect(coronzonAliases).toEqual(expect.arrayContaining(['科隆尊', 'Coronzon']));

    const kagunOrganizations = await instance('character_organizations as membership')
      .join('characters as character', 'character.id', 'membership.character_id')
      .join('organizations as organization', 'organization.id', 'membership.organization_id')
      .where({ 'character.canonical_name_zh': '木原加群' })
      .pluck('organization.name_zh');
    expect(kagunOrganizations).toEqual(expect.arrayContaining(['格雷姆林', '木原一族', '防止落榜']));

    const acceleratorDifficulties = await instance('character_difficulties')
      .where({ character_id: accelerator.id })
      .orderBy('difficulty_key')
      .pluck('difficulty_key');
    expect(acceleratorDifficulties).toEqual(['beginner', 'easy', 'normal']);

    const darkOrganizations = await instance('organizations as organization')
      .leftJoin('organizations as parent', 'parent.id', 'organization.parent_id')
      .whereIn('organization.name_zh', ['道具（ITEM）', '集团（GROUP）', '新生（Freshmen）'])
      .orderBy('organization.name_zh')
      .select('organization.name_zh as name', 'parent.name_zh as parent');
    expect(darkOrganizations).toEqual([
      { name: '新生（Freshmen）', parent: '暗部' },
      { name: '道具（ITEM）', parent: '暗部' },
      { name: '集团（GROUP）', parent: '暗部' },
    ]);

    const recognizableOrganizations = await instance('organizations as organization')
      .leftJoin('organizations as parent', 'parent.id', 'organization.parent_id')
      .whereIn('organization.name_zh', ['黑鸦部队', '大蜘蛛'])
      .orderBy('organization.name_zh')
      .select('organization.name_zh as name', 'parent.name_zh as parent');
    expect(recognizableOrganizations).toEqual([
      { name: '大蜘蛛', parent: '武装无能力集团（Skill-Out）' },
      { name: '黑鸦部队', parent: '轨道电梯公司' },
    ]);

    const churchOrganizations = await instance('organizations as organization')
      .leftJoin('organizations as parent', 'parent.id', 'organization.parent_id')
      .where({ 'organization.name_zh': '必要之恶教会' })
      .select('organization.name_zh as name', 'parent.name_zh as parent')
      .first();
    expect(churchOrganizations).toEqual({ name: '必要之恶教会', parent: '英国清教' });
  });
});
