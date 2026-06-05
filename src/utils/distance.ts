/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the distance between two coordinate pairs on Earth's surface
 * using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2)); // precise to 2 decimal places
}

/**
 * Default simulated user geolocation in Nigeria (Lagos City Center)
 */
export const DEFAULT_NIGERIA_COORDS = {
  latitude: 6.4474, // Lagos Island
  longitude: 3.4184,
};

/**
 * Bounds of Lagos & main cities in Nigeria to validate admin bounds coordinates
 */
export const NIGERIA_BOUNDS = {
  minLat: 4.0, // Southern coast
  maxLat: 14.0, // Northern border
  minLng: 2.5, // Western border
  maxLng: 15.0, // Eastern border
};
