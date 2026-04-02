"use client";

import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/data-canvas/types";
import { getFieldKind } from "@/lib/data-canvas/field-utils";

interface FilterPaneConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
}

export function FilterPaneConfig({ config, columns, onChange }: FilterPaneConfigProps) {
  const field = (config.filterField as string) || "";
  const dimensions = columns.filter((c) => getFieldKind(c) === "dimension");

  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs text-muted-foreground">Field to explore <span className="text-blue-500">(dimension)</span></span>
        <select
          value={field}
          onChange={(e) => onChange({ ...config, filterField: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          <option value="">Pick a field...</option>
          {dimensions.map((c) => (
            <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
          ))}
          {columns.filter((c) => getFieldKind(c) === "measure").length > 0 && (
            <optgroup label="Measures (less common for filter panes)">
              {columns.filter((c) => getFieldKind(c) === "measure").map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Shows all distinct values for this field. Click a value to select it — all other widgets will highlight what&apos;s associated and dim what&apos;s excluded.
      </p>
    </div>
  );
}
