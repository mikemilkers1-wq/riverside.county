# Riverside County Government v1.0.4 — Filing Authorization & Field Help

## Filing authorization
A Taxpayer ID is now treated only as an identifier, not as authorization to file.
Registered-taxpayer online filing requires BOTH:
- Riverside Taxpayer ID (`RC-TIN-...`)
- confidential Filing Access Code (`RC-FAC-....-....-....`)

The Access Code is checked server-side against the same Wirtschaftsprofil record used
by RinCEN. The portal does not reveal whether the TIN or the Access Code was wrong.

The Access Code is sent in a POST body rather than a URL/query string, is never written
to the Government Transactions metadata, and repeated failed verification attempts are
rate-limited.

The legacy no-TIN path remains unlinked and therefore cannot directly add tax activity
to another registered Wirtschaftsprofil.

## Contextual filing help
When `Show help` is enabled, individual information buttons now appear beside the
relevant tax filing fields. Each one has field-specific instructions covering:
- Taxpayer ID
- Filing Access Code
- unregistered legal name
- reporter / responsible person
- contact reference
- transaction date
- activity classification
- entry type
- amount
- description
- adding activity lines
- certification
- submission

The help buttons are explicitly `type="button"` and stop event propagation so opening
help cannot accidentally submit or change a form control.

## Database
`ensureDatabase()` adds `county_public_filing_attempts` for short-window failed-
verification rate limiting.

No new environment variables are required.
