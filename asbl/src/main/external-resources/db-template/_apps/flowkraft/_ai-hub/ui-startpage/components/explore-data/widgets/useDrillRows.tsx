"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasStore, type Widget } from "@/lib/stores/canvas-store";
import { executeQuery } from "@/lib/explore-data/rb-api";
import { extractParamTypes } from "@/lib/explore-data/sql-builder";
import { clicksFilterOf, slicerParamValues } from "@/lib/explore-data/slicer-filters";
import { DRILL_ROWS_LIMIT, drillValuesOf } from "@/lib/explore-data/drill-rows";

/** What the rows panel shows: the same five things the cube's drill panel shows. */
export interface DrillRows {
  heading: string;
  rows: Record<string, unknown>[];
  loading: boolean;
  error: string;
  truncated: boolean;
}

/** "channel Web · country DE" - the group clicked, said in words. */
function headingOf(fields: readonly string[], clicked: Record<string, unknown>): string {
  return "Rows: " + fields.map((field) => `${field} ${String(clicked[field])}`).join(" · ");
}

/**
 * A click on a bar or a table row of a Visual-tab widget opens the rows behind it (#21).
 *
 * The rows query is the one `useWidgetData` keeps on the data source (`rowsSql`), run with the
 * canvas's filter values and selections, plus the group values clicked. A widget whose clicks
 * filter the dashboard keeps doing that instead: one click does one thing. A chart names one group
 * by its bar, so a chart grouped by two columns opens nothing; a table row carries all of them.
 */
export function useDrillRows(el: HTMLElement | null, widget: Widget | undefined) {
  const connectionId = useCanvasStore((s) => s.connectionId);
  const filterValues = useCanvasStore((s) => s.filterValues);
  const widgets = useCanvasStore((s) => s.widgets);
  const exploreSelections = useCanvasStore((s) => s.exploreSelections);
  const parametersConfig = useCanvasStore((s) => s.parametersConfig);
  const [drill, setDrill] = useState<DrillRows | null>(null);
  const asked = useRef(0);

  const rowsSql = widget?.dataSource?.rowsSql ?? "";
  const fieldsKey = (widget?.dataSource?.rowsFields ?? []).join("\u0000");
  const clicks = widget ? clicksFilterOf(widget) : false;

  useEffect(() => {
    const fields = fieldsKey ? fieldsKey.split("\u0000") : [];
    if (!el || !connectionId || !rowsSql || fields.length === 0 || clicks) return;

    const open = async (clicked: Record<string, unknown>) => {
      const values = drillValuesOf(fields, clicked);
      if (!values) return;
      const ticket = ++asked.current;
      const heading = headingOf(fields, clicked);
      setDrill({ heading, rows: [], loading: true, error: "", truncated: false });
      try {
        const result = await executeQuery(
          connectionId,
          rowsSql,
          { ...(filterValues ?? {}), ...slicerParamValues(widgets, exploreSelections), ...values },
          extractParamTypes(parametersConfig?.parameters),
        );
        if (ticket !== asked.current) return;
        const rows = result.data ?? [];
        setDrill({ heading, rows, loading: false, error: "", truncated: rows.length >= DRILL_ROWS_LIMIT });
      } catch (e) {
        if (ticket !== asked.current) return;
        const error = e instanceof Error ? e.message : "The rows behind this could not be read.";
        setDrill({ heading, rows: [], loading: false, error, truncated: false });
      }
    };

    const onChartClick = (e: Event) => {
      if (fields.length !== 1) return;
      const detail = (e as CustomEvent).detail as { index?: number } | undefined;
      const chart = (el as HTMLElement & { getChartInstance?: () => { data?: { labels?: unknown[] } } | null })
        .getChartInstance?.();
      const label = detail?.index === undefined ? undefined : chart?.data?.labels?.[detail.index];
      open({ [fields[0]]: label });
    };
    const onCellClick = (e: Event) => {
      const detail = (e as CustomEvent).detail as { rowData?: Record<string, unknown> } | undefined;
      open(detail?.rowData ?? {});
    };
    el.addEventListener("chartClick", onChartClick);
    el.addEventListener("cellClick", onCellClick);
    return () => {
      el.removeEventListener("chartClick", onChartClick);
      el.removeEventListener("cellClick", onCellClick);
    };
  }, [el, connectionId, rowsSql, fieldsKey, clicks, filterValues, widgets, exploreSelections, parametersConfig]);

  const closeDrill = useCallback(() => {
    asked.current++;
    setDrill(null);
  }, []);
  return { drill, closeDrill };
}

/**
 * The panel the rows open in: `<rb-drill-rows>`, the very element a cube's drill opens (#21), over
 * the widget it was asked from. Escape closes it, as it closes the cube's.
 */
export function DrillRowsPanel({ drill, onClose }: { drill: DrillRows | null; onClose: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = host.current;
    if (!target || !drill) return;
    let panel = target.querySelector("rb-drill-rows") as (HTMLElement & Record<string, unknown>) | null;
    if (!panel) {
      panel = document.createElement("rb-drill-rows") as HTMLElement & Record<string, unknown>;
      panel.idPrefix = "widgetDrill";
      panel.closeId = "btnWidgetDrillClose";
      target.appendChild(panel);
    }
    panel.heading = drill.heading;
    panel.rows = drill.rows;
    panel.loading = drill.loading;
    panel.error = drill.error;
    panel.truncated = drill.truncated;
  }, [drill]);

  useEffect(() => {
    const target = host.current;
    if (!target) return;
    const onPanelClose = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // The panel's own event does not bubble: it is heard on the way down.
    target.addEventListener("close", onPanelClose, true);
    window.addEventListener("keydown", onKey);
    return () => {
      target.removeEventListener("close", onPanelClose, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (drill) return;
    host.current?.querySelector("rb-drill-rows")?.remove();
  }, [drill]);

  return <div ref={host} />;
}
