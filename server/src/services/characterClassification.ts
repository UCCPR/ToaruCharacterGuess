import classificationData from './characterClassificationData.json';

export interface CharacterIdentity {
  name: string;
  group: string;
}

export interface IdentityOrganization {
  name: string;
  type: string;
  relationship: string;
}

const ORGANIZATION_PARENTS = classificationData.organizationParents as Record<string, string>;
const RELATIONSHIP_LABELS = classificationData.relationshipLabels as Record<string, string>;
const SIDE_IDENTITIES = classificationData.sideIdentities as Record<string, CharacterIdentity>;
const ORGANIZATION_IDENTITY_GROUPS = classificationData.organizationIdentityGroups as Record<string, string>;
export const IDENTITY_ONLY_ORGANIZATION_TYPES = new Set(classificationData.identityOnlyOrganizationTypes);

export function organizationParentName(name: string, explicitParent?: string): string | null {
  return explicitParent ?? ORGANIZATION_PARENTS[name] ?? null;
}

export function sideIdentity(relationship: string): CharacterIdentity | undefined {
  return SIDE_IDENTITIES[relationship];
}

export function organizationIdentity(organization: IdentityOrganization): CharacterIdentity {
  const suffix = RELATIONSHIP_LABELS[organization.relationship] ?? '相关人员';
  const groupTemplate = ORGANIZATION_IDENTITY_GROUPS[organization.type];
  const group = groupTemplate
    ? groupTemplate.replace('{name}', organization.name)
    : `${organization.type}:${organization.relationship}`;
  return { name: `${organization.name}${suffix}`, group };
}

const REGION_CONTINENTS: Record<string, string> = {
  '学园都市': 'asia',
  '日本': 'asia',
  '中国': 'asia',
  '英国': 'europe',
  '意大利': 'europe',
  '梵蒂冈': 'europe',
  '欧洲': 'europe',
  '北欧': 'europe',
  '俄罗斯': 'europe',
  '亚洲': 'asia',
  '埃及': 'africa',
  '芬兰': 'europe',
  '西班牙': 'europe',
  '墨西哥': 'north-america',
  '美国': 'north-america',
};

export const DEBUT_WORK_TITLES: Record<string, string> = {
  'index-ot': '魔法禁书目录（旧约）',
  'index-ss': '魔法禁书目录 SS',
  'index-ss2': '魔法禁书目录 SS2',
  'index-nt': '新约 魔法禁书目录',
  'index-gt': '创约 魔法禁书目录',
  'index-sp': '魔法禁书目录 SP',
  'index-biohacker': '魔法禁书目录 SS：生物黑客篇',
  'railgun-manga': '某科学的超电磁炮（漫画）',
  'railgun-anime': '某科学的超电磁炮（动画）',
  'accelerator-manga': '某科学的一方通行（漫画）',
  'accelerator-anime': '某科学的一方通行（动画）',
  'endymion-movie': '剧场版：恩底弥翁的奇迹',
};

export function sameContinent(left: string, right: string): boolean {
  const leftContinent = REGION_CONTINENTS[left];
  return Boolean(leftContinent && leftContinent === REGION_CONTINENTS[right]);
}
