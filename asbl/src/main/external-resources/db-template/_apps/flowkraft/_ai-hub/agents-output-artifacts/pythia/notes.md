# Pythia — Working Notes

## WordPress vs Grails/Next.js: Key Differences

| Aspect           | WordPress (PODS)              | Grails / Next.js              |
|------------------|-------------------------------|-------------------------------|
| Data model       | PODS CPT in WP Admin UI       | Code (domain classes / schema)|
| Migrations       | None needed — PODS handles it | Liquibase / Drizzle push      |
| Templates        | PHP files in theme dir        | GSP views / React components  |
| Access control   | associated_user field + PHP   | Session + controller logic    |
| Payment          | Forminator plugin (free)      | Custom Stripe/PayPal code     |
| Publishing       | REST API from Groovy script   | Direct DB insert              |

## The 3-File Pattern

Every document type I build follows the same recipe:
1. **single-{cpt}.php** — individual document view with access control
2. **page-my-documents.php** — filtered list with pagination and search
3. **endExtractDocument.groovy** — ReportBurster automation script

The access control chain is always the same:
`allow_public_view` -> require login -> `associated_user` ownership -> groups -> roles

## Plugin Wins

Forminator alone saved us from writing ~500 lines of custom payment gateway code.
It handles Stripe + PayPal out of the box with a form builder UI. The only custom
work is linking the "Pay Invoice" button to a Forminator payment form and updating
the document_status field on success.

## PODS Tips
- Always enable REST API on the Pod — needed for ReportBurster publishing
- User Relationship field (`associated_user`) is the cornerstone of access control
- Use `pods_api()->load_pod()` to check if a field exists at runtime before filtering
- `$pod->field()` returns raw values; `$pod->display()` returns formatted/escaped values
- For line items, a JSON textarea field works well — no need for a repeater field
