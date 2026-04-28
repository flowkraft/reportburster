# DataPallas UI & Documentation Navigation

= DATAPALLAS APPLICATION MENU STRUCTURE
  A complete guide to every screen, what the user can do there,
  and where to read more.
  Base URL: https://www.reportburster.com

================================================================================
TOP NAVIGATION BAR
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo]  Processing   Configuration (template) ▾   Help & Support ▾  (...) │
└─────────────────────────────────────────────────────────────────────────────┘

─── 1. PROCESSING ─────────────────────────────────────────────────────────────
     Click to go directly to the Processing area (no dropdown).
     This is where you run burst & report generation jobs, merge files, and test your setup.
     Docs: /docs/report-bursting
           /docs/report-generation

─── 2. CONFIGURATION ▾ ────────────────────────────────────────────────────────
     Dropdown shows the currently loaded configuration template name.
     Docs: /docs/configuration

     ├── [List of your configuration templates]
     │   Click any template to open its settings for editing.
     │   Docs: /docs/configuration
     │
     ├── Reports
     │   Browse, create, duplicate, or delete configuration templates.
     │   Each template defines how a specific report type is split,
     │   generated, and distributed. Toggle visibility, restore defaults.
     │   Docs: /docs/configuration
     │
     └── Connections (Email, Databases)
         Manage reusable email server and database connection profiles.
         Create, edit, test, duplicate, or delete connections. Set one
         as default so new templates inherit it automatically.
         Docs: /docs/data-exploration/database-connections
               /docs/report-distribution-email

─── 3. HELP & SUPPORT ▾ ──────────────────────────────────────────────────────

     ├── Get Software Support
     │   Contact support@reportburster.com — includes instructions
     │   on which log files to attach for faster troubleshooting.
     │   Docs: /docs/troubleshooting
     │
     ├── DataPallas Services
     │   Learn about professional services: custom scripting,
     │   branded email templates, and managed document solutions.
     │
     ├── Apps / Starter Packs / Extra Utils
     │   Browse and install additional apps, starter packs, and
     │   Docker/extra utility packages to extend DataPallas.
     │   Docs: /docs/advanced/work-well-apps
     │
     ├── Documentation
     │   Quick links to the QuickStart guide (5-minute setup),
     │   the full User Guide, and Advanced Scenarios (scripting).
     │   Docs: /docs  /docs/quickstart  /docs/advanced
     │
     ├── Examples
     │   Real-world use cases: report distribution, Crystal Reports
     │   bursting, payslip emailing — with "Try It" demonstrations.
     │   Docs: /testimonials/report-distribution-software
     │         /testimonials/crystal-reports-distribution
     │         /testimonials/email-payslips
     │
     ├── Customer Reviews
     │   Testimonials from organizations showing how they use
     │   DataPallas.
     │
     ├── DataPallas Blog
     │   Live feed of the latest blog posts about report distribution
     │   tips, new features, and best practices.
     │   URL: /blog
     │
     ├── System Diagnostics / Update
     │   [Desktop app only] Check Java installation, verify system
     │   requirements, and update DataPallas to the latest version.
     │   Docs: /docs/server/installation
     │
     ├── License
     │   View and manage your license key, see edition details.
     │
     └── About
         Version information, licensing options (commercial or SSPL
         open-source), and copyright details.

─── RIGHT SIDE OF NAVBAR ──────────────────────────────────────────────────────
     ├── Request New Feature — Opens a form to suggest a new feature.
     ├── support@reportburster.com — Quick link to support.
     └── Theme/Skin selector — Change the application's visual theme.


================================================================================
LEFT SIDEBAR MENUS (one per area)
================================================================================
When you enter an area, the left sidebar shows its dedicated menu.


━━━ PROCESSING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "ACTIONS"

     ├── Processing
     │   Select a PDF or Excel file and click "Burst" to split it into
     │   individual documents based on burst tokens. Monitor progress
     │   and view job results in real time.
     │   Docs: /docs/report-bursting
     │
     ├── Merge -> Burst
     │   Combine multiple PDF files into one merged document, then
     │   optionally burst the result. Drag to reorder before merging.
     │   Docs: /docs/report-bursting
     │
     ├── Quality Assurance
     │   Test your configuration before going live. Choose test modes:
     │   test all tokens, random tokens, or specific values. Start a
     │   built-in test email server to catch and inspect outgoing
     │   emails safely — nothing gets delivered for real.
     │   Docs: /docs/report-distribution-qa
     │
     ├── Logging, Tracing
     │   View detailed logs from all completed jobs (burst, merge,
     │   QA). Search and filter to diagnose issues.
     │   Docs: /docs/troubleshooting
     │
     └── Samples - Try All
         Browse built-in sample configurations that demonstrate
         different capabilities (splitting, emailing, report
         generation). Each sample has a "Try It" button so you
         can run it immediately and see how it works.
         Docs: /docs/quickstart


━━━ CONFIGURATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "CONFIGURATION" + (currently loaded template name)

     ├── General
     │   Set the burst token pattern (how documents are split), the
     │   output folder where burst files are saved, and the quarantine
     │   folder for documents that fail during processing.
     │   Docs: /docs/configuration
     │
     ├── Reporting
     │   Configure report generation settings: data source (SQL query,
     │   script, CSV, Excel, XML), output template (HTML, FreeMarker,
     │   FOP, JasperReports), and output format (PDF, Excel, etc.).
     │   Configure Data Tables (rb-tabulator), Charts (rb-chart), and
     │   Pivot Tables (rb-pivot-table) — define their data sources,
     │   appearance, and behavior through DSL configurations.
     │   [Only visible if the template has report generation enabled]
     │   Docs: /docs/report-generation
     │         /docs/report-generation#supported-data-sources
     │         /docs/report-generation#output-formats
     │         /docs/report-generation/jasperreports
     │         /docs/bi-analytics/web-components/datatables
     │         /docs/bi-analytics/web-components/charts
     │         /docs/bi-analytics/web-components/pivottables
     │
     ├── Enable / Disable Delivery
     │   Master toggle switches for each delivery method: Email,
     │   Upload (FTP/cloud), Web Portal, SMS. Turn them on or off
     │   independently. Each toggle links to its detailed settings.
     │   Docs: /docs/report-distribution-email
     │         /docs/report-distribution-upload
     │
     ├── Email
     │   Configure how documents are emailed: subject line, message
     │   body (supports variables like ${burst_token}), attachments,
     │   and which SMTP connection to use. Test with a single click.
     │   Docs: /docs/report-distribution-email
     │         /docs/variables
     │   │
     │   └── Cloud Email Providers
     │       Reference guide for supported cloud email services:
     │       Office 365, Google, Amazon SES, Mailgun, SendGrid,
     │       SparkPost, Mandrill — with setup tips for each.
     │       Docs: /docs/report-distribution-email
     │
     ├── Upload
     │   Configure cloud/FTP upload commands using curl syntax.
     │   Supports variables for dynamic file paths and URLs so
     │   each burst document uploads to the right destination.
     │   Docs: /docs/report-distribution-upload
     │         /docs/advanced/curl
     │
     ├── Documents2Web
     │   Configure how documents are published to a self-service
     │   web portal where recipients can view and download them.
     │   Docs: /docs/document-portal
     │
     ├── SMS
     │   Configure SMS notifications: sender number, recipient
     │   number, and message text with variable support.
     │   Docs: /docs/variables
     │   │
     │   └── Twilio
     │       Twilio-specific SMS configuration details.
     │
     ├── Quality Assurance
     │   Configure the test email server used during QA testing:
     │   server URL, SMTP host, port, credentials, and SSL settings.
     │   Docs: /docs/report-distribution-qa
     │   │
     │   └── Test Email Server
     │       Detailed test email server connection settings.
     │       Docs: /docs/report-distribution-qa
     │
     └── Advanced
         Fine-tune processing behavior: delay between distributions,
         user-defined variables, burst token delimiters, two-stage
         splitting, and incubating/experimental features.
         Docs: /docs/advanced
               /docs/advanced/scripting
               /docs/variables
         │
         └── Error Handling
             Control what happens on failure: stop everything on
             first error, or continue processing remaining documents.
             Configure automatic retry with delays and max attempts.
             Docs: /docs/advanced


━━━ REPORTS (Configuration Templates) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Browse all configuration templates in a table view. Create new
     templates, duplicate existing ones, edit names and capabilities,
     toggle visibility, or delete. The default template (settings.xml)
     is always present and acts as the fallback when no specific
     template is defined for a report.
     Docs: /docs/configuration


━━━ CONNECTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Manage reusable connection profiles for email servers and databases.
     Create new email or database connections, edit credentials, test
     connectivity, set one as default, duplicate, or delete. Templates
     reference these connections by name so you configure credentials
     once and reuse them everywhere.
     Docs: /docs/data-exploration/database-connections
           /docs/report-distribution-email


━━━ HELP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "HELP"

     ├── Get Software Support
     │   Contact support@reportburster.com — includes instructions
     │   on which log files to attach for faster troubleshooting.
     │   Docs: /docs/troubleshooting
     │
     ├── DataPallas Services
     │   Learn about professional services: custom scripting,
     │   branded email templates, and managed document solutions.
     │
     ├── Apps / Starter Packs
     │   Browse and install additional apps, starter packs, and
     │   Docker/extra utility packages to extend DataPallas.
     │   Docs: /docs/advanced/work-well-apps
     │
     ├── Documentation
     │   Quick links to the QuickStart guide, User Guide, and
     │   Advanced Scenarios.
     │   Docs: /docs  /docs/quickstart  /docs/advanced
     │
     ├── Examples
     │   Real-world use cases with demonstrations.
     │   Docs: /testimonials/report-distribution-software
     │         /testimonials/crystal-reports-distribution
     │         /testimonials/email-payslips
     │
     ├── Customer Reviews
     │   Testimonials from organizations using DataPallas.
     │
     ├── DataPallas Blog
     │   Latest blog posts about features and best practices.
     │   URL: /blog
     │
     ├── System Diagnostics / Update
     │   [Desktop app only] Check Java, verify system requirements,
     │   update to the latest version.
     │   Docs: /docs/server/installation
     │
     ├── License
     │   View and manage your license key.
     │
     └── About
         Version and copyright information.


================================================================================
DOCUMENTATION SITE MAP (https://www.reportburster.com/docs)
================================================================================

**Stay current:** The site map above may become outdated. If you hit a 404, if something feels incomplete, or if you just haven't checked in a while — fetch https://www.reportburster.com/docs to see the latest documentation structure. Use your judgement on when to refresh, like a human would.

For complete reference, the documentation is organized as follows:

  Getting Started
    /docs/quickstart .................. QuickStart in 5 Minutes

  DataPallas Server
    /docs/server ...................... Overview
    /docs/server/installation ......... Installation & Setup
    /docs/server/scheduling ........... Scheduling & Automation

  Core Concepts
    /docs/artificial-intelligence ..... AI Features
    /docs/report-bursting ............. Report Bursting
    /docs/configuration ............... Report Configuration
    /docs/variables ................... Variables & Templating
    /docs/report-distribution-email ... Email Distribution
    /docs/report-distribution-upload .. Upload & Archive
    /docs/report-distribution-qa ...... Quality Assurance

  Data Exploration
    /docs/data-exploration ............ Overview
    /docs/data-exploration/database-connections .. DB Connections
    /docs/data-exploration/chat2db-ai . Chat2DB AI

  Report Generation
    /docs/report-generation ........... Overview
    /docs/report-generation#supported-data-sources .. Data Sources
    /docs/report-generation#output-formats .. Output Formats
    /docs/report-generation#report-parameters .. Report Parameters
    /docs/report-generation#report-templates-examples-gallery .. Samples & Walkthroughs
    /docs/report-generation/ai-powered-reporting .. AI-Powered Reporting
    /docs/report-generation/jasperreports .. JasperReports
    /docs/report-generation/large-scale .. Large-Scale Report Generation

  Document Portal
    /docs/document-portal ............. Overview
    /docs/document-portal/quickstart .. Quick Start
    /docs/document-portal/payslips .... Payslips Portal (HR)
    /docs/document-portal/invoices .... Invoices Portal (Billing)
    /docs/document-portal/payments .... Distribution & Payments
    /docs/document-portal/user-management .. User Management
    /docs/document-portal/notifications .. Notifications
    /docs/document-portal/development-stacks .. Dev Stacks

  Business Intelligence & Analytics
    /docs/bi-analytics ................ Overview
    /docs/bi-analytics/data-warehouse-olap .. Data Warehouse & OLAP
    /docs/bi-analytics/dashboards ..... Dashboards
    /docs/bi-analytics/web-components . Web Components Overview
    /docs/bi-analytics/web-components/datatables .. Data Tables
    /docs/bi-analytics/web-components/charts ...... Charts
    /docs/bi-analytics/web-components/pivottables . Pivot Tables
    /docs/bi-analytics/web-components/parameters .. Report Parameters
    /docs/bi-analytics/web-components/reports ..... Reports
    /docs/bi-analytics/performance-real-time .. Performance

  AI Crew
    /docs/ai-crew/the-team ............ The Team
    /docs/ai-crew/athena .............. Athena
    /docs/ai-crew/hephaestus .......... Hephaestus
    /docs/ai-crew/hermes .............. Hermes
    /docs/ai-crew/apollo .............. Apollo
    /docs/ai-crew/chat-client-apps .... Chat Client Apps

  Advanced Scenarios
    /docs/advanced .................... Overview
    /docs/advanced/cli ................ CLI
    /docs/advanced/scripting .......... Scripting
    /docs/advanced/curl ............... cURL Integration
    /docs/advanced/work-well-apps ..... "Work Well" Apps

  Troubleshooting
    /docs/troubleshooting ............. Troubleshooting
