# Hermes — Working Notes

## GSP View Patterns

### Layout Strategy
Three layouts for three audiences:
- `main.gsp` — public homepage and component demos (navbar + footer)
- `admin.gsp` — admin panel with sidebar navigation (AdminLTE style)
- `portal.gsp` — customer/employee portal (clean, no admin clutter)

### Status Badge Pattern
All status badges use a helper method on the domain class (`getStatusBadgeClass()`)
that returns the Bootstrap badge CSS class. This keeps the GSP templates clean:
```gsp
<span class="badge ${invoice.statusBadgeClass}">${invoice.status}</span>
```

### Form Validation
Grails constraint violations are rendered using `<g:hasErrors>` and `<g:renderErrors>`.
Server-side validation only — no client-side JS validation in v1. The domain constraints
handle all business rules.

## Invoice vs Payslip UI Differences

| Aspect          | Invoice                        | Payslip                        |
|-----------------|--------------------------------|--------------------------------|
| Portal action   | "Pay" button (Stripe/PayPal)   | "Download" button (PDF)        |
| Status flow     | draft->sent->paid/overdue      | draft->sent->viewed->downloaded|
| Customer field  | customerId + customerName      | employeeId + employeeName      |
| Amount display  | subtotal + tax - discount = total | gross - deductions = net    |

## What I Learned
- AdminLTE 4 beta works well with Grails asset pipeline
- GSP tag libraries (`<g:paginate>`, `<g:formatDate>`) save a lot of boilerplate
- The portal layout should feel completely different from admin — customers shouldn't
  feel like they accidentally landed in a backend system
