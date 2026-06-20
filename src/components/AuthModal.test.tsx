import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

vi.mock('../lib/carefinderRepository', () => ({
  signIn: vi.fn().mockResolvedValue({
    id: 'usr-admin-1',
    name: 'Carefinder Admin',
    email: 'admin@carefinder.gov.ng',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
  }),
  signUpPublic: vi.fn(),
}));

describe('AuthModal', () => {
  it('logs in as an admin', async () => {
    const onLoginSuccess = vi.fn();
    render(<AuthModal isOpen onClose={() => undefined} onLoginSuccess={onLoginSuccess} />);
    fireEvent.click(screen.getByText('Admin'));
    fireEvent.change(screen.getByPlaceholderText('admin@carefinder.gov.ng'), { target: { value: 'admin@carefinder.gov.ng' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' })));
  });
});
