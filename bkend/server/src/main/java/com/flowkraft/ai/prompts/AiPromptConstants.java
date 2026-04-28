package com.flowkraft.ai.prompts;

/**
 * Shared text blocks reused across multiple prompt definitions.
 * Keeping these here enforces DRY — edit once, reflected everywhere.
 */
public final class AiPromptConstants {

    private AiPromptConstants() {}

    // ── Multi-component note ──────────────────────────────────────────────────
    // Appended to tabulator / chart / pivot-table DSL configure prompts when
    // they are opened inside a multi-component dashboard context.
    // Also used by Angular's configuration.component.ts via AiManagerService.MULTI_COMPONENT_NOTE.
    public static final String MULTI_COMPONENT_NOTE = """
IMPORTANT — This is a Multi-Component Dashboard:
A dashboard may contain tabulators, charts, and pivot tables in the same report.
You MUST use the named (multi-component) form for ALL configurations:
  tabulator('componentId') { ... }   NOT   tabulator { ... }
  chart('componentId') { ... }       NOT   chart { ... }
  pivotTable('componentId') { ... }  NOT   pivotTable { ... }
The componentId must match across three places:
  1. ctx.reportData('componentId', data) in the Groovy data script
  2. component-id="componentId" attribute on the HTML web component
  3. The named DSL block: tabulator('componentId') { ... }

The Groovy data script below also reflects this multi-component pattern — each componentId has its own guarded data block.

For more details and examples read: https://www.reportburster.com/docs/bi-analytics/performance-real-time#multi-component-reports""";

    // ── Dashboard HTML layout rules ───────────────────────────────────────────
    // Eight CSS/layout rules for HTML dashboard templates.
    // Shared by: DashboardBuildLayout, DashboardBuildStepByStep, DashboardFromCubeDsl.
    public static final String DASHBOARD_HTML_RULES = """
1. **Visually self-contained** — this HTML will be injected into an existing page's DOM, so it MUST NOT leak styles or be affected by parent styles. Follow these CSS isolation rules strictly:
   - Wrap the entire dashboard in a single root `<div class="rb-dashboard-root">` container.
   - Start the `<style>` block with `.rb-dashboard-root { all: initial; display: block; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; }` to reset all inherited styles.
   - Add `.rb-dashboard-root *, .rb-dashboard-root *::before, .rb-dashboard-root *::after { box-sizing: inherit; }` to reset box-sizing for all children.
   - **Every CSS selector MUST be scoped** under `.rb-dashboard-root` (e.g., `.rb-dashboard-root h1 {}`, `.rb-dashboard-root .kpi-card {}`). Never use bare element selectors like `h1 {}`, `p {}`, `div {}`.
   - Use a `<style>` block (not inline styles on each element) — but every rule must be scoped under `.rb-dashboard-root`.
   - Do NOT use `<link>` tags, `@import`, or external stylesheets.
2. **No JavaScript** — no `<script>` tags. The web components are self-initializing.
3. **Layout with CSS Grid or Flexbox** — arrange components in a responsive dashboard layout. Use CSS Grid for the overall dashboard grid and Flexbox for smaller arrangements.
4. **Add HTML context around components** — include headings, section titles, summary cards, KPI boxes, or any other HTML elements that make the dashboard informative and professional. **For single values (totals, counts, averages), use `<rb-value>` with `component-id="atomicValues"`** — do not use `<rb-tabulator>` just to display a single number.
5. **Responsive design** — the dashboard should look good on different screen sizes. Use relative units and media queries where appropriate.
6. **Visual identity — cohesive color theme** — pick a color palette that fits the business domain, not random or generic blue-gray. Define colors as CSS variables in the style block for consistency. Use a dominant neutral for backgrounds, one or two accent colors for KPIs and highlights, and subtle borders or separators. Avoid the default Bootstrap look — make intentional color choices. Avoid cliché AI aesthetics (purple gradients, neon glows).
7. **Typography — clear hierarchy** — use font weight and size to create a clear visual hierarchy: dashboard title > section headings > KPI values > KPI labels > body text. KPI numbers should be large and bold — they are the first thing the eye hits. System fonts are fine but use them with intention — vary weight, size, and letter-spacing to create contrast. Do not use more than 2–3 font sizes; hierarchy comes from weight and spacing, not endless size variations.
8. **Spacing and polish** — use generous, consistent spacing between sections — white space is a design tool, not wasted space. Cards and sections should have consistent padding, border-radius, and subtle shadows or borders. Align elements to a visible grid — nothing should look randomly placed. Small details matter: consistent border-radius values, subtle hover states on interactive elements, smooth color transitions.""";
}
