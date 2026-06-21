# Carefinder

Carefinder is a nationwide hospital directory that helps people in Nigeria find, compare, export, and share healthcare facility information. It also gives authorized administrators a registry console for maintaining hospital records, reviewing submissions, moderating reviews, uploading images, and inviting other administrators.

## Live Application

[Open Carefinder](https://care-finder-eta.vercel.app/)

## Main Features

- Search by hospital name, city, LGA, or state.
- Filter by ownership, medical service, and distance.
- Browse hospitals on a clustered Mapbox map.
- View public and private hospitals separately.
- Open hospital details, ratings, services, and contact information.
- Download filtered hospital results as CSV.
- Share selected hospitals by link or email.
- Submit hospitals for administrator review.
- Register and sign in as a public user.
- Manage hospitals, submissions, reviews, images, and administrator invitations from the Registry Console.
- Use the application on desktop, tablet, or mobile in light or dark mode.

## Registry Coverage

Carefinder currently contains **2,614 hospital records** across Nigeria's 36 states and the Federal Capital Territory:

- 996 public hospitals
- 1,618 private hospitals

The nationwide registry was prepared from the [HDX Nigeria Health Facilities dataset](https://data.humdata.org/dataset/nigeria-health-facilities), with additional curated hospital records. Ownership for imported records is classified from available facility names and categories because the source dataset does not include a dedicated ownership field.

Hospital contact details, ownership, services, and operating status should be independently confirmed before making healthcare decisions.

## Technology

- React and TypeScript
- Vite
- Tailwind CSS
- Supabase Database, Authentication, Storage, and Edge Functions
- Mapbox GL JS
- Vercel
- Vitest and Playwright

## Run Locally

Install Node.js, clone the repository, and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

## Data Import

The nationwide registry importer is available at `scripts/import-nigeria-hospitals.mjs`. It is intended for controlled administrator use and requires the appropriate Supabase service credentials in the local environment.

## Acknowledgment

Special thanks to **AltSchool Africa** for the learning, support, and community that helped make this project possible.

## Author

**Tuta Joseph Vershima**
