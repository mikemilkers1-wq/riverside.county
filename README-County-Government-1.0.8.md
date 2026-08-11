# Riverside County Government v1.0.8

Public-service expansion:
- New `Gesetzbuch` page with a direct link to the existing Riverside County law collection
  and a dedicated tax-crime section.
- New public Taxpayer-ID lookup exposing only basic Wirtschaftsprofil data:
  name, Taxpayer ID, classification, and public status.
- New public Forms page for:
  - tax overpayment/refund review
  - Taxpayer ID replacement
  - Filing Access Code replacement
  - county petitions
  - submissions/petitions to the Governor
  - general administrative requests
- Public requests are forwarded directly to RinCEN `/api/public-requests`.

Privacy:
- Taxpayer lookup never exposes Filing Access Codes, tax balances, internal notes,
  payment history, or investigation data.

Legal-source note:
The existing `https://riverside-county.vercel.app/gesetze` page could not be fetched
from the generation environment, so this build links to that existing collection rather
than silently inventing or copying unseen local-law text. The newly added tax-crime
section is separate and includes carefully qualified federal reference notes.

No manual SQL or new County Vercel environment variable is required.
