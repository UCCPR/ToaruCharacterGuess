import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(resolve(root, 'server/src/db/seeds/characterCatalog.json'), 'utf8'));
const roster = JSON.parse(readFileSync(resolve(root, 'server/src/db/seeds/players.json'), 'utf8'));
const classification = JSON.parse(readFileSync(resolve(root, 'server/src/services/characterClassificationData.json'), 'utf8'));
const rosterByName = new Map(roster.filter((entry) => entry.enabled !== false).map((entry) => [entry.nickname, entry]));
const sideNames = { science: '科学侧', magic: '魔法侧', independent: '独立／其他', unknown: '未知' };
const workNames = { 'index-ot': '魔法禁书目录（旧约）', 'index-nt': '新约 魔法禁书目录', 'index-gt': '创约 魔法禁书目录', 'railgun-manga': '某科学的超电磁炮（漫画）', 'accelerator-manga': '某科学的一方通行', 'dark-matter-manga': '某科学的未元物质', 'mental-out-manga': '某暗部的少女共栖', 'item-manga': '暗部的ITEM', 'astral-buddy-manga': '某科学的一方通行外传', 'kakine-manga': '某科学的一方通行外传' };
const primary = (items) => items.find((item) => item.primary) ?? items[0];
const identityOnlyOrganizationTypes = new Set(classification.identityOnlyOrganizationTypes);
const organizationParent = (item) => item.parent ?? classification.organizationParents[item.name] ?? null;
const organizationIdentity = (item) => {
  const suffix = classification.relationshipLabels[item.relationship] ?? '相关人员';
  const template = classification.organizationIdentityGroups[item.type];
  const group = template ? template.replace('{name}', item.name) : `${item.type}:${item.relationship}`;
  return { name: `${item.name}${suffix}`, group };
};
const players = catalog.filter((item) => rosterByName.has(item.nickname)).map((item, index) => {
  const sides = item.sides ?? []; const organizations = item.organizations ?? []; const locations = item.locations ?? [];
  const identitiesByName = new Map([
    ...sides.map((side) => classification.sideIdentities[side.relationship]).filter(Boolean),
    ...organizations.map(organizationIdentity),
  ].map((identity) => [identity.name, identity]));
  const identities = [...identitiesByName.values()];
  const displayedOrganizations = organizations
    .filter((organization) => !identityOnlyOrganizationTypes.has(organization.type))
    .map((organization) => ({ name: organization.name, parent: organizationParent(organization) }));
  return { id: index + 1, name: item.nickname, names: { zh: item.nickname, en: item.name_en ?? item.nickname, ja: item.name_ja ?? item.nickname }, aliases: (item.aliases ?? []).map((alias) => alias.name), difficulties: rosterByName.get(item.nickname).difficulties, side: sideNames[primary(sides)?.key] ?? '未知', sides: sides.map((side) => sideNames[side.key] ?? '未知'), location: primary(locations)?.name ?? '待复核', organizations: displayedOrganizations, identities: identities.length ? identities : [{ name: '身份未分类', group: 'unclassified' }], gender: item.gender ?? 'unknown', debutWork: workNames[item.appearance?.work] ?? item.appearance?.work ?? '待复核', debutYear: item.appearance?.year ?? 0 };
});
const output = resolve(root, 'static/src/generated/catalog.ts'); mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `// Generated from the normalized catalog.\nexport const catalog = ${JSON.stringify(players, null, 2)} as const;\n`); console.log(`Generated ${players.length} static characters.`);
