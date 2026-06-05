import { describe, expect, it } from 'vitest';
import { calculateDistance, NIGERIA_BOUNDS } from './distance';

describe('distance utilities', () => {
  it('calculates nearby Lagos facilities within a sensible range', () => {
    const km = calculateDistance(6.4291, 3.4246, 6.4468, 3.4475);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(5);
  });

  it('defines coordinate bounds that cover Nigeria', () => {
    expect(NIGERIA_BOUNDS.minLat).toBeLessThan(6.5);
    expect(NIGERIA_BOUNDS.maxLng).toBeGreaterThan(7.4);
  });
});
