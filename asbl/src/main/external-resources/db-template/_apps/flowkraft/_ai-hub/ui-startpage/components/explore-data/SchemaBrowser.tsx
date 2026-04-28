"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronLeft, Database, Table, Box, Loader2, Search, X, Check, Type, Minus, Frame } from "lucide-react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { WidgetType } from "@/lib/stores/canvas-store";
import { fetchConnections, fetchSchema, fetchCubes, type CubeInfo } from "@/lib/explore-data/rb-api";
import type { ConnectionInfo, SchemaInfo, TableSchema } from "@/lib/explore-data/types";
import { getFieldKind } from "@/lib/explore-data/field-utils";

// ── Props ──────────────────────────────────────────────────────────────────────

interface SchemaBrowserProps {
  /** "left-panel" = normal canvas sidebar (default). "ai-prompt" = picker mode for AI Prompt Builder. */
  mode?: "left-panel" | "ai-prompt";
  /** Called when the user clicks the collapse arrow (left-panel mode). */
  onCollapse?: () => void;

  // ── ai-prompt mode extras ──
  /** Table names that should be pre-checked (ai-prompt mode). */
  preselectedTableNames?: string[];
  /** Cube IDs that should be pre-checked (ai-prompt mode). */
  preselectedCubeIds?: string[];
  /** Callback when user clicks "Pick Tables" (ai-prompt mode). */
  onPick?: (selection: { tableNames: string[]; cubeIds: string[] }) => void;
  /** Label for the confirm button (default: "Pick Tables"). */
  pickButtonLabel?: string;
  /** Callback when user clicks "Close" without picking (ai-prompt mode). */
  onClose?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SchemaBrowser({
  mode = "left-panel",
  onCollapse,
  preselectedTableNames,
  preselectedCubeIds,
  onPick,
  pickButtonLabel = "Pick Tables",
  onClose,
}: SchemaBrowserProps) {
  const isPicker = mode === "ai-prompt";

  // ── Store (used in left-panel mode for connectionId + widget actions) ──
  const { connectionId, setConnectionId, addWidgetFromTable, addWidgetFromCube, addWidget } = useCanvasStore();

  // ── Left-panel tabs ──
  const [activeTab, setActiveTab] = useState<"data" | "elements">("data");

  // ── Shared state ──
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [allCubes, setAllCubes] = useState<CubeInfo[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [cubesOpen, setCubesOpen] = useState(true);
  const [tablesOpen, setTablesOpen] = useState(true);
  const [search, setSearch] = useState("");

  // ── Inline add confirmation (left-panel mode) ──
  // Tracks which item is showing "Add? Yes / No"
  // key: "table:tableName" or "cube:cubeId"
  const [pendingAdd, setPendingAdd] = useState<string | null>(null);

  // ── Selection state (ai-prompt mode) ──
  const [selectedTables, setSelectedTables] = useState<Set<string>>(
    () => new Set(preselectedTableNames || []),
  );
  const [selectedCubes, setSelectedCubes] = useState<Set<string>>(
    () => new Set(preselectedCubeIds || []),
  );

  // Active connection: always from the store (same connection as left panel)
  const activeConnectionId = connectionId;

  // Cubes filtered for the active connection
  const cubes = activeConnectionId
    ? allCubes.filter((c) => c.connectionId === activeConnectionId)
    : [];

  // ── Search filtering ──
  const searchTerm = search.trim().toLowerCase();
  const filteredCubes = useMemo(
    () => (searchTerm ? cubes.filter((c) => c.name.toLowerCase().includes(searchTerm)) : cubes),
    [cubes, searchTerm],
  );
  const filteredTables = useMemo(() => {
    const all = schema?.tables ?? [];
    return searchTerm ? all.filter((t) => t.tableName.toLowerCase().includes(searchTerm)) : all;
  }, [schema, searchTerm]);

  // ── Data fetching (same for both modes) ──
  useEffect(() => {
    fetchConnections()
      .then((list) => {
        setConnections(list);
        // Auto-select default connection only in left-panel mode
        if (!isPicker) {
          const current = useCanvasStore.getState().connectionId;
          if (!current) {
            const def = list.find((c) => c.defaultConnection);
            if (def) setConnectionId(def.connectionCode);
          }
        }
      })
      .catch(() => setConnections([]));
    fetchCubes().then(setAllCubes).catch(() => setAllCubes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeConnectionId) { setSchema(null); return; }
    setLoadingSchema(true);
    fetchSchema(activeConnectionId)
      .then(setSchema)
      .catch(() => setSchema(null))
      .finally(() => setLoadingSchema(false));
  }, [activeConnectionId]);

  // ── Toggle helpers ──
  const toggleExpand = (name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleTableCheck = (name: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleCubeCheck = (id: string) => {
    setSelectedCubes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSelected = selectedTables.size + selectedCubes.size;

  // ── Render ──
  return (
    <div className={isPicker ? "flex flex-col h-full min-h-0" : "w-64 shrink-0 border-r border-border bg-muted/30 flex flex-col overflow-hidden"}>

      {/* Tab bar + collapse button — left-panel mode only */}
      {!isPicker && (
        <div className="flex items-stretch border-b border-border shrink-0 bg-muted/50">
          <button
            id="btnLeftTabData"
            onClick={() => setActiveTab("data")}
            className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 text-[11px] font-semibold transition-colors border-b-2 ${
              activeTab === "data"
                ? "text-primary border-primary bg-background"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Database className="w-3 h-3" />
            Data Source
          </button>
          <button
            id="btnLeftTabElements"
            onClick={() => setActiveTab("elements")}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors border-b-2 ${
              activeTab === "elements"
                ? "text-primary border-primary bg-background"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50"
            }`}
          >
            UI Elements
          </button>
          <button
            id="btnCollapseLeftPanel"
            onClick={onCollapse}
            className="px-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-b-2 border-transparent"
            title="Hide sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Elements tab — left-panel mode */}
      {!isPicker && activeTab === "elements" && (
        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          {(
            [
              { type: "text",    label: "Text Block", icon: Type,  description: "Notes, headings, captions" },
              { type: "divider", label: "Divider",    icon: Minus, description: "Visual separator" },
              { type: "iframe",  label: "iFrame",     icon: Frame, description: "Embed an external page" },
              // { type: "filter-pane", label: "Filter Pane", icon: ListFilter, description: "Associative exploration" },
            ] as { type: WidgetType; label: string; icon: React.ElementType; description: string }[]
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                id={`btnAddElement-${item.type}`}
                type="button"
                onClick={() => addWidget(item.type)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors"
              >
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Data tab — left-panel mode, plus full content in ai-prompt mode */}
      {(isPicker || activeTab === "data") && (
      <div className={isPicker ? "flex-1 overflow-y-auto p-3 space-y-3" : "p-3 space-y-3 overflow-y-auto flex-1"}>
        {/* Connection picker — hidden in ai-prompt mode */}
        {!isPicker && (
          <div>
            <select
              id="selectConnection"
              value={connectionId || ""}
              onChange={(e) => setConnectionId(e.target.value || null)}
              className="w-full text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
            >
              <option value="">Select connection…</option>
              {connections.map((c) => (
                <option key={c.connectionCode} value={c.connectionCode}>
                  {c.connectionCode} ({c.dbserver?.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        {activeConnectionId && !loadingSchema && (
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ..."
              className="w-full text-xs bg-background border border-border rounded-md pl-7 pr-7 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {!activeConnectionId && (
          <div className="p-3 rounded-md border border-dashed border-border bg-background/50 text-[11px] text-muted-foreground">
            Pick a connection above to browse tables and cubes.
          </div>
        )}

        {activeConnectionId && loadingSchema && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading schema…
          </div>
        )}

        {activeConnectionId && !loadingSchema && (
          <>
            {/* Cubes group */}
            {filteredCubes.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setCubesOpen((v) => !v)}
                  className="w-full flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground transition-colors"
                >
                  <ChevronRight className={`w-3 h-3 transition-transform ${cubesOpen ? "rotate-90" : ""}`} />
                  Cubes ({filteredCubes.length}
                  {searchTerm && filteredCubes.length !== cubes.length ? ` / ${cubes.length}` : ""})
                </button>
                {cubesOpen && (
                  <div className="space-y-0.5">
                    {filteredCubes.map((cube) => {
                      const cubeKey = `cube:${cube.id}`;
                      if (isPicker) {
                        const checked = selectedCubes.has(cube.id);
                        return (
                          <label
                            key={cube.id}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs hover:bg-accent transition-colors cursor-pointer ${
                              checked ? "bg-primary/5" : ""
                            }`}
                            title={cube.description}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCubeCheck(cube.id)}
                              className="shrink-0 accent-primary"
                            />
                            <Box className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate text-foreground">{cube.name}</span>
                          </label>
                        );
                      }
                      // left-panel mode: inline Add? Yes / No
                      const isPending = pendingAdd === cubeKey;
                      return (
                        <div key={cube.id}>
                          <button
                            id={`btnCube-${cube.id}`}
                            type="button"
                            onClick={() => {
                              if (isPending) setPendingAdd(null);
                              else setPendingAdd(cubeKey);
                            }}
                            title={cube.description}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs hover:bg-accent transition-colors group"
                          >
                            <Box className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate text-foreground">{cube.name}</span>
                          </button>
                          {isPending && (
                            <div className="ml-7 px-1 py-0.5 text-[11px] flex items-center gap-2">
                              <span className="text-muted-foreground">Add to canvas?</span>
                              <button
                                id={`btnConfirmAddCube-${cube.id}`}
                                type="button"
                                onClick={() => {
                                  addWidgetFromCube(cube.id);
                                  setPendingAdd(null);
                                }}
                                className="font-bold text-blue-600 hover:underline"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingAdd(null)}
                                className="text-foreground hover:underline"
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tables group */}
            {filteredTables.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setTablesOpen((v) => !v)}
                  className="w-full flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground transition-colors"
                >
                  <ChevronRight className={`w-3 h-3 transition-transform ${tablesOpen ? "rotate-90" : ""}`} />
                  Tables ({filteredTables.length}
                  {searchTerm && filteredTables.length !== (schema?.tables.length ?? 0) ? ` / ${schema?.tables.length ?? 0}` : ""})
                </button>
                {tablesOpen && (
                  <div id="schemaBrowserTablesList" className="space-y-0.5">
                    {filteredTables.map((table) => (
                      <TableNode
                        key={table.tableName}
                        table={table}
                        expanded={expandedTables.has(table.tableName)}
                        onToggleExpand={() => toggleExpand(table.tableName)}
                        onPickTable={isPicker ? () => toggleTableCheck(table.tableName) : () => {
                          const tableKey = `table:${table.tableName}`;
                          if (pendingAdd === tableKey) setPendingAdd(null);
                          else setPendingAdd(tableKey);
                        }}
                        mode={mode}
                        checked={isPicker ? selectedTables.has(table.tableName) : undefined}
                        isPending={!isPicker && pendingAdd === `table:${table.tableName}`}
                        onConfirmAdd={() => { addWidgetFromTable(table.tableName); setPendingAdd(null); }}
                        onCancelAdd={() => setPendingAdd(null)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {schema && schema.tables.length === 0 && cubes.length === 0 && (
              <div className="p-3 rounded-md border border-dashed border-border bg-background/50 text-[11px] text-muted-foreground">
                No tables found for this connection.
              </div>
            )}

            {/* No-match state */}
            {searchTerm &&
              filteredTables.length === 0 &&
              filteredCubes.length === 0 &&
              ((schema?.tables.length ?? 0) > 0 || cubes.length > 0) && (
                <div className="p-3 rounded-md border border-dashed border-border bg-background/50 text-[11px] text-muted-foreground">
                  No tables or cubes match &ldquo;{search}&rdquo;.
                </div>
              )}
          </>
        )}
      </div>
      )}

      {/* Footer — ai-prompt mode only */}
      {isPicker && (
        <div className="flex items-center justify-between p-3 border-t border-border shrink-0">
          <span className="text-xs text-muted-foreground">
            {totalSelected} item{totalSelected !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btnPickTables"
              type="button"
              onClick={() => onPick?.({
                tableNames: Array.from(selectedTables),
                cubeIds: Array.from(selectedCubes),
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {pickButtonLabel}
            </button>
            <button
              id="btnCloseSchemaBrowser"
              type="button"
              onClick={() => onClose?.()}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TableNode ──────────────────────────────────────────────────────────────────

function TableNode({
  table,
  expanded,
  onToggleExpand,
  onPickTable,
  mode = "left-panel",
  checked,
  isPending,
  onConfirmAdd,
  onCancelAdd,
}: {
  table: TableSchema;
  expanded: boolean;
  onToggleExpand: () => void;
  onPickTable: () => void;
  mode?: "left-panel" | "ai-prompt";
  checked?: boolean;
  /** left-panel: whether this table is showing the inline "Add? Yes/No" */
  isPending?: boolean;
  /** Confirm add — actually add the table to canvas */
  onConfirmAdd?: () => void;
  /** Cancel — remove inline messages */
  onCancelAdd?: () => void;
}) {
  const isPicker = mode === "ai-prompt";

  return (
    <div>
      <div className={`flex items-center gap-1 px-1 py-1 rounded-md hover:bg-accent transition-colors group ${isPicker && checked ? "bg-primary/5" : ""}`}>
        {isPicker && (
          <input
            type="checkbox"
            checked={checked ?? false}
            onChange={onPickTable}
            className="shrink-0 accent-primary"
          />
        )}
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-0.5 text-muted-foreground hover:text-foreground"
          title={expanded ? "Collapse columns" : "Show columns"}
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
        <button
          type="button"
          id={`btnTable-${table.tableName}`}
          onClick={onPickTable}
          className="flex-1 flex items-center gap-1.5 text-left text-xs text-foreground"
          title={isPicker ? "Toggle selection" : "Click to add this table to the canvas"}
        >
          <Table className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">{table.tableName}</span>
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">({table.columns.length})</span>
        </button>
      </div>
      {/* Inline "Add to canvas?" Yes/No — left-panel mode only */}
      {isPending && (
        <div className="ml-7 px-1 py-0.5 text-[11px] flex items-center gap-2">
          <span className="text-muted-foreground">Add to canvas?</span>
          <button
            type="button"
            id={`btnConfirmAdd-${table.tableName}`}
            onClick={onConfirmAdd}
            className="font-bold text-blue-600 hover:underline"
          >
            Yes
          </button>
          <button
            type="button"
            id={`btnCancelAdd-${table.tableName}`}
            onClick={onCancelAdd}
            className="text-foreground hover:underline"
          >
            No
          </button>
        </div>
      )}
      {expanded && (
        <div className={`${isPicker ? "ml-8" : "ml-5"} pl-2 border-l border-border/50 space-y-0.5 py-0.5`}>
          {table.columns.map((col) => {
            const kind = getFieldKind(col);
            const dotColor = kind === "measure" ? "bg-emerald-500" : "bg-blue-500";
            return (
              <div
                key={col.columnName}
                className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                title={`${col.columnName} (${col.typeName})`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                <span className="truncate">{col.columnName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
