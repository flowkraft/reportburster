"use client";

import { Table } from "lucide-react";
import type { TableSchema } from "@/lib/data-canvas/types";
import { getFieldKind, getFieldColorClass } from "@/lib/data-canvas/field-utils";

interface DataStepProps {
  tables: TableSchema[];
  value: string;
  onChange: (table: string) => void;
}

export function DataStep({ tables, value, onChange }: DataStepProps) {
  const selectedTable = tables.find((t) => t.tableName === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Table className="w-4 h-4 text-emerald-500 shrink-0" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          <option value="">Pick a table...</option>
          {tables.map((t) => (
            <option key={t.tableName} value={t.tableName}>
              {t.tableName} ({t.columns.length} cols)
            </option>
          ))}
        </select>
      </div>

      {/* Column preview with Tableau-style color coding */}
      {selectedTable && (
        <div className="ml-6 flex flex-wrap gap-1">
          {selectedTable.columns.map((col) => {
            const kind = getFieldKind(col);
            const colorClass = getFieldColorClass(kind);
            return (
              <span
                key={col.columnName}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  kind === "measure"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                }`}
                title={`${col.columnName} (${col.typeName}) — ${kind}`}
              >
                {col.columnName}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
