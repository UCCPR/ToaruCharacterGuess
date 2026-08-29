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
    expect(entry('婚后光子')?.appearance).toEqual({ work: 'index-ot', reference: '第8卷', year: 2006 });
    expect(entry('瓦希莉莎')?.appearance).toEqual({ work: 'index-ot', reference: '第12卷', year: 2007 });
    expect(entry('木原幻生')?.appearance).toEqual({ work: 'railgun-manga', reference: '第14话', year: 2008 });
    expect(entry('操齿凉子')?.appearance).toEqual({ work: 'railgun-manga', reference: '第79话', year: 2015 });
    expect(entry('分身')?.appearance).toEqual({ work: 'railgun-manga', reference: '第85话', year: 2016 });
    expect(entry('菱形干比古')?.appearance).toEqual({ work: 'accelerator-manga', reference: '第2话', year: 2014 });
    expect(entry('菱形蛭魅')?.appearance).toEqual({ work: 'accelerator-manga', reference: '第2话', year: 2014 });
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
      '欧提努斯', '帆风润子', '埃斯特·罗森塔尔', '鸣护艾丽莎',
      '操齿凉子', '安娜·金斯福德', '爱丽丝·异典',
      '米娜·马瑟斯', '莉莉丝', '御坂网络整体意识', '迪翁·福春',
      '山缪·李德·麦奎恩·马瑟斯',
    ]));
    expect(easy.has('铁装缀里')).toBe(false);
    expect(easy.has('木寺实莉')).toBe(false);
    expect(easy.has('木原乱数')).toBe(false);
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
