# Security policy

This repository contains the **frontend website** for the robertsinfosec free/busy calendar viewer.

If you believe you’ve found a security vulnerability, please report it **privately**.

This project also publishes `security.txt` at `/.well-known/security.txt`.

## Reporting a vulnerability

Please **do not** open public GitHub issues for security reports.

Preferred (private):
- **GitHub Security Advisories**: https://github.com/robertsinfosec/freebusy-site/security/advisories/new

Alternative:
- Email: `security@robertsinfosec.com`

If you are unsure whether something is security-sensitive, treat it as sensitive and use one of the private channels above.

## Scope

In scope for this repository:
- The **frontend** app in this repo (React/Vite UI)
- Client-side handling of Freebusy API responses
- Build/dependency issues that affect the deployed frontend

Out of scope (by default):
- Vulnerabilities in the **Freebusy API** backend service (report to that service’s security process)
- Denial of service (DoS) against shared infrastructure
- Social engineering

## What to include

- A clear description of the issue and potential impact
- Steps to reproduce (ideally a minimal PoC)
- Affected commit / tag (or the approximate date you tested)
- Any relevant configuration (e.g., `VITE_FREEBUSY_API` value)

Helpful extras:
- Any relevant browser/OS details
- If the issue relates to time zones, include the calendar owner timezone and viewing timezone

## Supported versions

This project currently supports the latest code on the default branch.
