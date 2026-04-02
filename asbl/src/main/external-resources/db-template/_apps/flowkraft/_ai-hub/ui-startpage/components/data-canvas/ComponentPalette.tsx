"use client";

import { BarChart3, Table, PieChart, Hash, Type, Minus, ListFilter } from "lucide-react";
import type { WidgetType } from "@/lib/stores/canvas-store";
import { useCanvasStore } from "@/lib/stores/canvas-store";

const PALETTE_ITEMS: { type: WidgetType; label: string; icon: React.ElementType; description: string }[] = [
  { type: "chart", label: "Chart", icon: BarChart3, description: "Line, bar, pie, area..." },
  { type: "tabulator", label: "Data Table", icon: Table, description: "Sortable, filterable grid" },
  { type: "pivot", label: "Pivot Table", icon: PieChart, description: "Multi-dimension analysis" },
  { type: "kpi", label: "KPI Card", icon: Hash, description: "Big number with label" },
  { type: "text", label: "Text", icon: Type, description: "Markdown text block" },
  { type: "divider", label: "Divider", icon: Minus, description: "Visual separator" },
  { type: "filter-pane", label: "Filter Pane", icon: ListFilter, description: "Explore data associations" },
];

export function ComponentPalette() {
  const addWidget = useCanvasStore((s) => s.addWidget);

  return (
    <div className="w-56 shrink-0 border-r border-border bg-muted/30 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Components
        </h3>
        <div className="space-y-1.5">
          {PALETTE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => addWidget(item.type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors hover:bg-accent group"
              >
                <div className="p-1.5 rounded-md bg-background border border-border group-hover:border-primary/30 transition-colors">
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-foreground text-sm">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
