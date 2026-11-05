import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../../../src/components/states/EmptyState';
import ErrorState from '../../../src/components/states/ErrorState';
import LoadingState from '../../../src/components/states/LoadingState';

describe('weather states', () => {
  it('announces loading progress', () => {
    render(<LoadingState message="Buscando clima..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Buscando clima...');
  });

  it('announces empty results', () => {
    render(<EmptyState title="Sem resultados" description="Tente outra cidade." />);

    expect(screen.getByRole('status')).toHaveTextContent('Sem resultados');
    expect(screen.getByRole('status')).toHaveTextContent('Tente outra cidade.');
  });

  it('announces an error and retries when requested', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorState message="Falha ao carregar." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
