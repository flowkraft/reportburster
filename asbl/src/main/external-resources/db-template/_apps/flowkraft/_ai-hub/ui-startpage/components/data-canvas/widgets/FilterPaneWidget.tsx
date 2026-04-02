"use client";

import { useState, useEffect } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { executeQuery, exploreAssociations } from "@/lib/data-canvas/rb-api";
import { Loader2 } from "lucide-react";

interface FilterPaneWidgetProps {
  widgetId: string;
}

export function FilterPaneWidget({ widgetId }: FilterPaneWidgetProps) {
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const exploreSelections = useCanvasStore((s) => s.exploreSelections);
  const exploreFieldStates = useCanvasStore((s) => s.exploreFieldStates);
  const exploreVersion = useCanvasStore((s) => s.exploreVersion);
  const toggleExploreSelection = useCanvasStore((s) => s.toggleExploreSelection);
  const setExploreFieldStates = useCanvasStore((s) => s.setExploreFieldStates);
  const widgets = useCanvasStore((s) => s.widgets);

  const [allValues, setAllValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const field = (widget?.displayConfig.filterField as string) || "";
  const table = (widget?.dataSource?.visualQuery?.table as string) || "";

  // Load initial distinct values
  useEffect(() => {
    if (!connectionId || !field || !table) return;
    setLoading(true);
    executeQuery(connectionId, `SELECT DISTINCT "${field}" FROM "${table}" WHERE "${field}" IS NOT NULL ORDER BY "${field}" LIMIT 1000`)
      .then((res) => setAllValues(res.data.map((r) => String(r[field] ?? ""))))
      .catch(() => setAllValues([]))
      .finally(() => setLoading(false));
  }, [connectionId, field, table]);

  // Call explore API when selections change to compute field states
  useEffect(() => {
    if (!connectionId || !table || exploreSelections.length === 0) return;

    // Collect all filter-pane fields on the canvas
    const filterPaneFields = widgets
      .filter((w) => w.type === "filter-pane" && w.displayConfig.filterField)
      .map((w) => w.displayConfig.filterField as string);

    if (filterPaneFields.length === 0) return;

    exploreAssociations(connectionId, table, exploreSelections, filterPaneFields)
      .then((res) => setExploreFieldStates(res.fieldStates))
      .catch((err) => console.warn("Explore failed:", err));
  }, [connectionId, table, exploreVersion]);

  if (!field) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Configure field in Display tab
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  const fieldStates = exploreFieldStates[field];
  const selectedSet = new Set(exploreSelections.filter((s) => s.field === field).map((s) => s.value));
  const excludedSet = fieldStates ? new Set(fieldStates.excluded) : null;

  const filtered = search ? allValues.filter((v) => v.toLowerCase().includes(search.toLowerCase())) : allValues;

  // Sort: selected first, excluded last
  const sorted = [...filtered].sort((a, b) => {
    const aSelected = selectedSet.has(a) ? 0 : excludedSet?.has(a) ? 2 : 1;
    const bSelected = selectedSet.has(b) ? 0 : excludedSet?.has(b) ? 2 : 1;
    return aSelected - bSelected || a.localeCompare(b);
  });

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-muted/20">
        <span className="font-medium text-foreground truncate flex-1">{field}</span>
        {allValues.length > 10 && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 w-16 outline-none text-foreground"
          />
        )}
      </div>

      {/* Values list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((value) => {
          const isSelected = selectedSet.has(value);
          const isExcluded = excludedSet?.has(value) ?? false;

          return (
            <button
              key={value}
              onClick={() => toggleExploreSelection(field, value)}
              className={`w-full flex items-center gap-1.5 px-2 py-1 text-left transition-colors ${
                isSelected
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : isExcluded
                  ? "text-muted-foreground/40"
                  : "text-foreground hover:bg-muted/30"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isSelected ? "bg-blue-500" : isExcluded ? "bg-slate-300" : "bg-slate-400"
              }`} />
              <span className="truncate">{value}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-2 py-1 border-t border-border/50 text-[10px] text-muted-foreground text-right">
        {allValues.length} values
      </div>
    </div>
  );
}
