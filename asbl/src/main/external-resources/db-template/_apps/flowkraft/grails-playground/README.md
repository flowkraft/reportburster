# FlowKraft Unified App

A unified Grails 7 application combining admin panel and customer portal functionality for managing payslips and invoices with integrated payment processing.

## Features

### Admin Panel (`/admin`)
- **Dashboard**: Overview statistics for payslips, invoices, revenue, and pending items
- **Payslip Management**: CRUD operations, send to employees, download PDFs
- **Invoice Management**: CRUD operations, send to customers, mark as paid, track overdue
- **Settings**: Company info, invoice/payslip prefixes, payment method configuration

### Customer Portal (`/`)
- **Home Page**: Overview of recent payslips and invoices
- **My Payslips**: View and download payslips
- **My Invoices**: View, download, and pay invoices online

### Payment Integration
- **Stripe**: Credit/debit card payments via Stripe Elements
- **PayPal**: PayPal checkout integration

## Project Structure

```
app/
├── grails-app/
│   ├── controllers/com/flowkraft/
│   │   ├── AdminController.groovy       # Admin dashboard & settings
│   │   ├── PayslipController.groovy     # Admin payslip CRUD
│   │   ├── InvoiceController.groovy     # Admin invoice CRUD
│   │   ├── PaymentController.groovy     # Payment API endpoints
│   │   ├── HomeController.groovy        # Portal home
│   │   ├── PortalPayslipController.groovy
│   │   ├── PortalInvoiceController.groovy
│   │   └── UrlMappings.groovy
│   ├── domain/com/flowkraft/
│   │   ├── Payslip.groovy              # Employee payslip domain
│   │   └── Invoice.groovy              # Customer invoice domain
│   ├── services/com/flowkraft/
│   │   ├── StripeService.groovy        # Stripe payment integration
│   │   └── PayPalService.groovy        # PayPal payment integration
│   └── views/
│       ├── layouts/
│       │   ├── admin.gsp               # Admin layout with dark sidebar
│       │   └── portal.gsp              # Portal layout with top nav
│       ├── admin/                      # Admin dashboard & settings
│       ├── payslip/                    # Admin payslip views
│       ├── invoice/                    # Admin invoice views
│       ├── home/                       # Portal home
│       ├── portalPayslip/              # Customer payslip views
│       └── portalInvoice/              # Customer invoice views
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Quick Start

### Development Mode

```bash
# Navigate to app directory
cd app

# Run with Grails
./grailsw run-app

# Or with Gradle
./gradlew bootRun
```

Access the app at:
- Portal: http://localhost:8080/
- Admin: http://localhost:8080/admin

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Application port | `8080` |
| `GRAILS_ENV` | Grails environment | `development` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_test_placeholder` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_placeholder` |
| `PAYPAL_CLIENT_ID` | PayPal client ID | `ATe_placeholder` |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | `secret_placeholder` |
| `PAYPAL_API_BASE` | PayPal API base URL | `https://api-m.sandbox.paypal.com` |

## URL Routes

### Portal Routes
- `GET /` - Home page
- `GET /payslips` - Customer payslip list
- `GET /payslips/:id` - View payslip
- `GET /invoices` - Customer invoice list
- `GET /invoices/:id` - View invoice
- `GET /invoices/:id/pay` - Pay invoice

### Admin Routes
- `GET /admin` - Dashboard
- `GET /admin/settings` - Settings page
- `GET /admin/payslips` - Payslip list
- `GET /admin/payslips/create` - Create payslip
- `GET /admin/payslips/:id` - View payslip
- `GET /admin/payslips/:id/edit` - Edit payslip
- `GET /admin/invoices` - Invoice list
- `GET /admin/invoices/create` - Create invoice
- `GET /admin/invoices/:id` - View invoice
- `GET /admin/invoices/:id/edit` - Edit invoice

### Payment API
- `POST /payment/stripe/create-intent` - Create Stripe PaymentIntent
- `POST /payment/stripe/confirm` - Confirm Stripe payment
- `POST /payment/paypal/create-order` - Create PayPal order
- `POST /payment/paypal/capture-order` - Capture PayPal order

## Technology Stack

- **Backend**: Grails 7, Groovy, GORM/Hibernate
- **Frontend**: GSP, Bootstrap 5, AdminLTE v4
- **Icons**: Bootstrap Icons
- **Database**: H2 (embedded), PostgreSQL (production)
- **Payments**: Stripe, PayPal
- **Container**: Docker, Docker Compose

## CSS Framework

The app uses **AdminLTE v4** with **Bootstrap 5** for consistent styling:
- Dark sidebar navigation in admin panel
- Light/dark theme toggle
- Responsive design
- Modern card-based layouts

## License

MIT License
