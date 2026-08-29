import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GuessBoard from '../../src/components/GuessBoard';
import { renderWithProviders } from '../render';

describe('GuessBoard organization annotation', () => {
  it('labels a yellow affiliation as a related organization', () => {
    renderWithProviders(<GuessBoard guesses={[{
      playerId: 1,
      nickname: '测试角色',
      correct: false,
      attributes: {
        nationality: { value: '科学侧', level: 'correct' },
        region: { value: '日本', level: 'close' },
        team: { value: '栅川中学', level: 'close' },
        age: { value: 1, level: 'wrong' },
        role: { value: '空间移动', level: 'close' },
        majorChampionships: { value: 0, level: 'correct' },
        debutWork: { value: '魔法禁书目录（旧约）', level: 'correct' },
        majorAppearances: { value: 2004, level: 'close' },
        isActive: { value: true, level: 'correct' },
      },
    }]} />);

    expect(screen.getByText('直属或同级组织')).toBeInTheDocument();
    expect(screen.getByText('相关身份')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '能力等级' })).not.toBeInTheDocument();
  });
});
