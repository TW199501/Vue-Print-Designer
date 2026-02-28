# Runtime Dependency Audit Comparison

Assessment scope: `npm audit --omit=dev --json`

## Before Fixes (2026-02-28)

- Source: `security_best_practices_report.md`
- Result:
  - critical: 1
  - high: 0
  - moderate: 1
  - total: 2
- Primary issues: `jspdf@2.5.2` and transitive `dompurify` in runtime dependency tree.

## After Fixes (2026-03-01)

- Command: `npm audit --omit=dev --json`
- Result:
  - critical: 0
  - high: 0
  - moderate: 0
  - total: 0

## Notes

- Runtime remediation was completed by upgrading `jspdf` to a patched major version line.
- Dev-only advisories are tracked separately and do not affect runtime audit gating.
