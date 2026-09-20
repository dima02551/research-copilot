import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge tone="positive">Релевантно</Badge>);
    expect(screen.getByText('Релевантно')).toBeInTheDocument();
  });

  it('defaults to the neutral tone when none is given', () => {
    render(<Badge>Нейтрально</Badge>);
    expect(screen.getByText('Нейтрально').className).toContain('bg-white/5');
  });
});
