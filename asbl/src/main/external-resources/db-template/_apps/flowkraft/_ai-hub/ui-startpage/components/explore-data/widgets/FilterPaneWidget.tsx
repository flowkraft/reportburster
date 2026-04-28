"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { executeQuery, exploreAssociations, fetchSchema } from "@/lib/explore-data/rb-api";
import { autoFilterPaneField, probeCardinality, classifyColumn } from "@/lib/explore-data/smart-defaults";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2, Sparkles } from "lucide-react";

interface FilterPaneWidgetProps {
  widgetId: string;
}

/**
 * Filter Pane widget — renders via the <rb-filter-pane> Svelte web component.
 * Uses the component's "Mode 1 — Data Push" branch by setting `data` (an
 * array of rows) imperatively via a ref. The component extracts distinct
 * values from the chosen `field` itself.
 *
 * Associative exploration: the component dispatches `filterPaneSelect`
 * events on click. We forward to the existing canvas-store action
 * `toggleExploreSelection`, then push the resulting selectedValues /
 * associatedValues / excludedValues back to the element so it updates
 * the visual state of each value.
 */
export function FilterPaneWidget({ widgetId }: FilterPaneWidgetProps) {
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const exploreSelections = useCanvasStore((s) => s.exploreSelections);
  const exploreFieldStates = useCanvasStore((s) => s.exploreFieldStates);
  const exploreVersion = useCanvasStore((s) => s.exploreVersion);
  const toggleExploreSelection = useCanvasStore((s) => s.toggleExploreSelection);
  const setExploreFieldStates = useCanvasStore((s) => s.setExploreFieldStates);
  const widgets = useCanvasStore((s) => s.widgets);

  const updateWidgetDisplayConfig = useCanvasStore((s) => s.updateWidgetDisplayConfig);

  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-filter-pane");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoErr, setAutoErr] = useState<string | null>(null);

  const field = (widget?.displayConfig.filterField as string) || "";
  const table = (widget?.dataSource?.visualQuery?.table as string) || "";

  const handleAutoPickField = async () => {
    if (!widget || !connectionId || !table) return;
    setAutoBusy(true);
    setAutoErr(null);
    try {
      const schema = await fetchSchema(connectionId);
      const tbl = schema.tables.find((t) => t.tableName === table);
      if (!tbl) {
        setAutoErr(`Table ${table} not found.`);
        return;
      }
      // Probe cardinality so we skip 200-value fields (unusable in a filter pane).
      const stringCols = tbl.columns
        .filter((c) => classifyColumn(c, tbl) === "category-low")
        .map((c) => c.columnName);
      const cardinality = stringCols.length > 0 ? await probeCardinality(connectionId, tbl.tableName, stringCols) : {};
      const picked = autoFilterPaneField(tbl, cardinality);
      if (!picked) {
        setAutoErr("No suitable filter field found in this table.");
        return;
      }
      updateWidgetDisplayConfig(widget.id, {
        ...(widget.displayConfig || {}),
        filterField: picked,
        _autoPicked: ["filterField"],
      });
    } catch (e) {
      setAutoErr(e instanceof Error ? e.message : "Auto-pick failed");
    } finally {
      setAutoBusy(false);
    }
  };

  // Load distinct values for the filter pane (same as old React widget)
  useEffect(() => {
    if (!connectionId || !field || !table) { setRows([]); return; }
    setLoading(true);
    executeQuery(
      connectionId,
      `SELECT DISTINCT "${field}" FROM "${table}" WHERE "${field}" IS NOT NULL ORDER BY "${field}" LIMIT 1000`,
    )
      .then((res) => setRows(res.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [connectionId, field, table]);

  // Recompute associative-exploration field states when selections change
  useEffect(() => {
    if (!connectionId || !table || exploreSelections.length === 0) return;

    const filterPaneFields = widgets
      .filter((w) => w.type === "filter-pane" && w.displayConfig.filterField)
      .map((w) => w.displayConfig.filterField as string);

    if (filterPaneFields.length === 0) return;

    exploreAssociations(connectionId, table, exploreSelections, filterPaneFields)
      .then((res) => setExploreFieldStates(res.fieldStates))
      .catch((err) => console.warn("Explore failed:", err));
  }, [connectionId, table, exploreVersion]);

  // Push data + field + DSL config + visual-state arrays into the custom element
  useEffect(() => {
    if (!ready || !ref.current || !field) return;

    const fieldStates = exploreFieldStates[field];
    const selectedSet = exploreSelections.filter((s) => s.field === field).map((s) => s.value);

    // Value-kind-aware sort pick: names (strings) → alpha asc (easier to scan);
    // numerics → count desc (the biggest bucket is usually most interesting).
    // Reads the first non-null value of the chosen field to decide. Honors
    // a user-set `filterPaneSort` displayConfig override when present.
    const configSort = (widget?.displayConfig.filterPaneSort as string | undefined);
    let pickedSort: "asc" | "count_desc" | "desc" | "none" = "asc";
    if (configSort === "asc" || configSort === "desc" || configSort === "count_desc" || configSort === "none") {
      pickedSort = configSort;
    } else {
      const sample = rows.find((r) => r[field] !== null && r[field] !== undefined && r[field] !== "")?.[field];
      const looksNumeric =
        typeof sample === "number" ||
        (typeof sample === "string" && sample !== "" && !isNaN(Number(sample)));
      pickedSort = looksNumeric ? "count_desc" : "asc";
    }

    const el = ref.current as HTMLElement & {
      data?: unknown;
      field?: string;
      label?: string;
      sort?: string;
      maxValues?: number;
      showSearch?: boolean | "auto";
      showCount?: boolean;
      multiSelect?: boolean;
      height?: string;
      selectedValues?: string[];
      associatedValues?: string[] | null;
      excludedValues?: string[] | null;
    };

    const dc = widget?.displayConfig ?? {};
    const cfgLabel       = (dc.filterPaneLabel       as string)  || "";
    const cfgMultiSelect = (dc.filterPaneMultiSelect as boolean | undefined) ?? true;
    const cfgShowSearch  = (dc.filterPaneShowSearch  as string)  || "auto";
    const cfgShowCount   = (dc.filterPaneShowCount   as boolean | undefined) ?? false;
    const cfgMaxValues   = (dc.filterPaneMaxValues   as number | undefined)  ?? 1000;
    const cfgHeightMode  = (dc.filterPaneHeightMode  as string)  || "auto";
    const cfgHeightPx    = (dc.filterPaneHeightPx    as number | undefined)  ?? 240;

    const searchProp: boolean | "auto" =
      cfgShowSearch === "on" ? true : cfgShowSearch === "off" ? false : "auto";

    el.field = field;
    el.label = cfgLabel || field;
    el.sort = pickedSort;
    el.maxValues = cfgMaxValues;
    el.showSearch = searchProp;
    el.showCount = cfgShowCount;
    el.multiSelect = cfgMultiSelect;
    el.height = cfgHeightMode === "fixed" ? `${cfgHeightPx}px` : "auto";
    el.data = rows;
    el.selectedValues = selectedSet;
    el.associatedValues = fieldStates ? fieldStates.associated : null;
    el.excludedValues = fieldStates ? fieldStates.excluded : null;
  }, [ready, rows, field, exploreSelections, exploreFieldStates, widget?.displayConfig]);

  // Listen for filterPaneSelect events from the Svelte component
  // and forward to the canvas-store toggle action.
  useEffect(() => {
    if (!ready || !ref.current) return;
    const el = ref.current;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { field: string; value: string };
      if (detail?.field && detail?.value !== undefined) {
        toggleExploreSelection(detail.field, detail.value);
      }
    };

    el.addEventListener("filterPaneSelect", handler);
    return () => el.removeEventListener("filterPaneSelect", handler);
  }, [ready, toggleExploreSelection]);

  if (!field) {
    // Empty state: if a table is picked, offer one-click auto-pick of the first
    // low-cardinality dimension. If no table, user needs to configure via Data tab.
    if (!table) {
      return (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-2 text-center">
          Pick a table in the Data tab, then choose a field to filter by.
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center p-3">
        <div className="text-center max-w-xs">
          <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-foreground mb-1">Pick a field to filter by</p>
          <p className="text-[11px] text-muted-foreground mb-2">
            We&apos;ll auto-pick a low-cardinality column from {table}.
          </p>
          <button
            type="button"
            onClick={handleAutoPickField}
            disabled={autoBusy}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {autoBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {autoBusy ? "Analyzing…" : "Auto-pick field"}
          </button>
          {autoErr && <p className="mt-1.5 text-[10px] text-destructive">{autoErr}</p>}
        </div>
      </div>
    );
  }
  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  if (!ready) return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading components...</div>;

  return (
    // @ts-expect-error - Web component custom element
    <rb-filter-pane ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
  );
}
