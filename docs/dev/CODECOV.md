# Codecov Setup and Usage Guide

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Testing](TESTING.md) | [Setup](SETUP.md) | [Architecture](ARCHITECTURE.md)

Complete guide for setting up and using Codecov for code coverage tracking.

## Table of Contents

- [What is Codecov?](#what-is-codecov)
- [Setup Steps](#setup-steps)
- [Viewing Coverage](#viewing-coverage)
- [Configuration](#configuration)
- [Local Workflow](#local-workflow)
- [CI/CD Integration](#cicd-integration)
- [Understanding Reports](#understanding-reports)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## What is Codecov?

Codecov is a code coverage reporting service that integrates with GitHub to track test coverage over time.

### What it Provides

- 📊 **Coverage trends** - See coverage change over time
- 🎯 **PR comments** - Automatic coverage reports on pull requests
- 📈 **Visual reports** - Line-by-line coverage visualization
- 🏅 **Badges** - Show coverage status in README

### Why Use It

- Track coverage progress toward 80% goal
- Prevent coverage regressions in PRs
- Identify untested code
- Visualize coverage by file/module

## Setup Steps

How to set up Codecov for this repository.

### Prerequisites

- GitHub repository
- Codecov account (free for open source)
- Existing test suite with coverage reports

### 1. Connect Repository to Codecov

1. **Sign in to Codecov:**
   - Go to https://codecov.io
   - Click **Sign in with GitHub**
   - Authorize Codecov

2. **Add repository:**
   - Click **Add new repository**
   - Find `robertsinfosec/freebusy-site`
   - Click to enable

3. **Copy upload token:**
   - Codecov will show your repository upload token
   - Copy this token (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Add Token to GitHub Secrets

1. **Go to repository settings:**

   ```
   https://github.com/robertsinfosec/freebusy-site/settings/secrets/actions
   ```

2. **Create new secret:**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: Paste the token from step 1
   - Click **Add secret**

### 3. Verify CI/CD Configuration

Your `.github/workflows/ci.yml` should include:

```yaml
- name: Run tests with coverage
  run: |
    cd src
    npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: src/coverage/lcov.info
    flags: unittests
    name: frontend-coverage
    fail_ci_if_error: false
    token: ${{ secrets.CODECOV_TOKEN }}
```

### 4. Trigger First Upload

Push a commit to trigger CI:

```bash
git commit --allow-empty -m "test: Trigger CI for Codecov"
git push
```

Or manually trigger the workflow:

- Go to **Actions** tab
- Select **CI** workflow
- Click **Run workflow**

### 5. Verify Upload

1. **Check GitHub Actions:**
   - Go to **Actions** tab
   - Click on the workflow run
   - Expand "Upload coverage to Codecov" step
   - Should show "Success!"

2. **Check Codecov Dashboard:**
   - Visit https://codecov.io/gh/robertsinfosec/freebusy-site
   - Should see coverage data

## Viewing Coverage

How to view and interpret coverage reports.

### Codecov Dashboard

URL: https://codecov.io/gh/robertsinfosec/freebusy-site

What you see:

- **Overall coverage percentage** (top of page)
- **Coverage graph** (trends over time)
- **File browser** (click to see line-by-line coverage)
- **Recent commits** (coverage for each commit)

### README Badge

The README includes a live coverage badge:

```markdown
[![coverage](https://codecov.io/gh/robertsinfosec/freebusy-site/branch/main/graph/badge.svg)](https://codecov.io/gh/robertsinfosec/freebusy-site)
```

This shows current coverage percentage and links to full report.

### PR Comments

Codecov automatically comments on pull requests with:

```
## Codecov Report
Coverage: 75.2% (+2.3%)
Diff Coverage: 85.7%

Files changed:
- src/src/components/CalendarGrid.tsx: 65% → 72% (+7%)
- src/src/lib/date-utils.ts: 87% → 89% (+2%)
```

### File-Level Coverage

Click on a file in Codecov dashboard to see:

- Line-by-line coverage (green = covered, red = not covered)
- Coverage percentage for that file
- Historical coverage trends
- Recent changes affecting coverage

## Configuration

Customizing Codecov behavior.

### codecov.yml

Create `.github/codecov.yml` for custom settings:

```yaml
# Codecov configuration
# https://docs.codecov.com/docs/codecov-yaml

coverage:
  precision: 2
  round: down
  range: "70...100"
  
  status:
    project:
      default:
        target: 80%           # Target overall coverage
        threshold: 2%         # Allow 2% drop
        if_ci_failed: error
    
    patch:
      default:
        target: 80%           # New code must be 80%+ covered
        threshold: 5%

comment:
  layout: "header, diff, files, footer"
  behavior: default
  require_changes: false

ignore:
  - "src/src/test/"         # Don't count test utilities
  - "**/*.config.*"         # Don't count config files

flags:
  unittests:
    paths:
      - src/src/
```

### Badge Customization

Default badge:

```markdown
[![coverage](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/REPO)
```

Custom styles available at: https://docs.codecov.com/docs/status-badges

## Local Workflow

How to work with coverage locally before pushing.

### Generate Coverage Locally

```bash
cd src/

# Run tests with coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Report Formats

```bash
# Terminal summary
npm run test:coverage

# HTML (interactive, browse files)
npm run test:coverage
open coverage/index.html

# LCOV (for Codecov upload)
# Generated automatically at coverage/lcov.info
```

### Check Coverage Before Push

```bash
cd src/

# Run tests with coverage
npm run test:coverage

# Look for files with low coverage
# Add tests for those files
# Re-run to verify improvement
npm run test:coverage
```

## CI/CD Integration

How coverage integrates with CI/CD.

### Workflow Overview

On every push or PR:

1. Run tests with coverage
2. Generate coverage report (LCOV format)
3. Upload to Codecov (using token)
4. Codecov processes and updates dashboard
5. Codecov comments on PR (if applicable)

### Viewing CI Coverage

**In GitHub Actions:**

- Go to **Actions** tab
- Click workflow run
- Expand "Run tests with coverage"
- See terminal coverage report

**On Codecov:**

- Visit dashboard
- Click commit or PR
- See detailed file-by-file coverage

### Coverage Upload

Upload happens in CI via Codecov GitHub Action:

```yaml
- uses: codecov/codecov-action@v4
  with:
    files: src/coverage/lcov.info
    token: ${{ secrets.CODECOV_TOKEN }}
```

## Understanding Reports

How to interpret coverage metrics.

### Coverage Metrics

**Overall coverage:**

- Percentage of lines executed during tests
- Goal: 80%+ for this project

**Diff coverage:**

- Coverage of lines changed in a PR
- Goal: 80%+ for new code

**File coverage:**

- Coverage per file
- 🟢 Green (80-100%) = good
- 🟡 Yellow (60-79%) = needs improvement
- 🔴 Red (0-59%) = priority

### Interpreting Colors

**In HTML report:**

- 🟢 Green line = Covered by tests
- 🔴 Red line = Not covered
- ⚪ Gray line = Not executable (comments, blank)

**In Codecov dashboard:**

- 🟢 Green file = 80-100% covered
- 🟡 Yellow file = 60-79% covered
- 🔴 Red file = 0-59% covered

### Finding Uncovered Code

**Locally:**

```bash
npm run test:coverage
open coverage/index.html
# Click on a file → red lines are uncovered
```

**On Codecov:**

- Visit https://codecov.io/gh/robertsinfosec/freebusy-site
- Click **Files** tab
- Click on a file
- Red lines are uncovered

## Best Practices

Guidelines for using coverage effectively.

### 1. Check Coverage Before PR

```bash
# Before creating PR, run:
cd src/
npm run test:coverage

# Ensure coverage didn't decrease
# Add tests for new code
```

### 2. Target 80% Minimum

Per project requirements:

- **Overall:** 80%+ coverage (goal, not gate)
- **New code:** 80%+ coverage (diff coverage)
- **No regressions:** Coverage should not decrease

### 3. Focus on Critical Code

Priority order:

1. Business logic (hooks, utilities)
2. Error handling
3. Edge cases (DST transitions, timezone boundaries)
4. Integration points

### 4. Don't Game Coverage

❌ **Bad:** Tests without assertions

```typescript
it('runs code', () => {
  doSomething();  // Runs code but doesn't verify
});
```

✅ **Good:** Meaningful tests

```typescript
it('calculates correctly', () => {
  const result = doSomething();
  expect(result).toBe(expected);
});
```

### 5. Use Coverage to Find Bugs

Coverage often reveals:

- Unreachable code
- Missing error handlers
- Forgotten edge cases
- Dead code to remove

### 6. Track Progress

Monitor the coverage badge:

[![coverage](https://codecov.io/gh/robertsinfosec/freebusy-site/branch/main/graph/badge.svg)](https://codecov.io/gh/robertsinfosec/freebusy-site)

Check dashboard weekly:

- Visit Codecov dashboard
- Review trends
- Celebrate improvements
- Address declining coverage

## Troubleshooting

Common issues and solutions.

### Coverage Not Uploading

**Check:**

1. `CODECOV_TOKEN` is set in GitHub secrets
2. `coverage/lcov.info` exists after tests
3. Upload step in workflow completed
4. Codecov service is operational

**Debug:**

```yaml
- name: Debug coverage file
  run: |
    ls -la src/coverage/
    head -20 src/coverage/lcov.info
```

### Coverage Seems Wrong

**Check:**

1. All source files discovered
2. Test files excluded
3. Config files excluded
4. Coverage provider configured correctly

**Debug:**

```bash
# See what files are included
cd src/
npm run test:coverage
# Check which files appear in report
```

### PR Comments Not Appearing

**Causes:**

- First-time setup (wait 1-2 PRs)
- Token permissions issue
- Codecov app not installed

**Solution:**

- Visit https://github.com/apps/codecov
- Ensure app installed for your repo
- Check token is valid

### "Coverage increased" but Badge Shows Decrease

**Cause:** Badge may cache for a few minutes.

**Solution:**

- Wait 5-10 minutes
- Hard refresh (Ctrl+Shift+R)
- Check actual Codecov dashboard for truth

## Current Coverage

Always check live sources for current coverage:

- **README Badge:** [![coverage](https://codecov.io/gh/robertsinfosec/freebusy-site/branch/main/graph/badge.svg)](https://codecov.io/gh/robertsinfosec/freebusy-site)
- **Codecov Dashboard:** https://codecov.io/gh/robertsinfosec/freebusy-site

> [!NOTE]
> Never rely on hardcoded numbers in documentation - they become stale immediately!

## Additional Resources

- **Codecov Docs:** https://docs.codecov.com/
- **Vitest Coverage:** https://vitest.dev/guide/coverage.html
- **Testing Guide:** [TESTING.md](TESTING.md)
- **Setup Guide:** [SETUP.md](SETUP.md)
- **GitHub Actions:** https://docs.github.com/en/actions

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Testing](TESTING.md) | [Setup](SETUP.md) | [Architecture](ARCHITECTURE.md)
