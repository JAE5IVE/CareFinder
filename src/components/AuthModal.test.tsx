import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

describe('AuthModal', () => {
  it('logs in with the demo admin shortcut in local mode', async () => {
    const onLoginSuccess = vi.fn();
    render(<AuthModal isOpen onClose={() => undefined} onLoginSuccess={onLoginSuccess} />);
    fireEvent.click(screen.getByText('Admin Staff'));
    fireEvent.click(screen.getByText('Log In Portal'));
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' })));
  });
});
