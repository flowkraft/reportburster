"use client";

import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/data-canvas/types";
import { getFieldKind } from "@/lib/data-canvas/field-utils";

const FORMATS = [
  { value: "number", label: "Number (1,234)" },
  { value: "currency", label: "Currency ($1,234)" },
  { value: "percent", label: "Percent (73%)" },
  { value: "raw", label: "Raw value" },
];

interface KpiConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
}

export function KpiConfig({ config, columns, onChange }: KpiConfigProps) {
  const field = (config.kpiField as string) || "";
  const format = (config.kpiFormat as string) || "number";
  const label = (config.kpiLabel as string) || "";

  const measures = columns.filter((c) => getFieldKind(c) === "measure");
  const dimensions = columns.filter((c) => getFieldKind(c) === "dimension");

  return (
    <div className="space-y-3">
      {/* Field */}
      <div>
        <span className="text-xs text-muted-foreground">Value field <span className="text-emerald-500">(measure)</span></span>
        <select
          value={field}
          onChange={(e) => onChange({ ...config, kpiField: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          <option value="">First column</option>
          {measures.length > 0 && (
            <optgroup label="Measures">
              {measures.map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </optgroup>
          )}
          {dimensions.length > 0 && (
            <optgroup label="Dimensions">
              {dimensions.map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Format */}
      <div>
        <span className="text-xs text-muted-foreground">Format</span>
        <select
          value={format}
          onChange={(e) => onChange({ ...config, kpiFormat: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div>
        <span className="text-xs text-muted-foreground">Label</span>
        <input
          value={label}
          onChange={(e) => onChange({ ...config, kpiLabel: e.target.value })}
          placeholder="Auto from field name"
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        />
      </div>
    </div>
  );
}
