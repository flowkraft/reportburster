"use client";

import { X, Trash2 } from "lucide-react";
import { useCanvasStore } from "@/lib/stores/canvas-store";

export function SelectionBar() {
  const widgets = useCanvasStore((s) => s.widgets);
  const selections = useCanvasStore((s) => s.exploreSelections);
  const toggleSelection = useCanvasStore((s) => s.toggleExploreSelection);
  const clearSelections = useCanvasStore((s) => s.clearExploreSelections);

  // Only show when ≥1 filter-pane exists AND there are active selections
  const hasFilterPanes = widgets.some((w) => w.type === "filter-pane");
  if (!hasFilterPanes || selections.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-border bg-blue-50/50 px-4 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Selections</span>
      {selections.map((s, i) => (
        <span
          key={`${s.field}-${s.value}-${i}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200"
        >
          <span className="font-medium">{s.field}:</span> {s.value}
          <button
            onClick={() => toggleSelection(s.field, s.value)}
            className="p-0.5 rounded-full hover:bg-blue-200 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <button
        onClick={clearSelections}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-muted-foreground hover:bg-accent transition-colors"
      >
        <Trash2 className="w-2.5 h-2.5" />
        Clear all
      </button>
    </div>
  );
}
