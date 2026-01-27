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
npm test            # runs vitest via scripts/run-tests.mjs
npm run test:coverage # also produces HTML in src/coverage/
```
### Notes

- Coverage output is generated under `src/coverage/`.

## Generated files (don’t hand-edit)

- Version stamping runs automatically via `predev`/`prebuild`/`pretest`:
  - `src/public/version.txt` (fetched by the React app at runtime)

## UI / styling conventions

- UI components are Shadcn/Radix-based in `src/src/components/ui/*`.
- Tailwind v4 theme uses CSS variables (see `src/styles/theme.css`, `src/theme.json`, `src/tailwind.config.js`).
  - Prefer existing semantic classes (`bg-background`, `text-muted-foreground`, etc.).
  - Avoid introducing hard-coded colors.

## Build/deploy specifics

- Vite config (`src/vite.config.ts`) uses `@` alias → `src/src`.
- Do **not** remove Spark/Phosphor proxy plugins from Vite config (`@github/spark` integration).
- Cloudflare Pages deploys the `src/` subdirectory with output `src/dist` (see README). Wrangler config is in `src/wrangler.jsonc`.

## Code Quality Standards

Follow these standards for all code contributions.

### TypeScript Code

- **Type safety required** - All function signatures must include type hints for parameters and return values
- **No `any` types** - Use `unknown` if type is truly indeterminate, then narrow it
- **Separation of concerns** - Keep components focused; extract logic to hooks and utilities
- **No technical debt** - Refactor as you go, never leave TODO comments without GitHub issues
- **Target 80% test coverage** - Write tests for all new code (goal, not gate)

### Project Structure

This project follows the GitHub Folder Structure standard:

```
Root: GitHub metadata and documentation ONLY
  - README.md, CONTRIBUTING.md, STYLE_GUIDE.md, LICENSE, etc.
  - docs/, .github/
src/: ALL source code and configuration
  - package.json, vite.config.ts, tsconfig.json, etc.
  - src/, scripts/, public/
```

> [!IMPORTANT]
> **Never put source code or configuration files in the repo root.** All code, configs, and build artifacts belong in `src/`.

### Import Organization

Organize imports consistently:

```typescript
// 1. React and third-party libraries (alphabetical)
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

// 2. Internal components and hooks
import { CalendarGrid } from '@/components/CalendarGrid';
import { useFreeBusy } from '@/hooks/use-freebusy';

// 3. Utilities and types
import { parseOwnerDay } from '@/lib/date-utils';
import type { FreeBusyResponse } from '@/hooks/freebusy-utils';
```

### Error Handling

- Use specific error types, never `try/catch` without handling
- Provide helpful error messages with context
- Never silently swallow errors
- Log errors at appropriate level

### Testing

- Place tests alongside source files (`*.test.ts`, `*.test.tsx`)
- Use Vitest with fixtures from test setup
- Mock external dependencies (API calls, timers)
- Test both success and failure cases
- Use descriptive test names: `test('handles DST transitions correctly')`

### Code Organization

- Write focused functions with single responsibilities
- Functions should be < 50 lines when possible
- Extract complex logic into well-named helper functions
- Prefer composition over complex conditionals

## Common Patterns

Use these established patterns from the codebase.

### Timezone-Safe Date Handling

```typescript
// Always use IANA timezone helpers
import { parseOwnerDay, formatInTimeZone } from '@/lib/date-utils';

// Good - IANA-aware
const ownerDay = parseOwnerDay(dateStr, calendar.timeZone);

// Bad - Timezone-naive
const date = new Date(dateStr); // ❌
```

### React Hook Pattern

```typescript
export function useCustomHook() {
  const [state, setState] = useState<StateType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Effect logic
  }, [/* dependencies */]);

  return { state, error };
}
```

### Error Boundary Pattern

```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('Failed to fetch:', error);
  throw error; // Re-throw for caller to handle
}
```

## What NOT to Do

Avoid these common mistakes:

- ❌ Don't put source code or config files in repo root
- ❌ Don't use `any` types without strong justification
- ❌ Don't hardcode paths - use Path aliases (`@/`) and configuration
- ❌ Don't ignore errors - handle or propagate them
- ❌ Don't leave commented-out code
- ❌ Don't use `new Date()` without explicit timezone handling
- ❌ Don't exceed 100 characters per line (prefer 80)
- ❌ Don't silently fail - log errors with context
- ❌ Don't convert owner-day boundaries using viewer timezone

## Markdown Documentation Standards

All markdown files must follow professional formatting standards.

### Required Practices

1. **Use real headers, not bold text** - Never use `**Header:**` as a simulated section header. Use proper `####` markdown headers instead.
2. **Add section descriptions** - Every header needs at least one sentence explaining what the section contains.
3. **Blank lines everywhere** - All headings, code blocks, lists, and tables MUST have blank lines above and below.
4. **No horizontal rules** - Never use `---` separators. Headers provide sufficient visual separation.
5. **No emoji in headers** - Keep section headers professional without decorative emoji.
6. **Use GitHub admonitions** - For callouts, use `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, etc.

### Examples

**CORRECT:**

```markdown
### Configuration Options

The following environment variables control behavior.

| Variable | Description |
```

**INCORRECT:**

```markdown
### Configuration Options
---
**Environment Variables:**
```

See [STYLE_GUIDE.md](../STYLE_GUIDE.md) for complete documentation standards.

## Git Commit Messages

Format all commits consistently:

```
type: Short description (50 chars max)

Longer explanation if needed (wrap at 72 chars).
- Bullet points okay
- Reference issues: Fixes #123
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`, `perf`

**Examples:**

```
feat: Add timezone selector to calendar view

Allows users to view availability in different timezones
without changing owner-day columns.

Fixes #45
```

```
fix: Handle DST transitions in busy block clipping

Busy blocks spanning DST transitions were incorrectly
clipped. Now uses IANA-aware helpers for boundaries.

Fixes #67
```

## When Suggesting Changes

Follow this checklist when making code suggestions:

1. **Read existing code first** - Understand current patterns
2. **Follow existing style** - Match what's already there
3. **Test your suggestions** - Provide test cases when appropriate
4. **Update documentation** - Keep docs in sync with code
5. **Consider edge cases** - Handle timezone boundaries, DST, empty states
6. **Remember `src/` structure** - All code/config goes in src/, not root
7. **Think about time semantics** - Owner-day vs viewer-timezone logic
8. **Preserve type safety** - Don't introduce `any` types

## Repository Philosophy

Core principles guiding this project:

- **GitHub-first** - Follow GitHub conventions and standards
- **Quality over speed** - Take time to do it right
- **No technical debt** - Refactor as you go
- **Test everything** - No untested code in production
- **Document everything** - Code is read more than written
- **Correctness first** - Timezone semantics are not negotiable

## Helpful Resources

- **Project README** - See [README.md](../README.md)
- **Style Guide** - See [STYLE_GUIDE.md](../STYLE_GUIDE.md)
- **Architecture** - See [docs/dev/ARCHITECTURE.md](../docs/dev/ARCHITECTURE.md)
- **API Contract** - See [docs/openapi.yaml](../docs/openapi.yaml)
- **TypeScript** - https://www.typescriptlang.org/docs/
- **Vitest** - https://vitest.dev/
- **Testing Library** - https://testing-library.com/
