import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BuildMeta from '../../../static/src/BuildMeta';
import { renderWithProviders } from '../render';

describe('static build metadata', () => {
  it('shows the version and update date at the page edge', () => {
    renderWithProviders(<BuildMeta />);

    expect(screen.getByText(/版本 .+ · 更新于 .+/)).toHaveClass('static-build-meta');
  });
});
