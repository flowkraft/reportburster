"use client";

import { GripVertical, X } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/data-canvas/types";
import { getFieldKind, getFieldColorClass } from "@/lib/data-canvas/field-utils";

const AGGREGATORS = ["Sum", "Count", "Average", "Min", "Max"];

interface PivotConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
}

export function PivotConfig({ config, columns, onChange }: PivotConfigProps) {
  const rows = (config.pivotRows as string[]) || [];
  const cols = (config.pivotCols as string[]) || [];
  const vals = (config.pivotVals as string[]) || [];
  const aggregator = (config.pivotAggregator as string) || "Sum";

  // Fields not yet assigned to any zone
  const assigned = new Set([...rows, ...cols, ...vals]);
  const available = columns.filter((c) => !assigned.has(c.columnName));

  const addTo = (zone: "pivotRows" | "pivotCols" | "pivotVals", field: string) => {
    const current = (config[zone] as string[]) || [];
    onChange({ ...config, [zone]: [...current, field] });
  };

  const removeFrom = (zone: "pivotRows" | "pivotCols" | "pivotVals", field: string) => {
    const current = (config[zone] as string[]) || [];
    onChange({ ...config, [zone]: current.filter((f) => f !== field) });
  };

  return (
    <div className="space-y-3">
      {/* Drop zones */}
      <FieldZone label="Rows" fields={rows} columns={columns} onRemove={(f) => removeFrom("pivotRows", f)} />
      <FieldZone label="Columns" fields={cols} columns={columns} onRemove={(f) => removeFrom("pivotCols", f)} />
      <FieldZone label="Values" fields={vals} columns={columns} onRemove={(f) => removeFrom("pivotVals", f)} />

      {/* Aggregator */}
      <div>
        <span className="text-xs text-muted-foreground">Aggregation</span>
        <select
          value={aggregator}
          onChange={(e) => onChange({ ...config, pivotAggregator: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          {AGGREGATORS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Available fields */}
      {available.length > 0 && (
        <div>
          <span className="text-xs text-muted-foreground">Available fields (click to add)</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {available.map((col) => {
              const kind = getFieldKind(col);
              // Suggest: dimensions → rows, measures → values
              const defaultZone = kind === "measure" ? "pivotVals" : "pivotRows";
              return (
                <button
                  key={col.columnName}
                  onClick={() => addTo(defaultZone as "pivotRows" | "pivotCols" | "pivotVals", col.columnName)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors hover:border-foreground/30 ${
                    kind === "measure"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                  }`}
                  title={`Click to add to ${kind === "measure" ? "Values" : "Rows"}`}
                >
                  {col.columnName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldZone({ label, fields, columns, onRemove }: { label: string; fields: string[]; columns: ColumnSchema[]; onRemove: (f: string) => void }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 min-h-[28px] border border-dashed border-border rounded-md p-1 flex flex-wrap gap-1">
        {fields.length === 0 && (
          <span className="text-[10px] text-muted-foreground/50 px-1 py-0.5">Drop fields here</span>
        )}
        {fields.map((f) => {
          const col = columns.find((c) => c.columnName === f);
          const kind = col ? getFieldKind(col) : "dimension";
          return (
            <span
              key={f}
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                kind === "measure"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-600"
              }`}
            >
              {f}
              <button onClick={() => onRemove(f)} className="hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
