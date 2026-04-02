"use client";

import { Eye, EyeOff } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/data-canvas/types";

interface TabulatorConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
}

export function TabulatorConfig({ config, columns, onChange }: TabulatorConfigProps) {
  const hiddenColumns = (config.hiddenColumns as string[]) || [];

  const toggleColumn = (col: string) => {
    const next = hiddenColumns.includes(col)
      ? hiddenColumns.filter((c) => c !== col)
      : [...hiddenColumns, col];
    onChange({ ...config, hiddenColumns: next });
  };

  if (columns.length === 0) {
    return <p className="text-xs text-muted-foreground">Run a query to see columns</p>;
  }

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">Column visibility</span>
      <div className="space-y-0.5">
        {columns.map((col) => {
          const hidden = hiddenColumns.includes(col.columnName);
          return (
            <button
              key={col.columnName}
              onClick={() => toggleColumn(col.columnName)}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors ${
                hidden ? "text-muted-foreground/50" : "text-foreground hover:bg-accent"
              }`}
            >
              {hidden ? <EyeOff className="w-3 h-3 shrink-0" /> : <Eye className="w-3 h-3 shrink-0" />}
              <span className={hidden ? "line-through" : ""}>{col.columnName}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{col.typeName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
