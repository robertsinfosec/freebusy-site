# Style Guide

This document defines the coding standards and best practices for the freebusy-site project.

This repo prefers simple, explicit code with **correct time semantics**. The goal of this guide is to keep changes consistent across contributors and to avoid subtle timezone regressions. When in doubt, optimize for clarity over cleverness.

## Table of Contents

- [General Principles](#general-principles)
- [Project Structure](#project-structure)
- [TypeScript / React](#typescript--react)
- [Timezone and Date Handling](#timezone-and-date-handling-do-not-improvise)
- [UI / Tailwind](#ui--tailwind)
- [Testing](#testing)
- [Markdown Documentation Standards](#markdown-documentation-standards)
- [Git Workflow](#git-workflow)

## General Principles

Core quality standards for all contributions:

- **Zero tolerance for technical debt** - Refactor as you go
- **No shortcuts** - Do it right the first time
- **Test everything** - Target 80% coverage (goal, not gate)
- **Document everything** - Code is read more than written
- **Review everything** - No code merges without review

### Best Practices

Core development practices to follow:

- **DRY (Don't Repeat Yourself)** - Extract common logic
- **SOLID principles** - Single responsibility, Open/closed, etc.
- **KISS (Keep It Simple)** - Simplest solution that works
- **YAGNI (You Aren't Gonna Need It)** - Don't over-engineer

## Project Structure

This project follows the GitHub Folder Structure standard to maintain clean separation between documentation and source code.

### Directory Layout

```
Root: GitHub metadata and documentation ONLY
├── README.md              # Project overview
├── CONTRIBUTING.md        # Contribution guidelines
├── STYLE_GUIDE.md        # This file
├── SECURITY.md           # Security policy
├── CODE_OF_CONDUCT.md    # Code of conduct
├── LICENSE               # License text
├── .gitignore            # Git ignore patterns
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   ├── PRD.md
│   ├── RUNBOOK.md
│   ├── openapi.yaml
│   └── threatmodel/
└── .github/              # GitHub configuration
    ├── copilot-instructions.md
    └── workflows/        # CI/CD workflows

src/                      # ALL source code and configuration
├── package.json          # Dependencies
├── vite.config.ts        # Build config
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind config
├── wrangler.jsonc        # Cloudflare config
├── public/               # Static assets
├── scripts/              # Build/test scripts
└── src/                  # Application code
    ├── components/       # React components
    ├── hooks/            # Custom hooks
    ├── lib/              # Utilities
    └── test/             # Test utilities
```

> [!IMPORTANT]
> **Never put source code or configuration files in the repo root.** All code, configs, and build artifacts belong in `src/`. The root should only contain documentation and GitHub metadata.

### File Naming

Naming conventions for different file types:

- **TypeScript/React**: PascalCase for components (`AppHeader.tsx`), kebab-case for utilities (`date-utils.ts`)
- **Test files**: `*.test.ts` or `*.test.tsx` (e.g., `use-freebusy.test.tsx`)
- **Documentation**: `UPPERCASE.md` for root-level docs, `Title_Case.md` or descriptive names for docs/
- **Configuration**: Lowercase with extension (e.g., `tsconfig.json`, `vite.config.ts`)

## TypeScript / React

This section describes the expected architecture boundaries in the frontend. Keeping types, derivations, and rendering responsibilities separated makes it easier to reason about time semantics and to write tests. Try to follow the existing patterns before introducing new abstractions.

### Architecture Principles

- **Types:** Use TypeScript types close to the API DTOs in `src/src/hooks/freebusy-utils.ts`.
- **Separation of concerns:** Keep rendering components mostly "dumb"; do parsing and derivation in hooks and helpers.
- **Type safety:** All function signatures must include type hints for parameters and return values.
- **No `any`:** Avoid `any` types; use `unknown` if type is truly indeterminate, then narrow it.

### Code Organization

Write focused components and functions with single responsibilities.

#### Good Example

```typescript
// Good - Single responsibility, clear types
function validateTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
```

#### Bad Example

```typescript
// Bad - Too long, multiple responsibilities, loose types
function processEverything(data: any) {  // ❌
  // Parse data
  // Validate data
  // Transform data
  // Render UI
  // ... 100+ lines
}
```

### Imports

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

Use specific error types and provide meaningful error messages.

```typescript
// Good - Specific error handling
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Network error:', error);
  } else {
    console.error('Unexpected error:', error);
  }
  throw error;
}

// Bad - Silent failures
try {
  await fetch(url);
} catch {  // ❌ Never swallow errors silently
  return null;
}
```

### Comments and Documentation

Explain WHY, not WHAT:

```typescript
// Good - Explain WHY, not WHAT
// Use UTC to avoid timezone issues when comparing across owners
const nowUtc = new Date().toISOString();

// Skip intervals already processed to avoid duplicate renders
if (processedIds.has(interval.id)) {
  continue;
}

// Bad - Stating the obvious
// Increment counter
counter += 1;  // ❌ The code already says this
```

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
- **Date constructor abuse:** Avoid `new Date()` without explicit timezone handling.
- **String parsing:** Avoid parsing date strings without specifying format and timezone.

## UI / Tailwind

This section sets expectations for styling changes and keeps the UI consistent with the existing theme system. The goal is to avoid “one-off” colors that drift over time. Use semantic classes so the app stays readable in both light and dark themes.

- **Tokens:** Prefer semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- **Colors:** Don’t introduce new hard-coded colors unless the existing theme primitives can’t express it.

## Testing

This section documents the expected level of test coverage for changes. Keeping tests green matters for CI hygiene. When adding new behavior, add a unit test close to the helper or hook where the logic lives.

### Framework and Tools

- **Framework:** Unit tests use Vitest + Testing Library.
- **Focus:** Prefer testing pure helpers (date math, clipping, formatting) over deeply testing Radix internals.
- **Coverage:** Run `cd src && npm run test:coverage` before submitting changes.

### Coverage Requirements

- **Target:** 80% coverage for all new code (goal, not a gate)
- **Integration:** We use Codecov for coverage reporting
- **Test both paths:** Test both success and failure cases
- **Mock external dependencies:** Mock API calls, timers, and other external dependencies

### Test Structure

Organize tests into descriptive `describe` blocks:

```typescript
import { describe, it, expect } from 'vitest';
import { parseOwnerDay } from './date-utils';

describe('parseOwnerDay', () => {
  it('parses ISO date string correctly', () => {
    const result = parseOwnerDay('2024-03-15', 'America/New_York');
    expect(result).toEqual({
      year: 2024,
      month: 3,
      day: 15,
    });
  });

  it('throws on invalid date format', () => {
    expect(() => parseOwnerDay('invalid', 'UTC')).toThrow();
  });

  it('handles DST transitions correctly', () => {
    // Test DST spring forward
    const result = parseOwnerDay('2024-03-10', 'America/New_York');
    expect(result).toBeDefined();
  });
});
```

### What to Test

Focus testing effort on:

- **Pure functions:** Date utilities, formatters, clippers
- **Hooks:** Custom React hooks with state management
- **Business logic:** Availability calculations, time window generation
- **Edge cases:** DST transitions, timezone boundaries, empty states

Avoid over-testing:

- **Third-party components:** Don't test Radix/Shadcn internals
- **Trivial code:** Simple getters/setters without logic

## Markdown Documentation Standards

All markdown files in this repository must follow professional formatting standards for consistency and proper rendering.

### Required Practices

These are not stylistic preferences but rendering requirements for GitHub-Flavored Markdown.

#### Use Real Headers

Never simulate section headers with bold text. Use proper markdown headers.

**Correct:**

```markdown
#### Benefits

The following advantages apply:
```

**Incorrect:**

```markdown
**Benefits:**

- List items...
```

> [!IMPORTANT]
> **Rule - Real Headers:** If content is important enough to stand out, it deserves a real header (`####`), not bolded text.

#### Section Descriptions Required

Every section header must have at least one sentence explaining what the section contains.

**Correct:**

```markdown
### Configuration Options

The following environment variables control application behavior.

| Variable | Description |
```

**Incorrect:**

```markdown
### Configuration Options

| Variable | Description |
```

> [!IMPORTANT]
> **Rule - Context First:** Readers need context before diving into details. Every header must have explanatory text.

#### Blank Lines Everywhere

All markdown elements MUST have blank lines above and below them for proper rendering.

**Elements requiring blank lines:**

- Headings
- Code blocks
- Lists
- Tables
- Block quotes
- Admonitions

**Correct:**

```markdown
This is a paragraph.

#### Heading

This is another paragraph.

```bash
code here
```

More text here.
```

**Incorrect:**

```markdown
This is a paragraph.
#### Heading
More text with no spacing.
```

> [!IMPORTANT]
> **Rule - Blank Lines:** GitHub-Flavored Markdown requires blank lines above and below all structural elements for proper rendering.

#### No Horizontal Rules

Do NOT use `---` horizontal rules in documentation. Section headers already create visual separation when rendered.

**Correct:**

```markdown
## Section One

Content here.

## Section Two

More content.
```

**Incorrect:**

```markdown
## Section One

Content here.

---

## Section Two
```

> [!IMPORTANT]
> **Rule - No HRs:** Headers provide sufficient visual separation. Horizontal rules create double lines and visual clutter.

#### No Emoji in Headers

Do NOT use emoji in section headers for professional appearance.

**Correct:**

```markdown
### Production Ready

Built for reliable operation in production environments.
```

**Incorrect:**

```markdown
### 🚀 Production Ready
```

> [!IMPORTANT]
> **Rule - No Emoji:** Professional documentation avoids decorative emoji in structural elements like headers.

#### List Item Descriptors

Bolded list items with colons are acceptable for describing options or examples within content.

**Correct usage:**

```markdown
- **Required:** TMDb API key for authentication
- **Optional:** Max video height (default: 1080p)
```

> [!NOTE]
> **Exception:** Bolded descriptors in lists (like `**Required:**`) are content labels, not section headers, and are acceptable.

#### GitHub Admonitions

Use GitHub-Flavored Markdown admonitions to highlight important information without breaking document flow.

**Available types:**

```markdown
> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to know.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Advises about risks or negative outcomes.
```

> [!TIP]
> **Best Practice:** Use admonitions to emphasize rules, warnings, or key concepts without adding extra headers.

## Git Workflow

Follow these standards for commits and branches to maintain clean repository history.

### Commit Messages

Format all commit messages consistently:

```
type: Short description (50 chars max)

Longer explanation if needed (wrap at 72 chars).
Explain WHY the change was made, not what was changed
(the diff shows what changed).

- Bullet points are okay
- Reference issues: Fixes #123, Related to #456
```

#### Commit Types

Available commit types:

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation only
- **test:** Adding/updating tests
- **refactor:** Code restructuring (no functional changes)
- **style:** Formatting, whitespace
- **chore:** Maintenance (dependencies, CI, etc.)
- **perf:** Performance improvement

#### Commit Examples

Good commit messages:

```
feat: Add timezone selector to calendar view

Allows users to view availability in different timezones
without changing the owner-day columns. Viewer timezone
only affects hour labels and vertical placement.

Fixes #45
```

```
fix: Handle DST transitions in busy block clipping

Busy blocks spanning DST transitions were incorrectly
clipped when the transition occurred mid-block. Now uses
IANA-aware helpers for all boundary calculations.

Fixes #67
```

### Branch Naming

Use descriptive branch names with type prefixes:

```
feature/timezone-selector
fix/dst-clipping-bug
docs/update-architecture-guide
refactor/extract-date-helpers
```

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] Follows TypeScript best practices
- [ ] Has type annotations on all functions
- [ ] No `any` types without justification
- [ ] Error handling is appropriate
- [ ] No hardcoded values (use constants or config)
- [ ] Logging provides useful context
- [ ] Tests are included and pass
- [ ] Coverage is maintained or improved
- [ ] Documentation is updated
- [ ] No secrets or sensitive data
- [ ] Imports are organized properly
- [ ] Comments explain WHY, not WHAT
- [ ] Follows timezone handling rules (if applicable)
- [ ] Markdown documentation follows standards

## Questions?

When in doubt, follow this hierarchy:

1. Check this style guide
2. Look at existing code for patterns
3. Ask in PR review
4. Reference [CONTRIBUTING.md](CONTRIBUTING.md)

Remember: **Quality over speed.** Do it right the first time.
