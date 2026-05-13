"use client";

import { useEffect, useMemo, useRef } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2 } from "lucide-react";
import { pickGaugeField } from "@/lib/explore-data/smart-defaults";
import { useEffectiveField } from "@/lib/hooks/use-effective-field";

interface GaugeWidgetProps {
  widgetId: string;
}

/**
 * GaugeWidget — thin React wrapper around <rb-gauge>.
 * Auto-picks the first non-ID measure. Expects displayConfig:
 *   { field, min?, max?, bands?: [{ to, color }] }
 */
export function GaugeWidget({ widgetId }: GaugeWidgetProps) {
  const { result, loading, error, tableSchema } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-gauge");

  const displayConfig = widget?.displayConfig ?? {};
  const configField = (displayConfig.field as string) || "";

  // SINGLE TRUTH for column inference + saved-field validation lives in
  // useEffectiveField. See lib/hooks/use-effective-field.ts.
  const { inferredColumns, keys, validateField } = useEffectiveField(result);

  const auto = useMemo(
    () => pickGaugeField(inferredColumns, tableSchema),
    [inferredColumns, tableSchema],
  );

  const effectiveField = validateField(configField) || auto.field || keys[0] || "";

  const options = useMemo(() => {
    const rawBands = displayConfig.gaugeBands as { to: number; color: string }[] | undefined;
    const reverseColors = (displayConfig.gaugeBandsReverse as boolean | undefined) ?? false;
    // When reversed, swap COLORS while keeping the threshold positions — produces
    // green-on-left / red-on-right for risk metrics where "more = worse".
    const bands = (reverseColors && rawBands && rawBands.length > 1)
      ? rawBands.map((b, i) => ({ to: b.to, color: rawBands[rawBands.length - 1 - i].color }))
      : rawBands;
    return {
      ...displayConfig,
      field: effectiveField,
      bands,
      format: displayConfig.gaugeFormat as "number" | "currency" | "percent" | "raw" | undefined,
    };
  }, [displayConfig, effectiveField]);

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
        No value to show.
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading gauge component…
      </div>
    );
  }

  return (
    // @ts-expect-error — custom element
    <rb-gauge ref={ref} style={{ display: "block", width: "100%", height: "100%", minHeight: "140px" }} />
  );
}
