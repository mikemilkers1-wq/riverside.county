# Riverside County Government v1.0.3

## Filing accuracy
Added a prominent pre-certification warning instructing filers to double-check or
triple-check Taxpayer ID, legal name, dates, amounts, classifications, direction
and descriptions before submission.

## Transaction date validation
Dates are limited in the browser to 1900 through today. The server independently
requires an exact `YYYY-MM-DD` date with a four-digit year, rejects invalid
calendar dates, and rejects future dates.

## Multi-line business return
One Business Transaction Activity Return may now contain up to 25 activity lines.
Each line has its own:
- transaction date
- activity classification
- income / expense direction
- amount
- description

This allows a filer to report several kinds of business activity in one return
instead of pretending an entire filing can contain only one classification.

## Expense treatment
Expense lines no longer generate a negative tax liability. They are stored as
`deduction_amount`; their estimated deduction effect can reduce the filing's
gross assessment, but the net assessment is floored at zero.

The filing receipt separately shows:
- gross estimated assessment
- estimated deduction effect
- net estimated assessment
- number of activity lines

## Shared ledger grouping
All lines in one public return share a `filing_reference` such as
`RC-BT-2026-0000001`, while each ledger row still keeps its own CTX reference.

No manual SQL or new environment variables are required.
