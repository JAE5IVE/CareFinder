import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

vi.mock('../lib/env', () => ({
  hasSupabaseConfig: false,
}));

describe('AuthModal', () => {
  it('logs in as an admin in local mode', async () => {
    const onLoginSuccess = vi.fn();
    render(<AuthModal isOpen onClose={() => undefined} onLoginSuccess={onLoginSuccess} />);
    fireEvent.click(screen.getByText('Admin'));
    fireEvent.change(screen.getByPlaceholderText('admin@carefinder.gov.ng'), { target: { value: 'admin@carefinder.gov.ng' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' })));
  });
});
