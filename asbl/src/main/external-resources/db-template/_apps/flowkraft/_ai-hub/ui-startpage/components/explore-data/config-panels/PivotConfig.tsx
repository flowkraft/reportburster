"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { X, ArrowUp, ArrowDown, Minus, GripVertical } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { getFieldKind } from "@/lib/explore-data/field-utils";
import { AutoBadge, isAutoField, clearAutoFlag } from "./AutoBadge";

const AGGREGATORS = ["Sum", "Count", "Average", "Min", "Max"];

/** Partition slots: Rows + Columns accept dims only; Values accepts measures
 *  only. Drag-drop between zones enforces this via the DIM_ZONES / MEASURE_ZONES
 *  whitelists below. */
type ZoneId = "pivotRows" | "pivotCols" | "pivotVals" | "available";
const DIM_ZONES: ZoneId[] = ["pivotRows", "pivotCols", "available"];
const MEASURE_ZONES: ZoneId[] = ["pivotVals", "available"];

type SortOrder = "ascending" | "descending";
type SortOrderMap = Record<string, SortOrder>;

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
  const sortOrder = (config.pivotSortOrder as SortOrderMap) || {};

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const columnByName = useMemo(() => {
    const out: Record<string, ColumnSchema> = {};
    for (const c of columns) out[c.columnName] = c;
    return out;
  }, [columns]);

  const assigned = new Set([...rows, ...cols, ...vals]);
  const available = columns.filter((c) => !assigned.has(c.columnName));

  // Zone membership lookup — where does this field live now?
  const zoneOf = (field: string): ZoneId => {
    if (rows.includes(field)) return "pivotRows";
    if (cols.includes(field)) return "pivotCols";
    if (vals.includes(field)) return "pivotVals";
    return "available";
  };

  // Whether a field is allowed in a given target zone (dim/measure gate).
  const isDropAllowed = (field: string, target: ZoneId): boolean => {
    if (target === "available") return true;
    const col = columnByName[field];
    const kind = col ? getFieldKind(col) : "dimension";
    return kind === "measure" ? MEASURE_ZONES.includes(target) : DIM_ZONES.includes(target);
  };

  // Mutate: remove from all zones + add to the target (at end). `available` is
  // the implicit "unassigned" state — removing from all three lists puts a
  // field back there. Preserves sort order for fields that stay in rows/cols.
  const moveTo = (field: string, target: ZoneId) => {
    const next = { ...config };
    const nextRows = rows.filter((f) => f !== field);
    const nextCols = cols.filter((f) => f !== field);
    const nextVals = vals.filter((f) => f !== field);
    if (target === "pivotRows") nextRows.push(field);
    else if (target === "pivotCols") nextCols.push(field);
    else if (target === "pivotVals") nextVals.push(field);
    next.pivotRows = nextRows;
    next.pivotCols = nextCols;
    next.pivotVals = nextVals;
    // Drop sort order when the column leaves rows/cols — irrelevant in values
    // and resets cleanly on re-add.
    if (target !== "pivotRows" && target !== "pivotCols") {
      const { [field]: _dropped, ...rest } = sortOrder;
      next.pivotSortOrder = rest;
    }
    // Clear auto-flag on the touched zones.
    let cleaned = next;
    cleaned = clearAutoFlag(cleaned, "pivotRows");
    cleaned = clearAutoFlag(cleaned, "pivotCols");
    cleaned = clearAutoFlag(cleaned, "pivotVals");
    onChange(cleaned);
  };

  const cycleSort = (field: string) => {
    const current = sortOrder[field];
    const next = current === "ascending" ? "descending"
              : current === "descending" ? undefined
              : "ascending";
    const map = { ...sortOrder };
    if (next) map[field] = next;
    else delete map[field];
    onChange({ ...config, pivotSortOrder: map });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const field = String(e.active.id);
    const overId = e.over?.id ? (String(e.over.id) as ZoneId) : null;
    if (!overId) return;
    if (!isDropAllowed(field, overId)) return;
    if (zoneOf(field) === overId) return;
    moveTo(field, overId);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const activeField = activeId;
  const activeKind = activeField ? (columnByName[activeField] ? getFieldKind(columnByName[activeField]) : "dimension") : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div id="configPanel-pivot" className="space-y-3">
        <FieldZone
          zoneId="pivotRows"
          label="Rows"
          accept="dimension"
          fields={rows}
          columnByName={columnByName}
          onRemove={(f) => moveTo(f, "available")}
          sortOrder={sortOrder}
          onCycleSort={cycleSort}
          autoBadge={isAutoField(config, "pivotRows") && <AutoBadge reason="Dimensions that didn't fit in Columns. Higher-cardinality dims land here because scrolling down is easier than scrolling right." />}
          isDropForbidden={activeKind === "measure"}
        />
        <FieldZone
          zoneId="pivotCols"
          label="Columns"
          accept="dimension"
          fields={cols}
          columnByName={columnByName}
          onRemove={(f) => moveTo(f, "available")}
          sortOrder={sortOrder}
          onCycleSort={cycleSort}
          autoBadge={isAutoField(config, "pivotCols") && <AutoBadge reason="Lowest-cardinality dimension — keeps the grid horizontally compact." />}
          isDropForbidden={activeKind === "measure"}
        />
        <FieldZone
          zoneId="pivotVals"
          label="Values"
          accept="measure"
          fields={vals}
          columnByName={columnByName}
          onRemove={(f) => moveTo(f, "available")}
          sortOrder={sortOrder}
          onCycleSort={cycleSort}
          autoBadge={isAutoField(config, "pivotVals") && <AutoBadge reason="First numeric measure (IDs excluded — SUM(CustomerID) is never meaningful)." />}
          isDropForbidden={activeKind === "dimension"}
        />

        {/* Aggregator — global (applies to every value column) */}
        <div>
          <span className="text-xs text-muted-foreground">
            Aggregation
            {isAutoField(config, "pivotAggregator") && <AutoBadge reason="Sum when a measure is present, else Count." />}
          </span>
          <select
            value={aggregator}
            onChange={(e) => onChange(clearAutoFlag({ ...config, pivotAggregator: e.target.value }, "pivotAggregator"))}
            className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            {AGGREGATORS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Available fields — source zone. Drag FROM here into Rows/Cols/Values. */}
        <AvailableZone fields={available} />
      </div>

      {/* Drag overlay — the chip that follows the pointer during a drag */}
      <DragOverlay dropAnimation={null}>
        {activeField && columnByName[activeField] ? (
          <FieldChip
            field={activeField}
            columnByName={columnByName}
            sortOrder={sortOrder}
            showSort={false}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zones — droppable containers
// ─────────────────────────────────────────────────────────────────────────────

function FieldZone({
  zoneId,
  label,
  accept,
  fields,
  columnByName,
  onRemove,
  sortOrder,
  onCycleSort,
  autoBadge,
  isDropForbidden,
}: {
  zoneId: "pivotRows" | "pivotCols" | "pivotVals";
  label: string;
  accept: "dimension" | "measure";
  fields: string[];
  columnByName: Record<string, ColumnSchema>;
  onRemove: (f: string) => void;
  sortOrder: SortOrderMap;
  onCycleSort: (f: string) => void;
  autoBadge?: React.ReactNode;
  /** Active drag is of the wrong kind → show "not allowed" affordance. */
  isDropForbidden?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });
  const showSort = zoneId === "pivotRows" || zoneId === "pivotCols";
  return (
    <div>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {label}
        <span className="text-[9px] text-muted-foreground/60">({accept}s)</span>
        {autoBadge}
      </span>
      <div
        ref={setNodeRef}
        className={[
          "mt-1 min-h-[36px] border border-dashed rounded-md p-1.5 flex flex-wrap gap-1 transition-colors",
          isOver && !isDropForbidden ? "border-primary bg-primary/5" : "border-border",
          isOver && isDropForbidden ? "border-destructive/50 bg-destructive/5 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {fields.length === 0 && (
          <span className="text-[10px] text-muted-foreground/50 px-1 py-0.5 self-center">
            Drag {accept}s here
          </span>
        )}
        {fields.map((f) => (
          <DraggableChip
            key={f}
            field={f}
            columnByName={columnByName}
            sortOrder={sortOrder}
            onRemove={() => onRemove(f)}
            onCycleSort={showSort ? () => onCycleSort(f) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function AvailableZone({ fields }: { fields: ColumnSchema[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "available" });
  return (
    <div>
      <span className="text-xs text-muted-foreground">Available fields</span>
      <div
        ref={setNodeRef}
        className={[
          "mt-1 min-h-[36px] border border-dashed rounded-md p-1.5 flex flex-wrap gap-1 transition-colors",
          isOver ? "border-primary bg-primary/5" : "border-border/60 bg-muted/20",
        ].join(" ")}
      >
        {fields.length === 0 && (
          <span className="text-[10px] text-muted-foreground/50 px-1 py-0.5 self-center">
            All fields assigned — drag one back here to remove it.
          </span>
        )}
        {fields.map((c) => (
          <DraggableSourceChip key={c.columnName} col={c} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chips — draggable items
// ─────────────────────────────────────────────────────────────────────────────

function DraggableChip({
  field,
  columnByName,
  sortOrder,
  onRemove,
  onCycleSort,
}: {
  field: string;
  columnByName: Record<string, ColumnSchema>;
  sortOrder: SortOrderMap;
  onRemove: () => void;
  onCycleSort?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: field });
  return (
    <span
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={chipClass(columnByName[field])}
    >
      <button
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing flex items-center text-muted-foreground hover:text-foreground"
        aria-label={`Drag ${field}`}
      >
        <GripVertical className="w-2.5 h-2.5" />
      </button>
      <span className="font-mono text-[10px]">{field}</span>
      {onCycleSort && <SortToggle order={sortOrder[field]} onClick={onCycleSort} />}
      <button id={`btnRemovePivotField-${field}`} onClick={onRemove} className="hover:text-destructive text-muted-foreground" aria-label={`Remove ${field}`}>
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function DraggableSourceChip({ col }: { col: ColumnSchema }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: col.columnName });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={`cursor-grab active:cursor-grabbing ${chipClass(col)}`}
      title={`Drag to assign`}
    >
      <GripVertical className="w-2.5 h-2.5" />
      <span className="font-mono text-[10px]">{col.columnName}</span>
    </button>
  );
}

/** Static chip used by the DragOverlay (follows pointer during drag). */
function FieldChip({
  field,
  columnByName,
}: {
  field: string;
  columnByName: Record<string, ColumnSchema>;
  sortOrder: SortOrderMap;
  showSort: boolean;
  dragging: boolean;
}) {
  return (
    <span className={`${chipClass(columnByName[field])} shadow-lg ring-1 ring-primary/40`}>
      <GripVertical className="w-2.5 h-2.5" />
      <span className="font-mono text-[10px]">{field}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort toggle — cycles none → asc → desc → none
// ─────────────────────────────────────────────────────────────────────────────

function SortToggle({ order, onClick }: { order?: SortOrder; onClick: () => void }) {
  const Icon = order === "ascending" ? ArrowUp : order === "descending" ? ArrowDown : Minus;
  const label = order === "ascending" ? "Sort ascending"
              : order === "descending" ? "Sort descending"
              : "Default order (click to sort asc)";
  return (
    <button
      onClick={onClick}
      className={`flex items-center text-[10px] transition-colors ${
        order ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
      }`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-2.5 h-2.5" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

function chipClass(col?: ColumnSchema): string {
  const kind = col ? getFieldKind(col) : "dimension";
  const base = "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border select-none";
  return kind === "measure"
    ? `${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-700`
    : `${base} bg-blue-500/10 border-blue-500/20 text-blue-700`;
}
