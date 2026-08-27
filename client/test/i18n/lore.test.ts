import { describe, expect, it } from 'vitest';
import i18n from '../../src/i18n';
import { localizeLoreValue } from '../../src/i18n/lore';

describe('lore localization', () => {
  it('localizes core lore fields in English', () => {
    expect(localizeLoreValue(i18n.t, '科学侧', 'en')).toBe('Science Side');
    expect(localizeLoreValue(i18n.t, '学园都市', 'en')).toBe('Academy City');
    expect(localizeLoreValue(i18n.t, '常盘台中学学生', 'en')).toBe('Tokiwadai Middle School student');
    expect(localizeLoreValue(i18n.t, '魔法禁书目录（旧约）', 'en')).toBe('A Certain Magical Index (Old Testament)');
  });

  it('localizes organization identities in Japanese', () => {
    expect(localizeLoreValue(i18n.t, '必要之恶教会成员', 'ja')).toBe('必要悪の教会（ネセサリウス）のメンバー');
    expect(localizeLoreValue(i18n.t, '英国', 'ja')).toBe('イギリス');
  });

  it('keeps Chinese values unchanged in Chinese', () => {
    expect(localizeLoreValue(i18n.t, '道具（ITEM）成员', 'zh-CN')).toBe('道具（ITEM）成员');
  });
});
