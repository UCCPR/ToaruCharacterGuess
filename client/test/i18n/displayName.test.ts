import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';
import { localizeDisplayName } from '../../src/i18n/displayName';
import { resources } from '../../src/i18n/resources';

describe('localized multiplayer display names', () => {
  it.each([
    ['zh', '访客#ABCDE', '未知对手'],
    ['en', 'Guest#ABCDE', 'Unknown opponent'],
    ['ja', 'ゲスト#ABCDE', '不明な相手'],
  ])('localizes server-generated names in %s', async (language, guest, unknown) => {
    const i18n = createInstance();
    await i18n.init({ resources, lng: language, initAsync: false });

    expect(localizeDisplayName(i18n.t, '访客#ABCDE')).toBe(guest);
    expect(localizeDisplayName(i18n.t, '未知对手')).toBe(unknown);
    expect(localizeDisplayName(i18n.t, 'RegisteredUser')).toBe('RegisteredUser');
  });
});
