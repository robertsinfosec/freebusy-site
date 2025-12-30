# robertsinfosec Free/Busy Calendar

A professional free/busy calendar viewer.

It consumes the **Freebusy API** (separate service) which normalizes a private iCal feed into a minimal JSON payload safe for a public availability UI.

![coverage](badges/coverage.svg) ![tests](badges/tests.svg)

## What this repo contains

This section explains the repository boundaries so you know what you are changing. The backend service is a separate project; this repo is the frontend only. If you are debugging time semantics, start with the API contract and the helper modules listed below.

- **Frontend:** React + Vite app under `src/` (npm package) and `src/src/` (app code).
- **API contract:** `docs/openapi.yaml` documents the backend response schema and time semantics.

## Key time semantics (read this before changing date logic)

This section is the “correctness contract” for the UI. These rules are easy to violate accidentally and can produce subtle off-by-one-day errors. If you change anything related to dates, time zones, or clipping, confirm these semantics still hold.

- **Owner-days:** Day columns come from `window.startDate` → `window.endDateInclusive` and are anchored to `calendar.timeZone`.
- **Viewer timezone:** Switching viewer TZ changes hour labels and vertical placement, but must not change which day columns exist.
- **Busy intervals:** `busy[].startUtc` is inclusive and `busy[].endUtc` is exclusive; rendering clips intervals to each owner-day.
- **All-day blocks:** `kind: "allDay"` blocks the entire owner-day.

Implementation references:

- **Owner-day generation/parsing:** `src/src/hooks/freebusy-utils.ts`
- **TZ-safe helpers (IANA/DST via `Intl`):** `src/src/lib/date-utils.ts`
- **Busy block layout and clipping:** `src/src/components/calendar-grid-utils.ts`

## Local development

This section shows the standard dev loop for the frontend. Run commands from the repository root, but change into the `src/` package directory first. If the UI cannot load data, confirm your `VITE_FREEBUSY_API` environment variable.

```bash
cd src
npm install
cp .env.example .env.local
npm run dev
```

Environment:

- **VITE_FREEBUSY_API:** Defaults to `http://localhost:8787/freebusy`.

## Testing

This section describes how tests run in this repo and why they matter for CI hygiene. The test wrapper also updates committed badges. If you change logic, run tests locally before opening a PR.

This repo wraps Vitest so test runs also update committed badges.

```bash
cd src
npm test
npm run test:coverage
```

Notes:

- **Badges:** Committed in `badges/` at the repo root.
- **Coverage output:** Emitted to `src/coverage/`.

## Deployment (Cloudflare Pages)

This section documents the expected Cloudflare Pages build settings. The deploy target is the `src/` subdirectory and Vite emits output to `dist`. Configure `VITE_FREEBUSY_API` to point at your deployed backend.

Build settings:

- **Root directory:** `src`
- **Build command:** `npm run build`
- **Output directory:** `dist`

Set `VITE_FREEBUSY_API` to your deployed Freebusy API endpoint.

## Contributing / community

This section points to the project’s community and contribution policies. If you are opening an issue or PR, read the contributing guide first. Security issues should be reported privately.


- **Code of Conduct:** See `CODE_OF_CONDUCT.md`.
- **Contributing guide:** See `CONTRIBUTING.md`.
- **Security policy:** See `SECURITY.md`.

### Issues and security

This section summarizes the preferred channels for product feedback and vulnerability reports. Using the standard issue templates helps maintainers reproduce problems quickly. Vulnerabilities should not be disclosed publicly.

- **Issues:** Please use the GitHub Issue templates when opening issues.
- **Vulnerabilities:** Report privately via GitHub Security Advisories (preferred) or `security@robertsinfosec.com`.
- **security.txt:** Published at `/.well-known/security.txt`.

## License

MIT — see `LICENSE`.
