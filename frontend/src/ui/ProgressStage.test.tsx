import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressStage } from './ProgressStage';

describe('ProgressStage', () => {
  it('shows the current stage detail text', () => {
    render(<ProgressStage status="searching" detail="Ищу источники (2)..." />);
    expect(screen.getByTestId('stage-detail')).toHaveTextContent('Ищу источники (2)...');
  });
});
