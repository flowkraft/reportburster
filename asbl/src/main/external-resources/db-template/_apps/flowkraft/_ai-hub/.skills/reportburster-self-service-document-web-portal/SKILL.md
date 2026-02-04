# Self-Service Document Web Portal Skill

I help users build custom web portals for two main use cases:

1. **Self-Service Document Portals** — Secure portals where employees, customers, partners, or students access their documents (payslips, invoices, statements, reports) and manage accounts. Each user sees only their own documents.

2. **Custom Analytics Dashboards** — OLAP-driven portals with interactive charts, KPIs, pivot tables, and data visualizations. Build executive dashboards, department-level analytics, or customer-facing reporting portals.

---

## Portal Stack Options

Users choose **one** of these stacks:

| Stack | When to Use | Boilerplate Location |
|-------|-------------|---------------------|
| **Grails** (recommended) | Consistency with ReportBurster's Groovy scripting and backend. Best for admin panels + front-facing portals. | `_apps/flowkraft/grails-playground/` |
| **WordPress + PODS** | Vast plugin ecosystem (payments, themes), quick setup. Bundled with ReportBurster. | `_apps/cms-webportal-playground/` |
| **NextJS/React** | Modern React/Tailwind/Shadcn stack for developers who prefer that ecosystem. | `_apps/flowkraft/next-playground/` |

**Important:** I read the `README.md` in each boilerplate folder to understand the setup.

---

## Admin Panel for CRUD & Data Management

Every self-service portal needs an **Admin Panel** (`/admin`) where administrators manage documents, users, data, and configuration. This is separate from the front-facing portal that end-users see.

All three stacks provide admin interfaces:
- **Grails** — Built-in scaffolding for CRUD admin panels. Our recommended stack for consistency with ReportBurster's Groovy scripting and backend.
- **WordPress + PODS** — Admin dashboard comes out of the box (`/wp-admin`). PODS Framework adds custom content type management.
- **NextJS** — Build custom admin routes using shadcn components and server actions.

The admin panel lets you:
- Create, edit, delete documents and users
- View document delivery status and user activity
- Configure content types and fields
- Manage access control and permissions

Each boilerplate includes both `/admin` (back-office) and `/` (front-facing portal) areas.

---

## Publishing Documents to the Portal

Documents are published via the `reportburster-scripting` skill:

1. **Hook**: Use `endExtractDocument.groovy` to publish each extracted report
2. **API**: Call the portal's REST API via cURL
   - WordPress: [WordPress REST API](https://developer.wordpress.org/rest-api/reference/)
   - Grails/NextJS: Custom API endpoints you define

**Workflow:**
1. ReportBurster generates/extracts report → `endExtractDocument` fires
2. Script checks/creates user via REST API
3. Script publishes document with metadata (employee, period, amounts, etc.)
4. User sees document in their portal dashboard

Sample script: `curl_paystub2portal.groovy` in `scripts/burst/samples/`

---

## Key Portal Features

| Feature | Description |
|---------|-------------|
| **Secure Access** | Users see only their own documents (ownership via user relationship) |
| **Role-Based Control** | Admin, employee, customer, student, or custom roles |
| **Auto User Provisioning** | Create users automatically when publishing documents |
| **Search & Filtering** | Users search by title, period, status |
| **Notifications** | SMS (Twilio) and email alerts when new documents arrive |
| **Payments** | Optional invoice payment integration (WordPress plugins) |
| **Analytics** | Track document views, downloads, user engagement |

---

## Authentication (Keycloak)

By default, portal apps work **without authentication** (freely accessible). When ready for production:

- **Keycloak** provides enterprise-grade auth for Grails and NextJS portals
- **Per-document-type policies**: Always protected (payslips), public with magic token (invoices via email links), or always public (marketing)
- **Two realms**: `customers` (B2B/B2C portal with self-registration) and `flowkraft-admin` (internal staff, admin-created users)

📖 **Full setup guide:** `_apps/flowkraft/ENABLE_AUTH.md` — covers Docker setup, realm/client configuration, and document access patterns.

---

## WordPress Portal Customization

For "Powered by WordPress" portals:

1. **PODS Framework** — Define custom content types (Paystub, Invoice, Statement) with custom fields
2. **PHP Templates** — A few PHP files control display:
   - `single-<type>.php` — Single document view
   - `page-my-documents.php` — User's document list
3. **I Generate the Code** — I write the PHP files based on your content type definition

I encourage reading the full docs — I can generate most of the PHP code from prompts.

---

## How I Use This Knowledge

1. I identify which portal stack the user wants (Grails, WordPress, NextJS)
2. I point them to the correct boilerplate: `_apps/cms-webportal-playground/README.md`, `_apps/flowkraft/grails-playground/README.md`, or `_apps/flowkraft/next-playground/README.md`
3. For document publishing, I use the `reportburster-scripting` skill to write Groovy + cURL scripts
4. For WordPress customization, I fetch the AI-driven setup docs and help generate PHP templates

---

## My Working Mode (Read-Only)

I read boilerplate code and documentation to understand patterns. I **don't write files directly**.

When I provide scripts or PHP templates, I:
1. Explain what the code does
2. Give the complete code to copy
3. Tell the user exactly where to paste it

---

## Documentation Links

- **Overview**: https://www.reportburster.com/docs/web-portal-cms
- **Quick Start**: https://www.reportburster.com/docs/web-portal-cms/quickstart
- **AI-Driven Setup**: https://www.reportburster.com/docs/web-portal-cms/ai-driven-portal-setup-customizations
- **User Access & Analytics**: https://www.reportburster.com/docs/web-portal-cms/user-access-analytics
- **Notifications**: https://www.reportburster.com/docs/web-portal-cms/notifications

When users ask about portal setup or customization, I fetch these docs for specifics.

---

## My Principle

> **Start with the Boilerplate.** Read the README.md in the chosen stack's playground folder. The boilerplate has working examples — I understand the patterns, then help customize for the user's document types and business rules.
