"use client";

import React, { useEffect, useRef, useState } from "react";
import { Filter, Settings2 } from "lucide-react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "@/components/explore-data/widgets/useRbElementReady";
import { executeQuery } from "@/lib/explore-data/rb-api";
import { FilterBarConfigPanel } from "@/components/explore-data/config-panels/FilterBarConfigPanel";

// Matches ParamMeta from frend/rb-webcomponents/src/wc/RbParameters.wc.svelte
export interface ParamMeta {
  id: string;
  type: string;
  defaultValue?: unknown;
  constraints?: Record<string, unknown>;
  uiHints?: Record<string, unknown>;
  label?: string;
  description?: string;
}

const RB_BASE = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:9090/api";

/**
 * FilterBar — dashboard-wide filters backed by the Report-Parameters DSL.
 *
 * Single source of truth: `canvas.filterDsl` (a string) → parsed via the
 * backend `/api/dsl/reportparameters/parse` → `ParamMeta[]` → passed to the
 * `<rb-parameters>` web component in props mode. The same web component is
 * used at runtime in exported dashboards (report mode), so canvas preview
 * and exported runtime look and behave identically.
 *
 * Value changes are reported via a `valueChange` CustomEvent on the host
 * element; we forward each (paramName, value) pair to `setFilterValue` in
 * the canvas store, which bumps `filterVersion` and triggers widget
 * re-fetches through the existing `{{paramName}}` substitution in
 * `useWidgetData.ts`.
 *
 * 5.6.5 — A gear icon appears in edit mode; clicking it toggles
 * `FilterBarConfigPanel` (DSL editor + form-based parameter builder).
 *
 * 5.6.6 — After parsing DSL, any parameter whose `uiHints.options` is a
 * SELECT SQL string is executed against the canvas connection and replaced
 * with the resolved array before the `<rb-parameters>` component receives it.
 */
export function FilterBar() {
  const filterDsl    = useCanvasStore((s) => s.filterDsl);
  const editMode     = useCanvasStore((s) => s.editMode);
  const connectionId = useCanvasStore((s) => s.connectionId);
  const setFilterValue = useCanvasStore((s) => s.setFilterValue);

  const [parameters,   setParameters]   = useState<ParamMeta[]>([]);
  const [parseError,   setParseError]   = useState<string | null>(null);
  const [configOpen,   setConfigOpen]   = useState(false);

  const elRef = useRef<HTMLElement | null>(null);
  const ready = useRbElementReady("rb-parameters");

  // Close config panel when leaving edit mode.
  useEffect(() => {
    if (!editMode) setConfigOpen(false);
  }, [editMode]);

  // ── Parse DSL → ParamMeta[] + resolve SQL options (5.6.3 + 5.6.6) ────
  useEffect(() => {
    const dsl = filterDsl?.trim() ?? "";
    if (!dsl) {
      setParameters([]);
      setParseError(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        // Step 1 — parse DSL via backend
        const res = await fetch(`${RB_BASE}/dsl/reportparameters/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dslCode: dsl }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          options?: { parameters?: ParamMeta[] };
          parameters?: ParamMeta[];
          error?: string;
        };
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        const params = data.parameters ?? data.options?.parameters ?? [];

        // Step 2 — 5.6.6: resolve SQL options strings → executed arrays
        const resolved = await Promise.all(
          params.map(async (p) => {
            const optionsSql = (p.uiHints as Record<string, unknown> | undefined)?.options;
            if (
              typeof optionsSql !== "string" ||
              !optionsSql.trimStart().toUpperCase().startsWith("SELECT") ||
              !connectionId
            ) {
              return p;
            }
            try {
              const qr   = await executeQuery(connectionId, optionsSql);
              const rows = qr.data ?? [];
              if (!rows.length) return p;
              const keys = Object.keys(rows[0]);
              // Two columns → [[value, label], …]; one column → [value, …]
              const arr  = keys.length >= 2
                ? rows.map((r) => [String(r[keys[0]]), String(r[keys[1]])])
                : rows.map((r) => String(r[keys[0]]));
              return { ...p, uiHints: { ...(p.uiHints ?? {}), options: arr } };
            } catch {
              // Leave SQL string in place on error; <rb-parameters> renders an empty list.
              return p;
            }
          }),
        );

        if (!cancelled) {
          setParameters(resolved);
          setParseError(null);
          // Seed filterValues with param defaults for params whose stored value
          // is unset OR empty string. Treating "" as unset is important: the
          // <rb-parameters> web component can fire valueChange with empty
          // strings during intermediate init — we don't want those to shadow
          // the DSL-declared default.
          const currentFV = useCanvasStore.getState().filterValues;
          for (const p of resolved) {
            if (p.defaultValue != null && String(p.defaultValue) !== "" && !currentFV[p.id]) {
              setFilterValue(p.id, String(p.defaultValue));
            }
          }
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setParameters([]);
        // 404 = backend endpoint not yet deployed; treat silently.
        setParseError(msg.includes("404") ? null : msg);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filterDsl, connectionId]);

  // ── Wire rb-parameters: register listener then assign props ─────────
  // Both actions must share one effect so the listener is registered
  // before parameters are set. The previous split (two effects with
  // different deps) caused the listener to run when ready=true but the
  // element didn't exist yet (hasFilters=false), so it returned early
  // and was never re-registered when the element appeared later.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<Record<string, unknown>>;
      const values = ce.detail ?? {};
      for (const [paramName, value] of Object.entries(values)) {
        setFilterValue(paramName, value == null ? "" : String(value));
      }
    };
    el.addEventListener("valueChange", handler);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).parameters = parameters;
    return () => el.removeEventListener("valueChange", handler);
  }, [parameters, ready, setFilterValue]);

  const hasFilters = parameters.length > 0;
  // Always render in edit mode (gear must be reachable even with no filters).
  if (!hasFilters && !editMode) return null;

  return (
    <>
      {/* Runtime filter bar */}
      <div className="shrink-0 border-b border-border bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3 flex-wrap min-h-[32px]">
          {hasFilters && ready && React.createElement("rb-parameters", {
            ref: elRef,
            style: { display: "inline-block", width: "100%" },
          })}
          {!hasFilters && editMode && (
            <div
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer hover:text-primary transition-colors select-none"
            >
              <Filter className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>No dashboard filters. Click to configure.</span>
            </div>
          )}
          {parseError && (
            <span className="text-xs text-destructive" title={parseError}>
              ⚠ Filter DSL has errors
            </span>
          )}

          {/* 5.6.5 — Configure gear (edit mode only) */}
          {editMode && (
            <button
              id="btnConfigureFilters"
              onClick={() => setConfigOpen(true)}
              className="ml-auto p-1 rounded-md transition-colors text-foreground hover:bg-accent"
              title="Configure dashboard filters"
            >
              <Settings2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* 5.6.5 — Config modal */}
      {editMode && <FilterBarConfigPanel open={configOpen} onClose={() => setConfigOpen(false)} />}
    </>
  );
}
