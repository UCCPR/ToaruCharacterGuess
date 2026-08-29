import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../src/i18n';
import { renderWithProviders } from '../render';
import GameRules from '../../src/components/GameRules';

describe('GameRules', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh');
  });

  it('explains the current close-match classification rules', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GameRules />);

    await user.click(screen.getByRole('button', { name: '游戏规则' }));

    expect(screen.getByText('同洲地区、直属或同级组织、相关身份或年份接近')).toBeInTheDocument();
    expect(screen.getByText(/任一所属组织相同显示绿色/)).toHaveTextContent('拥有同一个非空直接上级时显示黄色');
    expect(screen.getByText(/角色可以拥有多重身份/)).toHaveTextContent('同类身份为黄色');
    expect(screen.getByText(/活动地区相同显示绿色/)).toHaveTextContent('同一大洲时显示黄色');
    expect(screen.getByText('英国、意大利、梵蒂冈、北欧、俄罗斯、欧洲')).toBeInTheDocument();
    expect(screen.getByText('美国、墨西哥、洛杉矶')).toBeInTheDocument();
    expect(screen.queryByText('罗马正教')).not.toBeInTheDocument();
    expect(screen.getByText(/首次登场年份相差 3 年以内/)).toHaveTextContent('首次出场作品只判断完全一致');
    expect(screen.getByRole('heading', { name: '阵营分类' })).toBeInTheDocument();
    expect(screen.getByText('科学侧')).toBeInTheDocument();
    expect(screen.getByText('魔法侧')).toBeInTheDocument();
    expect(screen.getByText('独立／其他')).toBeInTheDocument();
    expect(screen.getByText(/主阵营相同显示绿色/)).toHaveTextContent('相关阵营与另一方重合时显示黄色');
  });
});
