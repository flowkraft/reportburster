"use client";

import { useEffect, useMemo, useRef } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2 } from "lucide-react";
import { pickTrendFields } from "@/lib/explore-data/smart-defaults";
import { pickColumnFormat } from "@/lib/explore-data/type-formatters";
import type { ColumnSchema } from "@/lib/explore-data/types";

interface TrendWidgetProps {
  widgetId: string;
}

/**
 * TrendWidget — thin React wrapper around <rb-trend>.
 * Auto-picks a date + value field. Format inferred from column name
 * (currency for revenue/freight/price/etc., else plain number).
 */
export function TrendWidget({ widgetId }: TrendWidgetProps) {
  const { result, loading, error, tableSchema } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-trend");

  const displayConfig = widget?.displayConfig ?? {};
  const configDate = (displayConfig.dateField as string) || "";
  const configValue = (displayConfig.valueField as string) || "";
  const configFormat = (displayConfig.format as string) || "";

  const inferredColumns: ColumnSchema[] = useMemo(() => {
    const row0 = result?.data?.[0];
    if (!row0) return [];
    return Object.entries(row0).map(([name, v]) => {
      let typeName = "VARCHAR";
      if (typeof v === "number") typeName = "DOUBLE";
      else if (typeof v === "string" && v !== "" && !isNaN(Date.parse(v))) typeName = "DATE";
      return { columnName: name, typeName, isNullable: true };
    });
  }, [result]);

  const auto = useMemo(
    () => pickTrendFields(inferredColumns, tableSchema),
    [inferredColumns, tableSchema],
  );

  const firstKey = inferredColumns[0]?.columnName ?? "";
  const effectiveDate = configDate || auto.dateField || firstKey;
  const effectiveValue = configValue || auto.valueField || inferredColumns[1]?.columnName || "";

  // Format inference — same source as NumberWidget uses.
  const effectiveFormat = useMemo<"number" | "currency" | "percent" | "raw">(() => {
    if (configFormat === "number" || configFormat === "currency" || configFormat === "percent" || configFormat === "raw") {
      return configFormat;
    }
    if (!effectiveValue) return "number";
    const spec = pickColumnFormat({ columnName: effectiveValue, typeName: "DOUBLE", isNullable: true });
    if (spec.kind === "currency") return "currency";
    if (spec.kind === "percentage") return "percent";
    return "number";
  }, [configFormat, effectiveValue]);

  const options = useMemo(
    () => ({
      ...displayConfig,
      dateField: effectiveDate,
      valueField: effectiveValue,
      format: effectiveFormat,
    }),
    [displayConfig, effectiveDate, effectiveValue, effectiveFormat],
  );

  useEffect(() => {
    if (!ready || !ref.current || !result) return;
    const el = ref.current as HTMLElement & { data?: unknown; options?: unknown };
    el.data = result.data;
    el.options = options;
  }, [ready, result, options]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-xs text-destructive p-2 overflow-hidden">
        Query error: {error.split("\n")[0].slice(0, 200)}
      </div>
    );
  }
  if (!result || result.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No trend data.
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading trend component…
      </div>
    );
  }

  return (
    // @ts-expect-error — custom element
    <rb-trend ref={ref} style={{ display: "block", width: "100%", height: "100%", minHeight: "80px" }} />
  );
}
