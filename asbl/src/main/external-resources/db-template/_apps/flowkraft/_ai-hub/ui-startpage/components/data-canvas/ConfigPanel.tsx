"use client";

import { useState, useEffect } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { DataSource, WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/data-canvas/types";
import { fetchSchema } from "@/lib/data-canvas/rb-api";
import { Settings2, Database, Palette } from "lucide-react";
import { QueryBuilder } from "./query-builder/QueryBuilder";
import { ChartConfig } from "./config-panels/ChartConfig";
import { TabulatorConfig } from "./config-panels/TabulatorConfig";
import { PivotConfig } from "./config-panels/PivotConfig";
import { KpiConfig } from "./config-panels/KpiConfig";
import { FilterPaneConfig } from "./config-panels/FilterPaneConfig";
import { DslCustomizer } from "./config-panels/DslCustomizer";

export function ConfigPanel({ canvasId }: { canvasId: string }) {
  const { widgets, selectedWidgetId, connectionId, setConnectionId, updateWidgetDataSource, updateWidgetDisplayConfig } = useCanvasStore();
  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [activeTab, setActiveTab] = useState<"data" | "display">("data");

  // Load columns when connection + widget's table changes
  useEffect(() => {
    if (!connectionId) { setColumns([]); return; }
    fetchSchema(connectionId)
      .then((schema) => {
        const table = selectedWidget?.dataSource?.visualQuery?.table;
        if (table) {
          const t = schema.tables.find((t) => t.tableName === table);
          setColumns(t?.columns || []);
        } else {
          // Flatten all columns for non-visual modes
          setColumns(schema.tables.flatMap((t) => t.columns));
        }
      })
      .catch(() => setColumns([]));
  }, [connectionId, selectedWidget?.dataSource?.visualQuery?.table, selectedWidget?.dataSource?.mode]);

  if (!selectedWidget) {
    return (
      <div className="w-80 shrink-0 border-l border-border bg-muted/30 overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6">
            <Settings2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Select a component to configure</p>
          </div>
        </div>
      </div>
    );
  }

  const isDataWidget = ["chart", "tabulator", "pivot", "kpi"].includes(selectedWidget.type);
  const isFilterPane = selectedWidget.type === "filter-pane";

  const handleDisplayChange = (config: WidgetDisplayConfig) => {
    updateWidgetDisplayConfig(selectedWidget.id, config);
  };

  return (
    <div className="w-80 shrink-0 border-l border-border bg-muted/30 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Widget type label */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {selectedWidget.type}
        </h3>

        {/* Tab switcher — only for data widgets */}
        {isDataWidget && (
          <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg">
            <button
              onClick={() => setActiveTab("data")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                activeTab === "data" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="w-3 h-3" />
              Data
            </button>
            <button
              onClick={() => setActiveTab("display")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                activeTab === "display" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="w-3 h-3" />
              Display
            </button>
          </div>
        )}

        {/* Data tab */}
        {isDataWidget && activeTab === "data" && (
          <QueryBuilder
            canvasId={canvasId}
            dataSource={selectedWidget.dataSource}
            onChange={(ds: DataSource) => updateWidgetDataSource(selectedWidget.id, ds)}
            connectionId={connectionId}
            onConnectionChange={setConnectionId}
          />
        )}

        {/* Display tab */}
        {isDataWidget && activeTab === "display" && (
          <div className="space-y-4">
            {/* Component-specific config */}
            {selectedWidget.type === "chart" && (
              <ChartConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "tabulator" && (
              <TabulatorConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "pivot" && (
              <PivotConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}
            {selectedWidget.type === "kpi" && (
              <KpiConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            )}

            {/* DSL Customizer — escape hatch */}
            <div className="pt-2 border-t border-border/50">
              <DslCustomizer
                dsl={(selectedWidget.displayConfig.customDsl as string) || ""}
                onChange={(dsl) => handleDisplayChange({ ...selectedWidget.displayConfig, customDsl: dsl })}
                canvasId={canvasId}
                componentType={selectedWidget.type}
              />
            </div>
          </div>
        )}

        {/* Filter Pane config — needs data source (for table) + display (for field) */}
        {isFilterPane && (
          <div className="space-y-4">
            <QueryBuilder
              canvasId={canvasId}
              dataSource={selectedWidget.dataSource}
              onChange={(ds: DataSource) => updateWidgetDataSource(selectedWidget.id, ds)}
              connectionId={connectionId}
              onConnectionChange={setConnectionId}
            />
            <div className="pt-2 border-t border-border/50">
              <FilterPaneConfig config={selectedWidget.displayConfig} columns={columns} onChange={handleDisplayChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
