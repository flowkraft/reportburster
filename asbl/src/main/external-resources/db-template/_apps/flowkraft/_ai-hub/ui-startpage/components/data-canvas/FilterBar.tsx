"use client";

import { useState } from "react";
import { Plus, X, Filter, Calendar, Type, Hash } from "lucide-react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { DashboardFilter } from "@/lib/stores/canvas-store";

const FILTER_TYPES = [
  { type: "dropdown" as const, icon: Filter, label: "Dropdown" },
  { type: "text" as const, icon: Type, label: "Text" },
  { type: "number" as const, icon: Hash, label: "Number" },
  { type: "date" as const, icon: Calendar, label: "Date" },
];

export function FilterBar() {
  const { filters, filterValues, editMode, addFilter, removeFilter, updateFilter, setFilterValue } = useCanvasStore();
  const [showAdd, setShowAdd] = useState(false);

  if (filters.length === 0 && !editMode) return null;

  const handleAddFilter = (type: DashboardFilter["type"]) => {
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    addFilter({
      id,
      paramName: `param_${filters.length + 1}`,
      type,
      label: `Filter ${filters.length + 1}`,
      defaultValue: "",
      linkedWidgetIds: [], // empty = applies to all widgets
    });
    setShowAdd(false);
  };

  return (
    <div className="shrink-0 border-b border-border bg-muted/20 px-4 py-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Rendered filters */}
        {filters.map((filter) => (
          <FilterControl key={filter.id} filter={filter} value={filterValues[filter.paramName] || filter.defaultValue || ""} editMode={editMode} />
        ))}

        {/* Add filter button (edit mode only) */}
        {editMode && (
          <div className="relative">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors border border-dashed border-border"
            >
              <Plus className="w-3 h-3" />
              Filter
            </button>

            {showAdd && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAdd(false)} />
                <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 w-32">
                  {FILTER_TYPES.map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => handleAddFilter(type)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterControl({ filter, value, editMode }: { filter: DashboardFilter; value: string; editMode: boolean }) {
  const { setFilterValue, removeFilter, updateFilter } = useCanvasStore();

  return (
    <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1">
      {/* Editable label */}
      {editMode ? (
        <input
          value={filter.label}
          onChange={(e) => updateFilter(filter.id, { label: e.target.value })}
          className="text-xs font-medium text-muted-foreground bg-transparent border-none outline-none w-16"
        />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
      )}

      {/* Input based on type */}
      {filter.type === "dropdown" && (
        <input
          value={value}
          onChange={(e) => setFilterValue(filter.paramName, e.target.value)}
          placeholder="All"
          className="text-xs bg-transparent border-b border-border/50 outline-none text-foreground w-20 px-1"
        />
      )}

      {filter.type === "text" && (
        <input
          value={value}
          onChange={(e) => setFilterValue(filter.paramName, e.target.value)}
          placeholder="..."
          className="text-xs bg-transparent border-b border-border/50 outline-none text-foreground w-20 px-1"
        />
      )}

      {filter.type === "number" && (
        <input
          type="number"
          value={value}
          onChange={(e) => setFilterValue(filter.paramName, e.target.value)}
          placeholder="0"
          className="text-xs bg-transparent border-b border-border/50 outline-none text-foreground w-16 px-1"
        />
      )}

      {filter.type === "date" && (
        <input
          type="date"
          value={value}
          onChange={(e) => setFilterValue(filter.paramName, e.target.value)}
          className="text-xs bg-transparent border-b border-border/50 outline-none text-foreground px-1"
        />
      )}

      {/* Param name (edit mode — editable) */}
      {editMode && (
        <input
          value={filter.paramName}
          onChange={(e) => updateFilter(filter.id, { paramName: e.target.value })}
          className="text-[10px] text-muted-foreground/50 bg-transparent border-none outline-none w-14 font-mono"
          title="Parameter name used in SQL as {{ paramName }}"
        />
      )}

      {/* Remove button (edit mode) */}
      {editMode && (
        <button onClick={() => removeFilter(filter.id)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
