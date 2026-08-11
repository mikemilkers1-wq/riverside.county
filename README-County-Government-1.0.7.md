# Riverside County Government v1.0.7

## Authoritative tax backend
The public County tax form no longer writes tax records into the County website's
own database. `/api/business-filings` now acts only as a server-side proxy to:

`https://rc-financedepartment.vercel.app/api/public-tax-filing`

Tax rule loading, Taxpayer-ID/Filing-Access-Code verification, and final tax filing
storage are therefore all handled by RinCEN.

## Filing feedback
Native browser `alert()` dialogs were removed from the filing submit path. Errors
and successful submissions now use a proper portal dialog. The form only reports a
successful filing after RinCEN confirms that the ledger rows were stored.

No new environment variables or manual SQL are required.
