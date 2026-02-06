# Athena — Working Notes

## Data Model Decisions

### Invoice: Why flat fields instead of line items table?
For the Grails playground, we kept line items as a flat subtotal/tax/discount/total model.
The Next.js version mirrors this. If a future version needs per-line-item tracking, we'd
add an `InvoiceLineItem` entity with FK to `Invoice`. For now, the flat model is simpler
and covers the demo use case. The WordPress version uses `line_items_json` (JSON array in
a text field) which is a middle ground — structured but no join table.

### Payslip: gross - deductions = net
Kept it deliberately simple. Real payroll has dozens of earning/deduction categories.
For the demo portal, a single `deductions` field and calculated `netAmount` is enough to
demonstrate the pattern. The PRD makes this clear: we're showing the workflow, not building
actual payroll software.

### Settings: Key-Value over Structured Config
Both Grails and Next.js use a `settings` table with key/value pairs. This avoids schema
changes when adding new settings. Categories group related settings for the UI.

## Patterns Used Across All Stacks

| Pattern                | Grails           | Next.js          | WordPress (Pythia)         |
|------------------------|------------------|------------------|----------------------------|
| Data model             | GORM domains     | Drizzle schema   | PODS Custom Post Types     |
| Invoice number format  | INV-YYYY-NNN     | INV-YYYY-NNNN    | post title                 |
| Status lifecycle       | enum in domain   | enum in schema   | dropdown field             |
| Payment integration    | Service classes   | API routes       | Forminator plugin          |
| Admin panel            | GSP + AdminLTE   | App Router + shadcn | WP Admin + custom plugin |
| Customer portal        | GSP + portal layout | separate routes | single-{cpt}.php template |

## Open Questions
- Should we add email notifications when invoice status changes? (Not in v1)
- Multi-currency support: display only, or actual FX conversion? (Display only for now)
