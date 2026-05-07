"use client";

import { useState, useEffect, useMemo } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { DataSource, WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { fetchSchema, executeQuery, getConnectionType } from "@/lib/explore-data/rb-api";
import { sqlForDataSource } from "@/lib/explore-data/sql-builder";
import { isTemporalExtraction, probeCardinality, probeSemanticType, pickDefaultAxes, canReuseAxisPicks, splitDimsAndMeasures, groupWidgetsByShape, groupWidgetsBySensibility, rankChartSubtypes, type CardinalityMap } from "@/lib/explore-data/smart-defaults";
import { seedDisplayConfigForType, synthesizePostAggColumns, temporalColumnNamesOf } from "@/lib/explore-data/widget-defaults";
import type { TableSchema } from "@/lib/explore-data/types";
import { Settings2, Database, Palette, Wand2, Loader2, Table, BarChart3, PieChart, Hash, Map as MapIcon, Workflow, Gauge as GaugeIcon, TrendingUp, BarChartHorizontal, FileText, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import type { WidgetType } from "@/lib/stores/canvas-store";
import { QueryBuilder } from "./query-builder/QueryBuilder";
import { ChartConfig, CHART_TYPES } from "./config-panels/ChartConfig";
import { TabulatorConfig } from "./config-panels/TabulatorConfig";
import { PivotConfig } from "./config-panels/PivotConfig";
import { NumberConfig } from "./config-panels/NumberConfig";
import { MapConfig } from "./config-panels/MapConfig";
import { SankeyConfig } from "./config-panels/SankeyConfig";
import { GaugeConfig } from "./config-panels/GaugeConfig";
import { TrendConfig } from "./config-panels/TrendConfig";
import { ProgressConfig } from "./config-panels/ProgressConfig";
import { DetailConfig } from "./config-panels/DetailConfig";
import { FilterPaneConfig } from "./config-panels/FilterPaneConfig";
import { BidirectionalDslCustomizer } from "./config-panels/BidirectionalDslCustomizer";

// Auto-switch helpers (`seedDisplayConfigForType`, `inferColumnsFromRow`)
// moved to `lib/explore-data/widget-defaults.ts` so the canvas-store's
// one-shot auto-switch mutator and this palette's onClick share one source
// of truth. Imported at the top of the file.


// Stable empty array for the `widget.columns ?? EMPTY_COLS` fallback so
// downstream useMemo/useEffect deps don't invalidate on every render of a
// widget with no columns yet.
const EMPTY_COLS: ColumnSchema[] = [];

let _cpRenderN = 0;

export function ConfigPanel({ onCollapse }: { onCollapse?: () => void }) {
  const { widgets, selectedWidgetId, connectionId, updateWidgetDataSource, updateWidgetDisplayConfig, changeWidgetRenderMode, setWidgetColumnsFromSchema } = useCanvasStore();
  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);
  _cpRenderN++;
  console.log('[ConfigPanel] #' + _cpRenderN + ' widgetId=' + selectedWidget?.id +
    ' type=' + (selectedWidget?.type ?? 'none') +
    ' cols=' + (selectedWidget?.columns?.length ?? 0) +
    ' shape=' + (selectedWidget?.shape ? 'yes' : 'no'));
  // `columns` is a DERIVED read from the widget record — no local state.
  // Populated by `setWidgetQueryResult` (any mode, post-query) or
  // `setWidgetColumnsFromSchema` (visual mode, pre-query schema fetch).
  // This eliminates the two competing `setColumns` effects that previously
  // raced against each other and against the palette re-render.
  const columns: ColumnSchema[] = selectedWidget?.columns ?? EMPTY_COLS;
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  // Local validation error for the "Detect columns" button (e.g. "Write a
  // query first"). Fetch/runtime errors come from the shared store instead —
  // see `combinedDetectError` below.
  const [detectError, setDetectError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"data" | "display">("data");
  // Per-column distinct-count probe — drives pie/doughnut demote-or-promote in
  // the Chart subtype ranker. Probed only for chart widgets in visual mode
  // with a table + group-by columns. Cached (5-min TTL) inside probeCardinality.
  const [cardinality, setCardinality] = useState<CardinalityMap>({});
  // Row count from the last executed query. undefined = no query run yet (schema-
  // only mode). When set, the sensibility gate rowCount>1 fires and hides chart
  // recommendations for single-row results (e.g. a bare SUM with no GROUP BY).
  const [lastRowCount, setLastRowCount] = useState<number | undefined>(undefined);

  // Set of group-by columns using a temporal-extraction bucket (day-of-week,
  // hour-of-day, month-of-year, quarter-of-year). The Chart subtype ranker
  // treats these as categorical so `line` gets demoted below `bar`/`row`.
  const extractionsSet = useMemo<Set<string>>(() => {
    const buckets = selectedWidget?.dataSource?.visualQuery?.groupByBuckets;
    if (!buckets) return new Set();
    const out = new Set<string>();
    for (const [col, bucket] of Object.entries(buckets)) {
      if (isTemporalExtraction(bucket)) out.add(col);
    }
    return out;
  }, [selectedWidget?.dataSource?.visualQuery?.groupByBuckets]);

  // Visual-mode table schema, enriched with semanticHints from the
  // fingerprint probe.  Intermediate state — NOT the authoritative
  // classified view.  The synthesis effect below consumes this + the
  // widget's visualQuery to compute the post-aggregation effective
  // columns and write them (together with the computed PickShape) onto
  // the widget record via setWidgetColumnsFromSchema.  Every palette /
  // config consumer reads from widget.columns + widget.shape; this local
  // state is internal scaffolding and never leaves ConfigPanel.
  const [schemaCols, setSchemaCols] = useState<ColumnSchema[]>(EMPTY_COLS);
  const [schemaTable, setSchemaTable] = useState<TableSchema | null>(null);

  // Effect 1 — fetch schema + enrich with semantic hints.
  // Re-fires only when the connection/table changes, NOT on visualQuery
  // edits.  Keeping schema fetch out of the visualQuery deps prevents
  // an HTTP hit on every summarize/groupBy chip change.
  useEffect(() => {
    setDetectError(null);
    const ds = selectedWidget?.dataSource;
    if (!connectionId || !ds) { setSchemaCols(EMPTY_COLS); setSchemaTable(null); setLastRowCount(undefined); return; }

    const tableInVisual = ds.mode === "visual" ? ds.visualQuery?.table : undefined;
    if (!tableInVisual) {
      setSchemaCols(EMPTY_COLS);
      setSchemaTable(null);
      setSampleData([]);
      setLastRowCount(undefined);
      return;
    }

    let cancelled = false;
    fetchSchema(connectionId)
      .then(async (schema) => {
        if (cancelled) return;
        const t = schema.tables.find((t) => t.tableName === tableInVisual);
        const baseCols = t?.columns || [];
        setSchemaCols(baseCols);
        setSchemaTable(t ?? null);
        setSampleData([]);

        // Kick off value-fingerprinting in the background; when it resolves,
        // merge semanticHint into each column (drives isEmail/isURL/isState etc).
        if (baseCols.length > 0) {
          try {
            const hints = await probeSemanticType(connectionId, tableInVisual, baseCols);
            if (cancelled) return;
            if (Object.keys(hints).length > 0) {
              setSchemaCols(baseCols.map((c) => hints[c.columnName]
                ? { ...c, semanticHint: hints[c.columnName] }
                : c));
            }
          } catch { /* ignore — predicates still work from name regexes */ }
        }
      })
      .catch(() => { if (!cancelled) { setSchemaCols(EMPTY_COLS); setSchemaTable(null); setSampleData([]); setLastRowCount(undefined); } });
    return () => { cancelled = true; };
  }, [connectionId, selectedWidget?.id, selectedWidget?.dataSource?.mode, selectedWidget?.dataSource?.visualQuery?.table]);

  // Effect 2 — synthesize post-aggregation columns + write to widget record.
  // Re-fires when EITHER the fetched schema changes OR the visualQuery's
  // summarize/groupBy changes.  Output is the "what will appear in the
  // result" view, which is what every palette / config panel / widget
  // renderer should see via widget.columns + widget.shape.  Keeping this
  // synthesis in a single place (synthesizePostAggColumns) + writing to
  // the store eliminates the old local `effectiveColumns` memo that every
  // consumer was reading divergently from widget.columns.
  useEffect(() => {
    const widgetId = selectedWidget?.id;
    if (!widgetId) return;
    const ds = selectedWidget?.dataSource;
    // Only visual mode populates this path; SQL/script widget.columns is
    // written by setWidgetQueryResult on query-result-land.
    if (ds?.mode !== "visual") return;
    const effective = synthesizePostAggColumns(schemaCols, ds.visualQuery);
    setWidgetColumnsFromSchema(widgetId, effective, schemaTable);
  }, [
    selectedWidget?.id,
    selectedWidget?.dataSource?.mode,
    schemaCols,
    schemaTable,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (selectedWidget?.dataSource?.visualQuery?.groupBy ?? []).join("\u0000"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(selectedWidget?.dataSource?.visualQuery?.summarize ?? []),
    setWidgetColumnsFromSchema,
  ]);

  // Auto-update columns + rowCount from actual query result when groupBy/summarize change.
  // Mirrors reference behavior: uses result data (rows+cols) for viz recommendations, not source schema.
  // The schema-loading effect above sets columns for raw table drops; this effect overrides for
  // aggregated queries so the palette classifies [OrderDate, Freight_sum] not 14 schema cols.
  useEffect(() => {
    const ds = selectedWidget?.dataSource;
    if (!connectionId || !ds || ds.mode !== "visual") return;
    const tableInVisual = ds.visualQuery?.table;
    if (!tableInVisual) return;
    const isAgg = (ds.visualQuery?.summarize?.length ?? 0) > 0
      || (ds.visualQuery?.groupBy?.length ?? 0) > 0;
    if (!isAgg) return; // raw table drop: schema columns from the effect above are correct

    const sql = sqlForDataSource(
      ds,
      getConnectionType(connectionId),
      temporalColumnNamesOf(selectedWidget?.shape),
    );
    if (!sql) return;

    let cancelled = false;
    executeQuery(connectionId, sql)
      .then((res) => {
        if (cancelled || !res.data || res.data.length === 0) return;
        // Only update rowCount — column types come from widget.columns
        // (written by setWidgetColumnsFromSchema; type-preserving).
        // [SQL-TRACE] diagnostic — leave commented; uncomment to debug what
        // value flows into the engine's `hints.rowCount` palette gate.
        // console.log(
        //   '[SQL-TRACE ConfigPanel setLastRowCount] widgetId=' + selectedWidget?.id +
        //   ' lastRowCount=' + res.rowCount +
        //   ' dataLen=' + res.data.length,
        // );
        setLastRowCount(res.rowCount);
      })
      .catch(() => { /* ignore — schema columns from main effect remain as fallback */ });
    return () => { cancelled = true; };
  }, [
    connectionId,
    selectedWidget?.id,
    selectedWidget?.dataSource?.mode,
    selectedWidget?.dataSource?.visualQuery?.table,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (selectedWidget?.dataSource?.visualQuery?.groupBy ?? []).join("\u0000"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(selectedWidget?.dataSource?.visualQuery?.summarize ?? []),
  ]);

  // Probe distinct-value counts for the group-by columns — only for chart
  // widgets (pie/doughnut cardinality rules don't apply to Number/tabulator/etc.)
  // and only when we have a resolved table. Re-runs when the groupBy set
  // changes; the underlying cache dedupes repeated probes across session.
  useEffect(() => {
    if (selectedWidget?.type !== "chart") { setCardinality({}); return; }
    const ds = selectedWidget.dataSource;
    const tableName = ds?.mode === "visual" ? ds.visualQuery?.table : undefined;
    const groupBy = ds?.mode === "visual" ? ds.visualQuery?.groupBy : undefined;
    if (!connectionId || !tableName || !groupBy || groupBy.length === 0) {
      setCardinality({});
      return;
    }
    let cancelled = false;
    probeCardinality(connectionId, tableName, groupBy)
      .then((result) => { if (!cancelled) setCardinality(result); })
      .catch(() => { if (!cancelled) setCardinality({}); });
    return () => { cancelled = true; };
  }, [
    connectionId,
    selectedWidget?.id,
    selectedWidget?.type,
    selectedWidget?.dataSource?.mode,
    selectedWidget?.dataSource?.visualQuery?.table,
    // Stringify groupBy so the effect re-fires when columns are added/removed.
    (selectedWidget?.dataSource?.visualQuery?.groupBy ?? []).join("\u0000"),
  ]);

  // ── Auto-pick X/Y axes for chart widgets ──────────────────────────────
  // Compute defaults on every columns/chartType/cardinality change, but only
  // apply them when the user's current picks are missing or reference columns
  // that no longer exist in the schema. User overrides persist across query
  // edits as long as their columns stay in the result.
  useEffect(() => {
    if (selectedWidget?.type !== "chart") return;
    if (columns.length === 0) return;
    const chartType = (selectedWidget.displayConfig.chartType as string) || "bar";
    const currentXFields = (selectedWidget.displayConfig.xFields as string[] | undefined) ?? [];
    const currentYFields = (selectedWidget.displayConfig.yFields as string[] | undefined) ?? [];
    const { dims, measures } = splitDimsAndMeasures(columns);
    const defaults = pickDefaultAxes(dims, measures, chartType, { cardinality });

    const keepX = canReuseAxisPicks(currentXFields, columns);
    const keepY = canReuseAxisPicks(currentYFields, columns);
    const nextX = keepX ? currentXFields : defaults.xFields;
    const nextY = keepY ? currentYFields : defaults.yFields;
    const nextBubble = selectedWidget.displayConfig.bubbleSizeField
      ?? defaults.bubbleSizeField;

    // Only write when something actually changed — avoid an infinite useEffect loop.
    const changed =
      nextX.join("\u0000") !== currentXFields.join("\u0000") ||
      nextY.join("\u0000") !== currentYFields.join("\u0000") ||
      nextBubble !== selectedWidget.displayConfig.bubbleSizeField;
    if (!changed) return;

    updateWidgetDisplayConfig(selectedWidget.id, {
      ...selectedWidget.displayConfig,
      xFields: nextX,
      yFields: nextY,
      ...(nextBubble !== undefined ? { bubbleSizeField: nextBubble } : {}),
      // Track what came from auto-pick so the AutoBadge renders correctly.
      _auto: {
        ...((selectedWidget.displayConfig._auto as Record<string, boolean> | undefined) ?? {}),
        xFields: !keepX,
        yFields: !keepY,
      },
    });
  }, [
    selectedWidget?.id,
    selectedWidget?.type,
    selectedWidget?.displayConfig?.chartType,
    // Stringify so the effect re-fires on real changes, not on identity flips.
    columns.map((c) => c.columnName).join("\u0000"),
    Object.entries(cardinality).map(([k, v]) => `${k}:${v}`).join("\u0000"),
  ]);

  // Shared query-result for the selected widget.  useWidgetData (the single
  // fetcher) writes here after each execution; we subscribe so that SQL/script
  // modes automatically populate `columns` + `sampleData` + `lastRowCount` as
  // soon as a Run completes — without a separate backend call of our own.
  const widgetQR = useCanvasStore((s) =>
    selectedWidget?.id ? s.queryResults[selectedWidget.id] : undefined,
  );
  const widgetQueryLoading = widgetQR?.loading ?? false;
  const widgetQueryError = widgetQR?.error ?? null;

  // Manually trigger a detection — used only when the user clicks the
  // "Detect columns from query" button in the Display / FilterPane tabs.
  // Bumps the appropriate version on dataSource so useWidgetData does a single
  // execution (which then populates the store entry the effect below watches).
  // Keeps the button meaningful for the "wrote SQL but hasn't clicked Run yet"
  // case while routing all network traffic through the shared fetcher.
  const detectColumnsFromQuery = () => {
    if (!connectionId || !selectedWidget?.dataSource) return;
    const ds = selectedWidget.dataSource;
    if (ds.mode === "script") {
      if (!ds.script) { setDetectError("Write a script first"); return; }
      updateWidgetDataSource(selectedWidget.id, {
        ...ds,
        scriptExecuteVersion: (ds.scriptExecuteVersion ?? 0) + 1,
      });
    } else {
      const sql = sqlForDataSource(
        ds,
        getConnectionType(connectionId),
        temporalColumnNamesOf(selectedWidget?.shape),
      );
      if (!sql) { setDetectError("Write or generate a query first"); return; }
      const nextVersion = (ds.executeVersion ?? 0) + 1;
      // Persist sql/generatedSql for visual→SQL consistency, same as handleRun.
      updateWidgetDataSource(selectedWidget.id, {
        ...ds,
        sql: (ds.mode === "sql" || ds.mode === "ai-sql") ? ds.sql : sql,
        generatedSql: sql,
        executeVersion: nextVersion,
      });
    }
    setDetectError(null);
  };

  // Auto-populate sampleData + lastRowCount from the shared store entry.
  // Fires whenever useWidgetData writes a new result.  The `columns` /
  // `shape` fields are written onto the widget record by the store mutator
  // `setWidgetQueryResult` itself — no local `setColumns` call needed.
  useEffect(() => {
    const ds = selectedWidget?.dataSource;
    if (!ds) return;
    if (ds.mode !== "sql" && ds.mode !== "ai-sql" && ds.mode !== "script") return;
    const result = widgetQR?.result;
    if (!result || !result.data || result.data.length === 0) return;
    setSampleData(result.data.slice(0, 5));
    setLastRowCount(result.rowCount);
    setDetectError(null);
  }, [widgetQR, selectedWidget?.dataSource?.mode]);

  // Palette grouping: recommended / sensible / nonsensible.
  // Re-evaluates whenever columns or cardinality change (e.g. user picks a
  // different table / changes group-by / aggregation in the Data tab).
  // Hooks MUST be declared before the `if (!selectedWidget) return` below —
  // hooks called after an early return violate the Rules of Hooks and cause
  // React error #310 when the user toggles selection.
  //
  // `isAggregated` drives the "no aggregation, no native" branch — when the
  // user has neither summarized nor grouped, we bias recommendations toward
  // Table/Detail (+Map if geo) instead of pushing Chart/Trend at a raw table
  // drop where they'd just render noise.
  //
  // Derived from `visualQuery.summarize`/`groupBy` ONLY — NOT from
  // `dataSource.mode`. A silent mode flip to sql/ai-sql/script (triggered
  // by simply clicking into the Finetune tab) used to make this unconditionally
  // true, which trapped the palette in "aggregated mode" even after the user
  // cleared all chips and returned to Visual. The visualQuery is the source
  // of truth; ignore mode.
  // SQL/script modes return undefined so the widget picker skips Rule 0
  // ("raw unaggregated browse → tabulator only") and evaluates the actual
  // result shape instead. Rule 0 fires on strict === false, so undefined
  // falls through to the scalar/chart/etc. rules.
  const isAggregated = useMemo<boolean | undefined>(() => {
    const ds = selectedWidget?.dataSource;
    if (!ds || ds.mode === "sql" || ds.mode === "ai-sql" || ds.mode === "script") return undefined;
    const vq = ds.visualQuery;
    if (vq?.kind === "cube") return true;
    const hasSummarize = (vq?.summarize?.length ?? 0) > 0;
    const hasGroupBy = (vq?.groupBy?.length ?? 0) > 0;
    return hasSummarize || hasGroupBy;
  }, [selectedWidget?.dataSource]);

  // `columns` (= `selectedWidget.columns`) IS the post-aggregation effective
  // view — Effect 2 above synthesizes it via `synthesizePostAggColumns`
  // and writes it to the widget record via `setWidgetColumnsFromSchema`.
  // The widget also carries a pre-classified `shape: PickShape` computed
  // alongside `columns`.  When present, the palette calls
  // `groupWidgetsByShape` which skips the local shape-rebuild that used
  // to run once per palette render (one of the original drift sources).
  // The pre-data / pre-schema case falls back to `groupWidgetsBySensibility`
  // (which internally calls shapeFromColumns once for legacy parity).
  const sensibilityGroups = useMemo(
    () => selectedWidget?.shape
      ? groupWidgetsByShape(selectedWidget.shape, columns, { cardinality, isAggregated, rowCount: lastRowCount })
      : groupWidgetsBySensibility(columns, { cardinality, isAggregated, rowCount: lastRowCount }),
    [selectedWidget?.shape, columns, cardinality, isAggregated, lastRowCount],
  );
  const selectedIsNonsensible =
    !!selectedWidget && sensibilityGroups.nonsensible.includes(selectedWidget.type);
  const [showMoreWidgets, setShowMoreWidgets] = useState(false);
  useEffect(() => {
    setShowMoreWidgets(selectedIsNonsensible);
  }, [selectedIsNonsensible]);

  // Auto-switch (tabulator/pivot → best data-shape fit on first query result)
  // lives ENTIRELY inside canvas-store's `setWidgetQueryResult` mutator.
  // No reactive observer here — a discrete store event drives a single
  // atomic (widgets, queryResults) write.  Structurally impossible to loop,
  // unlike the prior useEffect implementation that triggered React #185
  // "Maximum update depth exceeded" during visual→sql mode transitions.
  // User-explicit palette clicks set `userPicked: true` (see button onClick
  // below) which pins the type permanently against future auto-switches.

  if (!selectedWidget) {
    return (
      <div className="w-80 shrink-0 border-l border-border bg-muted/30 overflow-y-auto">
        <div className="flex items-center justify-end border-b border-border px-2 py-1.5">
          <button id="btnCollapseRightPanel" onClick={onCollapse} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Hide config panel">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-center h-[calc(100%-36px)]">
          <div className="text-center p-6">
            <Settings2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Select a component to configure</p>
          </div>
        </div>
      </div>
    );
  }

  const isDataWidget = ["chart", "tabulator", "pivot", "number", "map", "sankey", "gauge", "trend", "progress", "detail"].includes(selectedWidget.type);
  const isFilterPane = selectedWidget.type === "filter-pane";
  const isText = selectedWidget.type === "text";
  const isDivider = selectedWidget.type === "divider";
  const isIframe = selectedWidget.type === "iframe";

  const handleDisplayChange = (config: WidgetDisplayConfig) => {
    updateWidgetDisplayConfig(selectedWidget.id, config);
  };

  return (
    <div className="w-80 shrink-0 border-l border-border bg-muted/30 flex flex-col overflow-hidden">
      <div className="flex items-center justify-end border-b border-border px-2 py-1.5 shrink-0">
        <button id="btnCollapseRightPanel" onClick={onCollapse} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Hide config panel">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Visualize as — grouped palette.
            Recommended + sensible widgets live in the main grid; non-sensible
            collapse under "More widgets". The grouping reactively updates as
            the user changes the Data tab (table / aggregation / group-by). */}
        {isDataWidget && (() => {
          const WIDGET_META: Record<WidgetType, { label: string; Icon: typeof Table } | undefined> = {
            tabulator: { label: "Table", Icon: Table },
            chart: { label: "Chart", Icon: BarChart3 },
            pivot: { label: "Pivot", Icon: PieChart },
            number: { label: "Number", Icon: Hash },
            map: { label: "Map", Icon: MapIcon },
            sankey: { label: "Sankey", Icon: Workflow },
            gauge: { label: "Gauge", Icon: GaugeIcon },
            trend: { label: "Trend", Icon: TrendingUp },
            progress: { label: "Progress", Icon: BarChartHorizontal },
            detail: { label: "Detail", Icon: FileText },
            text: undefined, divider: undefined, iframe: undefined, "filter-pane": undefined,
          };

          // Only the #1 pick (first in the recommended array) gets the star —
          // single-winner signal. Other recommended items still come first in
          // the grid (position = rank), but without per-item visual noise.
          const bestPick: WidgetType | undefined = sensibilityGroups.recommended[0];

          // Chart subtype to show in the "Visualize as" main grid.
          // Priority: 1) If the widget is already a chart with a user-picked chartType → show that.
          //           2) Otherwise fall back to the smart-defaults #1 ranked subtype.
          // The "More widgets" section always shows the generic "Chart" label.
          const _savedChartType = selectedWidget?.type === "chart"
            ? (selectedWidget.displayConfig?.chartType as string | undefined)
            : undefined;
          // Chart subtype ranking splits widget.columns (the authoritative
          // post-agg effective view written by Effect 2).  Internal isTemporalLike
          // checks stay inside rankChartSubtypes — a chart-subtype concern, not
          // a widget-type drift source.
          const { dims: _chartDims, measures: _chartMeasures } = splitDimsAndMeasures(columns);
          const _bestChartSubtype = _savedChartType
            ?? rankChartSubtypes(_chartDims, _chartMeasures, { cardinality, extractions: extractionsSet })[0];
          const _bestChartMeta = CHART_TYPES.find((ct) => ct.type === _bestChartSubtype);

          const renderButton = (type: WidgetType, isRecommended: boolean, inMainGrid: boolean) => {
            const meta = WIDGET_META[type];
            if (!meta) return null;
            let { label, Icon } = meta;
            // In the main grid, show the specific chart subtype label + icon
            if (type === "chart" && inMainGrid && _bestChartMeta) {
              label = `Chart (${_bestChartMeta.label})`;
              Icon = _bestChartMeta.icon;
            }
            const isSelected = selectedWidget.type === type;
            const isBest = type === bestPick;
            return (
              <button
                key={type}
                id={`btnVisualizeAs-${type}`}
                type="button"
                onClick={() => {
                  changeWidgetRenderMode(selectedWidget.id, type);
                  // ANY palette click is an explicit user choice — recommended,
                  // sensible, or from "More widgets". `userPicked: true` pins
                  // the widget type permanently against the store's one-shot
                  // auto-switch (see canvas-store's setWidgetQueryResult:
                  // skips widgets with userPicked=true). Seed target widget's
                  // display fields with the shared helper so the first-time
                  // click on Number / Gauge / Progress / Trend / Sankey lands
                  // on sensible preselected columns without an extra click.
                  const prevConfig = selectedWidget.displayConfig || {};
                  const patch = seedDisplayConfigForType(
                    type,
                    prevConfig,
                    columns,
                    { cardinality, extractions: extractionsSet },
                    selectedWidget.shape,
                  );
                  updateWidgetDisplayConfig(selectedWidget.id, {
                    ...(patch ?? prevConfig),
                    userPicked: true,
                  });
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                  isSelected
                    ? "bg-background text-foreground shadow-sm"
                    : isRecommended
                      ? "text-foreground hover:bg-background/60"
                      : "text-muted-foreground hover:text-foreground"
                }`}
                title={isBest ? "Best fit for the current data" : undefined}
              >
                {isBest && (
                  <Sparkles id="sparklesBadge" className="sparkles-icon w-2.5 h-2.5 absolute top-0.5 right-0.5 text-amber-500" />
                )}
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          };

          const mainGrid = [...sensibilityGroups.recommended, ...sensibilityGroups.sensible];
          const moreGrid = sensibilityGroups.nonsensible;
          const recSet = new Set(sensibilityGroups.recommended);

          return (
            <div id="visualizeAsSection">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Visualize as
              </label>
              <div id="visualizeAsGrid" className="grid grid-cols-5 gap-0.5 p-0.5 bg-muted/50 rounded-lg">
                {mainGrid.map((type) => renderButton(type, recSet.has(type), true))}
              </div>
              {moreGrid.length > 0 && (
                <div className="mt-1.5">
                  <button
                    id="btnMoreWidgets"
                    type="button"
                    onClick={() => setShowMoreWidgets((v) => !v)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider w-full"
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${showMoreWidgets ? "" : "-rotate-90"}`}
                    />
                    More widgets
                    <span className="font-normal normal-case lowercase ml-1">
                      ({moreGrid.length} less suited for this data)
                    </span>
                  </button>
                  {showMoreWidgets && (
                    <div id="moreWidgetsGrid" className="grid grid-cols-5 gap-0.5 p-0.5 mt-1 bg-muted/30 rounded-lg">
                      {moreGrid.map((type) => renderButton(type, false, false))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Widget type label (for non-data widgets) */}
        {!isDataWidget && (
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {selectedWidget.type}
          </h3>
        )}

        {/* Tab switcher — only for data widgets */}
        {isDataWidget && (
          <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg">
            <button
              id="btnDataTab"
              onClick={() => setActiveTab("data")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                activeTab === "data" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="w-3 h-3" />
              Data
            </button>
            <button
              id="btnDisplayTab"
              onClick={() => setActiveTab("display")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                activeTab === "display" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="w-3 h-3" />
              Display
            </button>
          </div>
        )}

        {/* Data tab */}
        {isDataWidget && activeTab === "data" && (
          <QueryBuilder
            widgetId={selectedWidget.id}
            dataSource={selectedWidget.dataSource}
            onChange={(ds: DataSource) => updateWidgetDataSource(selectedWidget.id, ds)}
            connectionId={connectionId}
          />
        )}

        {/* Display tab */}
        {isDataWidget && activeTab === "display" && (
          <div className="space-y-4">
            {/* Column-detection helper.  Hidden once columns are populated — with
                the auto-populate effect above, a Run in the Data tab fills this
                in automatically, so the button is a quiet fallback for the
                "typed SQL but haven't clicked Run yet" case and for retry on error. */}
            {columns.length === 0 && (
              <div className="p-3 rounded-md border border-dashed border-border bg-muted/30 text-xs space-y-2">
                <p className="text-muted-foreground">
                  No columns yet. Pick a table in the Data tab, or click Run to load the columns.
                </p>
                <button
                  type="button"
                  id="btnDetectColumns"
                  onClick={detectColumnsFromQuery}
                  disabled={widgetQueryLoading || !connectionId || !selectedWidget.dataSource}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {widgetQueryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {widgetQueryLoading ? "Detecting..." : "Detect columns from query"}
                </button>
                {(detectError || widgetQueryError) && (
                  <p className="text-destructive">{detectError || widgetQueryError}</p>
                )}
              </div>
            )}

            {/* Component-specific config */}
            {selectedWidget.type === "chart" && (
              <ChartConfig
                config={selectedWidget.displayConfig}
                columns={columns}
                onChange={handleDisplayChange}
                rankingHints={{ cardinality, extractions: extractionsSet }}
              />
            )}
            {selectedWidget.type === "tabulator" && (
              <TabulatorConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} rowCount={lastRowCount} />
            )}
            {selectedWidget.type === "pivot" && (
              <PivotConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "number" && (
              <NumberConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "map" && (
              <MapConfig config={selectedWidget.displayConfig} columns={columns} shape={selectedWidget.shape} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "sankey" && (
              <SankeyConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} cardinality={cardinality} />
            )}
            {selectedWidget.type === "gauge" && (
              <GaugeConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "trend" && (
              <TrendConfig config={selectedWidget.displayConfig} columns={columns} shape={selectedWidget.shape} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "progress" && (
              <ProgressConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "detail" && (
              <DetailConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}

            {/* DSL Customizer — only the 3 widget types that have a DSL surface. */}
            {(selectedWidget.type === "chart" ||
              selectedWidget.type === "tabulator" ||
              selectedWidget.type === "pivot") && (
              <div className="pt-2 border-t border-border/50">
                <BidirectionalDslCustomizer
                  widgetId={selectedWidget.id}
                  widgetType={selectedWidget.type}
                  columns={columns}
                  sampleData={sampleData}
                />
              </div>
            )}
          </div>
        )}

        {/* Text widget — textarea; rendered as markdown in the widget */}
        {isText && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Text</label>
            <textarea
              id="txtWidgetTextContent"
              value={(selectedWidget.displayConfig.textContent as string) || ""}
              onChange={(e) => handleDisplayChange({ ...selectedWidget.displayConfig, textContent: e.target.value })}
              placeholder={"# Heading\n**bold**, *italic*\n- bullet one\n- bullet two"}
              rows={10}
              className="w-full text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground font-mono resize-y min-h-[120px]"
            />
            <p className="text-[11px] text-muted-foreground">
              Supports simple markdown: <code># heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>- list</code>, <code>[link](url)</code>, tables.
            </p>
          </div>
        )}

        {/* Divider widget — purely visual, no config */}
        {isDivider && (
          <div className="text-xs text-muted-foreground p-3 rounded-md border border-dashed border-border bg-muted/30">
            A divider has no configuration — it's a visual separator. Drag the corners to resize, or delete it with the × button.
          </div>
        )}

        {/* iFrame widget — embed an external page. Sandboxed by default. */}
        {isIframe && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">URL</label>
            <input
              type="url"
              value={(selectedWidget.displayConfig.iframeUrl as string) || ""}
              onChange={(e) => handleDisplayChange({ ...selectedWidget.displayConfig, iframeUrl: e.target.value })}
              placeholder="https://example.com/embed"
              className="w-full text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
            />
            <label className="text-xs font-medium text-muted-foreground mt-2 block">Title (a11y)</label>
            <input
              value={(selectedWidget.displayConfig.iframeTitle as string) || ""}
              onChange={(e) => handleDisplayChange({ ...selectedWidget.displayConfig, iframeTitle: e.target.value })}
              placeholder="Embedded content"
              className="w-full text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
            />
            <label className="text-xs font-medium text-muted-foreground mt-2 block">
              Sandbox
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">(space-separated tokens)</span>
            </label>
            <input
              value={(selectedWidget.displayConfig.iframeSandbox as string) ?? "allow-scripts allow-same-origin allow-popups allow-forms"}
              onChange={(e) => handleDisplayChange({ ...selectedWidget.displayConfig, iframeSandbox: e.target.value })}
              placeholder="allow-scripts allow-same-origin"
              className="w-full text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Default sandbox blocks the embed from navigating the parent page. Clear to remove all restrictions, or use only the tokens you need (e.g. <code>allow-scripts</code>).
            </p>
          </div>
        )}

        {/* Filter Pane config — needs data source (for table) + display (for field) */}
        {isFilterPane && (
          <div className="space-y-4">
            <QueryBuilder
              widgetId={selectedWidget.id}
              dataSource={selectedWidget.dataSource}
              onChange={(ds: DataSource) => updateWidgetDataSource(selectedWidget.id, ds)}
              connectionId={connectionId}
            />
            <div className="pt-2 border-t border-border/50">
              {columns.length === 0 && (
                <div className="mb-3 p-3 rounded-md border border-dashed border-border bg-muted/30 text-xs space-y-2">
                  <p className="text-muted-foreground">
                    No columns yet. Pick a table in the Data tab, or click Run to load the columns.
                  </p>
                  <button
                    type="button"
                    onClick={detectColumnsFromQuery}
                    disabled={widgetQueryLoading || !connectionId || !selectedWidget.dataSource}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {widgetQueryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    {widgetQueryLoading ? "Detecting..." : "Detect columns from query"}
                  </button>
                  {(detectError || widgetQueryError) && (
                    <p className="text-destructive">{detectError || widgetQueryError}</p>
                  )}
                </div>
              )}
              <FilterPaneConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
              <div className="pt-2">
                <BidirectionalDslCustomizer
                  widgetId={selectedWidget.id}
                  widgetType="filter-pane"
                  columns={columns}
                  sampleData={sampleData}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
