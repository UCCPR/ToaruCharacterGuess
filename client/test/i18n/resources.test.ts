import { describe, expect, it } from 'vitest';
import { resources } from '../../src/i18n/resources';

function leafKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object'
      ? leafKeys(child as object, path)
      : [path];
  });
}

describe('translation resources', () => {
  it('keeps English and Japanese structurally complete with Chinese', () => {
    const chineseKeys = leafKeys(resources.zh.translation).sort();
    expect(leafKeys(resources.en.translation).sort()).toEqual(chineseKeys);
    expect(leafKeys(resources.ja.translation).sort()).toEqual(chineseKeys);
  });
});
