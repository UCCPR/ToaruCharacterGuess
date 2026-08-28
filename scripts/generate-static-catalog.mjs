import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEBUT_WORK_TITLES,
  UNCLASSIFIED_IDENTITY,
  characterIdentityKey,
  IDENTITY_ONLY_ORGANIZATION_TYPES,
  SIDE_TITLES,
  organizationIdentity,
  organizationParentName,
  sideIdentity,
} from '../shared/dist/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(resolve(root, 'server/src/db/seeds/characterCatalog.json'), 'utf8'));
const roster = JSON.parse(readFileSync(resolve(root, 'server/src/db/seeds/players.json'), 'utf8'));
const rosterByName = new Map(roster.filter((entry) => entry.enabled !== false).map((entry) => [entry.nickname, entry]));
const primary = (items) => items.find((item) => item.primary) ?? items[0];
const players = catalog.filter((item) => rosterByName.has(item.nickname)).map((item, index) => {
  const sides = item.sides ?? []; const organizations = item.organizations ?? []; const locations = item.locations ?? [];
  const identitiesByName = new Map([
    ...sides.map((side) => sideIdentity(side.relationship)).filter(Boolean),
    ...organizations.map(organizationIdentity),
  ].map((identity) => [characterIdentityKey(identity), identity]));
  const identities = [...identitiesByName.values()];
  const displayedOrganizations = organizations
    .filter((organization) => !IDENTITY_ONLY_ORGANIZATION_TYPES.has(organization.type))
    .map((organization) => ({
      name: organization.name,
      parent: organizationParentName(organization.name, organization.parent),
    }));
  return { id: index + 1, name: item.nickname, names: { zh: item.nickname, en: item.name_en ?? item.nickname, ja: item.name_ja ?? item.nickname }, aliases: (item.aliases ?? []).map((alias) => alias.name), difficulties: rosterByName.get(item.nickname).difficulties, side: SIDE_TITLES[primary(sides)?.key] ?? '未知', sides: sides.map((side) => SIDE_TITLES[side.key] ?? '未知'), location: primary(locations)?.name ?? '待复核', organizations: displayedOrganizations, identities: identities.length ? identities : [UNCLASSIFIED_IDENTITY], gender: item.gender ?? 'unknown', debutWork: DEBUT_WORK_TITLES[item.appearance?.work] ?? item.appearance?.work ?? '待复核', debutYear: item.appearance?.year ?? 0 };
});
const output = resolve(root, 'static/src/generated/catalog.ts'); mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `// Generated from the normalized catalog.\nexport const catalog = ${JSON.stringify(players, null, 2)} as const;\n`); console.log(`Generated ${players.length} static characters.`);
