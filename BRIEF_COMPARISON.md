# Carefinder Brief Comparison

I read and used the full `carefinder-project-brief.pdf` as the acceptance checklist. The brief asks for a civic health directory for Nigerians with public search/share/export flows and protected admin curation.

## My First MVP

Strengths:

- Runs immediately with no install step.
- Covers search, city/LGA matching, specialty and ownership filters.
- Includes CSV export, share URLs, email preparation, admin entry creation, review moderation, and a Supabase/PostGIS schema.
- Includes small utility tests for distance, filters, CSV, and Markdown sanitization.

Gaps:

- Not React + TypeScript.
- Uses a CSS map preview rather than Mapbox GL JS.
- Uses browser storage rather than Supabase.
- Email sharing uses `mailto:` instead of Resend.
- Admin auth is a local demo, not Supabase Auth + RLS.

## ZIP Project

Strengths:

- Better base for the actual brief because it is Vite + React + TypeScript.
- Richer user interface with directory, map, details, auth modal, admin dashboard, public submissions, review moderation, CSV modal, and share modal.
- Better seeded Nigerian hospital data and stronger UX.
- Better admin flow than my first MVP.

Gaps before my fixes:

- No Supabase schema, PostGIS function, RLS policies, or Edge Function implementation.
- No Vitest, React Testing Library, Playwright, or Supabase RLS tests.
- Resend is simulated in the UI rather than implemented through an API endpoint.
- Map is SVG-based, not Mapbox GL JS.
- CSV filename used a hardcoded date and had a filename sanitization bug.
- Review submissions were instantly approved instead of entering moderation.
- Share link used `/search` even though the app has no router configured for that path.
- README was still the generic AI Studio README.

## Fixes Applied To The ZIP Project

- Replaced the generic package name with `carefinder`.
- Added test scripts and test dependencies placeholders to `package.json`.
- Fixed CSV filename sanitization from `0-8` to `0-9`.
- Changed CSV exports to use the current date.
- Changed share URLs to reopen the current app path with readable query parameters.
- Added support for both `query/specialty` and the original `q/specialties` URL params.
- Changed new public reviews to `pending` so admins moderate them.
- Added `hidden` review status support.
- Added a Supabase/PostGIS/RLS schema in `supabase/schema.sql`.
- Replaced the generic README with Carefinder-specific project instructions.

## Recommended Path

Use the ZIP React project as the main product base, then keep borrowing the schema/test discipline from my first MVP. The ZIP gives you a better app foundation; my MVP gave you useful backend scaffolding and test thinking.

The next serious build phase should connect the React UI to Supabase, then replace the SVG map with Mapbox and the simulated email flow with a Resend-backed serverless endpoint.
