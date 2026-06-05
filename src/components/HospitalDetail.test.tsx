import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SEEDED_HOSPITALS, SEEDED_REVIEWS } from '../data/hospitals';
import { HospitalDetail } from './HospitalDetail';

describe('HospitalDetail', () => {
  it('shows hospital details and blocks anonymous review submission', () => {
    render(
      <HospitalDetail
        hospital={SEEDED_HOSPITALS[0]}
        reviews={SEEDED_REVIEWS}
        currentUser={null}
        onBack={() => undefined}
        onAddReview={() => undefined}
      />
    );
    expect(screen.getByText(SEEDED_HOSPITALS[0].name)).toBeInTheDocument();
    expect(screen.getByText('Hospital Direct Contact')).toBeInTheDocument();
    expect(screen.getByText(/Please sign in/)).toBeInTheDocument();
  });

  it('submits logged-in public reviews for moderation', () => {
    const onAddReview = vi.fn();
    render(
      <HospitalDetail
        hospital={SEEDED_HOSPITALS[0]}
        reviews={SEEDED_REVIEWS}
        currentUser={{ id: 'u1', name: 'Amina', email: 'amina@test.ng', role: 'public', createdAt: new Date().toISOString() }}
        onBack={() => undefined}
        onAddReview={onAddReview}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/Clean emergency wing/), { target: { value: 'Helpful staff and clean ward.' } });
    fireEvent.click(screen.getByText('Post Review'));
    expect(onAddReview).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
  });
});
