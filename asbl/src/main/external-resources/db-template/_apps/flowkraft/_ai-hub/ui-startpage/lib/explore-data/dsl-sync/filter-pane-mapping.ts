import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";

/**
 * FilterPane-specific mapping between the UI's prefixed displayConfig keys and
 * the (unprefixed) DSL options object understood by FilterPaneOptions.
 *
 * UI keys:    filterField, filterPaneLabel, filterPaneSort, filterPaneMultiSelect,
 *             filterPaneShowSearch (tri-state "auto"|"on"|"off"), filterPaneShowCount,
 *             filterPaneMaxValues, filterPaneHeightMode ("auto"|"fixed") + filterPaneHeightPx.
 *
 * DSL keys:   field, label, sort, multiSelect, showSearch (boolean), showCount,
 *             maxValues, height (string e.g. "300px"), defaultSelected (string[]).
 */

export type FilterPaneDslOptions = {
  field?: string;
  label?: string;
  sort?: string;
  maxValues?: number;
  showSearch?: boolean;
  showCount?: boolean;
  multiSelect?: boolean;
  height?: string;
  defaultSelected?: string[];
};

export function uiToFilterPaneDsl(dc: WidgetDisplayConfig): FilterPaneDslOptions {
  const opts: FilterPaneDslOptions = {};
  const field = dc.filterField as string | undefined;
  if (field) opts.field = field;

  const label = dc.filterPaneLabel as string | undefined;
  if (label) opts.label = label;

  const sort = dc.filterPaneSort as string | undefined;
  if (sort) opts.sort = sort;

  const maxValues = dc.filterPaneMaxValues as number | undefined;
  if (typeof maxValues === "number") opts.maxValues = maxValues;

  const showSearch = dc.filterPaneShowSearch as string | undefined;
  if (showSearch === "on") opts.showSearch = true;
  else if (showSearch === "off") opts.showSearch = false;
  // "auto" or undefined → omit DSL key, widget picks

  const showCount = dc.filterPaneShowCount as boolean | undefined;
  if (typeof showCount === "boolean") opts.showCount = showCount;

  const multiSelect = dc.filterPaneMultiSelect as boolean | undefined;
  if (typeof multiSelect === "boolean") opts.multiSelect = multiSelect;

  const heightMode = dc.filterPaneHeightMode as string | undefined;
  const heightPx = dc.filterPaneHeightPx as number | undefined;
  if (heightMode === "fixed" && typeof heightPx === "number") {
    opts.height = `${heightPx}px`;
  }

  const defaultSelected = dc.filterPaneDefaultSelected as string[] | undefined;
  if (Array.isArray(defaultSelected) && defaultSelected.length > 0) {
    opts.defaultSelected = defaultSelected;
  }

  return opts;
}

/**
 * Merge DSL options back into displayConfig. Only maps known keys — unknown DSL
 * keys are left in customDsl text unchanged (they survive the round-trip).
 */
export function filterPaneDslToUi(
  opts: FilterPaneDslOptions,
  dc: WidgetDisplayConfig,
): WidgetDisplayConfig {
  const next: WidgetDisplayConfig = { ...dc };

  if ("field" in opts) next.filterField = opts.field ?? "";
  if ("label" in opts) next.filterPaneLabel = opts.label ?? "";
  if ("sort" in opts) next.filterPaneSort = opts.sort ?? "";
  if ("maxValues" in opts) next.filterPaneMaxValues = opts.maxValues;
  if ("showCount" in opts) next.filterPaneShowCount = opts.showCount;
  if ("multiSelect" in opts) next.filterPaneMultiSelect = opts.multiSelect;
  if ("defaultSelected" in opts) next.filterPaneDefaultSelected = opts.defaultSelected;

  if ("showSearch" in opts) {
    next.filterPaneShowSearch = opts.showSearch === true ? "on" : opts.showSearch === false ? "off" : "auto";
  }

  if ("height" in opts) {
    const h = opts.height;
    if (typeof h === "string" && /^\d+px$/.test(h)) {
      next.filterPaneHeightMode = "fixed";
      next.filterPaneHeightPx = parseInt(h, 10);
    } else {
      next.filterPaneHeightMode = "auto";
    }
  }

  return next;
}
