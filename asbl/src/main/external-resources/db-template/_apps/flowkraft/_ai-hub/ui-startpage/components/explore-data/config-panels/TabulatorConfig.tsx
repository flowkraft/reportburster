"use client";

import { Eye, EyeOff } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";

const LAYOUTS = [
  { value: "fitDataStretch", label: "Fit data (stretch last col)" },
  { value: "fitColumns",     label: "Fit columns to width" },
  { value: "fitData",        label: "Fit to data" },
  { value: "fitDataFill",    label: "Fit data (fill gap)" },
] as const;

const THEMES = [
  { value: "",           label: "Default (light)" },
  { value: "midnight",   label: "Midnight (dark)" },
  { value: "simple",     label: "Simple" },
  { value: "modern",     label: "Modern" },
  { value: "bootstrap5", label: "Bootstrap 5" },
  { value: "bulma",      label: "Bulma" },
] as const;

interface TabulatorConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
  /** Row count from the last executed query. When exactly 1, pagination is
   *  hidden entirely — paginating a single row is 100% nonsensical.  When
   *  undefined (no query run yet) or > 1, pagination is shown so the user can
   *  configure it ahead of time or tune it for their actual data volume. */
  rowCount?: number;
}

export function TabulatorConfig({ config, columns, onChange, rowCount }: TabulatorConfigProps) {
  const hiddenColumns = (config.hiddenColumns as string[]) || [];
  const layout     = (config.tabulatorLayout    as string)  || "fitDataStretch";
  const pagination = config.tabulatorPagination !== false;   // default on
  const pageSize   = (config.tabulatorPageSize  as number)  || 50;
  const theme      = (config.tabulatorTheme     as string)  ?? "";
  // Conservative hide rule: only when we KNOW there's exactly 1 row. Unknown
  // or >1 rows → show (user can still turn pagination off explicitly).
  const hidePagination = rowCount === 1;

  const toggleColumn = (col: string) => {
    const next = hiddenColumns.includes(col)
      ? hiddenColumns.filter((c) => c !== col)
      : [...hiddenColumns, col];
    onChange({ ...config, hiddenColumns: next });
  };

  return (
    <div id="configPanel-tabulator" className="space-y-4">

      {/* ── Layout ── */}
      <div>
        <span className="text-xs text-muted-foreground">Layout</span>
        <select
          value={layout}
          onChange={(e) => onChange({ ...config, tabulatorLayout: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          {LAYOUTS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* ── Pagination ── Hidden for single-row results (scalar KPI-like tables):
          paginating 1 row is meaningless and adds noise to the Display tab. */}
      {!hidePagination && (
        <div>
          <span className="text-xs text-muted-foreground">Pagination</span>
          <div className="flex mt-1 rounded-md overflow-hidden border border-border text-xs">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                onClick={() => onChange({ ...config, tabulatorPagination: v })}
                className={`flex-1 py-1.5 transition-colors ${
                  pagination === v
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {v ? "On" : "Off"}
              </button>
            ))}
          </div>
          {pagination && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Rows per page</span>
              <input
                type="number"
                min={5}
                max={500}
                step={5}
                value={pageSize}
                onChange={(e) => onChange({ ...config, tabulatorPageSize: Number(e.target.value) || 50 })}
                className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Theme ── */}
      <div>
        <span className="text-xs text-muted-foreground">Theme</span>
        <select
          value={theme}
          onChange={(e) => onChange({ ...config, tabulatorTheme: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* ── Column visibility ── */}
      {columns.length === 0 ? (
        <p className="text-xs text-muted-foreground">Run a query to see columns</p>
      ) : (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Column visibility</span>
          <div className="space-y-0.5">
            {columns.map((col) => {
              const hidden = hiddenColumns.includes(col.columnName);
              return (
                <button
                  key={col.columnName}
                  onClick={() => toggleColumn(col.columnName)}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors ${
                    hidden ? "text-muted-foreground/50" : "text-foreground hover:bg-accent"
                  }`}
                >
                  {hidden ? <EyeOff className="w-3 h-3 shrink-0" /> : <Eye className="w-3 h-3 shrink-0" />}
                  <span className={hidden ? "line-through" : ""}>{col.columnName}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{col.typeName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
