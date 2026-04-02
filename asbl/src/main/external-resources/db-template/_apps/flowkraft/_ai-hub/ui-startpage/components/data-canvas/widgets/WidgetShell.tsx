"use client";

import { BarChart3, Table, PieChart, Hash, Type, Minus, X, ListFilter } from "lucide-react";
import type { WidgetType } from "@/lib/stores/canvas-store";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { ChartWidget } from "./ChartWidget";
import { TabulatorWidget } from "./TabulatorWidget";
import { PivotWidget } from "./PivotWidget";
import { KpiWidget } from "./KpiWidget";
import { FilterPaneWidget } from "./FilterPaneWidget";

const WIDGET_META: Record<WidgetType, { label: string; icon: React.ElementType; color: string }> = {
  chart: { label: "Chart", icon: BarChart3, color: "text-blue-500" },
  tabulator: { label: "Data Table", icon: Table, color: "text-emerald-500" },
  pivot: { label: "Pivot Table", icon: PieChart, color: "text-violet-500" },
  kpi: { label: "KPI Card", icon: Hash, color: "text-amber-500" },
  "filter-pane": { label: "Filter Pane", icon: ListFilter, color: "text-cyan-500" },
  text: { label: "Text", icon: Type, color: "text-slate-500" },
  divider: { label: "Divider", icon: Minus, color: "text-slate-400" },
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
  const meta = WIDGET_META[type];
  const Icon = meta.icon;
  const hasData = widget?.dataSource != null;

  return (
    <div
      className={`relative h-full rounded-lg border transition-all ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-foreground/20"
      } bg-card overflow-hidden`}
      onClick={(e) => {
        e.stopPropagation();
        if (editMode) selectWidget(widgetId);
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
          <span className="text-[11px] font-medium text-muted-foreground">{meta.label}</span>
        </div>
        {editMode && isSelected && (
          <button
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
          <FilterPaneWidget widgetId={widgetId} />
        ) : hasData ? (
          <div className="p-2 h-full">
            <LiveWidget widgetId={widgetId} type={type} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-2">
            <div className="text-center">
              <Icon className={`w-8 h-8 mx-auto mb-1.5 ${meta.color} opacity-20`} />
              <p className="text-[11px] text-muted-foreground">
                {type === "text" ? "Click to add text" : "Select to configure data"}
              </p>
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
    case "kpi": return <KpiWidget widgetId={widgetId} />;
    default: return null;
  }
}
