import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Search from '../../src/pages/Search';
import { renderAtRoute } from '../render';
import { api } from '../../src/api/client';
import i18n from '../../src/i18n';

vi.mock('../../src/api/client', async () => {
  const actual = await vi.importActual<typeof import('../../src/api/client')>('../../src/api/client');
  return { ...actual, api: { get: vi.fn() } };
});

vi.mock('../../src/api/playerList', () => ({
  getPlayerList: vi.fn(async () => [{
    id: 3,
    nickname: '御坂美琴',
    localizedNames: { zh: '御坂美琴', en: 'Misaka Mikoto', ja: '御坂美琴' },
  }]),
  subscribePlayerList: vi.fn(() => () => undefined),
  searchPlayerList: (players: unknown[]) => players,
  localizedPlayerName: (_id: number, fallback: string, language: string) =>
    language.startsWith('en') ? 'Misaka Mikoto' : fallback,
}));

describe('Search localization', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    vi.mocked(api.get).mockResolvedValue({
      data: [{
        id: 3,
        nickname: '御坂美琴',
        localizedNames: { zh: '御坂美琴', en: 'Misaka Mikoto', ja: '御坂美琴' },
        nationality: '科学侧',
        region: '学园都市',
        team: '常盘台中学',
        age: 0,
        role: '',
        identities: ['能力者', '常盘台中学学生'],
        majorChampionships: 0,
        majorAppearances: 2004,
        debutWork: '魔法禁书目录（旧约）',
        difficulties: ['normal', 'easy', 'beginner'],
        isActive: true,
      }],
    } as never);
  });

  afterEach(async () => {
    await i18n.changeLanguage('zh');
  });

  it('shows localized names and all normalized identities', async () => {
    const user = userEvent.setup();
    renderAtRoute(<Search />, { route: '/search', path: '/search' });

    await user.type(screen.getByRole('combobox'), 'Misaka');
    await user.click(await screen.findByRole('option', { name: 'Misaka Mikoto' }));

    expect(await screen.findByRole('heading', { name: /Misaka Mikoto/ })).toBeInTheDocument();
    expect(screen.getByText('Esper, Tokiwadai Middle School student')).toBeInTheDocument();
    expect(screen.getByText('Science Side · Academy City')).toBeInTheDocument();
  });
});
