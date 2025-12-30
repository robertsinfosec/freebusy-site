# Contributing

Thanks for contributing! This repository is the **frontend** for the robertsinfosec free/busy calendar viewer.

## Repository layout

This section explains where the important pieces live so you can navigate quickly. The npm package root is nested under `src/`, and most application code is under `src/src/`. If you are making time-related changes, you will also want to review the API contract.

- **App package root:** `src/` (this is where `package.json` lives).
- **App code:** `src/src/`.
- **API contract and time semantics:** `docs/openapi.yaml`.

## Development setup

This section describes the minimal setup needed to run the frontend locally. If you are working on UI behavior, prefer running the dev server and iterating on a single feature at a time. Keep `.env.local` out of commits.

```bash
cd src
npm install
cp .env.example .env.local
npm run dev
```

Environment:

- **VITE_FREEBUSY_API:** Defaults to `http://localhost:8787/freebusy`.

## Tests and coverage

This section explains the test workflow and how coverage artifacts are produced. The repo wraps Vitest so running tests also updates committed badges. Run these commands before submitting changes that affect behavior.

This repo wraps Vitest so running tests also updates committed badges.

```bash
cd src
npm test
npm run test:coverage
```


- **Badges:** Live in `badges/` at the repo root.
- **Coverage output:** Coverage HTML is emitted to `src/coverage/`.

## Project-specific conventions

This section captures the project’s most important conventions. The time and timezone model is core to correctness, so treat these rules as constraints rather than guidelines. If you are unsure, add a test and ask for review.

### Time semantics (critical)

This subsection describes the rules that determine which day columns exist and how busy intervals are clipped. Many bugs in calendar UIs come from mixing “viewer time” with “owner time.” Keep the model consistent with these bullet points.


- **Owner-days:** Day columns are anchored to `calendar.timeZone` and the API’s `window.startDate` → `window.endDateInclusive`.
- **Viewer timezone:** Display-only; switching viewer TZ must not change which day columns exist.
- **Busy intervals:** Treat as half-open `[startUtc, endUtc)`.

Prefer existing helpers:

- **Date helpers:** `src/src/lib/date-utils.ts`.
- **Owner-day logic and DTOs:** `src/src/hooks/freebusy-utils.ts`.
- **Layout and clipping:** `src/src/components/calendar-grid-utils.ts`.

### UI styling

This subsection documents how styling is expected to work in the repo. The UI is built on Shadcn/Radix and Tailwind theme tokens. Prefer existing primitives so the app remains consistent in light and dark modes.


- **Components:** Use existing Shadcn/Radix components in `src/src/components/ui/*`.
- **Theme system:** Tailwind v4 theme is CSS-variable based (`src/styles/theme.css`, `src/theme.json`).
- **Classes:** Prefer semantic classes (`bg-background`, `text-muted-foreground`, etc.) over hard-coded colors.

## Pull requests

This section describes what we expect in a PR. Keep changes focused, include tests for behavior changes, and update docs when user-facing behavior or configuration changes. If you are touching time semantics, call it out explicitly in the PR description.

- Keep PRs focused and small when possible.
- Update or add unit tests for behavior changes.
- If you change API semantics, ensure `docs/openapi.yaml` and the UI stay in sync.

This repo uses a standard PR template:
- `.github/pull_request_template.md`

## Issues

This section explains how to file issues so they are actionable. The issue templates prompt for the details we typically need to reproduce problems. If you are unsure whether a report is security-sensitive, do not open a public issue.

When opening an issue, please use the standard GitHub Issue templates:
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/documentation.yml`
- `.github/ISSUE_TEMPLATE/question.yml`

These templates help ensure we get the details needed to reproduce and fix issues quickly.

Note: blank issues are disabled to keep reports consistent.

## Reporting security issues

This section points you to the private vulnerability reporting channels. Do not disclose security issues publicly in GitHub issues or discussions. Use the security policy document for guidance on what to include.

See `SECURITY.md`.
