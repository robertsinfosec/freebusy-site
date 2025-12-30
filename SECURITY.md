# Security policy

This repository contains the **frontend website** for the robertsinfosec free/busy calendar viewer.

If you believe you’ve found a security vulnerability, please report it **privately**.

This project also publishes `security.txt` at `/.well-known/security.txt`.

## Reporting a vulnerability

This section explains how to report security issues without exposing users or maintainers to unnecessary risk. Please do not disclose vulnerabilities publicly while they are being triaged. Use the channels below so we can coordinate a fix and disclosure timeline.

Please **do not** open public GitHub issues for security reports.

Preferred (private):

- **GitHub Security Advisories:** https://github.com/robertsinfosec/freebusy-site/security/advisories/new

Alternative:

- **Email:** `security@robertsinfosec.com`

If you are unsure whether something is security-sensitive, treat it as sensitive and use one of the private channels above.

## Scope

This section clarifies what is considered “in scope” for vulnerability reports against this repository. It helps reporters send issues to the right place and reduces back-and-forth during triage. If you are unsure, report privately and we will route it.

In scope for this repository:

- **Frontend application:** The React/Vite UI in this repo.
- **Client-side data handling:** Parsing and handling of Freebusy API responses.
- **Build and dependencies:** Issues that affect the deployed frontend.

Out of scope (by default):

- **Freebusy API backend:** Report to that service’s security process.
- **Denial of service:** DoS against shared infrastructure.
- **Social engineering:** Phishing, impersonation, or similar.

## What to include

This section lists the information that helps us reproduce, confirm, and fix the issue quickly. A minimal, reliable reproduction is often more valuable than a large write-up. Please redact secrets, tokens, and private calendar data.


- **Description:** A clear description of the issue and potential impact.
- **Reproduction:** Steps to reproduce (ideally a minimal PoC).
- **Version:** Affected commit or tag (or the approximate date you tested).
- **Configuration:** Any relevant configuration (for example, your `VITE_FREEBUSY_API` value).

Helpful extras:

- **Environment:** Relevant browser and OS details.
- **Timezone context:** If relevant, include the calendar owner timezone and viewing timezone.

## Supported versions

This section describes which versions receive security fixes. For this repo, fixes are generally made on the default branch and shipped with the latest deployment. If you are running a fork or pinned deployment, consider updating to pick up fixes.

This project currently supports the latest code on the default branch.
