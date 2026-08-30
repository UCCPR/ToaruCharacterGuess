import classificationData from './characterClassificationData.json' with { type: 'json' };

export interface CharacterIdentity {
  name: string;
  group: string;
  kind: string;
  entity: string | null;
  role: string;
}

export interface IdentityOrganization {
  name: string;
  type: string;
  relationship: string;
}

export const UNCLASSIFIED_IDENTITY: CharacterIdentity = {
  name: '身份未分类',
  group: 'unclassified',
  kind: 'unclassified',
  entity: null,
  role: 'unclassified',
};

export const GENDER_CODES: Readonly<Record<string, number>> = {
  female: 0,
  male: 1,
  unknown: 2,
  none: 3,
};

const ORGANIZATION_PARENTS = classificationData.organizationParents as Record<string, string>;
const RELATIONSHIP_LABELS = classificationData.relationshipLabels as Record<string, string>;
const SIDE_IDENTITIES = classificationData.sideIdentities as Record<string, Pick<CharacterIdentity, 'name' | 'group'>>;
const ORGANIZATION_IDENTITY_GROUPS = classificationData.organizationIdentityGroups as Record<string, string>;

export const IDENTITY_ONLY_ORGANIZATION_TYPES = new Set<string>(
  classificationData.identityOnlyOrganizationTypes,
);

export const SIDE_TITLES: Record<string, string> = {
  science: '科学侧',
  magic: '魔法侧',
  independent: '独立／其他',
  unknown: '未知',
};

export const DEBUT_WORK_TITLES: Record<string, string> = {
  'index-ot': '魔法禁书目录（旧约）',
  'index-ss': '魔法禁书目录 SS',
  'index-ss2': '魔法禁书目录 SS2',
  'index-nt': '新约 魔法禁书目录',
  'index-gt': '创约 魔法禁书目录',
  'index-sp': '魔法禁书目录 SP',
  'index-stiyl-ss': '魔法禁书目录 SS：史提尔篇',
  'index-kanzaki-ss': '魔法禁书目录 SS：神裂火织篇',
  'index-biohacker': '魔法禁书目录 SS：生物黑客篇',
  'railgun-manga': '某科学的超电磁炮（漫画）',
  'railgun-anime': '某科学的超电磁炮（动画）',
  'accelerator-manga': '某科学的一方通行（漫画）',
  'accelerator-anime': '某科学的一方通行（动画）',
  'dark-matter-manga': '某科学的未元物质',
  'mental-out-manga': '某科学的心理掌握',
  'item-novel': '某暗部的少女共栖',
  'astral-buddy-manga': '某科学的超电磁炮外传 Astral Buddy',
  'kakine-manga': '某科学的未元物质',
  'endymion-movie': '剧场版：恩底弥翁的奇迹',
};

export function organizationParentName(name: string, explicitParent?: string): string | null {
  return explicitParent ?? ORGANIZATION_PARENTS[name] ?? null;
}

export function sideIdentity(relationship: string): CharacterIdentity | undefined {
  const identity = SIDE_IDENTITIES[relationship];
  if (!identity) return undefined;
  return {
    ...identity,
    kind: 'side-affiliation',
    entity: null,
    role: relationship,
  };
}

export function organizationIdentity(organization: IdentityOrganization): CharacterIdentity {
  const suffix = RELATIONSHIP_LABELS[organization.relationship] ?? '相关人员';
  const groupTemplate = ORGANIZATION_IDENTITY_GROUPS[organization.type];
  const group = groupTemplate
    ? groupTemplate.replace('{name}', organization.name)
    : `${organization.type}:${organization.relationship}`;
  return {
    name: `${organization.name}${suffix}`,
    group,
    kind: organization.type,
    entity: organization.name,
    role: organization.relationship,
  };
}

export function characterIdentityKey(identity: CharacterIdentity): string {
  return `${identity.kind}\u0000${identity.entity ?? ''}\u0000${identity.role}`;
}
