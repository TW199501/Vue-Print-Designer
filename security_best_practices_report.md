# Security Assessment Report - Vue Print Designer

- Assessment date: 2026-02-28
- Project path: `d:\code\Vue-Print-Designe`
- Assessment type: Static code review + dependency audit
- Standards used: OWASP Top 10 (2021), CWE, CVSS, secure frontend practices

## Executive Summary

This repository is a Vue 3 + TypeScript print designer with Web Components export, local/remote print channels (WebSocket), and optional remote CRUD for templates/custom elements.

I identified **5 security findings**:

- **Critical**: 2
- **High**: 2
- **Medium**: 1

Most severe risks are:

1. **Arbitrary JavaScript execution path** via template `customScript` + `new Function(...)`.
2. **Critical known vulnerabilities in runtime dependency `jspdf@2.5.2`**.
3. **Sensitive credential/token handling weaknesses** (persistence in `localStorage` and transport via URL query parameters).

---

## Scope and Method

Reviewed:

- Technical docs: `docs/en/guide/web-components-guide.md`, `docs/en/guide/custom-element.md`, `README_EN.md`
- Runtime code: `src/**`
- Build/dependency manifests: `package.json`, `package-lock.json`

Checks performed:

- Injection/XSS/code execution sinks (`new Function`, `v-html`, `innerHTML`, message boundaries)
- Sensitive data storage/transport patterns
- Network/auth flow for local/remote printing
- Dependency vulnerability scan (`npm audit --omit=dev --json`)

---

## Findings

### [VPD-SEC-001] Arbitrary Code Execution via Template `customScript`

- Severity: **Critical**
- OWASP: A03 Injection
- CWE: CWE-94 (Code Injection), CWE-95 (Eval Injection)

#### Location

- `src/components/elements/TableElement.vue:195`
- `src/components/elements/TableElement.vue:197`
- `src/utils/print.ts:502`
- `src/utils/print.ts:542`
- `src/stores/templates.ts:251`
- `src/stores/templates.ts:258`
- `src/web-component.ts:295`
- `src/web-component.ts:301`

#### Evidence

- `customScript` is accepted as table element data and executed directly:
  - `new Function('data', 'footerData', 'columns', 'type', props.element.customScript)`
  - `new Function('data', 'footerData', 'columns', 'type', customScript)`
- Template pages can be loaded from remote response and applied into runtime state without script-level trust boundary.

#### Impact (one sentence)

If an attacker can influence template data (remote API compromise, supply-chain, malicious shared template), they can run arbitrary JavaScript in the application origin.

#### Recommended Fix

1. Remove `new Function` execution for untrusted template content.
2. Replace with a constrained DSL/allowlisted expression engine (no runtime JS eval).
3. If script extensibility must remain, execute in isolated sandbox (dedicated Worker/isolated iframe + strict message schema), and require signed/trusted templates.
4. Add explicit security mode: disable custom script by default unless explicitly enabled.

#### False Positive Notes

If all templates are guaranteed trusted and never user-supplied, risk is reduced but still remains a high-value trust-boundary weakness.

---

### [VPD-SEC-002] Critical Vulnerabilities in Runtime Dependency `jspdf@2.5.2`

- Severity: **Critical**
- OWASP: A06 Vulnerable and Outdated Components
- CWE: Multiple (including CWE-22, CWE-94, CWE-400)

#### Location

- `package.json:39`
- `package-lock.json:2206`
- `package-lock.json:2208`
- `package-lock.json:1834`
- `package-lock.json:1836`

#### Evidence

- `npm audit --omit=dev --json` reports:
  - `jspdf` critical/high advisories (including GHSA-f8cm-6447-x5h2, GHSA-9vjf-qc39-jprp, GHSA-p5xg-68wr-hm3m, etc.)
  - transitive `dompurify` vulnerability (`<3.2.4`) via `jspdf`
- Installed runtime versions:
  - `jspdf@2.5.2`
  - `dompurify@2.5.8` (under `jspdf`)

#### Impact (one sentence)

Known exploitable component flaws can permit denial-of-service and injection-style abuse in PDF generation workflows.

#### Recommended Fix

1. Upgrade `jspdf` to a fixed version line (audit suggests `4.2.0`).
2. Re-run regression tests for export/print workflows after major upgrade.
3. Add CI guardrails (`npm audit` or SCA policy) to block reintroduction.

#### False Positive Notes

Exploitability depends on exact jsPDF feature usage, but presence of critical known CVEs in runtime dependencies is a release-blocking supply-chain risk.

---

### [VPD-SEC-003] Sensitive Credentials and Tokens Persisted in `localStorage`

- Severity: **High**
- OWASP: A02 Cryptographic Failures / Sensitive Data Exposure
- CWE: CWE-922 (Sensitive Data in Client-Side Storage)

#### Location

- `src/composables/usePrintSettings.ts:251`
- `src/composables/usePrintSettings.ts:270`
- `src/composables/usePrintSettings.ts:326`
- `src/composables/usePrintSettings.ts:327`
- `src/composables/usePrintSettings.ts:340`
- `src/composables/usePrintSettings.ts:341`

#### Evidence

- `remoteSettings` includes `username`/`password` and is persisted through `saveJson(...remoteSettings...)`.
- `remoteAuthToken` is read from and written to `localStorage`.

#### Impact (one sentence)

Any XSS or malicious browser extension can exfiltrate persistent credentials/tokens and maintain long-lived account compromise.

#### Recommended Fix

1. Do not persist `password` and long-lived auth tokens in `localStorage`.
2. Keep secrets in memory only; require re-auth when needed.
3. Prefer short-lived server-issued tokens with refresh rotation and secure cookie strategy where feasible.
4. Add explicit "remember me" with risk warning and safer bounded lifetime if business requires persistence.

#### False Positive Notes

Risk remains material even in desktop/internal deployments because browser storage is plaintext and script-accessible.

---

### [VPD-SEC-004] Secret/Token Sent in WebSocket URL Query Parameters

- Severity: **High**
- OWASP: A02 Sensitive Data Exposure
- CWE: CWE-598 (Sensitive Data in URL Query String)

#### Location

- `src/composables/usePrintSettings.ts:295`
- `src/composables/usePrintSettings.ts:300`
- `src/composables/usePrintSettings.ts:584`
- `src/composables/usePrintSettings.ts:659`
- `src/utils/print.ts:1309`

#### Evidence

- Local and remote WS URLs are built with query params:
  - `?key=<secretKey>`
  - `?token=<remoteAuthToken>`
- Those URLs are then used directly in `new WebSocket(...)`.

#### Impact (one sentence)

Secrets in URLs can leak via logs, telemetry, proxies, debug tools, and diagnostics, expanding credential exposure surface.

#### Recommended Fix

1. Remove auth secrets from URL query strings.
2. Require `wss://` in production and authenticate after connection establishment via signed message/challenge-response.
3. If protocol supports it, use `Sec-WebSocket-Protocol` bearer scheme instead of query params.
4. Implement token expiry/revocation and rotation.

#### False Positive Notes

Localhost-only deployments reduce external leakage risk but do not eliminate logging/observability leakage in real environments.

---

### [VPD-SEC-005] HTML Injection Sinks (`v-html`, `innerHTML`) Without Explicit Sanitization Contract

- Severity: **Medium**
- OWASP: A03 Injection
- CWE: CWE-79 (XSS)

#### Location

- `src/components/layout/PreviewModal.vue:244`
- `src/utils/print.ts:821`

#### Evidence

- Preview renders HTML via `v-html="htmlContent"`.
- Processing path supports `container.innerHTML = content` for string-based content.

#### Impact (one sentence)

If these paths ever receive untrusted HTML (now or future integration), stored/reflected XSS becomes immediately exploitable.

#### Recommended Fix

1. Define a strict trust contract: only internally-generated HTML allowed.
2. Reject string HTML input at API boundary unless sanitized.
3. Add sanitizer (e.g., trusted DOM sanitization pipeline) and regression tests for XSS payloads.
4. Prefer DOM node pipelines over raw HTML string pipelines.

#### False Positive Notes

Current code mainly feeds internally-generated markup; exploitability depends on whether external/untrusted HTML can reach these sinks.

---

## Additional Notes (Non-runtime/Build Chain)

- `npm audit --json` also reports high vulnerabilities in dev-time dependencies:
  - `rollup@4.56.0` (path traversal advisory range `<4.59.0`)
  - `minimatch@9.0.5` (ReDoS advisory range `<9.0.7`)
- These are primarily CI/build-chain risks (not direct browser runtime), but still recommended to patch.

---

## Recommended Remediation Plan (Priority)

1. **Immediate (P0)**: Remove or hard-sandbox `customScript` runtime execution.
2. **Immediate (P0)**: Upgrade `jspdf` to patched major and run compatibility test matrix.
3. **Short-term (P1)**: Eliminate `localStorage` persistence of password/token; rotate existing credentials.
4. **Short-term (P1)**: Remove query-token authentication pattern for WebSocket; adopt secure handshake on `wss://`.
5. **Medium-term (P2)**: Harden HTML rendering contract and add XSS regression suite.

---

## Conclusion

The project is feature-rich and architecturally clear, but current security posture has **critical injection and component-risk exposure** plus **high-impact credential handling weaknesses**. Addressing the top 4 findings is strongly recommended before production deployment in untrusted environments.
