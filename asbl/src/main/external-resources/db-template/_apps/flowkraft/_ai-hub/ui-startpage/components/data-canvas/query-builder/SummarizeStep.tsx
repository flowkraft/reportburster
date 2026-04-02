"use client";

import { BarChart3, Plus, X } from "lucide-react";
import type { ColumnSchema } from "@/lib/data-canvas/types";

interface AggItem {
  aggregation: string;
  field: string;
}

const AGGREGATIONS = ["COUNT", "SUM", "AVG", "MIN", "MAX"];

interface SummarizeStepProps {
  columns: ColumnSchema[];
  summarize: AggItem[];
  groupBy: string[];
  onChange: (summarize: AggItem[], groupBy: string[]) => void;
}

export function SummarizeStep({ columns, summarize, groupBy, onChange }: SummarizeStepProps) {
  const addAgg = () => {
    onChange([...summarize, { aggregation: "COUNT", field: columns[0]?.columnName || "" }], groupBy);
  };

  const updateAgg = (i: number, patch: Partial<AggItem>) => {
    const updated = summarize.map((a, idx) => (idx === i ? { ...a, ...patch } : a));
    onChange(updated, groupBy);
  };

  const removeAgg = (i: number) => {
    onChange(summarize.filter((_, idx) => idx !== i), groupBy);
  };

  const toggleGroupBy = (col: string) => {
    const next = groupBy.includes(col) ? groupBy.filter((g) => g !== col) : [...groupBy, col];
    onChange(summarize, next);
  };

  return (
    <div className="space-y-1.5">
      {/* Aggregations */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-xs text-muted-foreground">Summarize</span>
        <button onClick={addAgg} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {summarize.map((a, i) => (
        <div key={i} className="flex items-center gap-1.5 ml-6">
          <select
            value={a.aggregation}
            onChange={(e) => updateAgg(i, { aggregation: e.target.value })}
            className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground w-20"
          >
            {AGGREGATIONS.map((agg) => (
              <option key={agg} value={agg}>{agg}</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">of</span>
          <select
            value={a.field}
            onChange={(e) => updateAgg(i, { field: e.target.value })}
            className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground min-w-0 flex-1"
          >
            {columns.map((c) => (
              <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
            ))}
          </select>
          <button onClick={() => removeAgg(i)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Group By — only show when there are aggregations */}
      {summarize.length > 0 && (
        <div className="ml-6">
          <span className="text-xs text-muted-foreground">Group by:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {columns.map((c) => (
              <button
                key={c.columnName}
                onClick={() => toggleGroupBy(c.columnName)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  groupBy.includes(c.columnName)
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {c.columnName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
