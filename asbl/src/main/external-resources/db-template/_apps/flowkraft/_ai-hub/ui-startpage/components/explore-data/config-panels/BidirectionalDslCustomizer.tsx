"use client";

import { useMemo } from "react";
import { DslCustomizer } from "./DslCustomizer";
import { useDslSync } from "@/lib/hooks/use-dsl-sync";
import { uiToChartDsl, chartDslToUi } from "@/lib/explore-data/dsl-sync/chart-mapping";
import { uiToTabulatorDsl, tabulatorDslToUi } from "@/lib/explore-data/dsl-sync/tabulator-mapping";
import { uiToPivotDsl, pivotDslToUi } from "@/lib/explore-data/dsl-sync/pivot-mapping";
import { uiToFilterPaneDsl, filterPaneDslToUi } from "@/lib/explore-data/dsl-sync/filter-pane-mapping";
import { uiToFilterBarDsl, filterBarDslToUi } from "@/lib/explore-data/dsl-sync/filter-bar-mapping";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";

type DslWidgetType = "chart" | "tabulator" | "pivot" | "filter-pane" | "filter-bar";

interface BidirectionalDslCustomizerProps {
  widgetId: string;
  widgetType: DslWidgetType;
  columns?: ColumnSchema[];
  sampleData?: Record<string, unknown>[];
}

/**
 * Widget-type → backend endpoint discriminator.
 * "filter-bar" maps to "reportparameters"; its actual sync is handled by
 * FilterBarConfigPanel (canvas-level) — not by useDslSync (widget-level).
 */
const DSL_TYPE_PATH: Record<DslWidgetType, string> = {
  chart:         "chart",
  tabulator:     "tabulator",
  pivot:         "pivot",
  "filter-pane": "filterpane",
  "filter-bar":  "reportparameters",
};

type Mapping = {
  uiToDsl: (dc: WidgetDisplayConfig) => Record<string, unknown>;
  dslToUi: (opts: Record<string, unknown>, dc: WidgetDisplayConfig) => WidgetDisplayConfig;
};

const MAPPINGS: Record<DslWidgetType, Mapping> = {
  chart:         { uiToDsl: uiToChartDsl,      dslToUi: chartDslToUi },
  tabulator:     { uiToDsl: uiToTabulatorDsl,  dslToUi: tabulatorDslToUi },
  pivot:         { uiToDsl: uiToPivotDsl,      dslToUi: pivotDslToUi },
  "filter-pane": { uiToDsl: uiToFilterPaneDsl, dslToUi: filterPaneDslToUi },
  // Stubs — FilterBarConfigPanel owns the real sync for this canvas-level type.
  "filter-bar":  { uiToDsl: uiToFilterBarDsl,  dslToUi: filterBarDslToUi },
};

/**
 * One entry point for bidirectional UI↔DSL sync across all 5 DSL widget types.
 * Picks the widget-specific mapping by type and drives `useDslSync` once per
 * mount (no wasted subscriptions / duplicate debounce timers).
 */
export function BidirectionalDslCustomizer({
  widgetId,
  widgetType,
  columns,
  sampleData,
}: BidirectionalDslCustomizerProps) {
  const dslType = DSL_TYPE_PATH[widgetType];
  const { uiToDsl, dslToUi } = useMemo(() => MAPPINGS[widgetType], [widgetType]);

  const { status, errorMessage, onDslTextChange, dslText } = useDslSync(
    widgetId,
    dslType,
    uiToDsl,
    dslToUi,
  );

  return (
    <DslCustomizer
      dsl={dslText}
      onChange={onDslTextChange}
      componentType={widgetType}
      columns={columns}
      sampleData={sampleData}
      syncStatus={status}
      syncError={errorMessage}
    />
  );
}
