"use client";

import { useState } from "react";
import { Table, Box, Check, ChevronsUpDown } from "lucide-react";
import type { TableSchema } from "@/lib/explore-data/types";
import type { CubeInfo } from "@/lib/explore-data/rb-api";
import { getFieldKind } from "@/lib/explore-data/field-utils";
import { getColumnIcon, getColumnIconLabel } from "@/lib/explore-data/column-icons";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface DataStepProps {
  tables: TableSchema[];
  cubes?: CubeInfo[];
  // The currently-selected value: either a table name or a cube id
  value: string;
  valueKind: "table" | "cube";
  onPickTable: (table: string) => void;
  onPickCube: (cubeId: string) => void;
}

// cmdk uses a single string namespace for `value`. To avoid collisions
// between table names and cube ids (and to let the search filter both),
// we prefix entries: "tbl:Customers", "cube:northwind-sales".
const TABLE_PREFIX = "tbl:";
const CUBE_PREFIX = "cube:";

export function DataStep({ tables, cubes = [], value, valueKind, onPickTable, onPickCube }: DataStepProps) {
  const [open, setOpen] = useState(false);

  const selectedTable = valueKind === "table" ? tables.find((t) => t.tableName === value) : undefined;
  const selectedCube = valueKind === "cube" ? cubes.find((c) => c.id === value) : undefined;

  const triggerLabel = selectedTable
    ? `${selectedTable.tableName} (${selectedTable.columns.length} cols)`
    : selectedCube
    ? `${selectedCube.name} (cube)`
    : cubes.length > 0
    ? "Pick a table or cube..."
    : "Pick a table...";

  const TriggerIcon = selectedCube ? Box : Table;
  const triggerIconClass = selectedCube ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TriggerIcon className={cn("w-4 h-4 shrink-0", triggerIconClass)} />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              id="btnPickTableOrCube"
              type="button"
              role="combobox"
              aria-expanded={open}
              className="flex-1 flex items-center justify-between text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground hover:bg-accent/50 transition-colors"
            >
              <span className={cn("truncate", !selectedTable && !selectedCube && "text-muted-foreground")}>
                {triggerLabel}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder={cubes.length > 0 ? "Search tables and cubes..." : "Search table..."} />
              <CommandList>
                <CommandEmpty>No match found.</CommandEmpty>

                <CommandGroup heading="Tables">
                  {tables.map((t) => {
                    const itemValue = `${TABLE_PREFIX}${t.tableName}`;
                    const isSelected = valueKind === "table" && value === t.tableName;
                    return (
                      <CommandItem
                        id={`itemPickTable-${t.tableName}`}
                        key={itemValue}
                        value={itemValue}
                        keywords={[t.tableName]}
                        onSelect={() => {
                          onPickTable(t.tableName);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Table className="mr-2 h-3.5 w-3.5 text-emerald-500/70" />
                        <span className="flex-1 truncate">{t.tableName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({t.columns.length} cols)
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                {cubes.length > 0 && (
                  <CommandGroup heading="Cubes">
                    {cubes.map((c) => {
                      const itemValue = `${CUBE_PREFIX}${c.id}`;
                      const isSelected = valueKind === "cube" && value === c.id;
                      return (
                        <CommandItem
                          id={`itemPickCube-${c.id}`}
                          key={itemValue}
                          value={itemValue}
                          keywords={[c.name, c.description, c.id]}
                          onSelect={() => {
                            onPickCube(c.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Box className="mr-2 h-3.5 w-3.5 text-amber-500/70" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{c.name}</div>
                            {c.description && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                {c.description}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Column preview with Tableau-style color coding + semantic type icons
          (only for tables). Icon chosen by getColumnIcon — PK/FK/geographic/
          email/url/currency/percentage/etc. Hover title spells out the
          semantic type for a11y. */}
      {selectedTable && (
        <div className="ml-6 flex flex-wrap gap-1">
          {selectedTable.columns.map((col) => {
            const kind = getFieldKind(col);
            const Icon = getColumnIcon(col, selectedTable);
            const iconLabel = getColumnIconLabel(col, selectedTable);
            return (
              <span
                key={col.columnName}
                className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                  kind === "measure"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                }`}
                title={`${col.columnName} (${col.typeName}) — ${iconLabel}`}
              >
                <Icon className="w-3 h-3 shrink-0" aria-hidden />
                {col.columnName}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
