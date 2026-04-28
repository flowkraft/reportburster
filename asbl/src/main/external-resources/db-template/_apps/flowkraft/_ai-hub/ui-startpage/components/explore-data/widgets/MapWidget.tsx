"use client";

import { useEffect, useRef } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2 } from "lucide-react";

// Diagnostic counter — kept permanently (same policy as other 7 diagnostic logs).
let _mapEffectCount = 0;

interface MapWidgetProps {
  widgetId: string;
}

/**
 * MapWidget — thin React wrapper around the <rb-map> web component.
 *
 * Unlike ChartWidget we don't run smart-defaults here: <rb-map>'s internal
 * `resolveOptions` already auto-detects map type (region / pin / grid) and
 * region sub-type (us_states / world_countries) from the data + user options.
 * So this widget just hands rows + options to the custom element.
 */
export function MapWidget({ widgetId }: MapWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-map");
  // Deep-equality guard: only push new options when the serialized config
  // actually changes. Prevents redundant el.options assignments that could
  // trigger rb-map's internal rendering loop and freeze the main thread.
  const lastOptionsRef = useRef<string>("");

  useEffect(() => {
    _mapEffectCount++;
    console.log('[MapWidget-effect] #' + _mapEffectCount + ' ready=' + ready + ' result=' + !!result + ' ref=' + !!ref.current + ' dcKeys=' + Object.keys(widget?.displayConfig ?? {}).join(','));
    if (!ready || !ref.current) return;
    if (!result) return;

    const el = ref.current as HTMLElement & { data?: unknown; options?: unknown };
    el.data = result.data;
    // Strip UI-internal bookkeeping flags (_auto_*, userPicked) before the
    // deep-equality check and before passing to rb-map. Those flags don't
    // affect map rendering; including them caused rb-map to re-render on every
    // palette click / auto-switch that adds userPicked or _auto_* to displayConfig.
    const dc = widget?.displayConfig ?? {};
    const renderOpts = Object.fromEntries(
      Object.entries(dc).filter(([k]) => !k.startsWith('_') && k !== 'userPicked')
    );
    const nextOptions = JSON.stringify(renderOpts);
    if (nextOptions !== lastOptionsRef.current) {
      lastOptionsRef.current = nextOptions;
      el.options = renderOpts;
    }
  }, [ready, result, widget?.displayConfig]);

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
        No rows to plot.
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading map component…
      </div>
    );
  }

  return (
    // @ts-expect-error — custom element
    <rb-map ref={ref} style={{ display: "block", width: "100%", height: "100%", minHeight: "240px" }} />
  );
}
