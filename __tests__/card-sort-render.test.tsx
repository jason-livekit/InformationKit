import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardSort } from '@/components/card-sort/card-sort';
import type { Card } from '@/lib/repo/schemas';

const cards: Card[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
];

describe('<CardSort />', () => {
  it('renders cards passed in as props (not the legacy global catalog)', async () => {
    render(<CardSort cards={cards} draftKey="test:draft" />);
    // Wait a tick so the mounted effect runs and the real grid renders.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('renders predefined groups in the groups column', async () => {
    render(
      <CardSort
        cards={cards}
        predefinedGroups={[{ id: 'g_pre', label: 'Fruits', cardIds: [] }]}
        draftKey="test:draft2"
      />,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('Fruits')).toBeInTheDocument();
  });
});
