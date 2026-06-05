import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SEEDED_HOSPITALS } from '../data/hospitals';
import { CSVExportModal } from './CSVExportModal';

describe('CSVExportModal', () => {
  it('shows column choices and exports selected results', () => {
    render(<CSVExportModal isOpen onClose={() => undefined} hospitals={SEEDED_HOSPITALS.slice(0, 2)} searchQuery="Lagos" />);
    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
    expect(screen.getByLabelText('Hospital Name')).toBeChecked();
    fireEvent.click(screen.getByText('Trigger Download'));
    expect(screen.getByText('Downloaded!')).toBeInTheDocument();
  });
});
