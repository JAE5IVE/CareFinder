# Carefinder

Carefinder is a civic health directory that helps Nigerians find, export, and share hospital information. It supports public hospital search plus admin tools for curating hospital entries, submissions, and reviews.

This folder contains the stronger React + TypeScript version from the ZIP, with senior-engineer cleanup applied after comparing it against the project brief.

## Current Features

- Search hospitals by name, city, LGA, or state.
- Filter by specialty, ownership, and radius.
- Interactive SVG map prototype with location/radius controls.
- Sortable hospital list and hospital detail view.
- CSV export with selectable columns.
- Shareable URL generation from active filters.
- Real Supabase client wiring with local demo fallback.
- Resend email sharing through `supabase/functions/share-hospitals`.
- Public user login through Supabase Auth when configured, demo auth otherwise.
- Admin dashboard for hospital management, review moderation, public submissions, invite-only admins, and image uploads.
- Supabase/PostGIS/RLS schema starter in `supabase/schema.sql`.
- Mapbox GL JS when `VITE_MAPBOX_ACCESS_TOKEN` is configured, SVG map fallback otherwise.
- React-MD-Editor in admin Markdown fields.

## Demo Credentials

Admin:

```text
Email: admin@carefinder.gov.ng
Password: admin123
```

Public user:

```text
Email: user@nigeria.ng
Password: user123
```

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

The brief asks for Vitest, React Testing Library, Playwright, and Supabase RLS checks. Those test files are now present.

```bash
npm run lint
npm test
npm run test:e2e
```

Implemented test starter:

- Unit tests: CSV export, distance calculation, search filters.
- Component tests: CSV export modal, auth modal, map container, hospital detail/review widget, admin dashboard.
- E2E tests: search, export CSV, share link, admin login/portal, anonymous review gate.
- RLS/schema contract tests: PostGIS, RLS enablement, admin write policies, public reads, storage policies.
- Optional live RLS integration test: set `TEST_PUBLIC_EMAIL` and `TEST_PUBLIC_PASSWORD` to verify that non-admin writes are blocked against a real Supabase project.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor or through the Supabase CLI.
3. Optionally run `supabase/seed.sql` for starter hospital data.
4. Create a public storage bucket named `hospital-images` if the SQL was not run through the CLI.
5. Add these values to `.env.local`:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_ACCESS_TOKEN=
```

6. Add Edge Function secrets:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set RESEND_FROM_EMAIL="Carefinder <carefinder@your-domain.com>"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set SUPABASE_ANON_KEY=...
supabase secrets set APP_URL=http://localhost:3000
```

7. Deploy functions:

```bash
supabase functions deploy share-hospitals
supabase functions deploy invite-admin
```

## What Still Needs Real Credentials

- Supabase URL and anon key.
- Mapbox public access token.
- Resend API key and verified sender.
- Supabase service role key for the invite-admin Edge Function.
- Actual `npm install`/build/test execution after Node/npm are available.

## Next Build Phase

1. Install Node dependencies and run lint, unit/component tests, build, and E2E tests.
2. Create the real Supabase project and apply `supabase/schema.sql`.
3. Add Supabase, Mapbox, and Resend credentials.
4. Deploy the Supabase Edge Functions.
5. Run the optional live RLS integration test against Supabase test users.
6. Fix any issues surfaced by the real toolchain and deploy to Vercel.
