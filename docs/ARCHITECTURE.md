# Architecture

This document describes the architecture of the **freebusy-site** frontend. It explains how the UI is structured, how data flows from the Freebusy API to the calendar grid, and which modules own the key time and timezone semantics. Use this as a map when making changes, debugging issues, or onboarding new contributors.

## Scope and boundaries

This section clarifies what this repository is responsible for and what it is not. Keeping these boundaries explicit prevents “frontend fixes” that actually belong in the backend service. When filing issues or planning work, validate that the change is in scope.

- **In scope:** React + Vite frontend that renders a free/busy calendar view.
- **Out of scope:** The Freebusy API service that produces the normalized JSON payload.
- **Primary interface:** The Freebusy API response described in `docs/openapi.yaml`.

## Repository layout

This section explains where the important pieces live so you can navigate quickly. The npm package root is nested under `src/`, and the application code is under `src/src/`. The repo root contains top-level docs and badges.

- **Package root:** `src/` (contains `package.json`, Vite config, and build scripts).
- **App code:** `src/src/` (React components, hooks, and shared libs).
- **API contract:** `docs/openapi.yaml` (schema and time semantics).
- **Static assets:** `src/public/` (served by Vite; includes `/.well-known/security.txt`).

## Runtime model (time semantics)

This section is the most important correctness contract in the frontend. The UI is built around **owner-days** and must not “shift” day columns when a viewer changes their display timezone. If you change date math, add tests and confirm these rules still hold.

- **Owner-days are authoritative:** Day columns come from `window.startDate` → `window.endDateInclusive` and are anchored to `calendar.timeZone`.
- **Viewer timezone is display-only:** Switching viewer timezone affects hour labels and vertical placement, but must not change which day columns exist.
- **Busy intervals are UTC instants:** Treat busy ranges as half-open intervals $[startUtc, endUtc)$ and clip them per owner-day.
- **All-day blocks:** `kind: "allDay"` blocks the entire owner-day.

Implementation references:

- **Owner-day generation and DTOs:** `src/src/hooks/freebusy-utils.ts`.
- **TZ-safe helpers (IANA/DST via `Intl`):** `src/src/lib/date-utils.ts`.
- **Busy block layout and clipping:** `src/src/components/calendar-grid-utils.ts`.

## Data flow

This section walks through how data moves through the app from fetch to render. Following this path makes it easier to understand where to fix a bug (fetching, interpretation, date-window generation, clipping, or rendering). If you introduce new derived state, prefer keeping derivations in hooks or helpers.

- **Fetch and interpret:** `src/src/hooks/use-freebusy.ts` fetches from `VITE_FREEBUSY_API` and normalizes HTTP errors (disabled/rate-limited/unavailable).
- **Parse and derive:** `src/src/hooks/freebusy-utils.ts` parses busy intervals and constructs owner-day windows.
- **Render:** Calendar components render weeks and day columns; busy blocks are clipped and positioned using helper utilities.

## Key modules

This section lists the “owners” of the main responsibilities in the codebase. Changes should generally stay within these boundaries so that logic is testable and rendering stays straightforward. If a module boundary is unclear, keep the simplest structure consistent with existing patterns.

- **App entry and top-level state:** `src/src/App.tsx`.
- **Availability fetching and refresh:** `src/src/hooks/use-freebusy.ts`.
- **Owner-day and busy parsing:** `src/src/hooks/freebusy-utils.ts`.
- **Calendar grid rendering:** `src/src/components/CalendarGrid.tsx`.
- **Week layout container:** `src/src/components/WeekSection.tsx`.
- **Export text generation:** `src/src/lib/availability-export.ts`.

## Configuration

This section documents configuration inputs that affect runtime behavior. Keep configuration minimal and explicit so that deployments are predictable. If you add new configuration, document it here and in the README.

- **API endpoint:** `VITE_FREEBUSY_API` (defaults to `http://localhost:8787/freebusy`).
- **Build output:** Vite outputs to `src/dist` when building in the `src/` package.

## Deployment architecture

This section describes how the frontend is built and deployed. The deployed site is static content produced by Vite. The runtime dependency is the Freebusy API endpoint configured via environment variables.

- **Build system:** Vite (configuration in `src/vite.config.ts`).
- **Hosting:** Cloudflare Pages (configured to deploy from the `src/` subdirectory).
- **Runtime integration:** Calls the Freebusy API over HTTPS; the API is a separate service.

## Security and reporting

This section documents how security communications are intended to work for the frontend. It is not a replacement for the security policy; it is an architectural note about where the security-related artifacts live. If you change security reporting channels, update all of these references together.

- **Security policy:** `SECURITY.md`.
- **Vulnerability reporting:** Prefer GitHub Security Advisories; email is an alternative.
- **security.txt:** Published at `/.well-known/security.txt` from `src/public/.well-known/security.txt`.
