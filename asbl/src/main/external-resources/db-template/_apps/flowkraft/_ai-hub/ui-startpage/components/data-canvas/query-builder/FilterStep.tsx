"use client";

import { Filter, Plus, X } from "lucide-react";
import type { ColumnSchema } from "@/lib/data-canvas/types";

interface FilterItem {
  column: string;
  operator: string;
  value: string;
  valueTo?: string;
}

// --- Type-aware operator groups ---

interface OperatorDef {
  value: string;
  label: string;
}

const STRING_OPS: OperatorDef[] = [
  { value: "equals", label: "=" },
  { value: "not_equals", label: "!=" },
  { value: "contains", label: "contains" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "is_null", label: "is null" },
  { value: "is_not_null", label: "is not null" },
];

const NUMBER_OPS: OperatorDef[] = [
  { value: "equals", label: "=" },
  { value: "not_equals", label: "!=" },
  { value: "greater_than", label: ">" },
  { value: "greater_or_equal", label: ">=" },
  { value: "less_than", label: "<" },
  { value: "less_or_equal", label: "<=" },
  { value: "between", label: "between" },
  { value: "is_null", label: "is null" },
  { value: "is_not_null", label: "is not null" },
];

const DATE_OPS: OperatorDef[] = [
  { value: "equals", label: "=" },
  { value: "not_equals", label: "!=" },
  { value: "greater_than", label: "after" },
  { value: "greater_or_equal", label: "on or after" },
  { value: "less_than", label: "before" },
  { value: "less_or_equal", label: "on or before" },
  { value: "between", label: "between" },
  { value: "is_null", label: "is null" },
  { value: "is_not_null", label: "is not null" },
];

const BOOLEAN_OPS: OperatorDef[] = [
  { value: "equals", label: "=" },
  { value: "is_null", label: "is null" },
  { value: "is_not_null", label: "is not null" },
];

const NO_VALUE_OPS = ["is_null", "is_not_null"];

// Type detection from column schema
const NUMERIC_TYPES = new Set([
  "INTEGER", "INT", "BIGINT", "SMALLINT", "TINYINT",
  "FLOAT", "DOUBLE", "REAL", "DECIMAL", "NUMERIC",
  "NUMBER", "MONEY", "INT4", "INT8", "INT2",
  "FLOAT4", "FLOAT8", "HUGEINT", "UINTEGER", "UBIGINT",
]);

const DATE_TYPES = new Set([
  "DATE", "DATETIME", "TIMESTAMP", "TIMESTAMPTZ",
  "TIMESTAMP_TZ", "TIMESTAMP WITH TIME ZONE",
  "TIME", "TIMETZ", "INTERVAL",
]);

const BOOLEAN_TYPES = new Set(["BOOLEAN", "BOOL", "BIT"]);

function getColumnType(column: ColumnSchema): "string" | "number" | "date" | "boolean" {
  const type = (column.typeName || "").toUpperCase().split("(")[0].trim();
  if (NUMERIC_TYPES.has(type)) return "number";
  if (DATE_TYPES.has(type)) return "date";
  if (BOOLEAN_TYPES.has(type)) return "boolean";
  return "string";
}

function getOperatorsForColumn(column: ColumnSchema | undefined): OperatorDef[] {
  if (!column) return STRING_OPS;
  switch (getColumnType(column)) {
    case "number": return NUMBER_OPS;
    case "date": return DATE_OPS;
    case "boolean": return BOOLEAN_OPS;
    default: return STRING_OPS;
  }
}

interface FilterStepProps {
  columns: ColumnSchema[];
  filters: FilterItem[];
  onChange: (filters: FilterItem[]) => void;
}

export function FilterStep({ columns, filters, onChange }: FilterStepProps) {
  const addFilter = () => {
    onChange([...filters, { column: columns[0]?.columnName || "", operator: "equals", value: "" }]);
  };

  const updateFilter = (i: number, patch: Partial<FilterItem>) => {
    const updated = filters.map((f, idx) => {
      if (idx !== i) return f;
      const next = { ...f, ...patch };
      // When column changes, reset operator if it's not valid for the new column type
      if (patch.column && patch.column !== f.column) {
        const col = columns.find((c) => c.columnName === patch.column);
        const validOps = getOperatorsForColumn(col);
        if (!validOps.some((op) => op.value === next.operator)) {
          next.operator = "equals";
        }
        next.value = "";
        next.valueTo = undefined;
      }
      // Clear valueTo when switching away from between
      if (patch.operator && patch.operator !== "between") {
        next.valueTo = undefined;
      }
      return next;
    });
    onChange(updated);
  };

  const removeFilter = (i: number) => {
    onChange(filters.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-orange-500 shrink-0" />
        <span className="text-xs text-muted-foreground">Filter</span>
        <button onClick={addFilter} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {filters.map((f, i) => {
        const col = columns.find((c) => c.columnName === f.column);
        const ops = getOperatorsForColumn(col);

        return (
          <div key={i} className="flex items-center gap-1.5 ml-6">
            <select
              value={f.column}
              onChange={(e) => updateFilter(i, { column: e.target.value })}
              className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground min-w-0 flex-1"
            >
              {columns.map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </select>
            <select
              value={f.operator}
              onChange={(e) => updateFilter(i, { operator: e.target.value })}
              className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground w-24"
            >
              {ops.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            {f.operator === "between" ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  value={f.value}
                  onChange={(e) => updateFilter(i, { value: e.target.value })}
                  placeholder="min"
                  className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground min-w-0 flex-1"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">and</span>
                <input
                  value={f.valueTo || ""}
                  onChange={(e) => updateFilter(i, { valueTo: e.target.value })}
                  placeholder="max"
                  className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground min-w-0 flex-1"
                />
              </div>
            ) : !NO_VALUE_OPS.includes(f.operator) && (
              <input
                value={f.value}
                onChange={(e) => updateFilter(i, { value: e.target.value })}
                placeholder="value"
                className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground min-w-0 flex-1"
              />
            )}
            <button onClick={() => removeFilter(i)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
