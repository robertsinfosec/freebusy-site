# Runbook

This document is an operational runbook for the **freebusy-site** frontend. It covers common development workflows, debugging steps, and operational actions for incidents or degraded service. Use this as the “what do I do next?” guide when something is broken.

## Quick links

This section lists the most frequently referenced docs and entry points. It is meant to reduce time-to-triage by making the right files easy to find. If you add a new operational document, link it here.

- **Architecture:** `docs/ARCHITECTURE.md`.
- **API contract:** `docs/openapi.yaml`.
- **Security policy:** `SECURITY.md`.
- **Contributing:** `CONTRIBUTING.md`.

## Local development

This section describes the standard way to run the frontend locally. The package root is under `src/`, so commands must be executed from that directory. If you are debugging, keep one terminal for the dev server and one for tests.

```bash
cd src
npm install
cp .env.example .env.local
npm run dev
```

- **Dev server:** Runs on `http://localhost:5000` (strict).
- **Primary config:** `VITE_FREEBUSY_API` (defaults to `http://localhost:8787/freebusy`).

## Testing and coverage

This section explains how tests run and where outputs go. The repository wraps Vitest so running tests also updates committed badge assets. Prefer running targeted tests while iterating, then the full suite before opening a PR.

```bash
cd src
npm test
npm run test:coverage
```

- **Badges:** Written to the repo root under `badges/`.
- **Coverage HTML:** Emitted to `src/coverage/`.
- **Coverage policy:** No app-code exclusions right now (including UI wrappers). Thresholds are enforced in `src/vite.config.ts`.

## Common issues and fixes

This section lists common failure modes for the frontend and how to diagnose them. These are practical playbooks, not exhaustive explanations. If you encounter a new common failure mode, add it here.

### API unavailable (503) or disabled

This section explains what to do when the UI shows an “unavailable” or “disabled” state. The frontend can only display what the backend provides, so the first step is determining whether the Freebusy API is reachable and enabled. If the backend is intentionally disabled, the correct action may be “do nothing.”

- **Symptom:** UI shows an unavailable banner or a “sharing is turned off” message.
- **First check:** Open the browser Network tab and inspect the Freebusy API request.
- **Next steps:**
  - **Confirm endpoint:** Validate the configured `VITE_FREEBUSY_API` value.
  - **Check backend:** Verify the Freebusy API service health and logs.
  - **User messaging:** Ensure the UI message matches the API response kind.

### Rate limited (429)

This section covers the rate-limited state. The Freebusy API may include a `nextAllowedAtUtc` timestamp; the frontend uses it to disable refresh and communicate the wait period. Avoid repeatedly refreshing during this window.

- **Symptom:** UI indicates rate limiting and refresh is disabled.
- **First check:** Inspect the JSON response for `rateLimit.nextAllowedAtUtc`.
- **Next steps:**
  - **Wait:** Respect `nextAllowedAtUtc` and retry after the window resets.
  - **Verify behavior:** Confirm the refresh button is disabled until the specified time.

### Wrong day columns or “week cuts off early”

This section covers bugs where the UI renders the wrong date columns or shows partial weeks. These issues are usually caused by violating the owner-day model or by incorrect padding/clipping across week boundaries. Reproduce with a fixed timezone and add a focused unit test.

- **Symptom:** Busy blocks appear on the wrong day or the look-ahead window ends mid-week visually.
- **First check:** Confirm owner-day rules from `docs/openapi.yaml` and the helpers in `src/src/hooks/freebusy-utils.ts`.
- **Next steps:**
  - **Confirm inputs:** Check `calendar.timeZone`, `window.startDate`, and `window.endDateInclusive` from the API.
  - **Validate padding:** Ensure weeks are padded as needed for rendering full week sections.
  - **Add tests:** Add a unit test that locks the scenario (timezone, start day, and expected last date).

## Operational checks

This section describes quick checks you can run before declaring an incident. The intent is to separate frontend regressions from backend outages and configuration mistakes. These checks should take minutes, not hours.

- **Client-side errors:** Check the browser console for exceptions and stack traces.
- **Network:** Check the Freebusy API call status and payload shape.
- **Config:** Confirm `VITE_FREEBUSY_API` is correct for the environment.
- **Regression check:** Run `cd src && npm test`.

## Release and deployment

This section documents the minimum steps to ship a change safely. The frontend is deployed as a static build, so most issues come from configuration mismatches or breaking time semantics. Keep releases small and validate behavior before merging.

- **Build:** Run `cd src && npm run build`.
- **Preview:** Validate the built site against the expected API endpoint.
- **Deploy:** Cloudflare Pages deploys from the `src/` directory with output `dist`.

## Security operations

This section documents what to do when handling a security report. It does not replace the security policy; it provides an operational checklist for maintainers. Keep discussions private until a fix is ready.

- **Intake:** Prefer GitHub Security Advisories; email is an alternative.
- **Triage:** Reproduce the issue on the default branch and confirm scope is in this repo.
- **Fix:** Implement the minimal fix, add tests where feasible, and prepare a deployment.
- **Communication:** Coordinate disclosure timing and update documentation as needed.
