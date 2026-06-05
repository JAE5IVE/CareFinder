import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SEEDED_HOSPITALS } from '../data/hospitals';
import { MapContainer } from './MapContainer';

describe('MapContainer', () => {
  it('renders the fallback interactive map without Mapbox keys', () => {
    render(
      <MapContainer
        hospitals={SEEDED_HOSPITALS}
        selectedHospitalId={null}
        onSelectHospital={() => undefined}
        userLat={6.4474}
        userLng={3.4184}
        radius={10}
        onUpdateUserCoords={() => undefined}
        onUpdateRadius={() => undefined}
      />
    );
    expect(screen.getByText('Interactive Spatial Map')).toBeInTheDocument();
    expect(screen.getByText('Public Hospitals')).toBeInTheDocument();
  });
});
