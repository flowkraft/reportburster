# Internal: BI Supporting Information (Power BI / Tableau mapping)

**Intended audience:** internal docs writers, support engineers, and product marketers. This page is _not_ public — it contains comparative notes to help explain how Power BI / Tableau workflows map to ReportBurster for internal training and doc-writing purposes.

---

## High-level mapping (why this is useful)
- Purpose: give concise equivalents so we can explain customer workflows in product-appropriate language without copying external docs verbatim.
- Keep this page internal. When we produce public docs, reference only ReportBurster capabilities (UI, AI assistants, embeddable components, Portal, etc.).

---

## Workflow mappings — Power BI / Tableau → ReportBurster (short)

- Data ingestion & prep
  - Power BI / Tableau: connectors + Power Query / Tableau Prep.
  - ReportBurster: create a Report via the UI; use the **Connection Details** (schema explorer, ER diagram) and **AI tools (Chat2DB / AI Prompts)** to generate SQL or Groovy transformations. UI saves the generated scripts/config files automatically.

- Modeling & calculations
  - Power BI / Tableau: measures and calculated columns.
  - ReportBurster: derive fields in SQL/Groovy via UI prompts or the script editor; K PIs can be computed in preprocess scripts and exposed in visuals.

- Visual authoring
  - Power BI / Tableau: drag-and-drop visuals on canvas.
  - ReportBurster: define visuals in Report configuration (Tabulator, Chart, Pivot) using UI controls or accept AI-generated configs; render using `rb-*` web components.

- Interactivity (filters, slicers, drill)
  - Power BI / Tableau: slicers, cross-filtering.
  - ReportBurster: `rb-parameters` drives report queries; components listen to shared params and `fetchData(params)` for linked interactivity and drill-through actions.

- Dashboards & storytelling
  - Power BI / Tableau: assemble pages, bookmarks, story points.
  - ReportBurster: assemble components in Portal pages or embedded layouts; save parameter views and publish.

- Publish / Embed
  - Power BI / Tableau: publish to service, embed via APIs.
  - ReportBurster: publish to the Self-Service Portal via the Apps manager or embed `<rb-report>` / `<rb-tabulator>` etc. — components fetch server config automatically; use `report-code`, `api-base-url`, `api-key`.

- Scheduling & automation
  - Power BI / Tableau: scheduled refreshes and alerts.
  - ReportBurster: schedule jobs and bursting; use Groovy scripts or CLI/REST for automation; AI can scaffold scripts when requested via UI prompts.

- Security & access control
  - Power BI / Tableau: RLS and workspaces.
  - ReportBurster: Portal user provisioning, API key usage, and server-side access checks; ensure docs explain how to limit access via Portal roles.

- Advanced analytics
  - Power BI / Tableau: R/Python, external services.
  - ReportBurster: advanced transformations in Groovy or calling external services from scripts; results shown via normal visuals.

---

## Practical notes for docwriters & support
- Never place direct Power BI / Tableau instructions in public docs — use this internal page for comparisons and to craft messaging that highlights ReportBurster's unique approach (UI-first, AI-assisted, embedded web components, server-as-source-of-truth).
- Emphasize the things customers care about:
  - "No manual files/folders" — reports are created in the UI and saved to server config automatically.
  - "AI-assisted scripting" — Chat2DB and AI Prompts help generate SQL/Groovy for users who don't know Groovy.
  - "Embeddable components" — copy/paste `<rb-report>` etc. for quick embedding.
- Link to internal implementation helpers and samples when writing guides:
  - `frend/rb-webcomponents/README.md` (component usage and API endpoints)
  - `frend/reporting/src/app/components/connection-details/connection-details.template.html` (schema explorer and connection helpers)
  - `frend/reporting/src/app/components/ai-manager/*` (AI prompts & Chat2DB integration)

---

## Example sales-dashboard note (internal summary)
- Customer flow: Create Report in UI → Use Schema Explorer + "Get Sales YTD by region" AI prompt → Accept generated SQL & preview → Add Chart/Tabulator/Pivot in UI → Publish to Portal or embed with `<rb-report report-code="sales-summary" ...>` → Optionally schedule bursting.

---

Keep this page up to date as the AI tooling or Portal features evolve; use it to inform public docs but never publish direct Power BI/Tableau step-by-step copies.
