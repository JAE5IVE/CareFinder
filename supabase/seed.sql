insert into public.hospitals (
  name,
  address,
  city,
  lga,
  state,
  phone,
  email,
  ownership,
  specialties,
  visiting_hours_markdown,
  description_markdown,
  notes_markdown,
  location,
  status
) values
(
  'Lagos University Teaching Hospital (LUTH)',
  'Ishaga Road, Idi-Araba',
  'Idi-Araba, Yaba',
  'Surulere',
  'Lagos',
  '+234 1 292 9000',
  'info@luth.org.ng',
  'public',
  array['Maternity', 'Emergency', 'Pediatric', 'Dental', 'Oncology', 'General Practice'],
  '### Open Visiting Hours
- **Morning Shift:** 11:00 AM - 1:00 PM
- **Evening Shift:** 4:00 PM - 6:00 PM',
  '## About LUTH
LUTH is one of the premier tertiary healthcare institutions in West Africa.',
  '> **Emergency Hotline:** +234 803 300 0000',
  st_setsrid(st_makepoint(3.3592, 6.5165), 4326)::geography,
  'approved'
),
(
  'Reddington Multi-Specialty Hospital',
  '12 Idejo Street',
  'Victoria Island',
  'Eti-Osa',
  'Lagos',
  '+234 1 271 2000',
  'customercare@reddingtonhospital.com',
  'private',
  array['Emergency', 'Cardiology', 'Maternity', 'Dental', 'Orthopedics', 'General Practice'],
  '### Patient Visits
- **Weekdays:** 2:00 PM - 8:00 PM
- **Weekends/Holidays:** 10:00 AM - 8:00 PM',
  '## Care Redefined
Private multi-specialty care with cardiology, critical care, and advanced surgery services.',
  '- Private health insurance and corporate HMOs accepted.',
  st_setsrid(st_makepoint(3.4246, 6.4291), 4326)::geography,
  'approved'
),
(
  'National Hospital Abuja',
  'Plot 272, Samuel Ademulegun Street',
  'Central Business District',
  'Municipal',
  'Abuja (FCT)',
  '+234 9 623 0150',
  'contact@nationalhospital.gov.ng',
  'public',
  array['Emergency', 'Pediatric', 'Oncology', 'Maternity', 'General Practice'],
  '### General Visiting Timings
- **Daily:** 12:30 PM - 2:00 PM & 4:30 PM - 7:00 PM',
  '## Premier Capital Healthcare
Flagship government-owned referral center in the Federal Capital Territory.',
  'Visitors must display an identity card at the main gateway.',
  st_setsrid(st_makepoint(7.4725, 9.0345), 4326)::geography,
  'approved'
);
