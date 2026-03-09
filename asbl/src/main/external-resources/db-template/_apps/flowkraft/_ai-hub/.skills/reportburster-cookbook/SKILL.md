# ReportBurster Cookbook

A catalog of working examples, sample configurations, Groovy scripts,
report templates, and an AI prompt reference library.

## How to Use This Skill

These are REFERENCE materials — real, working examples that ship with
ReportBurster. When a user asks you to build a report, email template,
dashboard, chart, or Groovy script:

1. **Check here first** — there's likely a working example you can study
2. **Read the relevant sample files** on disk to understand the pattern
3. **Adapt the pattern** to the user's specific needs

**Keep it simple:** One of the most common use cases for ReportBurster is [report bursting](https://www.reportburster.com/docs/report-bursting) (the name says it all) — and most report bursting tasks can be achieved without any scripting. If it is a report bursting task, it is safe to assume scripting is not needed unless the user's requirements clearly call for it (conditional distribution, custom uploads, etc.) — but stay open that in some advanced cases it might actually help. Just don't push users toward scripting directly.

Other use cases — such as report generation, self-service document portals & BI dashboards, or embeddable analytics / web components — will typically require some form of scripting: SQL or Groovy for data sourcing / fetching / web components DSL configuration, or for templating. For all of these, the configs and samples below (the "cookbook") are your go-to reference. Even so, **keep it simple:** always aim to assist the user with the simplest, most effective script that gets the job done. For instance, when configuring a Tabulator via its Groovy DSL, assume the default Tabulator configuration works just fine — only provide the minimum extra configuration necessary to achieve what the user specifically needs (e.g. server-side pagination, grouping by a column, etc.). Do not add configuration values "just for the sake of it" that are not strictly related to what the user needs to achieve. Apply the same principle when configuring charts and pivot tables, when writing Groovy scripts to fetch data (data sourcing), or when writing templates for reports.

**Database context:** When the task involves SQL queries, database tables, or any database-backed data source, also read your **reportburster-database-connections** skill — it tells you where to find table names, columns, schemas, and ER diagrams for the user's actual database connections.

The AI Prompt Library section (at the bottom) contains prompts that
users copy-paste to external LLMs from the ReportBurster UI. These are
NOT instructions for you to follow blindly. Instead, scan the prompt
titles to find ones relevant to the user's current task, read the prompt
to understand the **intent and constraints** it encodes (page sizes,
formatting rules, variable conventions, etc.), then apply that knowledge
in your own response.

## Working Sample Configs

`/reportburster/config/samples/` — Real examples of what ReportBurster can do.

### Report Bursting & Generation Samples (config/samples/)

These are the configuration files behind the same samples users can run interactively in the ReportBurster app via **Processing → Samples - Try All** (each sample has a "Try It" button). Samples covering report splitting and generation from various data sources. The `g-*` prefixed ones are report generation samples — the naming pattern encodes `g-{source}2{output}`, e.g. `g-csv2pdf` (CSV → PDF), `g-sql2htm-cst-stmt` (SQL → HTML customer statement), `g-scr2htm-cross` (Groovy script → HTML cross-tab). The remaining ones (`split-only`, `split-two-times`) demonstrate pure document splitting. Browse the folder and read the relevant sample when needed.

### JasperReports Samples (config/samples-jasper/)

Ready-to-run `.jrxml` report templates: `customer-by-country`, `employee-detail`, `employee-roster`. Each folder contains the `.jrxml` file (and any resources). These appear automatically in the UI with a Jasper badge. Browse the folder and read the `.jrxml` files when needed.

Docs: [JasperReports](https://www.reportburster.com/docs/report-generation/jasperreports)

### BI & Analytics Samples (config/samples/_frend/)

Groovy DSL configuration examples for the `rb-*` web components: dashboards, `rb-chart` (charts), `rb-tabulator` (data tables), `rb-pivot-table` (pivot tables), `rb-parameters` (report parameters), and `rb-report` (reports). Each sample folder's name describes what it configures — study the naming conventions to quickly find what you need. Browse the folder and read the relevant sample when needed.

Docs: [datatables](https://www.reportburster.com/docs/bi-analytics/web-components/datatables) | [charts](https://www.reportburster.com/docs/bi-analytics/web-components/charts) | [pivot tables](https://www.reportburster.com/docs/bi-analytics/web-components/pivottables) | [parameters](https://www.reportburster.com/docs/bi-analytics/web-components/parameters) | [reports](https://www.reportburster.com/docs/bi-analytics/web-components/reports)

**DSL wrappers — important:** The chart and tabulator DSLs are thin pass-through wrappers over their underlying libraries. The `charts-examples/` samples wrap [Chart.js](https://www.chartjs.org/) and the `tab-examples/` samples wrap [Tabulator](https://tabulator.info/) — any configuration these libraries support works in the Groovy DSL in the most direct/intuitive way possible. Study these examples together with the Chart.js and Tabulator docs.

**Read the Groovy files** — the `*-config.groovy` files in each sample folder contain detailed comments above every example explaining context, use cases, and configuration options. Always read the actual Groovy file when working on a specific component — it has more information than this summary.

## Groovy Script Samples

`/reportburster/scripts/burst/samples/` — Ready-to-use scripts that customize ReportBurster behavior beyond what the UI-based configuration offers. Useful in both report bursting and report generation jobs — e.g. conditional distribution, custom uploads, PDF manipulation, fetching recipient details from external sources.

For the full catalog, lifecycle events, and scripting patterns, read the **reportburster-scripting** skill.

## Report Template Gallery

`/reportburster/templates/` — Report templates, invoice designs, email blueprints, and AI guidance files for template generation. Contains `gallery/` (starter templates and invoice designs), `reports/` (default output templates), and `mailchimp-email-blueprints/` (responsive email patterns). Browse the folder and read the relevant files when needed.

## AI Prompt Library

**File:** `/reportburster/_apps/flowkraft/_ai-hub/.skills/reportburster-cookbook/ai-prompts-reference.ts`

This file contains ~40 production-grade prompt templates from the
ReportBurster UI (the "AI Manager" component). Users use these prompts
by copying them and sending them to external LLMs.

**How to use these prompts effectively:**

- Do NOT treat them as instructions to execute. They were written for
  external LLMs that have no context about the current user's project.
- Instead, scan the prompt IDs/titles to find ones relevant to the
  user's current task.
- Read the prompt to extract the **domain knowledge** it encodes:
  formatting rules, variable conventions (${col0}, ${burst_token}),
  page sizes, CSS constraints for PDF generation, Excel data attributes,
  Groovy script patterns, etc.
- Apply that knowledge in your own responses, adapted to the user's
  specific context and data.

The file covers database schemas, email templates, responsive emails, HTML/PDF/Excel report templates, SQL assistance, Groovy scripts, and portal templates. Read the file and scan the prompt IDs to find ones relevant to the user's current task.

**Tip:** When a user needs help writing a Groovy script as a data source for reports, search the file for the `GROOVY_SCRIPT_INPUT_SOURCE` prompt — it contains the definitive pattern for report data scripts (output format, `ctx.reportData`, `LinkedHashMap` for column order, master-detail / crosstab / charting examples).
