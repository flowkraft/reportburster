"use client";

import { Eye, EyeOff } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import type { TabulatorDslOptions } from "@/lib/explore-data/dsl-sync/tabulator-mapping";

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: every UI gesture in this Display tab panel mutates
 * the canonical DSL Map at displayConfig.dslConfig — never the old structured
 * fields (hiddenColumns, tabulatorLayout, etc., now removed).
 * ============================================================================
 */

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
  rowCount?: number;
}

/** Pull the canonical DSL Map out of displayConfig. Returns empty Map for
 *  fresh widgets — Display tab gestures populate it from there. */
function readDslMap(config: WidgetDisplayConfig): TabulatorDslOptions {
  return (config.dslConfig as TabulatorDslOptions) ?? {};
}

/** Replace the dslConfig Map and call parent onChange. */
function setDslMap(
  config: WidgetDisplayConfig,
  next: TabulatorDslOptions,
  onChange: (c: WidgetDisplayConfig) => void,
): void {
  onChange({ ...config, dslConfig: next });
}

/** Find the index of a field's autoColumnsDefinitions entry, or -1. */
function findAcDefIdx(map: TabulatorDslOptions, field: string): number {
  const defs = (map.autoColumnsDefinitions as Array<{ field?: string }> | undefined) ?? [];
  return defs.findIndex((d) => d?.field === field);
}

/** Set or remove a per-field property in autoColumnsDefinitions, returning the
 *  new Map immutably. If `value` is undefined and the entry would be empty
 *  (only `field`), the entry is removed entirely. */
function setAutoColDef(
  map: TabulatorDslOptions,
  field: string,
  prop: string,
  value: unknown,
): TabulatorDslOptions {
  const defs = ((map.autoColumnsDefinitions as Array<Record<string, unknown>> | undefined) ?? []).slice();
  const idx = defs.findIndex((d) => d?.field === field);
  if (idx >= 0) {
    const entry = { ...defs[idx] };
    if (value === undefined) {
      delete entry[prop];
    } else {
      entry[prop] = value;
    }
    // Drop the entry entirely if no overrides remain.
    const { field: _f, ...rest } = entry;
    if (Object.keys(rest).length === 0) {
      defs.splice(idx, 1);
    } else {
      defs[idx] = entry;
    }
  } else if (value !== undefined) {
    defs.push({ field, [prop]: value });
  }
  // Always keep autoColumns: true so the rendered table shows non-overridden
  // columns by default. The DSL is "the lightest possible Tabulator wrapper" —
  // see DSLPrinciplesReadme.java Principle 4.
  // Cast: every entry we add has `field: string` (so DslColumn-shaped); TS
  // can't see this through Record<string, unknown> in the helper signature.
  return { ...map, autoColumns: true, autoColumnsDefinitions: defs as TabulatorDslOptions["autoColumnsDefinitions"] };
}

export function TabulatorConfig({ config, columns, onChange, rowCount }: TabulatorConfigProps) {
  const map = readDslMap(config);

  const layout       = (map.layout as string)         || "fitDataStretch";
  const pagination   = map.pagination !== false;
  const pageSize     = (map.paginationSize as number) || 50;
  const theme        = (map.theme as string)          ?? "";
  const hidePagination = rowCount === 1;

  const isHidden = (col: string): boolean => {
    const idx = findAcDefIdx(map, col);
    if (idx < 0) return false;
    const defs = (map.autoColumnsDefinitions as Array<Record<string, unknown>> | undefined) ?? [];
    return defs[idx]?.visible === false;
  };

  const toggleColumn = (col: string) => {
    const next = isHidden(col)
      ? setAutoColDef(map, col, "visible", undefined)  // un-hide → remove the override
      : setAutoColDef(map, col, "visible", false);
    setDslMap(config, next, onChange);
  };

  const setMapKey = (key: keyof TabulatorDslOptions, value: unknown) => {
    setDslMap(config, { ...map, [key]: value }, onChange);
  };

  return (
    <div id="configPanel-tabulator" className="space-y-4">
      {/* ── Layout ── */}
      <div>
        <span className="text-xs text-muted-foreground">Layout</span>
        <select
          value={layout}
          onChange={(e) => setMapKey("layout", e.target.value)}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          {LAYOUTS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* ── Pagination ── */}
      {!hidePagination && (
        <div>
          <span className="text-xs text-muted-foreground">Pagination</span>
          <div className="flex mt-1 rounded-md overflow-hidden border border-border text-xs">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                id={`btnTabulatorPagination-${v ? "on" : "off"}`}
                onClick={() => setMapKey("pagination", v)}
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
                onChange={(e) => setMapKey("paginationSize", Number(e.target.value) || 50)}
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
          onChange={(e) => setMapKey("theme", e.target.value)}
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
              const hidden = isHidden(col.columnName);
              return (
                <button
                  key={col.columnName}
                  id={`btnToggleCol-${col.columnName}`}
                  data-hidden={hidden ? "true" : "false"}
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
