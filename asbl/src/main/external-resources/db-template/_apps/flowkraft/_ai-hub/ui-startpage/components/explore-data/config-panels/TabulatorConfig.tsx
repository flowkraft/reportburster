"use client";

// lucide-react removed
import { useEffect, useState } from "react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import type { TabulatorDslOptions } from "@/lib/explore-data/dsl-sync/tabulator-mapping";
import { getFieldKind } from "@/lib/explore-data/field-utils";

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

/** One highlight rule of a column (#28), as `rb-tabulator` reads it (`shared/table-extras.ts`). */
export type TableHighlightKind = "scale" | "bars" | "above" | "below";
export interface TableHighlight { field: string; kind: TableHighlightKind; value?: number; color?: string }

const HIGHLIGHT_KINDS = [
  { value: "", label: "None" },
  { value: "scale", label: "Colour scale" },
  { value: "bars", label: "Bars in the cells" },
  { value: "above", label: "Colour values above…" },
  { value: "below", label: "Colour values below…" },
] as const;
const HIGHLIGHT_COLORS = ["red", "green", "amber", "blue"] as const;

/** Set, change or take away one column's rule; the list goes when it is empty. */
export function setHighlight(map: TabulatorDslOptions, field: string, rule: TableHighlight | null): TabulatorDslOptions {
  const others = ((map.rbHighlights as TableHighlight[] | undefined) ?? []).filter((h) => h.field !== field);
  const list = rule ? [...others, rule] : others;
  const next = { ...map } as Record<string, unknown>;
  if (list.length) next.rbHighlights = list;
  else delete next.rbHighlights;
  return next as TabulatorDslOptions;
}

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
  // The clicks setting lives in the canonical Map beside every other display setting, so it
  // travels into the published config file with them (Principle 4). Unticked takes the key away
  // again, so a dashboard that never used it reads exactly as it did.
  const clicksFilter = (map.clicksFilter as boolean | undefined) === true;
  const setClicksFilter = (on: boolean) => {
    const next = { ...map } as Record<string, unknown>;
    if (on) next.clicksFilter = true;
    else delete next.clicksFilter;
    setDslMap(config, next as typeof map, onChange);
  };

  // Totals, search and dragging columns (#28): one key each in the Map, gone when unticked, so a
  // table that never used them reads exactly as it did. Search and dragging are Tabulator's own
  // options; the totals are rb-tabulator's (`rbTotals`).
  const totals = (map as Record<string, unknown>).rbTotals === true;
  const columnDefaults = ((map as Record<string, unknown>).columnDefaults as Record<string, unknown> | undefined) ?? {};
  const search = columnDefaults.headerFilter === "input";
  const movable = (map as Record<string, unknown>).movableColumns === true;
  const setFlag = (key: string, on: boolean) => {
    const next = { ...map } as Record<string, unknown>;
    if (on) next[key] = true;
    else delete next[key];
    setDslMap(config, next as typeof map, onChange);
  };
  const setSearch = (on: boolean) => {
    const defaults = { ...columnDefaults };
    if (on) defaults.headerFilter = "input";
    else delete defaults.headerFilter;
    const next = { ...map } as Record<string, unknown>;
    if (Object.keys(defaults).length) next.columnDefaults = defaults;
    else delete next.columnDefaults;
    setDslMap(config, next as typeof map, onChange);
  };

  // Highlights (#28): one rule per column of numbers, picked here column by column.
  const numberColumns = columns.filter((c) => getFieldKind(c) === "measure").map((c) => c.columnName);
  const highlights = ((map as Record<string, unknown>).rbHighlights as TableHighlight[] | undefined) ?? [];
  const [highlightField, setHighlightField] = useState("");
  const field = numberColumns.includes(highlightField) ? highlightField : numberColumns[0] ?? "";
  const rule = highlights.find((h) => h.field === field);
  const [valueText, setValueText] = useState("");
  useEffect(() => {
    setValueText(rule?.value !== undefined ? String(rule.value) : "");
    // Only when another column is picked: what is typed afterwards is the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);
  const writeRule = (next: TableHighlight | null) => setDslMap(config, setHighlight(map, field, next), onChange);
  const setKind = (kind: string) => {
    if (!kind) return writeRule(null);
    const k = kind as TableHighlightKind;
    if (k === "above" || k === "below") {
      const value = Number(valueText);
      return writeRule({ field, kind: k, value: valueText.trim() !== "" && Number.isFinite(value) ? value : 0, color: rule?.color ?? "red" });
    }
    writeRule({ field, kind: k });
  };
  const typeValue = (text: string) => {
    setValueText(text);
    const value = Number(text);
    if (rule && (rule.kind === "above" || rule.kind === "below") && text.trim() !== "" && Number.isFinite(value)) {
      writeRule({ ...rule, value });
    }
  };

  return (
    <div id="configPanel-tabulator" className="space-y-4">
      {/* ── Layout ── */}
      <div>
        <span className="text-xs text-base-content/60">Layout</span>
        <select
          id="selectTabulatorLayout"
          value={layout}
          onChange={(e) => setMapKey("layout", e.target.value)}
          className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
        >
          {LAYOUTS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* ── Pagination ── */}
      {!hidePagination && (
        <div>
          <span className="text-xs text-base-content/60">Pagination</span>
          <div className="flex mt-1 rounded-md overflow-hidden border border-base-300 text-xs">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                id={`btnTabulatorPagination-${v ? "on" : "off"}`}
                onClick={() => setMapKey("pagination", v)}
                className={`flex-1 py-1.5 transition-colors ${
                  pagination === v
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-base-content/60 hover:bg-base-200"
                }`}
              >
                {v ? "On" : "Off"}
              </button>
            ))}
          </div>
          {pagination && (
            <div className="mt-2">
              <span className="text-xs text-base-content/60">Rows per page</span>
              <input
                id="inputTabulatorPageSize"
                type="number"
                min={5}
                max={500}
                step={5}
                value={pageSize}
                onChange={(e) => setMapKey("paginationSize", Number(e.target.value) || 50)}
                className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Theme ── */}
      <div>
        <span className="text-xs text-base-content/60">Theme</span>
        <select
          id="selectTabulatorTheme"
          value={theme}
          onChange={(e) => setMapKey("theme", e.target.value)}
          className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* ── Column visibility ── */}
      {columns.length === 0 ? (
        <p className="text-xs text-base-content/60">Run a query to see columns</p>
      ) : (
        <div className="space-y-2">
          <span className="text-xs text-base-content/60">Column visibility</span>
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
                    hidden ? "text-base-content/60/50" : "text-base-content hover:bg-base-200"
                  }`}
                >
                  {hidden
                    ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  }
                  <span className={hidden ? "line-through" : ""}>{col.columnName}</span>
                  <span className="ml-auto text-[10px] text-base-content/60">{col.typeName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Totals, search, dragging columns (#28) */}
      <div className="space-y-1.5">
        {([
          ["chkTableTotals", "Totals row", totals, (on: boolean) => setFlag("rbTotals", on)],
          ["chkTableSearch", "Search in each column", search, setSearch],
          ["chkTableMovableColumns", "Columns can be dragged", movable, (on: boolean) => setFlag("movableColumns", on)],
        ] as const).map(([id, label, checked, set]) => (
          <label key={id} className="flex items-center gap-2 text-xs text-base-content cursor-pointer">
            <input id={id} type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="rounded border-base-300" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {/* Highlights (#28): a colour scale, bars, or one above/below colour, per column of numbers */}
      {numberColumns.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-base-content/60">Highlight</span>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              id="selectTableHighlightField"
              value={field}
              onChange={(e) => setHighlightField(e.target.value)}
              className="w-full text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1 text-base-content"
            >
              {numberColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              id="selectTableHighlightKind"
              value={rule?.kind ?? ""}
              onChange={(e) => setKind(e.target.value)}
              className="w-full text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1 text-base-content"
            >
              {HIGHLIGHT_KINDS.map((k) => <option key={k.value || "none"} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          {rule && (rule.kind === "above" || rule.kind === "below") && (
            <div className="grid grid-cols-2 gap-1.5">
              <input
                id="inputTableHighlightValue"
                type="text"
                inputMode="decimal"
                value={valueText}
                onChange={(e) => typeValue(e.target.value)}
                className="w-full text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1 text-base-content"
              />
              <select
                id="selectTableHighlightColor"
                value={rule.color ?? "red"}
                onChange={(e) => writeRule({ ...rule, color: e.target.value })}
                className="w-full text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1 text-base-content"
              >
                {HIGHLIGHT_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {highlights.map((h) => (
                <span key={h.field} id={`tableHighlight-${h.field}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-base-200 text-[10px] text-base-content">
                  {h.field}: {h.kind}{h.value !== undefined ? ` ${h.value}` : ""}
                  <button
                    id={`btnRemoveTableHighlight-${h.field}`}
                    type="button"
                    onClick={() => setDslMap(config, setHighlight(map, h.field, null), onChange)}
                    className="text-base-content/60 hover:text-error"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* A widget's one interaction setting: its clicks make a selection, exactly as a slicer's do
          (`slicer-filters.ts`). Off until it is ticked, so no dashboard changes by itself. */}
      <label className="flex items-center gap-2 text-xs text-base-content cursor-pointer">
        <input
          id="chkTableClicksFilter"
          type="checkbox"
          checked={clicksFilter}
          onChange={(e) => setClicksFilter(e.target.checked)}
          className="rounded border-base-300"
        />
        <span>Clicks filter the dashboard</span>
        <span className="text-[10px] text-base-content/60 ml-auto">
          {clicksFilter ? "a click filters every widget on this table" : "clicks do nothing"}
        </span>
      </label>
    </div>
  );
}
