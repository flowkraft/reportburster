"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Sparkles, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useCanvasStore, type ParamMeta } from "@/lib/stores/canvas-store";
import { fetchDslExample } from "@/lib/explore-data/ai-prompt-builder";
import { DslHelpDialog } from "./DslHelpDialog";
import { DslExampleDialog } from "./DslExampleDialog";

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this panel mutates the canonical Map at
 * `CanvasState.parametersConfig` directly — no parallel local params state,
 * no debounced bidirectional sync. The DSL editor pane is a derived view:
 * /api/dsl/reportparameters/serialize on open, /parse on save → setParametersConfig.
 * ============================================================================
 */

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  { ssr: false },
);

const RB_BASE = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:9090/api";

const PARAM_TYPES = ["String", "Integer", "Double", "Boolean", "Date"];
const UI_WIDGETS  = ["text", "select", "multiselect", "datepicker", "checkbox", "radio"];

/** Slugify a label into a valid parameter ID: "Start Date" → "start_date".
 *  Uses underscores (not hyphens) because the param ID flows through:
 *    - extractParamIds regex /\bid:\s*['"](\w+)['"]/ — needs \w
 *    - backend convertToJdbiParameters → JDBI :name parser — needs [a-zA-Z_]\w*
 *  Hyphens break all three. Underscores are \w-safe end to end. */
function slugifyId(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return slug || "param";
}

const emptyParam = (n: number): ParamMeta => {
  const label = `Param${n}`;
  return {
    id: slugifyId(label),
    type: "String",
    label,
    description: "",
    defaultValue: undefined,
    constraints: {},
    uiHints: {},
  };
};

type SyncStatus = "synced" | "syncing" | "error";

interface FilterBarConfigPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal dialog for configuring dashboard filter bar parameters.
 *
 * The Map at `CanvasState.parametersConfig` is canonical. Form mutations call
 * `setParametersConfig` directly (synchronous, no debouncing). The "Customize
 * with DSL" pane is a derived view — opens via /serialize, saves via /parse →
 * `setParametersConfig`. There is NO local params state to keep in sync.
 */
export function FilterBarConfigPanel({ open, onClose }: FilterBarConfigPanelProps) {
  const parametersConfig    = useCanvasStore((s) => s.parametersConfig);
  const setParametersConfig = useCanvasStore((s) => s.setParametersConfig);

  const params = parametersConfig?.parameters ?? [];

  const [dslOpen,        setDslOpen]        = useState(false);
  const [dslText,        setDslText]        = useState<string>("");
  const [dslStatus,      setDslStatus]      = useState<SyncStatus>("synced");
  const [dslError,       setDslError]       = useState<string | null>(null);
  const [aiOpen,         setAiOpen]         = useState(false);
  const [exampleOpen,    setExampleOpen]    = useState(false);
  const [example,        setExample]        = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);

  const handleShowExample = useCallback(async () => {
    if (example !== null) { setExampleOpen(true); return; }
    setLoadingExample(true);
    try {
      const text = await fetchDslExample("filter-bar");
      setExample(text || "// No example available");
    } catch (err) {
      setExample(`// Failed to load example: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingExample(false);
      setExampleOpen(true);
    }
  }, [example]);

  const parseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // When the DSL editor pane is opened — derive text by serializing the
  // canonical Map. Re-derives whenever params change while pane is open
  // (so external form edits flow into the visible text).
  useEffect(() => {
    if (!dslOpen) return;
    let cancelled = false;
    setDslStatus("syncing");
    (async () => {
      try {
        const res = await fetch(`${RB_BASE}/dsl/reportparameters/serialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ options: { parameters: params } }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { dslCode: string };
        if (!cancelled) {
          setDslText(data.dslCode);
          setDslStatus("synced");
          setDslError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setDslStatus("error");
          setDslError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dslOpen, JSON.stringify(params)]);

  // User edited DSL text → debounced parse → setParametersConfig.
  const handleDslChange = (text: string) => {
    setDslText(text);
    setDslStatus("syncing");
    if (parseTimer.current) clearTimeout(parseTimer.current);
    parseTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${RB_BASE}/dsl/reportparameters/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dslCode: text }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { parameters?: ParamMeta[]; options?: { parameters?: ParamMeta[] }; error?: string };
        if (data.error) throw new Error(data.error);
        const parsed = data.parameters ?? data.options?.parameters ?? [];
        setParametersConfig({ parameters: parsed });
        setDslStatus("synced");
        setDslError(null);
      } catch (e) {
        setDslStatus("error");
        setDslError(e instanceof Error ? e.message : String(e));
      }
    }, 500);
  };

  const updateParam = (idx: number, updated: ParamMeta) => {
    const next = params.map((p, i) => i === idx ? updated : p);
    setParametersConfig({ parameters: next });
  };

  const addParam = () => {
    const n = params.length + 1;
    setParametersConfig({ parameters: [...params, emptyParam(n)] });
  };

  const removeParam = (idx: number) => {
    setParametersConfig({ parameters: params.filter((_, i) => i !== idx) });
  };

  if (!open) return null;

  // Status indicator — only show DSL parse errors (form mutations are sync now).
  const statusEl =
    dslStatus === "error" ? (
      <span className="flex items-center gap-1 text-[10px] text-destructive" title={dslError ?? "error"}>
        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
        {dslError ? dslError.slice(0, 60) : "DSL error"}
      </span>
    ) : params.length > 0 ? (
      <span className="text-[10px] text-muted-foreground">
        {params.length} parameter{params.length !== 1 ? "s" : ""}
      </span>
    ) : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-card border border-border ring-1 ring-border/60 rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Dashboard Filters</span>
              {statusEl}
            </div>
            <button id="btnCloseFilterConfig" onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

            {/* Parameter rows */}
            <div className="space-y-2">
              {params.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">
                  No parameters yet. Add one below or edit the DSL directly.
                </p>
              )}
              {params.map((p, i) => (
                <ParameterRow
                  key={i}
                  param={p}
                  onChange={(updated) => updateParam(i, updated)}
                  onRemove={() => removeParam(i)}
                />
              ))}
              <button
                id="btnAddParameter"
                onClick={addParam}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add parameter
              </button>
            </div>

            {/* DSL editor — collapsible, same pattern as DslCustomizer */}
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  id="btnDslToggle"
                  onClick={() => setDslOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {dslOpen
                    ? <ChevronDown className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />}
                  Customize with DSL (Parameters)
                  {dslStatus === "error" && (
                    <span className="flex items-center gap-1 text-[10px] text-destructive">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      DSL error
                    </span>
                  )}
                </button>
                {dslOpen && (
                  <button
                    id="btnShowFilterDslExample"
                    onClick={handleShowExample}
                    disabled={loadingExample}
                    className="text-[10px] text-primary hover:underline disabled:opacity-50"
                  >
                    {loadingExample ? "Loading…" : "Show Example"}
                  </button>
                )}
              </div>

              {dslOpen && (
                <>
                  <div id="filterDslEditorContainer" className="border border-border rounded-md overflow-hidden">
                    <CodeMirror
                      value={dslText}
                      onChange={handleDslChange}
                      height="180px"
                      theme="dark"
                      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
                    />
                  </div>

                  {/* Hey AI, Help Me — directly below the editor, same pattern as DslCustomizer */}
                  <button
                    id="btnAiHelpFilters"
                    onClick={() => setAiOpen(true)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors w-full justify-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    Hey AI, Help Me…
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-5 py-3 border-t border-border shrink-0">
            <button
              id="btnDoneFilters"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              I'm Done
            </button>
          </div>
        </div>
      </div>

      <DslHelpDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        componentType="filter-bar"
        currentDsl={dslText}
        columns={[]}
        sampleData={[]}
      />

      <DslExampleDialog
        open={exampleOpen}
        onClose={() => setExampleOpen(false)}
        componentType="filter-bar"
        example={example ?? ""}
      />
    </>
  );
}

// ── ParameterRow ──────────────────────────────────────────────────────────────

interface ParameterRowProps {
  param: ParamMeta;
  onChange: (updated: ParamMeta) => void;
  onRemove: () => void;
}

function ParameterRow({ param, onChange, onRemove }: ParameterRowProps) {
  const constraints = (param.constraints ?? {}) as Record<string, unknown>;
  const uiHints     = (param.uiHints     ?? {}) as Record<string, unknown>;

  const required   = constraints.required as boolean | undefined;
  const widgetKind = uiHints.widget as string | undefined;
  const options    = uiHints.options;
  const optionsStr = Array.isArray(options)
    ? (options as unknown[]).join(", ")
    : typeof options === "string" ? options : "";

  const showOptions =
    widgetKind === "select" || widgetKind === "multiselect" || widgetKind === "radio";

  const update = (patch: Partial<ParamMeta>) => onChange({ ...param, ...patch });

  const patchConstraint = (key: string, value: unknown) =>
    onChange({
      ...param,
      constraints: { ...(param.constraints ?? {}), [key]: value !== undefined ? value : undefined },
    });

  const patchUiHint = (key: string, value: unknown) =>
    onChange({
      ...param,
      uiHints: { ...(param.uiHints ?? {}), [key]: value || undefined },
    });

  const handleLabelChange = (label: string) => {
    // id is always auto-calculated from label; it's readonly in the UI
    update({ label, id: slugifyId(label) });
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/10">
      {/* Row 1: label (primary) + type + delete */}
      <div className="flex items-center gap-2">
        <input
          id={`inputParamLabel-${param.id || param.label}`}
          placeholder="Label"
          value={param.label ?? ""}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground flex-1 min-w-0"
          autoFocus={!param.label}
        />
        <select
          id={`selectParamType-${param.id || param.label}`}
          value={param.type ?? "String"}
          onChange={(e) => update({ type: e.target.value })}
          className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground w-28 shrink-0"
        >
          {PARAM_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button
          id={`btnRemoveParam-${param.id || param.label}`}
          onClick={onRemove}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
          title="Remove parameter"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 2: auto-calculated param ID (readonly) + default value */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] text-muted-foreground block mb-0.5">Parameter ID (auto)</label>
          <input
            id={`inputParamId-${param.id || param.label}`}
            readOnly
            value={param.id ?? ""}
            className="text-xs bg-muted/30 border border-border/60 rounded-md px-2 py-1.5 text-muted-foreground font-mono w-full cursor-default select-all"
            tabIndex={-1}
          />
        </div>
        <div className="w-28 shrink-0">
          <label className="text-[10px] text-muted-foreground block mb-0.5">Default</label>
          <input
            id={`inputParamDefault-${param.id || param.label}`}
            placeholder="—"
            value={(param.defaultValue as string) ?? ""}
            onChange={(e) => update({ defaultValue: e.target.value || undefined })}
            className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground w-full"
          />
        </div>
      </div>

      {/* Row 3: widget type + required toggle */}
      <div className="flex items-center gap-2">
        <select
          id={`selectParamWidget-${param.id || param.label}`}
          value={widgetKind ?? ""}
          onChange={(e) => patchUiHint("widget", e.target.value)}
          className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground flex-1 min-w-0"
        >
          <option value="">widget: auto</option>
          {UI_WIDGETS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer shrink-0">
          <input
            id={`inputParamRequired-${param.id || param.label}`}
            type="checkbox"
            checked={required === true}
            onChange={(e) => patchConstraint("required", e.target.checked ? true : undefined)}
            className="w-3.5 h-3.5"
          />
          Required
        </label>
      </div>

      {/* Row 4: options source — only for select-like widgets */}
      {showOptions && (
        <div>
          <label className="text-[10px] text-muted-foreground block mb-0.5">
            Options
            <span className="font-normal ml-1">(comma-separated, or a SELECT SQL query)</span>
          </label>
          <input
            id={`inputParamOptions-${param.id || param.label}`}
            placeholder="Option A, Option B  —or—  SELECT value FROM lookup"
            value={optionsStr}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw.trim()) { patchUiHint("options", undefined); return; }
              const isSql = raw.trimStart().toUpperCase().startsWith("SELECT");
              patchUiHint("options", isSql
                ? raw
                : raw.split(",").map((s) => s.trim()).filter(Boolean));
            }}
            className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground w-full font-mono"
          />
        </div>
      )}
    </div>
  );
}
