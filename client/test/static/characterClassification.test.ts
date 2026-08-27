import { describe, expect, it } from 'vitest';
import { catalog } from '../../../static/src/generated/catalog';

function character(name: string) {
  const result = catalog.find((entry) => entry.name === name);
  if (!result) throw new Error(`Missing static character: ${name}`);
  return result;
}

describe('static character classification', () => {
  it('uses the shared direct-parent hierarchy for organization feedback', () => {
    expect(character('麦野沉利').organizations).toContainEqual({
      name: '道具（ITEM）',
      parent: '暗部',
    });
    expect(character('土御门元春').organizations).toContainEqual({
      name: '集团（GROUP）',
      parent: '暗部',
    });
  });

  it('keeps identity-only entries out of the organization column', () => {
    const mathers = character('山缪·李德·麦奎恩·马瑟斯');
    expect(mathers.organizations.map((organization) => organization.name))
      .not.toContain('科隆尊召唤者');
    expect(mathers.identities).toContainEqual({
      name: '科隆尊召唤者',
      group: 'status:科隆尊召唤者',
    });
  });

  it('shares relationship labels and side identities with the server edition', () => {
    expect(character('莉莉丝').identities.map((identity) => identity.name))
      .toContain('克劳利家族女儿');
    expect(character('削板军霸').identities).toContainEqual({
      name: '原石',
      group: 'esper',
    });
  });
});
