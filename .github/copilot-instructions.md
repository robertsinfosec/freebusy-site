# Copilot instructions (freebusy-site)

## Project shape (big picture)
- This repo is the **frontend** for a free/busy calendar viewer.
- The **package root is `src/`** (that’s where `package.json` lives). The React app code is in `src/src/`.
- Data comes from the **Freebusy API** (separate service) returning normalized JSON. See `docs/openapi.yaml` for the contract and time semantics.

## Key runtime model (time semantics)
- The UI is built around **owner-days**:
  - Day columns are anchored to `calendar.timeZone` and `window.startDate` → `window.endDateInclusive` from the API.
  - Busy intervals are UTC instants (`startUtc` inclusive, `endUtc` exclusive) and are **clipped per owner-day**.
  - `kind: "allDay"` blocks the entire owner-day.
- The viewer timezone is **display-only** (hour labels + vertical placement). Do not change which day columns exist when switching viewer TZ.
- When touching timezone logic, prefer the existing helpers in:
  - `src/src/lib/date-utils.ts` (IANA/DST-safe conversions via `Intl`)
  - `src/src/hooks/freebusy-utils.ts` (owner-day generation + API DTOs)
  - `src/src/components/calendar-grid-utils.ts` (busy block layout + clipping)

## Core data flow (files to start from)
- App entry + top-level state: `src/src/App.tsx`
- Fetching/refreshing availability: `src/src/hooks/use-freebusy.ts`
  - Uses `VITE_FREEBUSY_API` (defaults to `http://localhost:8787/freebusy`)
  - Polls every 5 minutes; interprets disabled/rate-limited/unavailable states via `interpretFreeBusyHttpResult`
- Rendering grid + working-hours mapping: `src/src/components/CalendarGrid.tsx`
- Export text generation: `src/src/lib/availability-export.ts`

## Local dev / build / test (use these commands)
Run everything from the **repo root** but `cd src` first:
```bash
cd src
npm install
cp .env.example .env.local
npm run dev   # Vite on http://localhost:5000 (strict)
```

Testing is intentionally wrapped to update badges:
```bash
cd src
npm test            # runs vitest via scripts/run-tests.mjs and updates badges/tests.svg
npm run test:coverage # also produces HTML in src/coverage/ and updates badges/coverage.svg
```
Notes:
- Badges live at repo root: `badges/coverage.svg`, `badges/tests.svg` (and are committed).
- Coverage output is generated under `src/coverage/`.

## Generated files (don’t hand-edit)
- Version stamping runs automatically via `predev`/`prebuild`/`pretest`:
  - `src/src/version.generated.ts`
  - `src/public/version.txt`
  - `src/version.txt`

## UI / styling conventions
- UI components are Shadcn/Radix-based in `src/src/components/ui/*`.
- Tailwind v4 theme uses CSS variables (see `src/styles/theme.css`, `src/theme.json`, `src/tailwind.config.js`).
  - Prefer existing semantic classes (`bg-background`, `text-muted-foreground`, etc.).
  - Avoid introducing hard-coded colors.

## Build/deploy specifics
- Vite config (`src/vite.config.ts`) uses `@` alias → `src/src`.
- Do **not** remove Spark/Phosphor proxy plugins from Vite config (`@github/spark` integration).
- Cloudflare Pages deploys the `src/` subdirectory with output `src/dist` (see README). Wrangler config is in `src/wrangler.jsonc`.
