import type { TFunction } from 'i18next';

export function localizeDisplayName(t: TFunction, name: string): string {
  return name
    .replace(/^访客(?=#|$)/, t('common.guest'))
    .replace(/^未知对手$/, t('stats.unknownOpponent'));
}
