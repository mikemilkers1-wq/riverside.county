# Riverside County Government 1.0.1

Fixes and changes:
- Agency Directory is explicitly backed by the shared `county_governance_state` record used by RinCEN and participating departmental terminals.
- Agency cards can now be opened into a full professional detail modal.
- Shared agency fields include administrator, extension, legal authority, status, description and website/terminal URL.
- Added support for the shared RinCEN `logoKey` convention, with safe county-seal fallback.
- Copied the RinCEN-style light official-government trust banner.
- County homepage video now has native looping plus a defensive restart near the end of playback.
- Business Activity classifications have a complete client fallback if the tax-rule endpoint is temporarily unavailable.
- County business filing now writes to the same shared tax-ledger schema RinCEN reads (`activity_code`, `tax_rate`, `record_kind='activity'`).
- Shared schema setup was aligned with RinCEN to prevent County Government and RinCEN from creating incompatible tax-ledger tables.

No manual SQL is required; `ensureDatabase()` performs compatible CREATE/ALTER operations automatically.
