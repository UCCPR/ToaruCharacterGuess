import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../../static/src/App';
import { staticGameStorageKey } from '../../../static/src/game';
import { renderWithProviders } from '../render';

describe('static unfinished-game prompt', () => {
  it('offers to resume on startup and restores the saved mode, difficulty, and guesses', async () => {
    localStorage.setItem(staticGameStorageKey('free', 'easy'), JSON.stringify({
      targetId: 1,
      guessIds: [2],
      status: 'playing',
      updatedAt: Date.now(),
    }));

    renderWithProviders(<App />);

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('继续上次游戏？');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('单人模式');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('简单版');
    await userEvent.click(screen.getByRole('button', { name: '继续游戏' }));

    await waitFor(() => {
      expect(screen.getByText('单人模式 · 简单版', { selector: '.title' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('猜测次数 1 / 8')).toBeInTheDocument();
  });

  it('keeps the save and remains in the lobby when the prompt is dismissed', async () => {
    const key = staticGameStorageKey('free', 'normal');
    localStorage.setItem(key, JSON.stringify({
      targetId: 1,
      guessIds: [],
      status: 'playing',
      updatedAt: Date.now(),
    }));

    renderWithProviders(<App />);
    await userEvent.click(await screen.findByRole('button', { name: '暂不继续' }));

    expect(screen.getByText('选择单人难度', { selector: '.title' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/UCCPR/ToaruCharacterGuess',
    );
    expect(localStorage.getItem(key)).not.toBeNull();
  });
});
