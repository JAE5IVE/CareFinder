/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OwnershipType = 'public' | 'private';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  lga: string; // Local Government Area
  state: string; // e.g. Lagos, Abuja FCT, Oyo, etc.
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  specialties: string[]; // e.g., Maternity, Emergency, Dental, Pediatric, General Practice, etc.
  visitingHours: string; // Markdown description
  description: string;   // Markdown description
  notes: string;         // Markdown notes/warnings
  ownership: OwnershipType;
  rating: number;        // Cached aggregate rating
  reviewCount: number;  // Cached review count
  status: 'approved' | 'pending'; // In Carefinder, admins curate entries other than public submissions
  photoUrls?: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  hospitalId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5
  text: string;
  status: 'approved' | 'pending' | 'hidden'; // Admins moderate reviews (approve/hide)
  createdAt: string;
}

export type UserRole = 'admin' | 'public';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface SearchFilters {
  searchQuery: string; // hospital name, city, or LGA
  specialties: string[];
  ownership: OwnershipType | 'all';
  radius: number; // in km, or 0 if disabled
  userLat: number | null;
  userLng: number | null;
}

export interface CSVColumnOption {
  key: keyof Hospital | 'location';
  label: string;
  enabled: boolean;
}
