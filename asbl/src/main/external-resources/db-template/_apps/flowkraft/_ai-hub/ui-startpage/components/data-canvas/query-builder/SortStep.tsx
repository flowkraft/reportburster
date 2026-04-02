"use client";

import { ArrowUpDown, Plus, X } from "lucide-react";
import type { ColumnSchema } from "@/lib/data-canvas/types";

interface SortItem {
  column: string;
  direction: "ASC" | "DESC";
}

interface SortStepProps {
  columns: ColumnSchema[];
  sort: SortItem[];
  onChange: (sort: SortItem[]) => void;
}

export function SortStep({ columns, sort, onChange }: SortStepProps) {
  const addSort = () => {
    onChange([...sort, { column: columns[0]?.columnName || "", direction: "ASC" }]);
  };

  const updateSort = (i: number, patch: Partial<SortItem>) => {
    const updated = sort.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange(updated);
  };

  const removeSort = (i: number) => {
    onChange(sort.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-violet-500 shrink-0" />
        <span className="text-xs text-muted-foreground">Sort</span>
        <button onClick={addSort} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {sort.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 ml-6">
          <select
            value={s.column}
            onChange={(e) => updateSort(i, { column: e.target.value })}
            className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground min-w-0 flex-1"
          >
            {columns.map((c) => (
              <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
            ))}
          </select>
          <select
            value={s.direction}
            onChange={(e) => updateSort(i, { direction: e.target.value as "ASC" | "DESC" })}
            className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground w-16"
          >
            <option value="ASC">ASC</option>
            <option value="DESC">DESC</option>
          </select>
          <button onClick={() => removeSort(i)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
