import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title and, when given, the description', () => {
    render(<EmptyState title="Инсайтов не найдено" description="Попробуйте переформулировать тему." />);
    expect(screen.getByText('Инсайтов не найдено')).toBeInTheDocument();
    expect(screen.getByText('Попробуйте переформулировать тему.')).toBeInTheDocument();
  });

  it('omits the description paragraph when none is given', () => {
    render(<EmptyState title="Инсайтов не найдено" />);
    expect(screen.getByText('Инсайтов не найдено')).toBeInTheDocument();
    expect(screen.queryByText('Попробуйте переформулировать тему.')).not.toBeInTheDocument();
  });

  it('renders the action slot when given', () => {
    render(<EmptyState title="Пусто" action={<button>Повторить</button>} />);
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });
});
