import type { Knex } from 'knex';
import { db } from './knex';
import curatedCatalogData from './seeds/characterCatalog.json';
import playableData from './seeds/players.json';
import { organizationParentName } from '../services/characterClassification';

interface PlayableCharacter {
  nickname: string;
  difficulties: string[];
  enabled?: boolean;
}

interface CuratedCatalogEntry {
  nickname: string;
  name_ja: string;
  name_en: string;
  gender: string;
  aliases: Array<{ name: string; locale: string; type: string }>;
  sides: Array<{ key: string; relationship: string; primary: boolean }>;
  organizations: Array<{
    name: string;
    type: string;
    parent?: string;
    relationship: string;
    primary: boolean;
  }>;
  locations: Array<{ name: string; type: string; relationship: string; primary: boolean }>;
  appearance: { work: string; reference: string; year: number };
  source_page: string;
}

const curatedCatalog = curatedCatalogData as CuratedCatalogEntry[];
const playableByNickname = new Map(
  (playableData as PlayableCharacter[]).map((entry) => [entry.nickname, entry])
);
const CURATED_REVIEW_STATUS = 'community_sourced';

const CURATED_WORKS: Record<string, { title: string; medium: string; continuity: string }> = {
  'index-ot': { title: '某魔法的禁书目录（旧约）', medium: 'novel', continuity: 'main' },
  'index-ss': { title: '某魔法的禁书目录 SS', medium: 'novel', continuity: 'supplemental' },
  'index-ss2': { title: '某魔法的禁书目录 SS2', medium: 'novel', continuity: 'supplemental' },
  'index-nt': { title: '新约 某魔法的禁书目录', medium: 'novel', continuity: 'main' },
  'index-gt': { title: '创约 某魔法的禁书目录', medium: 'novel', continuity: 'main' },
  'index-sp': { title: '某魔法的禁书目录 SP', medium: 'novel', continuity: 'supplemental' },
  'index-biohacker': { title: '某魔法的禁书目录 SS 生物黑客篇', medium: 'novel', continuity: 'supplemental' },
  'railgun-manga': { title: '某科学的超电磁炮', medium: 'manga', continuity: 'spinoff' },
  'railgun-anime': { title: '某科学的超电磁炮（动画）', medium: 'anime', continuity: 'spinoff' },
  'accelerator-manga': { title: '某科学的一方通行', medium: 'manga', continuity: 'spinoff' },
  'accelerator-anime': { title: '某科学的一方通行（动画）', medium: 'anime', continuity: 'spinoff' },
  'endymion-movie': { title: '剧场版 魔法禁书目录：恩底弥翁的奇迹', medium: 'movie', continuity: 'spinoff' },
};

const CURATED_CONTENT_SCOPES: Record<string, string> = {
  'index-ot': 'index-old-testament',
  'index-ss': 'index-old-testament',
  'index-ss2': 'index-old-testament',
  'index-nt': 'index-new-testament',
  'index-gt': 'index-genesis-testament',
  'index-sp': 'index-side-stories',
  'index-biohacker': 'index-side-stories',
  'railgun-manga': 'railgun',
  'railgun-anime': 'railgun',
  'accelerator-manga': 'accelerator',
  'accelerator-anime': 'accelerator',
  'endymion-movie': 'index-movie',
};

const normalizeName = (value: string): string => value.trim().toLocaleLowerCase('zh-CN');

function organizationSide(type: string): string | null {
  if (['church', 'church-branch', 'magic-cabal', 'religious-order'].includes(type)) return 'magic';
  if (['school', 'law-enforcement', 'dark-side-group', 'network', 'student-clique'].includes(type)) {
    return 'science';
  }
  return null;
}

async function curatedOrganizationId(
  trx: Knex.Transaction,
  entry: CuratedCatalogEntry['organizations'][number]
): Promise<number> {
  let parentId: number | null = null;
  const parentName = organizationParentName(entry.name, entry.parent);
  if (parentName) {
    await trx('organizations').insert({
      name_zh: parentName,
      organization_type: 'unknown',
      review_status: CURATED_REVIEW_STATUS,
    }).onConflict('name_zh').ignore();
    const parent = await trx('organizations').where({ name_zh: parentName }).first('id');
    parentId = Number(parent.id);
  }
  await trx('organizations').insert({
    name_zh: entry.name,
    organization_type: entry.type,
    parent_id: parentId,
    side_key: organizationSide(entry.type),
    review_status: CURATED_REVIEW_STATUS,
  }).onConflict('name_zh').merge([
    'organization_type',
    'parent_id',
    'side_key',
    'review_status',
  ]);
  const organization = await trx('organizations').where({ name_zh: entry.name }).first('id');
  return Number(organization.id);
}

/** Applies the manually reviewed, source-linked starter catalog. */
export async function syncCuratedCharacterCatalog(instance: Knex = db): Promise<number> {
  let synced = 0;
  await instance.transaction(async (trx) => {
    const source = await trx('catalog_sources').where({ key: 'toaru-huijiwiki' }).first('id');
    if (!source) throw new Error('CATALOG_SOURCE_NOT_READY:toaru-huijiwiki');

    // Merge the formerly used misspelling into the canonical organization.
    // Deleting its links first is safe because the curated pass below rebuilds
    // every reviewed membership using “必要之恶教会”.
    const misspelled = await trx('organizations').where({ name_zh: '必要恶之教会' }).first('id');
    if (misspelled) {
      await trx('character_organizations').where({ organization_id: misspelled.id }).del();
      await trx('organizations').where({ id: misspelled.id }).del();
    }

    for (const entry of curatedCatalog) {
      const playable = playableByNickname.get(entry.nickname);
      if (!playable) continue;
      await trx('characters').insert({
        canonical_name_zh: entry.nickname,
        name_ja: entry.name_ja,
        name_en: entry.name_en,
        gender: entry.gender,
        status: 'active',
        review_status: CURATED_REVIEW_STATUS,
      }).onConflict('canonical_name_zh').merge([
        'name_ja',
        'name_en',
        'gender',
        'status',
        'review_status',
        'updated_at',
      ]);
      const character = await trx('characters')
        .where({ canonical_name_zh: entry.nickname })
        .first('id');
      const characterId = Number(character.id);
      synced += 1;

      await trx('characters').where({ id: characterId }).update({
        name_ja: entry.name_ja,
        name_en: entry.name_en,
        gender: entry.gender,
        review_status: CURATED_REVIEW_STATUS,
        updated_at: trx.fn.now(),
      });

      const aliases = [
        { name: entry.name_ja, locale: 'ja', type: 'canonical' },
        ...entry.aliases,
      ];
      for (const alias of aliases) {
        await trx('character_aliases').insert({
          character_id: characterId,
          name: alias.name,
          normalized_name: normalizeName(alias.name),
          locale: alias.locale,
          alias_type: alias.type,
          source_id: source.id,
        }).onConflict(['character_id', 'locale', 'normalized_name']).merge([
          'name',
          'alias_type',
          'source_id',
        ]);
      }

      for (const side of entry.sides) {
        await trx('character_sides').insert({
          character_id: characterId,
          side_key: side.key,
          relationship_type: side.relationship,
          is_primary: side.primary,
          review_status: CURATED_REVIEW_STATUS,
        }).onConflict(['character_id', 'side_key', 'relationship_type']).merge([
          'is_primary',
          'review_status',
        ]);
      }

      for (const organization of entry.organizations) {
        const organizationId = await curatedOrganizationId(trx, organization);
        await trx('character_organizations').insert({
          character_id: characterId,
          organization_id: organizationId,
          relationship_type: organization.relationship,
          is_primary: organization.primary,
          review_status: CURATED_REVIEW_STATUS,
        }).onConflict(['character_id', 'organization_id', 'relationship_type']).merge([
          'is_primary',
          'review_status',
        ]);
      }

      for (const location of entry.locations) {
        await trx('locations').insert({
          name_zh: location.name,
          location_type: location.type,
          review_status: CURATED_REVIEW_STATUS,
        }).onConflict('name_zh').merge(['location_type', 'review_status']);
        const locationRow = await trx('locations').where({ name_zh: location.name }).first('id');
        await trx('character_locations').insert({
          character_id: characterId,
          location_id: locationRow.id,
          relationship_type: location.relationship,
          is_primary: location.primary,
          review_status: CURATED_REVIEW_STATUS,
        }).onConflict(['character_id', 'location_id', 'relationship_type']).merge([
          'is_primary',
          'review_status',
        ]);
      }

      const work = CURATED_WORKS[entry.appearance.work];
      if (!work) throw new Error(`UNKNOWN_CATALOG_WORK:${entry.appearance.work}`);
      await trx('works').insert({
        key: entry.appearance.work,
        title_zh: work.title,
        medium: work.medium,
        continuity: work.continuity,
        source_id: source.id,
      }).onConflict('key').merge(['title_zh', 'medium', 'continuity', 'source_id']);
      const workRow = await trx('works').where({ key: entry.appearance.work }).first('id');
      await trx('character_appearances').insert({
        character_id: characterId,
        work_id: workRow.id,
        source_key: 'huijiwiki:first-appearance',
        reference_label: entry.appearance.reference,
        debut_year: entry.appearance.year,
        prominence: 'unknown',
        is_first: true,
        review_status: CURATED_REVIEW_STATUS,
      }).onConflict(['character_id', 'source_key']).merge([
        'work_id',
        'reference_label',
        'debut_year',
        'is_first',
        'review_status',
      ]);

      await trx('character_game_profiles').insert({
        character_id: characterId,
        is_enabled: playable.enabled ?? true,
        content_scope: CURATED_CONTENT_SCOPES[entry.appearance.work] ?? 'unclassified',
        review_status: CURATED_REVIEW_STATUS,
        updated_at: trx.fn.now(),
      }).onConflict('character_id').merge([
        'is_enabled',
        'content_scope',
        'review_status',
        'updated_at',
      ]);

      await trx('character_difficulties').where({ character_id: characterId }).del();
      if (playable.difficulties.length) {
        await trx('character_difficulties').insert(
          [...new Set(playable.difficulties)].map((difficultyKey) => ({
            character_id: characterId,
            difficulty_key: difficultyKey,
          }))
        );
      }

      await trx('character_references').insert({
        character_id: characterId,
        source_id: source.id,
        source_url: `https://toaru.huijiwiki.com/wiki/${encodeURIComponent(entry.source_page)}`,
        page_title: entry.source_page,
        applies_to: 'community-catalog',
        confidence: 'community',
        last_verified_at: trx.fn.now(),
      }).onConflict(['character_id', 'source_id', 'applies_to']).merge([
        'source_url',
        'page_title',
        'confidence',
        'last_verified_at',
      ]);
    }
  });
  return synced;
}
