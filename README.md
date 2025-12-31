# robertsinfosec Free/Busy Calendar

[![CI](https://github.com/robertsinfosec/freebusy-site/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/robertsinfosec/freebusy-site/actions/workflows/ci.yml)
[![tests](https://img.shields.io/github/actions/workflow/status/robertsinfosec/freebusy-site/ci.yml?branch=main&label=tests&logo=githubactions&logoColor=white)](https://github.com/robertsinfosec/freebusy-site/actions/workflows/ci.yml)
[![coverage](https://codecov.io/gh/robertsinfosec/freebusy-site/branch/main/graph/badge.svg)](https://codecov.io/gh/robertsinfosec/freebusy-site)
[![CodeQL](https://github.com/robertsinfosec/freebusy-site/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/robertsinfosec/freebusy-site/actions/workflows/codeql.yml)
[![code scanning](https://img.shields.io/github/actions/workflow/status/robertsinfosec/freebusy-site/codeql.yml?branch=main&label=code%20scanning&logo=github&logoColor=white)](https://github.com/robertsinfosec/freebusy-site/security/code-scanning)
[![node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Frobertsinfosec%2Ffreebusy-site%2Fmain%2Fsrc%2Fpackage.json&query=%24.engines.node&label=node&logo=node.js&logoColor=white)](https://github.com/robertsinfosec/freebusy-site/blob/main/src/package.json)
[![license](https://img.shields.io/github/license/robertsinfosec/freebusy-site?label=license)](https://github.com/robertsinfosec/freebusy-site/blob/main/LICENSE)
[![release](https://img.shields.io/github/v/release/robertsinfosec/freebusy-site?display_name=tag&label=release)](https://github.com/robertsinfosec/freebusy-site/releases)
[![last commit](https://img.shields.io/github/last-commit/robertsinfosec/freebusy-site?label=last%20commit)](https://github.com/robertsinfosec/freebusy-site/commits/main)
[![issues](https://img.shields.io/github/issues/robertsinfosec/freebusy-site?label=issues)](https://github.com/robertsinfosec/freebusy-site/issues)
[![PRs](https://img.shields.io/github/issues-pr/robertsinfosec/freebusy-site?label=pull%20requests)](https://github.com/robertsinfosec/freebusy-site/pulls)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025E8C?logo=dependabot&logoColor=white)](https://github.com/robertsinfosec/freebusy-site/security/dependabot)


A professional free/busy calendar viewer.

It consumes the **Freebusy API** (separate service) which normalizes a private iCal feed into a minimal JSON payload safe for a public availability UI.

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

This section describes how tests run in this repo and why they matter for CI hygiene. If you change logic, run tests locally before opening a PR.

This repo uses Vitest.

```bash
cd src
npm test
npm run test:coverage
```

Notes:

- **Coverage output:** Emitted to `src/coverage/`.

## Deployment (Cloudflare Pages)

This section documents the expected Cloudflare Pages build settings. The deploy target is the `src/` subdirectory and Vite emits output to `dist`. Configure `VITE_FREEBUSY_API` to point at your deployed backend.

Build settings:

- **Root directory:** `src`
- **Build command:** `npm run build`
- **Output directory:** `dist`

Set `VITE_FREEBUSY_API` to your deployed Freebusy API endpoint.

## Documentation

This section points to the primary internal docs for understanding and operating the frontend. Start with the architecture doc when making structural changes or debugging time semantics. Use the runbook when something is broken and you need a practical triage checklist.

- **Architecture:** See `docs/ARCHITECTURE.md`.
- **Runbook:** See `docs/RUNBOOK.md`.

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
