import { describe, expect, it } from 'vitest';
import { SEEDED_HOSPITALS } from '../data/hospitals';
import { filterHospitals, sortHospitals } from './search';

const baseFilters = {
  searchQuery: '',
  specialties: [],
  ownership: 'all' as const,
  radius: 0,
  userLat: null,
  userLng: null,
};

describe('hospital search filters', () => {
  it('searches by hospital name, city, LGA, state, or address', () => {
    expect(filterHospitals(SEEDED_HOSPITALS, { ...baseFilters, searchQuery: 'Surulere' }).length).toBeGreaterThan(0);
  });

  it('filters by specialty', () => {
    const rows = filterHospitals(SEEDED_HOSPITALS, { ...baseFilters, specialties: ['Cardiology'] });
    expect(rows.every((hospital) => hospital.specialties.includes('Cardiology'))).toBe(true);
  });

  it('filters by ownership', () => {
    const rows = filterHospitals(SEEDED_HOSPITALS, { ...baseFilters, ownership: 'private' });
    expect(rows.every((hospital) => hospital.ownership === 'private')).toBe(true);
  });

  it('filters by radius around a coordinate', () => {
    const rows = filterHospitals(SEEDED_HOSPITALS, {
      ...baseFilters,
      radius: 3,
      userLat: 6.4291,
      userLng: 3.4246,
    });
    expect(rows.some((hospital) => hospital.name.includes('Reddington'))).toBe(true);
  });

  it('sorts by rating descending', () => {
    const rows = sortHospitals(SEEDED_HOSPITALS, 'rating');
    expect(rows[0].rating).toBeGreaterThanOrEqual(rows[1].rating);
  });

  it('sorts by closest hospital when coordinates are available', () => {
    const rows = sortHospitals(SEEDED_HOSPITALS, 'distance', 6.4291, 3.4246);
    expect(rows[0].name).toContain('Reddington');
  });
});
