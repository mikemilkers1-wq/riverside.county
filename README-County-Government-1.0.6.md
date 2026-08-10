# Riverside County Government v1.0.6 — Whole-Dollar Tax Model

The County tax filing system now follows the Roblox economy's whole-dollar rule.

- Filing amounts must be positive whole-dollar integers (`1`, `40`, `200`).
- Decimal amounts such as `2.50`, `40,50`, or `40.50` are rejected client- and server-side.
- Each activity line's assessment or deduction effect is rounded to the nearest whole dollar.
- Filing totals and receipts contain whole-dollar tax amounts only.
- Existing Filing Access Code protection and German interface remain in place.
- The official government trust banner remains English by request.

No manual SQL or new environment variable is required.
