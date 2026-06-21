# Carefinder

Carefinder is a civic health directory that helps Nigerians find, export, and share hospital information. It supports public hospital search plus admin tools for curating hospital entries, submissions, and reviews.

## Current Features

- Search hospitals by name, city, LGA, or state.
- Filter by specialty, ownership, and radius.
- Interactive map with location and radius controls.
- Sortable hospital list and hospital detail view.
- CSV export with selectable columns.
- Shareable URL generation from active filters.
- Email sharing.
- Citizen and admin authentication.
- Admin dashboard for hospital management, review moderation, public submissions, invite-only admins, and image uploads.
- Mapbox GL JS when `VITE_MAPBOX_ACCESS_TOKEN` is configured, SVG map fallback otherwise.
- React-MD-Editor in admin Markdown fields.
- Nationwide registry coverage with 2,611 hospital-like facilities across all 37 states/FCT.

## Run Locally

Prerequisite: Node.js.

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Test Commands

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

## Nationwide Hospital Import

Carefinder currently includes 2,611 hospital-like registry records across Nigeria's 36 states and the FCT, sourced from the [HDX Nigeria Health Facilities dataset](https://data.humdata.org/dataset/nigeria-health-facilities).

The source does not provide a dedicated ownership field. Carefinder groups records into public or private using transparent facility-name and category signals. Registry contact details, ownership, services, and current operating status should be independently verified before relying on them for care decisions.
