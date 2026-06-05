export const hospitals = [
  {
    id: "lagos-general",
    name: "Lagos General Hospital",
    city: "Lagos",
    lga: "Lagos Island",
    address: "Broad Street, Lagos Island, Lagos",
    phone: "+234 802 111 3000",
    email: "info@lagosgeneral.example",
    ownership: "public",
    specialties: ["Emergency", "Maternity", "Pediatric"],
    visitingHours: "Mon-Sun, 8:00 AM - 6:00 PM",
    rating: 4.4,
    reviewCount: 128,
    lat: 6.4541,
    lng: 3.3947,
    description:
      "**Lagos General Hospital** provides emergency, maternal, and child-health services for residents around Lagos Island.",
    reviews: [
      { user: "Ada", rating: 5, text: "Quick triage and helpful nurses.", status: "approved" },
      { user: "Musa", rating: 4, text: "Busy, but the emergency desk was responsive.", status: "pending" }
    ]
  },
  {
    id: "cedarcrest-abuja",
    name: "Cedarcrest Hospitals",
    city: "Abuja",
    lga: "Garki",
    address: "2 Sam Mbakwe Street, Garki, Abuja",
    phone: "+234 809 600 0444",
    email: "care@cedarcrest.example",
    ownership: "private",
    specialties: ["Orthopedic", "Emergency", "Surgery"],
    visitingHours: "Mon-Sat, 9:00 AM - 5:00 PM",
    rating: 4.7,
    reviewCount: 89,
    lat: 9.0351,
    lng: 7.4896,
    description:
      "A private multi-specialty hospital known for **orthopedic care**, emergency support, and diagnostics.",
    reviews: [
      { user: "Tomi", rating: 5, text: "Clean wards and professional doctors.", status: "approved" }
    ]
  },
  {
    id: "uch-ibadan",
    name: "University College Hospital",
    city: "Ibadan",
    lga: "Ibadan North",
    address: "Queen Elizabeth Road, Ibadan, Oyo",
    phone: "+234 805 500 1234",
    email: "contact@uch.example",
    ownership: "public",
    specialties: ["Dental", "Pediatric", "Oncology"],
    visitingHours: "Mon-Fri, 10:00 AM - 4:00 PM",
    rating: 4.5,
    reviewCount: 214,
    lat: 7.4035,
    lng: 3.9001,
    description:
      "Teaching hospital offering specialist clinics, including **dental**, pediatric, oncology, and outpatient care.",
    reviews: [
      { user: "Ife", rating: 4, text: "Specialist clinic was organized.", status: "approved" }
    ]
  },
  {
    id: "st-nicholas",
    name: "St. Nicholas Hospital",
    city: "Lagos",
    lga: "Eti-Osa",
    address: "57 Campbell Street, Lagos",
    phone: "+234 803 525 1295",
    email: "hello@stnicholas.example",
    ownership: "private",
    specialties: ["Cardiology", "Dental", "Diagnostics"],
    visitingHours: "Mon-Sun, 9:00 AM - 7:00 PM",
    rating: 4.6,
    reviewCount: 76,
    lat: 6.4478,
    lng: 3.4219,
    description:
      "Private hospital with diagnostics, cardiac checks, and outpatient services. Markdown notes can include **important alerts**.",
    reviews: [
      { user: "Bola", rating: 5, text: "Fast lab turnaround.", status: "approved" }
    ]
  },
  {
    id: "aminu-kano",
    name: "Aminu Kano Teaching Hospital",
    city: "Kano",
    lga: "Tarauni",
    address: "Zaria Road, Kano",
    phone: "+234 806 700 2233",
    email: "support@akth.example",
    ownership: "public",
    specialties: ["Emergency", "Maternity", "Surgery"],
    visitingHours: "Mon-Sun, 8:30 AM - 5:30 PM",
    rating: 4.2,
    reviewCount: 155,
    lat: 11.987,
    lng: 8.5189,
    description:
      "Large teaching hospital serving Kano and neighboring states with emergency and maternity units.",
    reviews: [
      { user: "Zainab", rating: 4, text: "Good maternity staff support.", status: "approved" }
    ]
  },
  {
    id: "rivers-teaching",
    name: "Rivers State University Teaching Hospital",
    city: "Port Harcourt",
    lga: "Port Harcourt",
    address: "Harley Street, Old GRA, Port Harcourt",
    phone: "+234 805 310 4490",
    email: "frontdesk@rsuth.example",
    ownership: "public",
    specialties: ["Pediatric", "Emergency", "Diagnostics"],
    visitingHours: "Mon-Fri, 8:00 AM - 5:00 PM",
    rating: 4.1,
    reviewCount: 102,
    lat: 4.8156,
    lng: 7.0498,
    description:
      "Public teaching hospital with emergency care, diagnostics, and pediatric services in Port Harcourt.",
    reviews: [
      { user: "Nimi", rating: 4, text: "Helpful pediatric unit.", status: "approved" }
    ]
  }
];

export const csvColumns = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "specialties", label: "Specialties" },
  { key: "rating", label: "Rating" }
];
