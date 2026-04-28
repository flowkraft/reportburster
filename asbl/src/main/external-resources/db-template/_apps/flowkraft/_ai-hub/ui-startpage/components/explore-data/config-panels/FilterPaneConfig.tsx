"use client";

import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { getFieldKind } from "@/lib/explore-data/field-utils";
import { AutoBadge, isAutoField, clearAutoFlag } from "./AutoBadge";

const SORT_OPTIONS = [
  { value: "",            label: "Auto (smart default)" },
  { value: "asc",         label: "Alphabetical ↑" },
  { value: "desc",        label: "Alphabetical ↓" },
  { value: "count_desc",  label: "Count (most first)" },
  { value: "none",        label: "None" },
] as const;

const SHOW_SEARCH_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "on",   label: "Always on" },
  { value: "off",  label: "Always off" },
] as const;

interface FilterPaneConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
}

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground pt-2 pb-1 border-t border-border/50">
      {children}
    </div>
  );
}

export function FilterPaneConfig({ config, columns, onChange }: FilterPaneConfigProps) {
  const field = (config.filterField as string) || "";
  const dimensions = columns.filter((c) => getFieldKind(c) === "dimension");

  const label          = (config.filterPaneLabel       as string)  || "";
  const sort           = (config.filterPaneSort        as string)  || "";
  const multiSelect    = (config.filterPaneMultiSelect as boolean | undefined) ?? true;
  const showSearch     = (config.filterPaneShowSearch  as string)  || "auto";
  const showCount      = (config.filterPaneShowCount   as boolean | undefined) ?? false;
  const maxValues      = (config.filterPaneMaxValues   as number | undefined)  ?? 1000;
  const heightMode     = (config.filterPaneHeightMode  as string)  || "auto";
  const heightPx       = (config.filterPaneHeightPx    as number | undefined)  ?? 240;

  const inputCls = "w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground";

  return (
    <div className="space-y-3">
      {/* ── Field picker (unchanged) ── */}
      <div>
        <span className="text-xs text-muted-foreground">
          Field to explore <span className="text-blue-500">(dimension)</span>
          {isAutoField(config, "filterField") && <AutoBadge reason="Lowest-cardinality low-card dimension (IDs and wide text excluded)." />}
        </span>
        <select
          value={field}
          onChange={(e) => onChange(clearAutoFlag({ ...config, filterField: e.target.value }, "filterField"))}
          className={inputCls}
        >
          <option value="">Pick a field...</option>
          {dimensions.map((c) => (
            <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
          ))}
          {columns.filter((c) => getFieldKind(c) === "measure").length > 0 && (
            <optgroup label="Measures (less common for filter panes)">
              {columns.filter((c) => getFieldKind(c) === "measure").map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Shows all distinct values for this field. Click a value to select it — all other widgets will highlight what&apos;s associated and dim what&apos;s excluded.
      </p>

      {/* ── Display ── */}
      <GroupHeader>Display</GroupHeader>
      <div>
        <span className="text-xs text-muted-foreground">Label</span>
        <input
          type="text"
          value={label}
          onChange={(e) => onChange({ ...config, filterPaneLabel: e.target.value })}
          placeholder="Auto from field name"
          className={inputCls}
        />
      </div>

      {/* ── Behavior ── */}
      <GroupHeader>Behavior</GroupHeader>
      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={multiSelect}
          onChange={(e) => onChange({ ...config, filterPaneMultiSelect: e.target.checked })}
          className="rounded border-border"
        />
        <span>Multi-select</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {multiSelect ? "checkboxes" : "single pick"}
        </span>
      </label>
      <div>
        <span className="text-xs text-muted-foreground">Sort by</span>
        <select
          value={sort}
          onChange={(e) => onChange({ ...config, filterPaneSort: e.target.value })}
          className={inputCls}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Value list ── */}
      <GroupHeader>Value list</GroupHeader>
      <div>
        <span className="text-xs text-muted-foreground">Show search box</span>
        <select
          value={showSearch}
          onChange={(e) => onChange({ ...config, filterPaneShowSearch: e.target.value })}
          className={inputCls}
        >
          {SHOW_SEARCH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-muted-foreground mt-1">
          Auto shows the box only when there are many values.
        </p>
      </div>
      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={showCount}
          onChange={(e) => onChange({ ...config, filterPaneShowCount: e.target.checked })}
          className="rounded border-border"
        />
        <span>Show value counts</span>
        <span className="text-[10px] text-muted-foreground ml-auto">e.g. USA (1,243)</span>
      </label>
      <div>
        <span className="text-xs text-muted-foreground">Max values</span>
        <input
          type="number"
          min={1}
          value={maxValues}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({ ...config, filterPaneMaxValues: Number.isFinite(n) && n > 0 ? n : 1000 });
          }}
          className={inputCls}
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Caps the value list for high-cardinality fields.
        </p>
      </div>

      {/* ── Layout ── */}
      <GroupHeader>Layout</GroupHeader>
      <div>
        <span className="text-xs text-muted-foreground">Height</span>
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            onClick={() => onChange({ ...config, filterPaneHeightMode: "auto" })}
            className={`flex-1 text-xs px-2 py-1.5 rounded-md border transition-colors ${
              heightMode === "auto"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, filterPaneHeightMode: "fixed" })}
            className={`flex-1 text-xs px-2 py-1.5 rounded-md border transition-colors ${
              heightMode === "fixed"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            }`}
          >
            Fixed
          </button>
          {heightMode === "fixed" && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={40}
                value={heightPx}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  onChange({ ...config, filterPaneHeightPx: Number.isFinite(n) && n > 0 ? n : 240 });
                }}
                className="w-16 text-sm bg-background border border-border rounded-md px-2 py-1 text-foreground"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
