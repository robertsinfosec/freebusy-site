# robertsinfosec Free/Busy Calendar

A professional free/busy calendar viewer.

It consumes the **Freebusy API** (separate service) which normalizes a private iCal feed into a minimal JSON payload safe for a public availability UI.

![coverage](badges/coverage.svg) ![tests](badges/tests.svg)

## What this repo contains

- **Frontend only**: React + Vite app under `src/` (npm package) and `src/src/` (app code).
- **API contract**: `docs/openapi.yaml` documents the backend response schema and time semantics.

## Key time semantics (read this before changing date logic)

- **Owner-days are authoritative**: day columns come from `window.startDate` → `window.endDateInclusive` and are anchored to `calendar.timeZone`.
- **Viewer timezone is display-only**: switching viewer TZ changes hour labels + vertical placement, but must not change which day columns exist.
- **Busy intervals are UTC instants**: `busy[].startUtc` is inclusive and `busy[].endUtc` is exclusive; rendering clips intervals to each owner-day.
- **All-day blocks**: `kind: "allDay"` blocks the entire owner-day.

Implementation references:
- Day generation/parsing: `src/src/hooks/freebusy-utils.ts`
- TZ-safe helpers (IANA/DST via `Intl`): `src/src/lib/date-utils.ts`
- Busy block layout + clipping: `src/src/components/calendar-grid-utils.ts`

## Local development

```bash
cd src
npm install
cp .env.example .env.local
npm run dev
```

Environment:
- `VITE_FREEBUSY_API` (defaults to `http://localhost:8787/freebusy`)

## Testing

This repo wraps Vitest so test runs also update committed badges.

```bash
cd src
npm test
npm run test:coverage
```

Notes:
- Badges are committed in `badges/` at the repo root.
- Coverage HTML is emitted to `src/coverage/`.

## Deployment (Cloudflare Pages)

Build settings:
- Root directory: `src`
- Build command: `npm run build`
- Output directory: `dist`

Set `VITE_FREEBUSY_API` to your deployed Freebusy API endpoint.

## Contributing / community

- Code of Conduct: see `CODE_OF_CONDUCT.md`
- Contributing guide: see `CONTRIBUTING.md`
- Security policy: see `SECURITY.md`

Issues and security:
- Please use the GitHub Issue templates when opening issues.
- Please report vulnerabilities privately via GitHub Security Advisories (preferred) or `security@robertsinfosec.com`.
- `security.txt` is published at `/.well-known/security.txt`.

## License

MIT — see `LICENSE`.
