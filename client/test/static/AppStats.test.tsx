import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../../static/src/App';
import { addStaticGameRecord, loadStaticGameRecords } from '../../../static/src/stats';
import { renderWithProviders } from '../render';

describe('static personal records page', () => {
  it('shows locally recorded results and allows clearing them', async () => {
    addStaticGameRecord({
      id: 'completed-game',
      mode: 'free',
      difficulty: 'easy',
      status: 'won',
      answerId: 1,
      guessIds: [2, 1],
      finishedAt: '2026-08-28T01:00:00.000Z',
    });

    renderWithProviders(<App />);
    await userEvent.click(screen.getByRole('button', { name: '个人记录' }));

    expect(screen.getByText('个人统计')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    expect(screen.getByText('最近对局')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '清空记录' }));
    await userEvent.click(await screen.findByRole('button', { name: '确认清空' }));

    expect(loadStaticGameRecords()).toEqual([]);
    expect(screen.getByText('还没有符合当前难度的已完成对局')).toBeInTheDocument();
  });
});
