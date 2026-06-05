import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SEEDED_HOSPITALS, SEEDED_REVIEWS } from '../data/hospitals';
import { AdminDashboard } from './AdminDashboard';

describe('AdminDashboard', () => {
  const props = {
    hospitals: SEEDED_HOSPITALS,
    reviews: SEEDED_REVIEWS,
    onAddHospital: vi.fn(),
    onUpdateHospital: vi.fn(),
    onDeleteHospital: vi.fn(),
    onUpdateReviewStatus: vi.fn(),
    onDeleteReview: vi.fn(),
  };

  it('renders hospital management controls', () => {
    render(<AdminDashboard {...props} />);
    expect(screen.getByText('Carefinder Registry Console')).toBeInTheDocument();
    expect(screen.getByText('Add New Hospital')).toBeInTheDocument();
  });

  it('opens review moderation tab', () => {
    render(<AdminDashboard {...props} />);
    fireEvent.click(screen.getByText('Moderate Reviews'));
    expect(screen.getByText('Validate Witness testimonies & Patient Case Logs')).toBeInTheDocument();
  });
});
