# Threat Model

This folder contains the project threat model and related security design notes.

Publishing a threat model under `docs/` is a common OSS practice because it keeps the analysis versioned alongside code changes. Some projects prefer `docs/security/` or `SECURITY/` - the key is that it’s easy to find, reviewed like code, and kept in sync.

- **Primary document:** `THREATMODEL.md`
- **Template:** `THREATMODEL_TEMPLATE.md`
- **Scope:** freebusy-site frontend (React/Vite) and its interaction with the Freebusy API

Note: This is a threat model / security design document, not a penetration test report. It is intended to guide engineering mitigations and to focus any future OWASP-aligned pentest.

## Document roles

This section explains what each file in this folder is for. The goal is to make it obvious where to find the “published” threat model content versus folder-level guidance.

- **`THREATMODEL.md`:** The published threat model (includes both the summary and the detailed threat analysis).
- **`README.md`:** Folder index and update guidance (this file).
- **`THREATMODEL_TEMPLATE.md`:** Starter template for new threat models.

## How to update

This section describes how to keep the threat model current as the codebase evolves. Updates should be made as part of normal engineering work and reviewed like code. If a security-relevant assumption changes, update the document in the same pull request.

1. Update the diagrams and risks in `THREATMODEL.md` as behavior changes.
2. If the API contract changes, update `docs/openapi.yaml` and ensure frontend behavior and tests stay in sync.
3. Add mitigations as code/infra changes (Cloudflare Pages headers, CSP, etc.), and mark risks as reduced/accepted.
