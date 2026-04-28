# dsl/jsononly

Widget options DTOs that are **JSON-only today** — no Groovy DSL, no parser,
no serializer. The `displayConfig` for these widgets travels as a plain JSON
object inside the canvas state and, at export time (Phase 6 of
CANVAS-SYNC-PLAN), is written as `g-dashboard-{widgetId}-config.json` next
to the DSL-powered `.groovy` sidecars.

**Widgets covered:** Value (Number), Detail, Gauge, Progress, Sankey, Trend, Map.

**Why JSON-only?** Each of these has a small, flat option shape (field
pickers, format strings, a goal, a region). A Groovy DSL would add ceremony
without user value. The visual config panel is the single source of truth.

**Promotion path.** If real-world usage demands expressions, conditionals,
or computed fields for any of these widgets, the widget graduates to its
own `dsl/{widget}/` sibling package with `Options` + `OptionsScript` +
`OptionsParser` — same layout as `chart/`, `tabulator/`, `pivottable/`,
`filterpane/`, `cube/`. The JSON DTO here becomes the Options DTO there;
nothing else is lost. Promotion is additive, not breaking.

**Contract invariant.** The fields in each `*Options.java` MUST match the
`options` prop shape of the corresponding `<rb-{widget}>` Svelte component
in `frend/rb-webcomponents/src/wc/`. Keep them in sync — drift is silent
and breaks Phase 6 export.
