import type { Knex } from 'knex';
import { SIDE_TITLES } from '@toaru-character-guess/shared';

/** Normalized character catalog used directly by gameplay. */
export async function ensureCharacterCatalogSchema(instance: Knex): Promise<void> {
  if (!(await instance.schema.hasTable('catalog_sources'))) {
    await instance.schema.createTable('catalog_sources', (table) => {
      table.increments('id').primary();
      table.string('key', 64).notNullable().unique();
      table.string('name', 128).notNullable();
      table.string('source_kind', 32).notNullable();
      table.string('base_url', 512).nullable();
      table.string('license', 64).nullable();
      table.integer('priority').notNullable().defaultTo(0);
      table.timestamp('created_at').notNullable().defaultTo(instance.fn.now());
    });
  }

  await instance('catalog_sources').insert([
    {
      key: 'legacy-seed',
      name: 'Legacy project seed data',
      source_kind: 'legacy',
      priority: 0,
    },
    {
      key: 'toaru-official',
      name: 'Toaru Project official sources',
      source_kind: 'official',
      base_url: 'https://toaru-project.com/',
      priority: 100,
    },
    {
      key: 'toaru-huijiwiki',
      name: '魔禁维基（灰机Wiki）',
      source_kind: 'community',
      base_url: 'https://toaru.huijiwiki.com/',
      license: 'CC-BY-NC-SA',
      priority: 40,
    },
    {
      key: 'toaru-fandom',
      name: '某魔法的禁书维基（Fandom）',
      source_kind: 'community',
      base_url: 'https://toaru.fandom.com/zh/',
      license: 'CC-BY-SA',
      priority: 30,
    },
  ]).onConflict('key').merge(['name', 'source_kind', 'base_url', 'license', 'priority']);

  if (!(await instance.schema.hasTable('characters'))) {
    await instance.schema.createTable('characters', (table) => {
      table.increments('id').primary();
      table.string('canonical_name_zh', 128).notNullable().unique();
      table.string('name_ja', 128).nullable();
      table.string('name_en', 128).nullable();
      table.string('entity_type', 32).notNullable().defaultTo('person');
      table.string('gender', 32).notNullable().defaultTo('unknown');
      table.string('status', 32).notNullable().defaultTo('active');
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
      table.timestamp('created_at').notNullable().defaultTo(instance.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(instance.fn.now());
      table.index(['canonical_name_zh'], 'characters_name_zh_idx');
      table.index(['review_status', 'id'], 'characters_review_status_idx');
    });
  }

  if (!(await instance.schema.hasTable('character_aliases'))) {
    await instance.schema.createTable('character_aliases', (table) => {
      table.increments('id').primary();
      table.integer('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
      table.string('name', 128).notNullable();
      table.string('normalized_name', 160).notNullable();
      table.string('locale', 16).notNullable().defaultTo('zh-CN');
      table.string('alias_type', 32).notNullable().defaultTo('alternative');
      table.integer('source_id').nullable().references('id').inTable('catalog_sources').onDelete('SET NULL');
      table.unique(['character_id', 'locale', 'normalized_name'], 'character_aliases_identity_unique');
      table.index(['normalized_name'], 'character_aliases_normalized_idx');
    });
  }

  if (!(await instance.schema.hasTable('works'))) {
    await instance.schema.createTable('works', (table) => {
      table.increments('id').primary();
      table.string('key', 80).notNullable().unique();
      table.string('title_zh', 160).notNullable();
      table.string('title_ja', 160).nullable();
      table.string('medium', 32).notNullable();
      table.string('continuity', 32).notNullable().defaultTo('main');
      table.integer('sort_order').notNullable().defaultTo(0);
      table.integer('source_id').nullable().references('id').inTable('catalog_sources').onDelete('SET NULL');
    });
  }

  if (!(await instance.schema.hasTable('sides'))) {
    await instance.schema.createTable('sides', (table) => {
      table.string('key', 64).primary();
      table.string('name_zh', 64).notNullable().unique();
      table.string('name_ja', 64).nullable();
    });
    await instance('sides').insert([
      { key: 'science', name_zh: SIDE_TITLES.science, name_ja: '科学サイド' },
      { key: 'magic', name_zh: SIDE_TITLES.magic, name_ja: '魔術サイド' },
      { key: 'independent', name_zh: SIDE_TITLES.independent, name_ja: null },
      { key: 'unknown', name_zh: SIDE_TITLES.unknown, name_ja: null },
    ]);
  }

  if (!(await instance.schema.hasTable('character_sides'))) {
    await instance.schema.createTable('character_sides', (table) => {
      table.integer('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
      table.string('side_key', 64).notNullable().references('key').inTable('sides').onDelete('CASCADE');
      table.string('relationship_type', 32).notNullable().defaultTo('member');
      table.boolean('is_primary').notNullable().defaultTo(false);
      table.string('start_reference', 128).nullable();
      table.string('end_reference', 128).nullable();
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
      table.primary(['character_id', 'side_key', 'relationship_type']);
      table.index(['side_key', 'character_id']);
    });
  }

  if (!(await instance.schema.hasTable('organizations'))) {
    await instance.schema.createTable('organizations', (table) => {
      table.increments('id').primary();
      table.string('name_zh', 128).notNullable().unique();
      table.string('name_ja', 128).nullable();
      table.string('name_en', 128).nullable();
      table.string('organization_type', 32).notNullable().defaultTo('unknown');
      table.integer('parent_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
      table.string('side_key', 64).nullable().references('key').inTable('sides').onDelete('SET NULL');
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
      table.index(['parent_id']);
    });
  }

  if (!(await instance.schema.hasTable('character_organizations'))) {
    await instance.schema.createTable('character_organizations', (table) => {
      table.integer('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
      table.integer('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.string('relationship_type', 32).notNullable().defaultTo('member');
      table.string('role', 128).nullable();
      table.boolean('is_primary').notNullable().defaultTo(false);
      table.string('start_reference', 128).nullable();
      table.string('end_reference', 128).nullable();
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
      table.primary(['character_id', 'organization_id', 'relationship_type']);
      table.index(['organization_id', 'character_id']);
    });
  }

  if (!(await instance.schema.hasTable('locations'))) {
    await instance.schema.createTable('locations', (table) => {
      table.increments('id').primary();
      table.string('name_zh', 128).notNullable().unique();
      table.string('name_ja', 128).nullable();
      table.string('location_type', 32).notNullable().defaultTo('unknown');
      table.integer('parent_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
    });
  }

  if (!(await instance.schema.hasTable('character_locations'))) {
    await instance.schema.createTable('character_locations', (table) => {
      table.integer('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
      table.integer('location_id').notNullable().references('id').inTable('locations').onDelete('CASCADE');
      table.string('relationship_type', 32).notNullable().defaultTo('active');
      table.boolean('is_primary').notNullable().defaultTo(false);
      table.string('start_reference', 128).nullable();
      table.string('end_reference', 128).nullable();
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
      table.primary(['character_id', 'location_id', 'relationship_type']);
      table.index(['location_id', 'character_id']);
    });
  }

  if (!(await instance.schema.hasTable('character_appearances'))) {
    await instance.schema.createTable('character_appearances', (table) => {
      table.increments('id').primary();
      table.integer('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
      table.integer('work_id').nullable().references('id').inTable('works').onDelete('SET NULL');
      table.string('source_key', 80).notNullable();
      table.string('reference_label', 128).nullable();
      table.integer('debut_year').nullable();
      table.string('prominence', 32).notNullable().defaultTo('unknown');
      table.boolean('is_first').notNullable().defaultTo(false);
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
      table.unique(['character_id', 'source_key'], 'character_appearances_source_unique');
      table.index(['work_id', 'character_id']);
    });
  }

  if (!(await instance.schema.hasTable('character_game_profiles'))) {
    await instance.schema.createTable('character_game_profiles', (table) => {
      table.integer('character_id').primary().references('id').inTable('characters').onDelete('CASCADE');
      table.boolean('is_enabled').notNullable().defaultTo(false);
      table.string('content_scope', 64).notNullable().defaultTo('unclassified');
      table.integer('spoiler_level').notNullable().defaultTo(0);
      table.integer('editorial_prominence').nullable();
      table.float('recognition_score').nullable();
      table.integer('sample_size').notNullable().defaultTo(0);
      table.string('review_status', 32).notNullable().defaultTo('needs_review');
      table.timestamp('updated_at').notNullable().defaultTo(instance.fn.now());
    });
  }

  if (!(await instance.schema.hasTable('character_difficulties'))) {
    await instance.schema.createTable('character_difficulties', (table) => {
      table.integer('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
      table.string('difficulty_key', 32).notNullable().references('key').inTable('difficulty_levels').onDelete('CASCADE');
      table.primary(['character_id', 'difficulty_key']);
      table.index(['difficulty_key', 'character_id']);
    });
  }

  if (!(await instance.schema.hasTable('character_references'))) {
    await instance.schema.createTable('character_references', (table) => {
      table.increments('id').primary();
      table.integer('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
      table.integer('source_id').notNullable().references('id').inTable('catalog_sources').onDelete('CASCADE');
      table.string('source_url', 512).nullable();
      table.string('page_title', 256).nullable();
      table.string('applies_to', 128).notNullable().defaultTo('character');
      table.string('confidence', 16).notNullable().defaultTo('unknown');
      table.timestamp('last_verified_at').nullable();
      table.unique(['character_id', 'source_id', 'applies_to'], 'character_references_unique');
    });
  }
}
