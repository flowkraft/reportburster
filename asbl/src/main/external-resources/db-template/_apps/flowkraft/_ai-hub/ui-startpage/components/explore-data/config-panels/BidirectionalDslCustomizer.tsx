"use client";

import { useEffect, useState } from "react";
import { DslCustomizer } from "./DslCustomizer";
import { useDslConfig } from "@/lib/hooks/use-dsl-config";
import type { ColumnSchema } from "@/lib/explore-data/types";

type DslWidgetType = "chart" | "tabulator" | "pivot" | "filter-pane" | "filter-bar";

interface BidirectionalDslCustomizerProps {
  widgetId: string;
  widgetType: DslWidgetType;
  columns?: ColumnSchema[];
  sampleData?: Record<string, unknown>[];
}

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Per Principle 4, the DSL editor is one of three views into a widget's
 * canonical DSL Map at displayConfig.dslConfig. The other two: Display tab UI,
 * canvas widget render. All four widget types (chart, tabulator, pivot,
 * filter-pane) read/write via `useDslConfig` — Map → text on open, text → Map
 * on save. The filter-bar is canvas-level (filterDsl on CanvasState) and
 * managed by FilterBarConfigPanel — it does not flow through this component.
 * ============================================================================
 */

export function BidirectionalDslCustomizer({
  widgetId,
  widgetType,
  columns,
  sampleData,
}: BidirectionalDslCustomizerProps) {
  // Map widget-type strings to the discriminated union expected by useDslConfig.
  const dslConfigType = widgetType === "filter-pane" ? "filterpane"
                      : widgetType === "filter-bar"  ? "parameters"
                      : widgetType;
  const { config, getDslText, saveDslText, error } = useDslConfig(
    widgetId,
    dslConfigType as "tabulator" | "chart" | "pivot" | "filterpane" | "parameters",
  );

  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<"synced" | "syncing" | "error">("synced");

  // Whenever the canonical Map changes (Display tab gesture, edit save),
  // re-derive the DSL text view by serializing the Map server-side.
  useEffect(() => {
    let cancelled = false;
    setStatus("syncing");
    getDslText()
      .then((t) => { if (!cancelled) { setText(t); setStatus("synced"); } })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);

  const onChange = (next: string) => {
    setText(next);
    setStatus("syncing");
    saveDslText(next)
      .then(() => setStatus("synced"))
      .catch(() => setStatus("error"));
  };

  return (
    <DslCustomizer
      dsl={text}
      onChange={onChange}
      componentType={widgetType}
      columns={columns}
      sampleData={sampleData}
      syncStatus={status}
      syncError={error}
    />
  );
}
