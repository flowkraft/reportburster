"use client";

import { useWidgetData } from "./useWidgetData";
import { Loader2 } from "lucide-react";

interface TabulatorWidgetProps {
  widgetId: string;
}

export function TabulatorWidget({ widgetId }: TabulatorWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-xs text-destructive p-2">{error}</div>;
  if (!result || result.data.length === 0) return null;

  const keys = Object.keys(result.data[0]);

  // Simple table for now — Tabulator.js integration in Phase 4 (needs display config)
  return (
    <div className="overflow-auto h-full text-xs">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k} className="sticky top-0 bg-muted/80 backdrop-blur-sm text-left px-2 py-1.5 border-b border-border font-medium text-muted-foreground whitespace-nowrap">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.data.map((row, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {keys.map((k) => (
                <td key={k} className="px-2 py-1 border-b border-border/50 text-foreground whitespace-nowrap">
                  {row[k] == null ? <span className="text-muted-foreground/50">null</span> : String(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
