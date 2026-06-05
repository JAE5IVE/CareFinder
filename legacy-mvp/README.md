# Carefinder

Carefinder is a civic health tool for finding, exporting, and sharing Nigerian hospital information.

This first build is a runnable MVP prototype based on the project brief. It uses plain browser JavaScript so a beginner can open it immediately without installing Node packages. The product flow is intentionally close to the requested React/Supabase version, so the next step can be a clean migration to React + TypeScript.

## What Works Now

- Search hospitals by name, city, LGA, or address.
- Filter by city, specialty, ownership type, and demo radius search.
- View matching hospitals in a map-style panel and sortable card list.
- Open hospital details with address, phone, email, specialties, visiting hours, Markdown description, rating, and reviews.
- Export the current filtered results to CSV with selectable columns.
- Copy a shareable search URL with filter parameters.
- Prepare an email with a curated hospital list.
- Demo admin login for creating hospital entries and approving pending reviews.
- Local browser storage for newly added hospitals and reviews.

## Open The App

Open `index.html` in a browser.

Demo admin credentials:

```text
Email: admin@carefinder.ng
Password: demo-admin
```

## Suggested Real Stack

The brief recommends:

- React + TypeScript
- Supabase Postgres + PostGIS
- Supabase Auth and Row Level Security
- Mapbox GL JS
- PapaParse
- Resend
- React-MD-Editor
- Tailwind CSS
- Vercel

This prototype keeps those integrations represented in the user experience while avoiding setup friction for the first version.

## Next Engineering Steps

1. Create a Vite React + TypeScript app.
2. Move the current data model into Supabase using `supabase/schema.sql`.
3. Replace local filtering with Supabase queries and a PostGIS radius function.
4. Replace the map preview with Mapbox GL JS.
5. Replace the demo admin login with Supabase Auth.
6. Move email sharing from `mailto:` to a Resend-backed serverless endpoint.
7. Add Vitest, React Testing Library, and Playwright test coverage.

## Notes For A Newbie Founder

This project is best built in phases:

- Phase 1: Static prototype and product validation.
- Phase 2: Real database, auth, and admin dashboard.
- Phase 3: Mapbox radius search and public review accounts.
- Phase 4: Testing, security review, deployment, and data collection workflow.

The app in this folder is Phase 1.
