import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AdminPlayers from '../../../src/components/admin/AdminPlayers';
import { renderWithProviders } from '../../render';

describe('AdminPlayers', () => {
  it('explains that character editing is disabled during migration', () => {
    renderWithProviders(<AdminPlayers />);
    expect(screen.getByText('角色编辑暂时停用')).toBeInTheDocument();
    expect(screen.getByText(/规范目录种子统一维护/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '新增角色' })).not.toBeInTheDocument();
  });
});
