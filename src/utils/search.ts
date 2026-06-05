import { Hospital } from '../types';
import { calculateDistance } from './distance';

export interface DirectoryFilters {
  searchQuery: string;
  specialties: string[];
  ownership: Hospital['ownership'] | 'all';
  radius: number;
  userLat: number | null;
  userLng: number | null;
}

export type HospitalSort = 'distance' | 'rating' | 'name';

export function filterHospitals(hospitals: Hospital[], filters: DirectoryFilters): Hospital[] {
  return hospitals.filter((hospital) => {
    const query = filters.searchQuery.toLowerCase().trim();
    if (query) {
      const fields = [hospital.name, hospital.city, hospital.lga, hospital.state, hospital.address].join(' ').toLowerCase();
      if (!fields.includes(query)) return false;
    }

    if (filters.specialties.length > 0) {
      const hasSpecialty = filters.specialties.some((specialty) => hospital.specialties.includes(specialty));
      if (!hasSpecialty) return false;
    }

    if (filters.ownership !== 'all' && hospital.ownership !== filters.ownership) return false;

    if (filters.radius > 0 && filters.userLat !== null && filters.userLng !== null) {
      const distance = calculateDistance(filters.userLat, filters.userLng, hospital.latitude, hospital.longitude);
      if (distance > filters.radius) return false;
    }

    return true;
  });
}

export function sortHospitals(
  hospitals: Hospital[],
  sortBy: HospitalSort,
  userLat: number | null = null,
  userLng: number | null = null
): Hospital[] {
  return [...hospitals].sort((a, b) => {
    if (sortBy === 'distance' && userLat !== null && userLng !== null) {
      return calculateDistance(userLat, userLng, a.latitude, a.longitude) - calculateDistance(userLat, userLng, b.latitude, b.longitude);
    }
    if (sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });
}
