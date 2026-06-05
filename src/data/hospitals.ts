/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hospital, Review } from '../types';

export const SEEDED_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Lagos University Teaching Hospital (LUTH)',
    address: 'Ishaga Road, Idi-Araba',
    city: 'Idi-Araba, Yaba',
    lga: 'Surulere',
    state: 'Lagos',
    latitude: 6.5165,
    longitude: 3.3592,
    phone: '+234 1 292 9000',
    email: 'info@luth.org.ng',
    specialties: ['Maternity', 'Emergency', 'Pediatric', 'Dental', 'Oncology', 'General Practice'],
    visitingHours: `### Open Visiting Hours
- **Morning Shift:** 11:00 AM - 1:00 PM
- **Evening Shift:** 4:00 PM - 6:00 PM

*Note: Only one visitor is permitted per bed in the intensive care unit.*`,
    description: `## About LUTH
LUTH is one of the premier tertiary healthcare institutions in West Africa. Established in 1962, it serves as a center for excellence in medical education, research, and expert patient care.

### Key Capabilities
- **Oncology wing** with state-of-the-art linear accelerators.
- **Dedicated Neonatal Intensive Care Unit (NICU)**.
- Full scale teaching labs and specialist consultations.`,
    notes: `> **Emergency Hotline:** +234 803 300 0000 (24/7)
> Due to high volume, non-emergency consultations should be booked online.`,
    ownership: 'public',
    rating: 4.2,
    reviewCount: 4,
    status: 'approved',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'hosp-2',
    name: 'Reddington Multi-Specialty Hospital',
    address: '12 Idejo Street',
    city: 'Victoria Island',
    lga: 'Eti-Osa',
    state: 'Lagos',
    latitude: 6.4291,
    longitude: 3.4246,
    phone: '+234 1 271 2000',
    email: 'customercare@reddingtonhospital.com',
    specialties: ['Emergency', 'Cardiology', 'Maternity', 'Dental', 'Orthopedics', 'General Practice'],
    visitingHours: `### Patient Visits
- **Weekdays:** 2:00 PM - 8:00 PM
- **Weekends/Holidays:** 10:00 AM - 8:00 PM

*Children under 12 are not permitted in ward areas.*`,
    description: `## Care Redefined
Reddington Hospital provides a first-rate service with fully integrated facilities, certified medical staff, and digital record systems. Built to international standards, we excel in cardiology, critical care, and advanced surgeries.

### Accreditations
- COHSASA Accredited.
- International standard emergency response team.`,
    notes: `- Private health insurance and corporate HMOs accepted.
- Digital billing panel on the second floor.`,
    ownership: 'private',
    rating: 4.7,
    reviewCount: 3,
    status: 'approved',
    createdAt: '2026-02-15T08:30:00Z',
  },
  {
    id: 'hosp-3',
    name: 'National Hospital Abuja',
    address: 'Plot 272, Samuel Ademulegun Street',
    city: 'Central Business District',
    lga: 'Municipal',
    state: 'Abuja (FCT)',
    latitude: 9.0345,
    longitude: 7.4725,
    phone: '+234 9 623 0150',
    email: 'contact@nationalhospital.gov.ng',
    specialties: ['Emergency', 'Pediatric', 'Oncology', 'Maternity', 'General Practice'],
    visitingHours: `### General Visiting Timings
- **Daily:** 12:30 PM - 2:00 PM & 4:30 PM - 7:00 PM`,
    description: `## Premier Capital Healthcare
National Hospital Abuja functions as the flagship government-owned referral center in the Federal Capital Territory. Features cutting-edge diagnostics, advanced renal panels, and pediatric surgery divisions.`,
    notes: `Highly secure zone. Visitors must display an identity card at the main gateway.`,
    ownership: 'public',
    rating: 3.9,
    reviewCount: 3,
    status: 'approved',
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'hosp-4',
    name: 'Lagoon Hospital Ikoyi',
    address: '17B Bourdillon Road',
    city: 'Ikoyi',
    lga: 'Eti-Osa',
    state: 'Lagos',
    latitude: 6.4468,
    longitude: 3.4475,
    phone: '+234 1 804 5542',
    email: 'enquiries@lagoonhospitals.com',
    specialties: ['Maternity', 'Emergency', 'Pediatric', 'Dental', 'Orthopedics', 'General Practice'],
    visitingHours: `### Open Air Hours
- **Standard Wards:** 12:00 PM - 6:00 PM daily`,
    description: `## High Standard Medical Services
Lagoon Hospital was established in 1986 and remains to be a leading brand in upscale private medicine in Nigeria. Known for quality treatment pathways and high safety indices.`,
    notes: `Pre-approval with insurance provider speeds up admissions process during off-hours.`,
    ownership: 'private',
    rating: 4.4,
    reviewCount: 2,
    status: 'approved',
    createdAt: '2026-03-20T14:15:00Z',
  },
  {
    id: 'hosp-5',
    name: 'Evercare Hospital Lekki',
    address: 'Plot 3, Block 2, Bisola Durosinmi Etti Drive',
    city: 'Lekki Phase 1',
    lga: 'Eti-Osa',
    state: 'Lagos',
    latitude: 6.4385,
    longitude: 3.4831,
    phone: '+234 813 985 0000',
    email: 'info@evercare.ng',
    specialties: ['Cardiology', 'Pediatric', 'Emergency', 'Maternity', 'General Practice'],
    visitingHours: `### Dynamic Visiting Standard
- **General Wards:** 10:00 AM - 7:00 PM
- **ICU Wards:** 4:00 PM - 5:30 PM only`,
    description: `## 165-Bed Private Multispecialty Tertiary Facility
Evercare Hospital Lekki offers a broad portfolio of medical and surgical services, from high-stakes neurosurgery to general clinical maintenance, with dedicated pediatric support.`,
    notes: `- Wheelchair accessible entries.
- Ample secure parking in front.`,
    ownership: 'private',
    rating: 4.5,
    reviewCount: 2,
    status: 'approved',
    createdAt: '2026-04-05T11:00:00Z',
  },
  {
    id: 'hosp-6',
    name: 'Federal Medical Centre (FMC) Ebute Metta',
    address: 'Murtala Muhammed Way, Railway Compound',
    city: 'Ebute Metta',
    lga: 'Mainland',
    state: 'Lagos',
    latitude: 6.4851,
    longitude: 3.3768,
    phone: '+234 1 291 5635',
    email: 'contact@fmcebutemetta.gov.ng',
    specialties: ['Maternity', 'General Practice', 'Emergency', 'Pediatric'],
    visitingHours: `### Ward Entry Conditions
- **Morning Round:** 11:30 AM - 1:30 PM
- **Evening Round:** 5:00 PM - 6:30 PM`,
    description: `## Public Hospital of Distinction
FMC Ebute Metta is known as one of the best managed federal health institutes in South-Western Nigeria, offering quality primary, secondary, and maternity care at subsidized Rates.`,
    notes: `Subsidized tests available through the NHIS package. Wait times may fluctuate.`,
    ownership: 'public',
    rating: 4.0,
    reviewCount: 2,
    status: 'approved',
    createdAt: '2026-04-12T15:20:00Z',
  },
  {
    id: 'hosp-7',
    name: 'Gbagada General Hospital',
    address: 'Hospital Road, Gbagada',
    city: 'Gbagada',
    lga: 'Kosofe',
    state: 'Lagos',
    latitude: 6.5564,
    longitude: 3.3912,
    phone: '+234 905 561 0282',
    email: 'gbagadagh@lagosstate.gov.ng',
    specialties: ['Emergency', 'General Practice', 'Maternity', 'Pediatric'],
    visitingHours: `### Daily Visiting Schedule
- **All wards:** 4:00 PM - 6:00 PM`,
    description: `## Comprehensive Civic Care
Lagos State government secondary hospital featuring a massive burn clinic, multi-specialty trauma unit, and highly integrated outpatient consulting clinics.`,
    notes: `Government-subsidized maternity cards are issued at the prenatal ward registry.`,
    ownership: 'public',
    rating: 3.8,
    reviewCount: 2,
    status: 'approved',
    createdAt: '2026-04-25T16:40:00Z',
  }
];

export const SEEDED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    hospitalId: 'hosp-1',
    userName: 'Chinedu Okafor',
    userEmail: 'chinedu@test.com',
    rating: 5,
    text: 'My wife had her delivery here. The doctors in the maternity ward are absolute life-savers! Highly recommend.',
    status: 'approved',
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'rev-2',
    hospitalId: 'hosp-1',
    userName: 'Funmi Adebayo',
    userEmail: 'funmi.ade@test.com',
    rating: 4,
    text: 'Great doctors, but the triage queue was exceptionally long. Be sure to arrive early for outpatient diagnostics.',
    status: 'approved',
    createdAt: '2026-02-18T15:22:00Z',
  },
  {
    id: 'rev-3',
    hospitalId: 'hosp-2',
    userName: 'Tarek Al-Mansoor',
    userEmail: 'tarek@company.com',
    rating: 5,
    text: 'Spectacular emergency cardiology response. Quick billing integration, clean private rooms, worth the premium cost.',
    status: 'approved',
    createdAt: '2026-03-05T09:12:00Z',
  },
  {
    id: 'rev-4',
    hospitalId: 'hosp-3',
    userName: 'Aisha Bello',
    userEmail: 'aisha@abuja.com',
    rating: 4,
    text: 'A clean national asset in Abuja. Pediatric consultants are extremely thorough and caring with neonates.',
    status: 'approved',
    createdAt: '2026-04-02T10:45:00Z',
  },
  {
    id: 'rev-5',
    hospitalId: 'hosp-3',
    userName: 'Emeka Nwosu',
    userEmail: 'emeka@test.com',
    rating: 3,
    text: 'Care is high standard but administrative processing is extremely slow due to paper registers.',
    status: 'approved',
    createdAt: '2026-04-20T16:11:00Z',
  },
  {
    id: 'rev-6',
    hospitalId: 'hosp-4',
    userName: 'Sola Shonibare',
    userEmail: 'sola@shonibare.com',
    rating: 5,
    text: 'Superb pediatric handling. Excellent dental facility. Extremely satisfied with Ikoyi lagoon service standards.',
    status: 'approved',
    createdAt: '2026-05-01T14:30:00Z',
  }
];
