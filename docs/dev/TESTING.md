# Testing Guide

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Setup](SETUP.md) | [Architecture](ARCHITECTURE.md) | [Codecov](CODECOV.md)

Complete guide for writing and running tests in freebusy-site.

## Table of Contents

- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Code Coverage](#code-coverage)
- [Test Organization](#test-organization)
- [Best Practices](#best-practices)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## Running Tests

How to run tests locally and in CI.

### Quick Test Run

```bash
cd src/
npm test
```

### With Coverage

```bash
cd src/
npm run test:coverage
```

### Generate HTML Coverage Report

```bash
cd src/
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Run Specific Tests

```bash
# Single test file
npm test use-freebusy.test

# Tests matching pattern
npm test -- --grep "timezone"

# Watch mode (re-run on changes)
npm test -- --watch

# Verbose output
npm test -- --reporter=verbose

# Show console.log output
npm test -- --reporter=verbose
```

### Using npm Scripts

Available test scripts in `package.json`:

```bash
cd src/

# Run all tests
npm test

# With coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

## Writing Tests

How to structure and write effective tests.

### Test File Structure

```
src/src/
├── components/
│   ├── AppHeader.tsx
│   ├── AppHeader.test.tsx      # Component tests
│   ├── CalendarGrid.tsx
│   ├── calendar-grid-utils.ts
│   └── calendar-grid-utils.test.ts
├── hooks/
│   ├── use-freebusy.ts
│   ├── use-freebusy.test.tsx   # Hook tests
│   ├── freebusy-utils.ts
│   └── freebusy-utils.test.ts
└── lib/
    ├── date-utils.ts
    ├── date-utils.test.ts      # Utility tests
    ├── availability-export.ts
    └── availability-export.test.ts
```

### Basic Test Pattern

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
});
```

### Testing React Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('renders title', () => {
    render(<AppHeader />);
    
    expect(screen.getByText(/free\/busy/i)).toBeInTheDocument();
  });
  
  it('shows timezone selector', () => {
    render(<AppHeader />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });
});
```

### Testing React Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFreeBusy } from './use-freebusy';

describe('useFreeBusy', () => {
  it('fetches data on mount', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ busy: [] }),
      } as Response)
    );

    const { result } = renderHook(() => useFreeBusy());

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Mocking Fetch Requests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API integration', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.resetAllMocks();
  });

  it('handles successful response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response)
    );

    const response = await fetch('/api/data');
    const data = await response.json();

    expect(data).toEqual({ data: 'test' });
  });

  it('handles error response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      } as Response)
    );

    const response = await fetch('/api/data');
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});
```

### Testing Error Conditions

```typescript
import { describe, it, expect } from 'vitest';

describe('error handling', () => {
  it('handles missing data gracefully', () => {
    const result = processData(null);
    expect(result).toBeNull();
  });

  it('throws on invalid input', () => {
    expect(() => validateInput('')).toThrow('Input required');
  });

  it('returns error state on failure', () => {
    const result = processUnsafeData({ invalid: true });
    expect(result.error).toBeDefined();
  });
});
```

### Parametrized Tests

Test multiple inputs with one test function:

```typescript
import { describe, it, expect } from 'vitest';

describe.each([
  { input: '2024-01-01', expected: { year: 2024, month: 1, day: 1 } },
  { input: '2024-12-31', expected: { year: 2024, month: 12, day: 31 } },
  { input: '2025-06-15', expected: { year: 2025, month: 6, day: 15 } },
])('parseDate with $input', ({ input, expected }) => {
  it(`parses ${input} correctly`, () => {
    const result = parseDate(input);
    expect(result).toEqual(expected);
  });
});
```

## Code Coverage

Understanding and improving test coverage.

### Understanding Coverage

Coverage measures what percentage of your code is executed during tests. Higher coverage generally means better tested code.

Coverage is tracked via:

- **Terminal reports** (run locally)
- **HTML reports** (browse locally in `src/coverage/`)
- **XML reports** (uploaded to Codecov)
- **Codecov dashboard** (online, with trends)

### Viewing Coverage Locally

```bash
cd src/

# Terminal summary
npm run test:coverage

# HTML (interactive, most detailed)
npm run test:coverage
open coverage/index.html
```

### Coverage Badge

The README shows current coverage via Codecov badge. Always refer to the live badge or Codecov dashboard for current numbers.

### Coverage Goals

- **Target:** 80% overall coverage (goal, not gate)
- **Minimum:** No PR should decrease coverage
- **New code:** Should be ≥80% covered

Check current coverage:

- Visit [Codecov Dashboard](https://codecov.io/gh/robertsinfosec/freebusy-site)
- Click on branch or PR to see detailed breakdown

### Improving Coverage

1. **Identify gaps:**

   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

2. **Focus on red/yellow files:**
   - Red = <60% coverage (priority)
   - Yellow = 60-79% coverage (needs work)
   - Green = 80-100% coverage (good!)

3. **Write tests for uncovered code:**
   - Look at "missing lines" in HTML report
   - Write tests that execute those lines
   - Verify with another coverage run

4. **Don't game coverage:**
   - Tests must have meaningful assertions
   - Cover both success and error paths
   - Test edge cases, not just happy path

See [Codecov Guide](CODECOV.md) for detailed coverage tracking setup.

## Test Organization

How tests are organized in the codebase.

### Directory Structure

Tests are co-located with source files:

```
src/src/
├── components/
│   ├── CalendarGrid.tsx
│   └── CalendarGrid.test.tsx   # Next to source
├── hooks/
│   ├── use-freebusy.ts
│   └── use-freebusy.test.tsx   # Next to source
└── lib/
    ├── date-utils.ts
    └── date-utils.test.ts      # Next to source
```

### Naming Conventions

- **Test files:** `*.test.ts` or `*.test.tsx`
- **Test suites:** `describe('ModuleName', ...)`
- **Test cases:** `it('does something specific', ...)`
- **Mocks:** Descriptive names (`mockFetch`, `mockTimezone`)

### Shared Test Utilities

Test setup and utilities in `src/src/test/setup.ts`:

```typescript
// src/src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

## Best Practices

Guidelines for writing effective tests.

### 1. One Concept Per Test

❌ Bad: Testing multiple things in one test

```typescript
it('does everything', () => {
  expect(fn1()).toBe(1);
  expect(fn2()).toBe(2);
  expect(fn3()).toBe(3);
});
```

✅ Good: Separate tests for each concept

```typescript
it('fn1 returns 1', () => {
  expect(fn1()).toBe(1);
});

it('fn2 returns 2', () => {
  expect(fn2()).toBe(2);
});
```

### 2. Descriptive Test Names

❌ Bad: Vague names

```typescript
it('works', () => {
  // ...
});
```

✅ Good: Clear, descriptive names

```typescript
it('returns owner-days for given date range', () => {
  // ...
});

it('handles DST transitions correctly', () => {
  // ...
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('clips busy intervals to owner-day boundaries', () => {
  // Arrange: Set up test data
  const interval = {
    startUtc: '2024-03-15T08:00:00Z',
    endUtc: '2024-03-16T02:00:00Z',
  };
  const ownerDay = '2024-03-15';
  
  // Act: Execute function being tested
  const result = clipInterval(interval, ownerDay, 'America/New_York');
  
  // Assert: Verify expected outcome
  expect(result.startUtc).toBe('2024-03-15T08:00:00Z');
  expect(result.endUtc).toBe('2024-03-16T00:00:00Z'); // Clipped to day boundary
});
```

### 4. Mock External Dependencies

Always mock:

- HTTP requests (use `vi.fn()` to mock `fetch`)
- Timers/dates (use `vi.useFakeTimers()`)
- Browser APIs (`window`, `localStorage`, etc.)
- External libraries when testing in isolation

### 5. Test Both Success and Failure

```typescript
describe('fetchFreeBusy', () => {
  it('returns data on success', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ busy: [] }),
      } as Response)
    );

    const result = await fetchFreeBusy();
    expect(result.busy).toEqual([]);
  });

  it('handles network error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    await expect(fetchFreeBusy()).rejects.toThrow('Network error');
  });

  it('handles HTTP error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      } as Response)
    );

    await expect(fetchFreeBusy()).rejects.toThrow();
  });
});
```

### 6. Keep Tests Fast

- Mock slow operations (network, file I/O)
- Use fake timers instead of actual delays
- Avoid testing implementation details
- Run expensive tests separately if needed

### 7. Test Timezone Logic Carefully

Timezone bugs are subtle. Test thoroughly:

```typescript
describe('timezone handling', () => {
  it('handles DST spring forward', () => {
    const result = parseOwnerDay('2024-03-10', 'America/New_York');
    expect(result).toBeDefined();
  });

  it('handles DST fall back', () => {
    const result = parseOwnerDay('2024-11-03', 'America/New_York');
    expect(result).toBeDefined();
  });

  it('uses IANA timezone, not offset', () => {
    // Bad: hard-coded offset
    // Good: IANA timezone
    const result = formatInTimeZone(date, 'America/New_York');
    expect(result).toMatch(/EST|EDT/);
  });
});
```

## Continuous Integration

How tests run in GitHub Actions.

### GitHub Actions

Every push and PR triggers automated testing via GitHub Actions.

Workflow: `.github/workflows/ci.yml`

What happens:

1. Checkout code
2. Set up Node.js
3. Install dependencies (`cd src && npm ci`)
4. Run tests with coverage (`npm run test:coverage`)
5. Upload coverage to Codecov
6. Build production bundle (`npm run build`)

### Viewing CI Results

On GitHub:

1. Go to **Actions** tab
2. Click on workflow run
3. Expand "Run tests" step
4. View test results and coverage report

On Codecov:

1. Visit [Codecov Dashboard](https://codecov.io/gh/robertsinfosec/freebusy-site)
2. Click on commit or PR
3. View detailed coverage breakdown

### PR Requirements

Before merging:

- ✅ All tests must pass
- ✅ Coverage must not decrease
- ✅ Linting must pass (`npm run lint`)
- ✅ Build must succeed (`npm run build`)
- ✅ All checks must be green

## Troubleshooting

Common testing issues and solutions.

### Tests Failing Locally

**Check you're in the right directory:**

```bash
cd src/
npm test
```

**Clear test cache:**

```bash
cd src/
rm -rf node_modules/.vitest
npm test
```

**Check for TypeScript errors:**

```bash
cd src/
npx tsc --noEmit
```

### Import Errors

**Reinstall dependencies:**

```bash
cd src/
rm -rf node_modules package-lock.json
npm install
```

**Check path aliases:**

Ensure `@/` alias is configured in both:
- `src/vite.config.ts` (for runtime)
- `src/tsconfig.json` (for TypeScript)

### Mock Not Working

**Ensure correct import path:**

```typescript
// If code does: import { fetch } from './api'
vi.mock('./api', () => ({
  fetch: vi.fn(),
}));

// If code does: global.fetch
global.fetch = vi.fn();
```

**Check mock is applied before function runs:**

```typescript
import { vi, beforeEach } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn(); // Mock applied before each test
});
```

### Coverage Report Not Generating

**Install dependencies:**

```bash
cd src/
npm install --save-dev @vitest/coverage-v8
```

**Check vite.config.ts:**

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
```

### Tests Pass Locally, Fail in CI

Common causes:

- **Timezone differences:** Mock `Date` and use consistent timezone
- **Environment variable differences:** Set in CI workflow
- **File path differences:** Use cross-platform paths
- **Node version differences:** Check Node version matches

Debug CI:

```yaml
# Add to workflow for debugging
- name: Debug environment
  run: |
    pwd
    ls -la
    node --version
    npm --version
```

## Pre-Commit Checklist

Before committing code:

- [ ] Run tests: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Lint code: `npm run lint`
- [ ] All tests pass locally
- [ ] Added tests for new code
- [ ] Coverage hasn't decreased

## Additional Resources

- **Vitest Documentation:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/
- **Codecov Documentation:** https://docs.codecov.com/
- **Setup Guide:** [SETUP.md](SETUP.md)
- **Architecture Guide:** [ARCHITECTURE.md](ARCHITECTURE.md)

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Setup](SETUP.md) | [Architecture](ARCHITECTURE.md) | [Codecov](CODECOV.md)
