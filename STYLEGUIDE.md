# Style Guide

This repo prefers simple, explicit code with **correct time semantics**.

## TypeScript / React

- Use TypeScript types close to the API DTOs in `src/src/hooks/freebusy-utils.ts`.
- Keep rendering components mostly “dumb”; do parsing/derivation in hooks and helpers.

## Timezone and date handling (do not improvise)

- Day columns are **owner-days** anchored to `calendar.timeZone`.
- Viewer timezone affects only labels and vertical placement.
- Use the existing timezone-safe helpers:
  - `src/src/lib/date-utils.ts`
  - `src/src/hooks/freebusy-utils.ts`
  - `src/src/components/calendar-grid-utils.ts`

Avoid:
- Hard-coded offsets (e.g., `-0500`) instead of IANA TZs
- Converting owner-day boundaries using the viewer timezone

## UI / Tailwind

- Prefer semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- Don’t introduce new hard-coded colors unless the existing theme primitives can’t express it.

## Testing

- Unit tests use Vitest + Testing Library.
- Prefer testing pure helpers (date math, clipping, formatting) over deeply testing Radix internals.
- Run `cd src && npm run test:coverage` before submitting changes.
