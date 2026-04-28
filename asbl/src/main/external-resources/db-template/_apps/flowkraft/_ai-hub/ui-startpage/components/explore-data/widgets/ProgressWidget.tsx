"use client";

import { useEffect, useMemo, useRef } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2 } from "lucide-react";
import { pickProgressField, pickProgressGoal } from "@/lib/explore-data/smart-defaults";
import { pickColumnFormat } from "@/lib/explore-data/type-formatters";
import type { ColumnSchema } from "@/lib/explore-data/types";

interface ProgressWidgetProps {
  widgetId: string;
}

/**
 * ProgressWidget — thin React wrapper around <rb-progress>.
 * Auto-picks the first non-ID measure as the value field; derives a "nice"
 * goal from the value itself (value × 1.25 rounded up to a nice number) when
 * no goal is configured.
 */
export function ProgressWidget({ widgetId }: ProgressWidgetProps) {
  const { result, loading, error, tableSchema } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-progress");

  const displayConfig = widget?.displayConfig ?? {};
  const configField = (displayConfig.field as string) || "";
  const configGoal = displayConfig.goal as number | undefined;
  const configFormat = (displayConfig.format as string) || "";

  const inferredColumns: ColumnSchema[] = useMemo(() => {
    const row0 = result?.data?.[0];
    if (!row0) return [];
    return Object.entries(row0).map(([name, v]) => ({
      columnName: name,
      typeName: typeof v === "number" ? "DOUBLE" : "VARCHAR",
      isNullable: true,
    }));
  }, [result]);

  const auto = useMemo(
    () => pickProgressField(inferredColumns, tableSchema),
    [inferredColumns, tableSchema],
  );

  const firstKey = inferredColumns[0]?.columnName ?? "";
  const effectiveField = configField || auto.field || firstKey;

  // Derive goal from the first row's value if not configured.
  const effectiveGoal = useMemo(() => {
    if (typeof configGoal === "number" && configGoal > 0) return configGoal;
    const row0 = result?.data?.[0];
    if (!row0 || !effectiveField) return 100;
    const value = Number(row0[effectiveField]);
    return pickProgressGoal(value);
  }, [configGoal, result, effectiveField]);

  const effectiveFormat = useMemo<"number" | "currency" | "percent">(() => {
    if (configFormat === "number" || configFormat === "currency" || configFormat === "percent") return configFormat;
    if (!effectiveField) return "number";
    const spec = pickColumnFormat({ columnName: effectiveField, typeName: "DOUBLE", isNullable: true });
    if (spec.kind === "currency") return "currency";
    if (spec.kind === "percentage") return "percent";
    return "number";
  }, [configFormat, effectiveField]);

  const options = useMemo(
    () => ({
      ...displayConfig,
      field: effectiveField,
      goal: effectiveGoal,
      format: effectiveFormat,
    }),
    [displayConfig, effectiveField, effectiveGoal, effectiveFormat],
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
        No progress value.
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading progress component…
      </div>
    );
  }

  return (
    // @ts-expect-error — custom element
    <rb-progress ref={ref} style={{ display: "block", width: "100%", height: "100%", minHeight: "60px" }} />
  );
}
