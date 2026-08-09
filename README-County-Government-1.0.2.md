# Riverside County Government v1.0.2

## Taxpayer-ID-first filing
The standard Business Transaction Filing path now requires a Riverside Taxpayer
ID (`RC-TIN-YYYY-######`). The server validates the ID directly against the
shared RinCEN `rcdf_portal_state` Wirtschaftsprofile data and resolves:
- legal taxpayer / entity name
- Wirtschaftsprofil ID
- classification
- current profile status

The public user cannot replace the registered legal name with a free-typed name.

A separate `No Taxpayer ID issued` path remains available for genuinely
unregistered taxpayers. These filings are stored without an automatic
Wirtschaftsprofil association and are marked for possible manual review.

## Shared Government Transactions
New public filings now store both `economic_profile_id` and `taxpayer_id` when
a TIN is validated. A safe additive `taxpayer_id` column is added to the shared
county business tax ledger by `ensureDatabase()`.

## Taxes & Filing Guide
Added a public `Taxes & Filing Guide` page. It displays the currently loaded
business activity classifications, rates, descriptions, practical selection
guidance, and an explanation of Income vs Expense filing.

The filing form also displays context-sensitive guidance for the selected
activity classification and entry direction.

## Official government banner
The top trust banner now uses the same markup, SVG flag asset, dimensions,
spacing, colors and typography as the RinCEN trust banner.

## Changed files
- components/Portal.js
- app/globals.css
- lib/setup.js
- app/api/business-filings/route.js
- package.json

## New files
- public/assets/us-flag.svg
- README-County-Government-1.0.2.md

No manual SQL or new environment variables are required.
