"use client";

import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { Loader2 } from "lucide-react";

interface KpiWidgetProps {
  widgetId: string;
}

function formatValue(value: unknown, format: string): string {
  if (value == null) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return String(value);

  switch (format) {
    case "currency":
      return num.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    case "percent":
      return num.toLocaleString(undefined, { style: "percent", minimumFractionDigits: 0 });
    case "number":
      return num.toLocaleString();
    default:
      return String(value);
  }
}

export function KpiWidget({ widgetId }: KpiWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-xs text-destructive p-2">{error}</div>;
  if (!result || result.data.length === 0) return null;

  const displayConfig = widget?.displayConfig || {};
  const row = result.data[0];
  const keys = Object.keys(row);
  const field = (displayConfig.kpiField as string) || keys[0];
  const format = (displayConfig.kpiFormat as string) || "number";
  const label = (displayConfig.kpiLabel as string) || field;
  const value = row[field];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {formatValue(value, format)}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
