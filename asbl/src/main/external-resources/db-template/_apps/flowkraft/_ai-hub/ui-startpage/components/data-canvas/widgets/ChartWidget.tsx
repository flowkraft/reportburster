"use client";

import { useRef, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { Loader2 } from "lucide-react";

Chart.register(...registerables);

interface ChartWidgetProps {
  widgetId: string;
}

// Auto-suggest chart type based on data shape (Tableau-inspired)
function suggestChartType(rows: Record<string, unknown>[], xField: string): string {
  if (rows.length === 0) return "bar";
  const firstVal = rows[0][xField];
  // If X looks like a date/time → line chart
  if (typeof firstVal === "string" && /^\d{4}[-/]/.test(firstVal)) return "line";
  // Otherwise → bar
  return "bar";
}

export function ChartWidget({ widgetId }: ChartWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const displayConfig = widget?.displayConfig || {};
  const configChartType = displayConfig.chartType as string | undefined;
  const configXField = displayConfig.xField as string | undefined;
  const configYField = displayConfig.yField as string | undefined;

  useEffect(() => {
    if (!canvasRef.current || !result || result.data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const rows = result.data;
    const keys = Object.keys(rows[0]);

    // Determine X and Y fields
    const xField = configXField || keys[0];
    const yFields = configYField ? [configYField] : keys.filter((k) => k !== xField);

    // Auto-suggest or use configured chart type
    const chartType = configChartType || suggestChartType(rows, xField);

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
    const isPie = chartType === "pie" || chartType === "doughnut";

    chartRef.current = new Chart(canvasRef.current, {
      type: chartType as any,
      data: {
        labels: rows.map((r) => String(r[xField] ?? "")),
        datasets: yFields.map((key, i) => ({
          label: key,
          data: rows.map((r) => Number(r[key]) || 0),
          backgroundColor: isPie
            ? rows.map((_, j) => colors[j % colors.length] + "cc")
            : colors[i % colors.length] + "80",
          borderColor: isPie ? "#fff" : colors[i % colors.length],
          borderWidth: isPie ? 2 : 1,
          tension: chartType === "line" ? 0.3 : undefined,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isPie || yFields.length > 1,
            position: "bottom",
            labels: { boxWidth: 12, font: { size: 11 } },
          },
        },
        ...(isPie ? {} : { scales: { y: { beginAtZero: true } } }),
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [result, configChartType, configXField, configYField]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-xs text-destructive p-2">{error}</div>;
  if (!result) return null;

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
