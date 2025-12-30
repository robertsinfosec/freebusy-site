# Contributing

Thanks for contributing! This repository is the **frontend** for the robertsinfosec free/busy calendar viewer.

## Repository layout

- App package root: `src/` (this is where `package.json` lives)
- App code: `src/src/`
- API contract + time semantics: `docs/openapi.yaml`

## Development setup

```bash
cd src
npm install
cp .env.example .env.local
npm run dev
```

Environment:
- `VITE_FREEBUSY_API` (defaults to `http://localhost:8787/freebusy`)

## Tests and coverage

This repo wraps Vitest so running tests also updates committed badges.

```bash
cd src
npm test
npm run test:coverage
```

- Badges live in `badges/` at the repo root.
- Coverage HTML is emitted to `src/coverage/`.

## Project-specific conventions

### Time semantics (critical)

- **Owner-days are authoritative**: day columns are anchored to `calendar.timeZone` and the API’s `window.startDate` → `window.endDateInclusive`.
- **Viewer timezone is display-only**: switching viewer TZ must not change which day columns exist.
- **Busy intervals are UTC instants**: treat as half-open `[startUtc, endUtc)`.

Prefer existing helpers:
- `src/src/lib/date-utils.ts`
- `src/src/hooks/freebusy-utils.ts`
- `src/src/components/calendar-grid-utils.ts`

### UI styling

- Use existing Shadcn/Radix components in `src/src/components/ui/*`.
- Tailwind v4 theme is CSS-variable based (`src/styles/theme.css`, `src/theme.json`).
- Prefer semantic classes (`bg-background`, `text-muted-foreground`, etc.) over hard-coded colors.

## Pull requests

- Keep PRs focused and small when possible.
- Update or add unit tests for behavior changes.
- If you change API semantics, ensure `docs/openapi.yaml` and the UI stay in sync.

This repo uses a standard PR template:
- `.github/pull_request_template.md`

## Issues

When opening an issue, please use the standard GitHub Issue templates:
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/documentation.yml`
- `.github/ISSUE_TEMPLATE/question.yml`

These templates help ensure we get the details needed to reproduce and fix issues quickly.

Note: blank issues are disabled to keep reports consistent.

## Reporting security issues

See `SECURITY.md`.
