"use client";

import { BarChart3, Table, PieChart, Hash, Map as MapIcon, Type, Minus, X, ListFilter, Workflow, Gauge as GaugeIcon, TrendingUp, BarChartHorizontal, FileText, Frame } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import type { WidgetType } from "@/lib/stores/canvas-store";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { ChartWidget } from "./ChartWidget";
import { TabulatorWidget } from "./TabulatorWidget";
import { PivotWidget } from "./PivotWidget";
import { NumberWidget } from "./NumberWidget";
import { MapWidget } from "./MapWidget";
import { SankeyWidget } from "./SankeyWidget";
import { GaugeWidget } from "./GaugeWidget";
import { TrendWidget } from "./TrendWidget";
import { ProgressWidget } from "./ProgressWidget";
import { DetailWidget } from "./DetailWidget";
import { FilterPaneWidget } from "./FilterPaneWidget";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

const WIDGET_META: Record<WidgetType, { label: string; icon: React.ElementType; color: string }> = {
  chart: { label: "Chart", icon: BarChart3, color: "text-blue-500" },
  tabulator: { label: "Data Table", icon: Table, color: "text-emerald-500" },
  pivot: { label: "Pivot Table", icon: PieChart, color: "text-violet-500" },
  number: { label: "Number", icon: Hash, color: "text-amber-500" },
  map: { label: "Map", icon: MapIcon, color: "text-sky-500" },
  sankey: { label: "Sankey", icon: Workflow, color: "text-fuchsia-500" },
  gauge: { label: "Gauge", icon: GaugeIcon, color: "text-rose-500" },
  trend: { label: "Trend", icon: TrendingUp, color: "text-orange-500" },
  progress: { label: "Progress", icon: BarChartHorizontal, color: "text-lime-500" },
  detail: { label: "Detail", icon: FileText, color: "text-indigo-500" },
  "filter-pane": { label: "Filter Pane", icon: ListFilter, color: "text-cyan-500" },
  text: { label: "Text Block", icon: Type, color: "text-slate-500" },
  divider: { label: "Divider", icon: Minus, color: "text-slate-400" },
  iframe: { label: "iFrame", icon: Frame, color: "text-teal-500" },
};

interface WidgetShellProps {
  widgetId: string;
  type: WidgetType;
}

export function WidgetShell({ widgetId, type }: WidgetShellProps) {
  const selectedWidgetId = useCanvasStore((s) => s.selectedWidgetId);
  const selectWidget = useCanvasStore((s) => s.selectWidget);
  const removeWidget = useCanvasStore((s) => s.removeWidget);
  const editMode = useCanvasStore((s) => s.editMode);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));

  const isSelected = selectedWidgetId === widgetId;
  // Instant visual feedback: local state flipped on mousedown via flushSync so
  // the DOM commits + paints BEFORE the Zustand update (which re-renders
  // ConfigPanel, autosave listeners, etc.) is dispatched on the next frame.
  const [pressedSelected, setPressedSelected] = useState(false);
  useEffect(() => { if (!isSelected) setPressedSelected(false); }, [isSelected]);
  const showSelected = pressedSelected || isSelected;

  const handlePress = () => {
    if (!editMode) return;
    // 1. Force React to synchronously commit the local state change.
    flushSync(() => { setPressedSelected(true); });
    // 2. Yield to the browser so it paints the blue header. Only on the NEXT
    //    frame do we fire the heavy Zustand update (which triggers ConfigPanel
    //    re-render, schema fetch, etc.). Paint and data-load now run in parallel
    //    instead of the visual waiting for the data.
    requestAnimationFrame(() => { selectWidget(widgetId); });
  };

  const meta = WIDGET_META[type];
  const Icon = meta.icon;
  const hasData = widget?.dataSource != null;
  const textContent = (widget?.displayConfig?.textContent as string) || "";

  // Divider — minimal chrome: just a line. Selectable for delete.
  if (type === "divider") {
    return (
      <div
        className={`relative h-full flex items-center px-2 rounded-md ${
          showSelected ? "ring-2 ring-primary/30" : "hover:ring-1 hover:ring-foreground/10"
        }${editMode ? " react-grid-drag-handle" : ""}`}
        onMouseDown={handlePress}
        onClick={(e) => e.stopPropagation()}
      >
        <hr className="w-full border-t border-border" />
        {editMode && isSelected && (
          <button
            onClick={(e) => { e.stopPropagation(); removeWidget(widgetId); }}
            className="absolute top-0 right-0 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors bg-background/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id={`widget-${widgetId}`}
      className={`relative h-full rounded-lg border ${
        showSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-foreground/20"
      } bg-card overflow-hidden`}
      onMouseDown={handlePress}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header bar */}
      <div
        id={`widgetHeader-${widgetId}`}
        className={`flex items-center justify-between px-3 py-1.5 border-b cursor-pointer ${
          showSelected
            ? "border-primary/50 bg-primary/20"
            : "border-border/50 bg-muted/30"
        }${editMode ? " react-grid-drag-handle" : ""}`}
        title={[widget?.dataSource?.visualQuery?.table || "", widget?.dataSource?.visualQuery?.cubeId || ""].filter(Boolean).join(" · ") || undefined}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
          <span className="text-[11px] font-semibold text-foreground">{meta.label}</span>
        </div>
        {editMode && isSelected && (
          <button
            id={`btnDeleteWidget-${widgetId}`}
            onClick={(e) => {
              e.stopPropagation();
              removeWidget(widgetId);
            }}
            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-0 h-[calc(100%-33px)]">
        {type === "filter-pane" ? (
          <WidgetErrorBoundary resetKey={`filter-pane:${widgetId}`}>
            <FilterPaneWidget widgetId={widgetId} />
          </WidgetErrorBoundary>
        ) : type === "text" ? (
          textContent ? (
            <div className="p-3 h-full overflow-auto prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-2">
              <div className="text-center">
                <Icon className={`w-8 h-8 mx-auto mb-1.5 ${meta.color} opacity-20`} />
                <p className="text-[11px] text-muted-foreground">Edit text in the Display tab</p>
              </div>
            </div>
          )
        ) : type === "iframe" ? (
          (widget?.displayConfig?.iframeUrl as string) ? (
            <iframe
              src={widget!.displayConfig.iframeUrl as string}
              title={(widget!.displayConfig.iframeTitle as string) || "Embedded content"}
              sandbox={(widget!.displayConfig.iframeSandbox as string) ?? "allow-scripts allow-same-origin allow-popups allow-forms"}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full border-0"
              style={{ pointerEvents: editMode && !isSelected ? "none" : "auto" }}
            />
          ) : (
            <div className="flex items-center justify-center h-full p-2">
              <div className="text-center">
                <Icon className={`w-8 h-8 mx-auto mb-1.5 ${meta.color} opacity-20`} />
                <p className="text-[11px] text-muted-foreground">Set the URL in the Display tab</p>
              </div>
            </div>
          )
        ) : hasData ? (
          <div className="p-2 h-full">
            <WidgetErrorBoundary resetKey={`${type}:${widgetId}`}>
              <LiveWidget widgetId={widgetId} type={type} />
            </WidgetErrorBoundary>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-2">
            <div className="text-center">
              <Icon className={`w-8 h-8 mx-auto mb-1.5 ${meta.color} opacity-20`} />
              <p className="text-[11px] text-muted-foreground">Select to configure data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveWidget({ widgetId, type }: { widgetId: string; type: WidgetType }) {
  switch (type) {
    case "chart": return <ChartWidget widgetId={widgetId} />;
    case "tabulator": return <TabulatorWidget widgetId={widgetId} />;
    case "pivot": return <PivotWidget widgetId={widgetId} />;
    case "number": return <NumberWidget widgetId={widgetId} />;
    case "map": return <MapWidget widgetId={widgetId} />;
    case "sankey": return <SankeyWidget widgetId={widgetId} />;
    case "gauge": return <GaugeWidget widgetId={widgetId} />;
    case "trend": return <TrendWidget widgetId={widgetId} />;
    case "progress": return <ProgressWidget widgetId={widgetId} />;
    case "detail": return <DetailWidget widgetId={widgetId} />;
    default: return null;
  }
}
