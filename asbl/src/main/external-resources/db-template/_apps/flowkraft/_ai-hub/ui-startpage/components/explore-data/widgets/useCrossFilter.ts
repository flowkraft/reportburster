"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasStore, type Widget } from "@/lib/stores/canvas-store";
import {
  CROSS_FILTER_EVENT,
  clicksFilterOf,
  crossFilterFieldsOf,
} from "@/lib/explore-data/slicer-filters";

/**
 * An rb-* element held in state as well as in a ref.
 *
 * A ref being filled does not re-run an effect, and these elements are not there on the first
 * render - the widget shows a hint, then a spinner, then the element - so an effect that only
 * reads the ref can run before the element exists and never again. That is exactly how a slicer's
 * clicks reached nothing (TODO 1b (a), `05f0c59c`). The state copy re-runs the effect when the
 * element appears, and when it is replaced (a table rebuilds its element on a theme change), while
 * the ref stays for the effects that push data into it.
 */
export function useRbElement<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [el, setEl] = useState<T | null>(null);
  const attach = useCallback((node: T | null) => {
    ref.current = node;
    setEl(node);
  }, []);
  return { ref, el, attach };
}

/**
 * Tell this widget's element whether its clicks filter the dashboard, and hear them when they do.
 *
 * A click makes exactly the selection a slicer pick makes - same store, same chips bar, same
 * parameters - so the dashboard answers a click and a pick the same way (`slicer-filters.ts`). The
 * widget's own query is written without the fields its clicks select, so a second click on the
 * same bar drops the selection again instead of being impossible.
 */
export function useCrossFilterClicks(el: HTMLElement | null, widget: Widget | undefined) {
  const toggleExploreSelection = useCanvasStore((s) => s.toggleExploreSelection);
  const clicks = widget ? clicksFilterOf(widget) : false;
  // The field a chart's labels are values of: a chart's element cannot know it in the canvas, where
  // it is handed Chart.js-shaped data and no config file. A table reads the clicked cell's own
  // column and a map its dimension, so neither needs telling.
  const chartField = widget?.type === "chart" ? (crossFilterFieldsOf(widget)[0] ?? "") : "";

  useEffect(() => {
    if (!el) return;
    const target = el as HTMLElement & { clicksFilter?: boolean; crossFilterField?: string };
    target.clicksFilter = clicks;
    if (chartField) target.crossFilterField = chartField;
    if (!clicks) return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { field?: string; value?: string } | undefined;
      if (!detail?.field || !detail.value) return;
      toggleExploreSelection(detail.field, detail.value);
    };
    el.addEventListener(CROSS_FILTER_EVENT, handler);
    return () => el.removeEventListener(CROSS_FILTER_EVENT, handler);
  }, [el, clicks, chartField, toggleExploreSelection]);
}
