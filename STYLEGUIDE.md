# Style Guide

This repo prefers simple, explicit code with **correct time semantics**. The goal of this guide is to keep changes consistent across contributors and to avoid subtle timezone regressions. When in doubt, optimize for clarity over cleverness.

## TypeScript / React

This section describes the expected architecture boundaries in the frontend. Keeping types, derivations, and rendering responsibilities separated makes it easier to reason about time semantics and to write tests. Try to follow the existing patterns before introducing new abstractions.

- **Types:** Use TypeScript types close to the API DTOs in `src/src/hooks/freebusy-utils.ts`.
- **Separation of concerns:** Keep rendering components mostly “dumb”; do parsing and derivation in hooks and helpers.

## Timezone and date handling (do not improvise)

This section captures the most important correctness constraints in the product. Timezone logic is easy to get subtly wrong, especially around DST transitions and “owner-day” boundaries. If you need new date logic, add it near existing helpers and cover it with tests.

- **Owner-days:** Day columns are **owner-days** anchored to `calendar.timeZone`.
- **Viewer timezone:** Viewer timezone affects only labels and vertical placement.
- **Helpers:** Use the existing timezone-safe helpers:
  - `src/src/lib/date-utils.ts`
  - `src/src/hooks/freebusy-utils.ts`
  - `src/src/components/calendar-grid-utils.ts`

### Avoid

This subsection lists common mistakes that lead to incorrect rendering or date-window bugs. These are not stylistic preferences; they are correctness constraints. If you find existing code doing any of the following, treat it as a bug.

- **Hard-coded offsets:** Avoid hard-coded offsets (e.g., `-0500`) instead of IANA time zones.
- **Boundary conversion:** Avoid converting owner-day boundaries using the viewer timezone.

## UI / Tailwind

This section sets expectations for styling changes and keeps the UI consistent with the existing theme system. The goal is to avoid “one-off” colors that drift over time. Use semantic classes so the app stays readable in both light and dark themes.

- **Tokens:** Prefer semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- **Colors:** Don’t introduce new hard-coded colors unless the existing theme primitives can’t express it.

## Testing

This section documents the expected level of test coverage for changes. The repository’s test wrapper also updates committed badges, so keeping tests green matters for CI hygiene. When adding new behavior, add a unit test close to the helper or hook where the logic lives.

- **Framework:** Unit tests use Vitest + Testing Library.
- **Focus:** Prefer testing pure helpers (date math, clipping, formatting) over deeply testing Radix internals.
- **Coverage:** Run `cd src && npm run test:coverage` before submitting changes.
