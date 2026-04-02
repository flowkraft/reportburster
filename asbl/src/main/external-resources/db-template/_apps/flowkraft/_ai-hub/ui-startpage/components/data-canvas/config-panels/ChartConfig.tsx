"use client";

import { BarChart3, TrendingUp, PieChart, Circle } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/data-canvas/types";
import { getFieldKind } from "@/lib/data-canvas/field-utils";

const CHART_TYPES = [
  { type: "bar", icon: BarChart3, label: "Bar" },
  { type: "line", icon: TrendingUp, label: "Line" },
  { type: "pie", icon: PieChart, label: "Pie" },
  { type: "doughnut", icon: Circle, label: "Donut" },
];

interface ChartConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
}

export function ChartConfig({ config, columns, onChange }: ChartConfigProps) {
  const chartType = (config.chartType as string) || "bar";
  const xField = (config.xField as string) || "";
  const yField = (config.yField as string) || "";

  const dimensions = columns.filter((c) => getFieldKind(c) === "dimension");
  const measures = columns.filter((c) => getFieldKind(c) === "measure");

  return (
    <div className="space-y-3">
      {/* Chart type picker — 4 icons */}
      <div>
        <span className="text-xs text-muted-foreground">Chart type</span>
        <div className="flex gap-1 mt-1">
          {CHART_TYPES.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => onChange({ ...config, chartType: type })}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md text-[11px] transition-colors ${
                chartType === type
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* X axis — suggest dimensions */}
      <div>
        <span className="text-xs text-muted-foreground">X axis <span className="text-blue-500">(dimension)</span></span>
        <select
          value={xField}
          onChange={(e) => onChange({ ...config, xField: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          <option value="">Auto-detect</option>
          {dimensions.length > 0 && (
            <optgroup label="Dimensions">
              {dimensions.map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </optgroup>
          )}
          {measures.length > 0 && (
            <optgroup label="Measures">
              {measures.map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Y axis — suggest measures */}
      <div>
        <span className="text-xs text-muted-foreground">Y axis <span className="text-emerald-500">(measure)</span></span>
        <select
          value={yField}
          onChange={(e) => onChange({ ...config, yField: e.target.value })}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          <option value="">Auto-detect</option>
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
    </div>
  );
}
