// Generates all files for a valid ReportBurster dashboard from canvas state

import type { Widget, DashboardFilter } from "@/lib/stores/canvas-store";
import { buildSql } from "@/lib/data-canvas/sql-builder";

export interface ExportedFiles {
  reportCode: string;
  templateHtml: string;
  scriptGroovy: string;
  chartConfigGroovy: string;
  tabulatorConfigGroovy: string;
  pivotConfigGroovy: string;
  filterPaneConfigGroovy: string;
  parametersSpecGroovy: string;
}

interface ExportableState {
  widgets: Widget[];
  filters: DashboardFilter[];
}

export function generateExport(state: ExportableState, reportCode: string, apiBaseUrl: string): ExportedFiles {
  const dataWidgets = state.widgets.filter((w) => ["chart", "tabulator", "pivot", "kpi"].includes(w.type));

  return {
    reportCode,
    templateHtml: generateTemplate(state, reportCode, apiBaseUrl),
    scriptGroovy: generateScript(dataWidgets),
    chartConfigGroovy: generateChartConfig(state.widgets.filter((w) => w.type === "chart")),
    tabulatorConfigGroovy: generateTabulatorConfig(state.widgets.filter((w) => w.type === "tabulator")),
    pivotConfigGroovy: generatePivotConfig(state.widgets.filter((w) => w.type === "pivot")),
    filterPaneConfigGroovy: generateFilterPaneConfig(state.widgets.filter((w) => w.type === "filter-pane")),
    parametersSpecGroovy: generateParametersSpec(state.filters),
  };
}

// --- HTML Template ---

function generateTemplate(state: ExportableState, reportCode: string, apiBaseUrl: string): string {
  const { widgets } = state;

  // Build CSS grid from widget positions
  // Sort by y then x for natural reading order
  const sorted = [...widgets].sort((a, b) => a.gridPosition.y - b.gridPosition.y || a.gridPosition.x - b.gridPosition.x);

  const componentHtml = sorted.map((w) => {
    const id = widgetComponentId(w);
    const attrs = `report-code="${reportCode}" api-base-url="${apiBaseUrl}" component-id="${id}"`;

    switch (w.type) {
      case "chart":
        return `    <div class="grid-item" style="grid-column: span ${w.gridPosition.w}; grid-row: span ${w.gridPosition.h};">
      <rb-chart ${attrs}></rb-chart>
    </div>`;
      case "tabulator":
        return `    <div class="grid-item" style="grid-column: span ${w.gridPosition.w}; grid-row: span ${w.gridPosition.h};">
      <rb-tabulator ${attrs}></rb-tabulator>
    </div>`;
      case "pivot":
        return `    <div class="grid-item" style="grid-column: span ${w.gridPosition.w}; grid-row: span ${w.gridPosition.h};">
      <rb-pivot-table ${attrs}></rb-pivot-table>
    </div>`;
      case "kpi":
        return `    <div class="grid-item kpi-card" style="grid-column: span ${w.gridPosition.w}; grid-row: span ${w.gridPosition.h};">
      <rb-value ${attrs} field="${(w.displayConfig.kpiField as string) || ""}" format="${(w.displayConfig.kpiFormat as string) || "number"}"></rb-value>
      <p class="kpi-label">${(w.displayConfig.kpiLabel as string) || ""}</p>
    </div>`;
      case "text":
        return `    <div class="grid-item" style="grid-column: span ${w.gridPosition.w}; grid-row: span ${w.gridPosition.h};">
      <div class="text-block">${(w.displayConfig.textContent as string) || ""}</div>
    </div>`;
      case "filter-pane": {
        const filterField = (w.displayConfig.filterField as string) || "";
        const table = w.dataSource?.visualQuery?.table || "";
        const connCode = ""; // Will use report's connection
        return `    <div class="grid-item" style="grid-column: span ${w.gridPosition.w}; grid-row: span ${w.gridPosition.h};">
      <rb-filter-pane ${attrs} field="${filterField}" table-name="${table}" connection-code="${connCode}"></rb-filter-pane>
    </div>`;
      }
      case "divider":
        return `    <div class="grid-item" style="grid-column: span 12;">
      <hr class="divider" />
    </div>`;
      default:
        return "";
    }
  }).join("\n");

  // Parameters bar
  const paramsHtml = state.filters.length > 0
    ? `    <div class="params-bar">
      <rb-parameters report-code="${reportCode}" api-base-url="${apiBaseUrl}"></rb-parameters>
    </div>`
    : "";

  return `<meta charset="utf-8">
<div class="rb-dashboard-root">
  <style>
    .rb-dashboard-root {
      all: initial;
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      box-sizing: border-box;
      color: #1e293b;
      background: #f8fafc;
      padding: 24px;
    }
    .rb-dashboard-root *, .rb-dashboard-root *::before, .rb-dashboard-root *::after {
      box-sizing: inherit;
    }
    .rb-dashboard-root .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
      auto-rows: minmax(80px, auto);
    }
    .rb-dashboard-root .grid-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      overflow: hidden;
    }
    .rb-dashboard-root .kpi-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .rb-dashboard-root .kpi-label {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .rb-dashboard-root .text-block {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }
    .rb-dashboard-root .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 8px 0;
    }
    .rb-dashboard-root .params-bar {
      margin-bottom: 20px;
    }
  </style>

${paramsHtml}
  <div class="dashboard-grid">
${componentHtml}
  </div>
</div>
`;
}

// --- Groovy Script (one script, componentId guards) ---

function generateScript(widgets: Widget[]): string {
  const blocks = widgets.map((w) => {
    const id = widgetComponentId(w);
    const sql = getWidgetSql(w);
    const isScript = w.dataSource?.mode === "script" && w.dataSource.script;

    if (isScript) {
      // Script mode: paste script directly inside the guard
      return `// Component: ${id} (${w.type})
if (!componentId || componentId == '${id}') {
${indent(w.dataSource!.script!, 4)}
}`;
    }

    if (!sql) {
      return `// Component: ${id} (${w.type}) — no data source configured`;
    }

    return `// Component: ${id} (${w.type})
if (!componentId || componentId == '${id}') {
    def data = dbSql.rows("""${sql}""")
    ctx.reportData('${id}', data)
}`;
  });

  return `import groovy.sql.Sql

def dbSql = ctx.dbSql
def componentId = ctx.variables?.get('componentId')
def userVars = ctx.variables?.getUserVariables(ctx.token ?: '')

${blocks.join("\n\n")}
`;
}

// --- Chart Config DSL ---

function generateChartConfig(charts: Widget[]): string {
  if (charts.length === 0) return "";
  return charts.map((w) => {
    const id = widgetComponentId(w);
    const cfg = w.displayConfig;
    const chartType = (cfg.chartType as string) || "bar";
    const yField = (cfg.yField as string) || "";

    // If user provided custom DSL, use it
    if (cfg.customDsl) return cfg.customDsl as string;

    return `chart('${id}') {
  type '${chartType}'
  data {
${yField ? `    labelField '${(cfg.xField as string) || ""}'
    datasets {
      dataset {
        field '${yField}'
        label '${yField}'
      }
    }` : "    // Auto-detect fields from data"}
  }
}`;
  }).join("\n\n");
}

// --- Tabulator Config DSL ---

function generateTabulatorConfig(tabulators: Widget[]): string {
  if (tabulators.length === 0) return "";
  return tabulators.map((w) => {
    const id = widgetComponentId(w);
    const cfg = w.displayConfig;

    if (cfg.customDsl) return cfg.customDsl as string;

    // Auto-columns mode — Tabulator will auto-generate from data
    return `tabulator('${id}') {
  layout "fitColumns"
  autoColumns true
}`;
  }).join("\n\n");
}

// --- Pivot Config DSL ---

function generatePivotConfig(pivots: Widget[]): string {
  if (pivots.length === 0) return "";
  return pivots.map((w) => {
    const id = widgetComponentId(w);
    const cfg = w.displayConfig;

    if (cfg.customDsl) return cfg.customDsl as string;

    const rows = (cfg.pivotRows as string[]) || [];
    const cols = (cfg.pivotCols as string[]) || [];
    const vals = (cfg.pivotVals as string[]) || [];
    const aggregator = (cfg.pivotAggregator as string) || "Sum";

    return `pivotTable('${id}') {
${rows.map((r) => `  rows '${r}'`).join("\n")}
${cols.map((c) => `  cols '${c}'`).join("\n")}
${vals.map((v) => `  vals '${v}'`).join("\n")}
  aggregatorName '${aggregator}'
  rendererName 'Table'
}`;
  }).join("\n\n");
}

// --- Parameters Spec DSL ---

function generateParametersSpec(filters: DashboardFilter[]): string {
  if (filters.length === 0) return "";

  const params = filters.map((f) => {
    let typeStr = "String";
    let control = "text";

    switch (f.type) {
      case "dropdown": control = "select"; break;
      case "date": typeStr = "LocalDate"; control = "date"; break;
      case "daterange": typeStr = "LocalDate"; control = "date"; break;
      case "number": typeStr = "Integer"; control = "text"; break;
      case "text": control = "text"; break;
    }

    return `    parameter(
        id: '${f.paramName}',
        type: ${typeStr},
        label: '${f.label}',
        defaultValue: ${f.defaultValue ? `'${f.defaultValue}'` : "''"}
    ) {
        constraints(required: false)
        ui(control: '${control}')
    }`;
  });

  return `${filters.some((f) => f.type === "date" || f.type === "daterange") ? "import java.time.LocalDate\n\n" : ""}reportParameters {
${params.join("\n\n")}
}
`;
}

// --- Filter Pane Config DSL ---

function generateFilterPaneConfig(filterPanes: Widget[]): string {
  if (filterPanes.length === 0) return "";
  return filterPanes.map((w) => {
    const id = widgetComponentId(w);
    const cfg = w.displayConfig;

    if (cfg.customDsl) return cfg.customDsl as string;

    const filterField = (cfg.filterField as string) || "";
    if (!filterField) return `// filterPane('${id}') — no field configured`;

    const lines: string[] = [];
    lines.push(`filterPane('${id}') {`);
    lines.push(`  field '${filterField}'`);

    // Only emit non-default values to keep DSL clean
    if (cfg.filterLabel) lines.push(`  label '${cfg.filterLabel}'`);
    if (cfg.filterSort && cfg.filterSort !== "asc") lines.push(`  sort '${cfg.filterSort}'`);
    if (cfg.filterMaxValues && cfg.filterMaxValues !== 500) lines.push(`  maxValues ${cfg.filterMaxValues}`);
    if (cfg.filterShowSearch === true) lines.push(`  showSearch true`);
    if (cfg.filterShowSearch === false) lines.push(`  showSearch false`);
    if (cfg.filterShowCount === true) lines.push(`  showCount true`);
    if (cfg.filterMultiSelect === false) lines.push(`  multiSelect false`);
    if (cfg.filterHeight && cfg.filterHeight !== "auto") lines.push(`  height '${cfg.filterHeight}'`);

    lines.push(`}`);
    return lines.join("\n");
  }).join("\n\n");
}

// --- Helpers ---

function widgetComponentId(w: Widget): string {
  // Stable ID: type + short hash from widget id
  return `${w.type}_${w.id.replace(/^w-/, "").slice(0, 8)}`;
}

function getWidgetSql(w: Widget): string | null {
  const ds = w.dataSource;
  if (!ds) return null;
  if (ds.mode === "visual" && ds.visualQuery) return buildSql(ds.visualQuery) || null;
  if ((ds.mode === "sql" || ds.mode === "ai-sql") && ds.sql) return ds.sql;
  if (ds.generatedSql) return ds.generatedSql;
  return null;
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text.split("\n").map((line) => pad + line).join("\n");
}
