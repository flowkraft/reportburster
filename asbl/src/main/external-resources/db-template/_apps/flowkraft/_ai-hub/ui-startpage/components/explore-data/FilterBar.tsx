"use client";

import React, { useEffect, useRef, useState } from "react";
// lucide-react removed
import { useCanvasStore, type ParamMeta } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "@/components/explore-data/widgets/useRbElementReady";
import { executeQuery } from "@/lib/explore-data/rb-api";
import { extractParamTypes } from "@/lib/explore-data/sql-builder";
import { filterValueApplies, optionsUses } from "@/lib/explore-data/filter-values";
import { useDataToday } from "@/lib/explore-data/use-data-today";
import { FilterBarConfigPanel } from "@/components/explore-data/config-panels/FilterBarConfigPanel";

// Re-export for callers (legacy import path).
export type { ParamMeta };

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this component renders FROM the canonical Map at
 * `CanvasState.parametersConfig.parameters`. The DSL text is a derived view
 * (see FilterBarConfigPanel for the on-demand serialize/parse). The same Map
 * flows to the canvas <rb-parameters> AND to the publisher (no drift).
 * ============================================================================
 *
 * FilterBar — dashboard-wide filters backed by the Report-Parameters DSL Map.
 *
 * Param value changes are reported via a `valueChange` CustomEvent on the host
 * element; we forward each (paramName, value) pair to `setFilterValue` in the
 * canvas store, which bumps `filterVersion` and triggers widget re-fetches
 * through the existing `${paramName}` substitution in `useWidgetData.ts`.
 *
 * SQL options resolution: any parameter whose `uiHints.options` is a SELECT
 * SQL string is executed against the canvas connection and replaced with the
 * resolved array before the `<rb-parameters>` component receives it.
 */
/** The options a SELECT's rows give: one column, its values; two or more, `[value, label]` pairs. */
function optionsOfRows(rows: Record<string, unknown>[]): unknown[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.length >= 2
    ? rows.map((r) => [String(r[keys[0]]), String(r[keys[1]])])
    : rows.map((r) => String(r[keys[0]]));
}

/** The SELECT a filter takes its options from, or null when its options are a list of its own. */
function optionsSqlOf(p: ParamMeta | undefined): string | null {
  const options = (p?.uiHints as Record<string, unknown> | undefined)?.options;
  return typeof options === "string" && options.trimStart().toUpperCase().startsWith("SELECT") ? options : null;
}

/** A filter's value as the text a query is sent: a list as its comma-separated values. */
function valueText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(",");
  return value == null ? "" : String(value);
}

export function FilterBar() {
  const parametersConfig = useCanvasStore((s) => s.parametersConfig);
  const editMode         = useCanvasStore((s) => s.editMode);
  const connectionId     = useCanvasStore((s) => s.connectionId);
  const setFilterValue   = useCanvasStore((s) => s.setFilterValue);
  // A date range's presets count from the day the Visual tab's relative dates count from.
  const { today: dataToday } = useDataToday(connectionId);

  const baseParameters = parametersConfig?.parameters ?? [];

  const [parameters, setParameters] = useState<ParamMeta[]>(baseParameters);
  const [configOpen, setConfigOpen] = useState(false);

  const elRef = useRef<HTMLElement | null>(null);
  const ready = useRbElementReady("rb-parameters");

  useEffect(() => {
    if (!editMode) setConfigOpen(false);
  }, [editMode]);

  // Resolve any uiHints.options SQL strings → executed value arrays. The
  // resolved array (or the unchanged param if no SQL) drives <rb-parameters>.
  // Stringify the source params for the dep — array identity flips on every
  // store read, but we only want to re-resolve when the actual data changes.
  const baseKey = JSON.stringify(baseParameters);
  useEffect(() => {
    if (baseParameters.length === 0) {
      setParameters([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const resolved = await Promise.all(
        baseParameters.map(async (p) => {
          const optionsSql = optionsSqlOf(p);
          if (optionsSql === null || !connectionId) {
            return p;
          }
          // A SELECT that names other filters is answered for their defaults here, and asked again
          // by <rb-parameters> (an `optionsChange` event, below) each time one of them changes.
          const uses = optionsUses(optionsSql, baseParameters, p.id);
          try {
            const qr   = uses.length === 0
              ? await executeQuery(connectionId, optionsSql)
              : await executeQuery(connectionId, optionsSql,
                  Object.fromEntries(baseParameters.map((q) => [q.id, valueText(q.defaultValue)])),
                  extractParamTypes(baseParameters));
            const rows = qr.data ?? [];
            if (uses.length > 0) {
              return { ...p, uiHints: { ...(p.uiHints ?? {}), options: optionsOfRows(rows), optionsDependOn: uses } };
            }
            if (!rows.length) return p;
            const keys = Object.keys(rows[0]);
            const arr  = keys.length >= 2
              ? rows.map((r) => [String(r[keys[0]]), String(r[keys[1]])])
              : rows.map((r) => String(r[keys[0]]));
            return { ...p, uiHints: { ...(p.uiHints ?? {}), options: arr } };
          } catch {
            return p;
          }
        }),
      );
      if (!cancelled) {
        setParameters(resolved);
        // Seed filterValues with param defaults for params whose stored value
        // is unset OR empty string. The <rb-parameters> web component can fire
        // valueChange with empty strings during init — we don't want those to
        // shadow the DSL-declared default.
        const currentFV = useCanvasStore.getState().filterValues;
        for (const p of resolved) {
          if (p.defaultValue != null && String(p.defaultValue) !== "" && !currentFV[p.id]) {
            setFilterValue(p.id, String(p.defaultValue));
          }
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, connectionId]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<Record<string, unknown>>;
      const values = ce.detail ?? {};
      // <rb-parameters> echoes valueChange when it seeds itself as well as when a
      // person changes a filter, and says which through `rbInit` (not part of the
      // values: it is non-enumerable, so every other consumer sees what it always
      // saw). A seeded empty may not shadow a default; a cleared one must go
      // through - an empty filter is not a filter, and the widgets have to hear it.
      // setFilterValue is idempotent, so same-value echoes are no-ops.
      const fromInit = (ce.detail as { rbInit?: boolean })?.rbInit === true;
      const currentFV = useCanvasStore.getState().filterValues;
      for (const [paramName, value] of Object.entries(values)) {
        const next = value == null ? "" : String(value);
        if (!filterValueApplies(next, currentFV[paramName], fromInit)) continue;
        setFilterValue(paramName, next);
      }
    };
    el.addEventListener("valueChange", handler);
    // A filter whose options SELECT names another asks for its options again when that one changes:
    // run here, against the canvas connection with the values the bar holds, as a widget's query is.
    const onOptionsChange = async (e: Event) => {
      const asked = (e as CustomEvent<{ id: string; values: Record<string, unknown> }>).detail;
      const declared = useCanvasStore.getState().parametersConfig?.parameters ?? [];
      const sql = optionsSqlOf(declared.find((q) => q.id === asked?.id));
      if (!asked || sql === null || !connectionId) return;
      try {
        const values = Object.fromEntries(Object.entries(asked.values ?? {}).map(([k, v]) => [k, valueText(v)]));
        const qr = await executeQuery(connectionId, sql, values, extractParamTypes(declared));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).setDependentOptions?.(asked.id, optionsOfRows(qr.data ?? []));
      } catch {
        // The list stays as it was; the widgets' own queries say what is wrong with the connection.
      }
    };
    el.addEventListener("optionsChange", onOptionsChange);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).parameters = parameters;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).dataToday = dataToday ?? "";
    return () => {
      el.removeEventListener("valueChange", handler);
      el.removeEventListener("optionsChange", onOptionsChange);
    };
  }, [parameters, ready, setFilterValue, dataToday, connectionId]);

  const hasFilters = parameters.length > 0;
  if (!hasFilters && !editMode) return null;

  return (
    <>
      <div id="parameterBarContainer" className="shrink-0 border-b border-base-300 bg-base-200/20 px-4 py-2">
        <div className="flex items-center gap-3 flex-wrap min-h-[32px]">
          {hasFilters && ready && React.createElement("rb-parameters", {
            ref: elRef,
            style: { display: "inline-block", width: "100%" },
          })}
          {!hasFilters && editMode && (
            <div
              id="btnConfigureFilterBar"
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-base-content cursor-pointer hover:text-primary transition-colors select-none"
            >
              {/* Heroicon: funnel */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
              <span>No dashboard filters. Click to configure.</span>
            </div>
          )}

          {editMode && (
            <button
              id="btnConfigureFilters"
              onClick={() => setConfigOpen(true)}
              className="ml-auto p-1 rounded-md transition-colors text-base-content hover:bg-base-200"
              title="Configure dashboard filters"
            >
              {/* Heroicon: adjustments-vertical */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" /></svg>
            </button>
          )}
        </div>
      </div>

      {editMode && <FilterBarConfigPanel open={configOpen} onClose={() => setConfigOpen(false)} />}
    </>
  );
}
