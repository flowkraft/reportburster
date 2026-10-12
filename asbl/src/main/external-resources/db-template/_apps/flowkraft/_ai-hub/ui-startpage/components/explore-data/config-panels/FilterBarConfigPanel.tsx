"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// lucide-react removed
import dynamic from "next/dynamic";
import { EditorView } from "@codemirror/view";
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

// The editor's input is #filterDslEditorInput, as the Finetune editors' are #sqlEditorInput / #scriptEditorInput.
const FILTER_DSL_EDITOR_INPUT = [EditorView.contentAttributes.of({ id: "filterDslEditorInput" })];

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  { ssr: false },
);

// Same-origin proxy — see app/api/dp/[...path]/route.ts.
const RB_BASE = "/api/dp";

const PARAM_TYPES = ["String", "Integer", "Double", "Boolean", "Date"];
const UI_WIDGETS  = ["text", "select", "multiselect", "datepicker", "daterange", "checkbox", "radio"];
/** The shipped files' names for the dropdown's controls (the filter bar draws both the same). */
const SHIPPED_CONTROL_NAMES: Record<string, string> = {
  "multi-select": "multiselect", date: "datepicker", "date-range": "daterange", boolean: "checkbox",
};

/** The id a date range's last day has: `dateFrom` → `dateTo`, `order_date_from` → `order_date_to`.
 *  The same rule as `rangeToIdOf` in rb-webcomponents' `date-range.ts`, which draws the range. */
export function rangeToIdOf(fromId: string): string | null {
  const m = /^(.+?)(From|_from)$/.exec(fromId ?? "");
  return m ? m[1] + (m[2] === "From" ? "To" : "_to") : null;
}

/** Whether a filter asks to be drawn as a date range, in either word. */
function isDateRange(p: ParamMeta | undefined): boolean {
  const hints = (p?.uiHints ?? {}) as Record<string, unknown>;
  const written = (hints.control ?? hints.widget) as string | undefined;
  return written === "daterange" || written === "date-range";
}

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
  // canonical Map. Re-derives whenever params change while slicer is open
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
    let next = params.map((p, i) => i === idx ? updated : p);
    // A filter turned into a date range gets its last day as a filter of its own, right after it, when
    // the dashboard has none yet: the range fills two parameters, so each `${}` keeps its own name.
    const toId = isDateRange(updated) && !isDateRange(params[idx]) ? rangeToIdOf(updated.id) : null;
    if (toId && !next.some((p) => p.id === toId)) {
      const partner: ParamMeta = {
        id: toId, type: updated.type || "Date", label: "To", description: "",
        defaultValue: undefined, constraints: { required: false }, uiHints: {},
      };
      next = [...next.slice(0, idx + 1), partner, ...next.slice(idx + 1)];
    }
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
      <span className="flex items-center gap-1 text-[10px] text-error" title={dslError ?? "error"}>
        <span className="w-1.5 h-1.5 rounded-full bg-error" />
        {dslError ? dslError.slice(0, 60) : "DSL error"}
      </span>
    ) : params.length > 0 ? (
      <span className="text-[10px] text-base-content/60">
        {params.length} parameter{params.length !== 1 ? "s" : ""}
      </span>
    ) : null;

  return (
    <>
      {/* Backdrop */}
      <div id="overlayFilterBarConfig" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Modal */}
      {/* The wrapper lets clicks through to the backdrop; only the dialog itself takes them. */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          id="dlgFilterBarConfig"
          className="pointer-events-auto bg-base-100 border border-base-300 ring-1 ring-border/60 rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-300 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-base-content">Dashboard Filters</span>
              {statusEl}
            </div>
            <button id="btnCloseFilterConfig" onClick={onClose} className="p-1 rounded-md text-base-content/60 hover:bg-base-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

            {/* Parameter rows */}
            <div className="space-y-2">
              {params.length === 0 && (
                <p className="text-xs text-base-content/60 py-1">
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
                className="flex items-center gap-1.5 text-xs text-base-content/60 hover:text-base-content transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add parameter
              </button>
            </div>

            {/* DSL editor — collapsible, same pattern as DslCustomizer */}
            <div className="pt-2 border-t border-base-300/50 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  id="btnFilterDslToggle"
                  onClick={() => setDslOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-base-content/60 hover:text-base-content transition-colors"
                >
                  {dslOpen
                    ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>}
                  Customize with DSL (Parameters)
                  {dslStatus === "error" && (
                    <span className="flex items-center gap-1 text-[10px] text-error">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" />
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
                  <div id="filterDslEditorContainer" className="border border-base-300 rounded-md overflow-hidden">
                    <CodeMirror
                      value={dslText}
                      extensions={FILTER_DSL_EDITOR_INPUT}
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
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border border-base-300 bg-base-100 hover:bg-base-200 text-base-content transition-colors w-full justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5 text-violet-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 1 2.455 2.456ZM16.5 20.25l-.259 1.035a3.375 3.375 0 0 1-2.455 2.456L12.75 24l1.036-.259a3.375 3.375 0 0 0 2.455-2.456l.259-1.035Z" /></svg>
                    Hey AI, Help Me…
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-5 py-3 border-t border-base-300 shrink-0">
            <button
              id="btnDoneFilters"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-content hover:bg-primary/90 transition-colors"
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
  const key         = param.id || param.label;

  const required = constraints.required as boolean | undefined;
  // The shipped files say `control`; rows written before this dialog did too say `widget`. One setting.
  const written  = (uiHints.control ?? uiHints.widget) as string | undefined;
  const control  = written === undefined ? undefined : (SHIPPED_CONTROL_NAMES[written] ?? written);
  const options  = uiHints.options;

  const showOptions = control === "select" || control === "multiselect" || control === "radio";
  // A range is drawn from a filter whose id names its first day (`...From`); any other id is a plain date.
  const rangeWithoutFrom = control === "daterange" && rangeToIdOf(param.id ?? "") === null;
  const isList      = control === "multiselect";

  // What a list field shows while it is being typed: the stored value is parsed on every key, and
  // drawing it back would swallow a trailing ", " before the next value is typed.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draftOr = (field: string, stored: string) => drafts[field] ?? stored;
  const typing  = (field: string, text: string) => setDrafts((d) => ({ ...d, [field]: text }));
  const typed   = (field: string) => setDrafts((d) => { const next = { ...d }; delete next[field]; return next; });

  const update = (patch: Partial<ParamMeta>) => onChange({ ...param, ...patch });

  const patchConstraint = (name: string, value: unknown) => {
    const next = { ...(param.constraints ?? {}) } as Record<string, unknown>;
    if (value === undefined) delete next[name];
    else next[name] = value;
    onChange({ ...param, constraints: next });
  };

  const patchUiHints = (patch: Record<string, unknown>) => {
    const next = { ...(param.uiHints ?? {}) } as Record<string, unknown>;
    for (const [name, value] of Object.entries(patch)) {
      if (value === undefined || value === "") delete next[name];
      else next[name] = value;
    }
    onChange({ ...param, uiHints: next });
  };

  // The id follows the label while it is the label's slug; once it is typed in, it is the author's.
  const idIsAuto = param.id === slugifyId(param.label ?? "");

  const handleLabelChange = (label: string) => {
    update(idIsAuto ? { label, id: slugifyId(label) } : { label });
  };

  // A multi-select's default is a list (`[]` when nothing is picked), any other control's one value:
  // a default kept across the change is said the way the new control holds it.
  const handleControlChange = (next: string) => {
    const hints = { ...(param.uiHints ?? {}) } as Record<string, unknown>;
    delete hints.widget;
    if (next === "") delete hints.control;
    else hints.control = next;
    const dv = param.defaultValue;
    const defaultValue = next === "multiselect"
      ? (Array.isArray(dv) ? dv : dv === undefined || dv === null || dv === "" ? [] : [dv])
      : (Array.isArray(dv) ? dv[0] : dv);
    typed("default");
    onChange({ ...param, uiHints: hints, defaultValue });
  };

  const handleIdChange = (raw: string) => {
    // A parameter id is a bind name (`:id`) and a key in the URL: letters, digits and _, not first a digit.
    update({ id: raw.replace(/[^A-Za-z0-9_]/g, "").replace(/^[0-9]+/, "") });
  };

  return (
    <div className="border border-base-300 rounded-lg p-3 space-y-2 bg-base-200/10">
      {/* Row 1: label (primary) + type + delete */}
      <div className="flex items-center gap-2">
        <input
          id={`inputParamLabel-${key}`}
          placeholder="Label"
          value={param.label ?? ""}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content flex-1 min-w-0"
          autoFocus={!param.label}
        />
        <select
          id={`selectParamType-${key}`}
          value={param.type ?? "String"}
          onChange={(e) => update({ type: e.target.value, defaultValue: retyped(e.target.value, param.defaultValue) })}
          className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content w-28 shrink-0"
        >
          {PARAM_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button
          id={`btnRemoveParam-${key}`}
          onClick={onRemove}
          className="p-1.5 text-base-content/60 hover:text-error transition-colors shrink-0"
          title="Remove parameter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
        </button>
      </div>

      {/* Row 2: the parameter id (follows the label until it is typed) + default value */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] text-base-content/60 block mb-0.5">
            Parameter ID {idIsAuto && <span className="font-normal">(from the label)</span>}
          </label>
          <input
            id={`inputParamId-${key}`}
            value={param.id ?? ""}
            onChange={(e) => handleIdChange(e.target.value)}
            className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content font-mono w-full"
          />
        </div>
        <div className="w-28 shrink-0">
          <label className="text-[10px] text-base-content/60 block mb-0.5">Default</label>
          {param.type === "Boolean" ? (
            // A Boolean's default is a choice, so `false` is one of them and not an empty box.
            <select
              id={`selectParamDefault-${key}`}
              value={param.defaultValue === true ? "true" : param.defaultValue === false ? "false" : ""}
              onChange={(e) => update({ defaultValue: e.target.value === "" ? undefined : e.target.value === "true" })}
              className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content w-full"
            >
              <option value="">—</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              id={`inputParamDefault-${key}`}
              placeholder={isList ? "none picked" : "—"}
              value={draftOr("default", listText(param.defaultValue))}
              onChange={(e) => {
                typing("default", e.target.value);
                // A multi-select starts with a list, `[]` when nothing is picked; any other control a value.
                update({ defaultValue: isList
                  ? splitList(e.target.value).map((v) => typedValue(param.type, v))
                  : (e.target.value === "" ? undefined : typedValue(param.type, e.target.value)) });
              }}
              onBlur={() => typed("default")}
              className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content w-full"
            />
          )}
        </div>
      </div>

      {/* Row 3: control + required toggle */}
      <div className="flex items-center gap-2">
        <select
          id={`selectParamWidget-${key}`}
          value={control ?? ""}
          onChange={(e) => handleControlChange(e.target.value)}
          className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content flex-1 min-w-0"
        >
          <option value="">control: auto</option>
          {UI_WIDGETS.map((w) => <option key={w} value={w}>{w}</option>)}
          {/* A control the dropdown has no word for (`integer`, `datetime`...) is shown as written. */}
          {control && !UI_WIDGETS.includes(control) && <option value={control}>{control}</option>}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-base-content cursor-pointer shrink-0">
          <input
            id={`inputParamRequired-${key}`}
            type="checkbox"
            checked={required === true}
            // Unticked is said, as the shipped files say it: `required: false`.
            onChange={(e) => patchConstraint("required", e.target.checked)}
            className="w-3.5 h-3.5"
          />
          Required
        </label>
      </div>

      {rangeWithoutFrom && (
        <p id={`paramRangeHint-${key}`} className="text-[10px] text-amber-600">
          A date range is drawn from a filter whose id ends in From (or _from), with its To partner.
        </p>
      )}

      {/* Row 4: options source — only for select-like controls */}
      {showOptions && (
        <div>
          <label className="text-[10px] text-base-content/60 block mb-0.5">
            Options
            <span className="font-normal ml-1">(comma-separated, value=Label to show a name, or a SELECT SQL query)</span>
          </label>
          <input
            id={`inputParamOptions-${key}`}
            placeholder="A, B  —or—  a=Option A, b=Option B  —or—  SELECT value, label FROM lookup"
            value={draftOr("options", optionsText(options))}
            onChange={(e) => {
              typing("options", e.target.value);
              const raw = e.target.value;
              if (!raw.trim()) { patchUiHints({ options: undefined }); return; }
              const isSql = raw.trimStart().toUpperCase().startsWith("SELECT");
              patchUiHints({ options: isSql ? raw : parseOptions(param.type, raw) });
            }}
            onBlur={() => typed("options")}
            className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content w-full font-mono"
          />
        </div>
      )}

      {/* Row 5: the only values the parameter accepts (also what a control with no options offers) */}
      <div>
        <label className="text-[10px] text-base-content/60 block mb-0.5">
          Allowed values
          <span className="font-normal ml-1">(comma-separated; empty = any value)</span>
        </label>
        <input
          id={`inputParamAllowedValues-${key}`}
          placeholder="any value"
          value={draftOr("allowed", listText(constraints.allowedValues))}
          onChange={(e) => {
            typing("allowed", e.target.value);
            const values = splitList(e.target.value).map((v) => typedValue(param.type, v));
            patchConstraint("allowedValues", values.length > 0 ? values : undefined);
          }}
          onBlur={() => typed("allowed")}
          className="text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content w-full"
        />
      </div>
    </div>
  );
}

// ── Values as the form types them and as the shipped files hold them ─────────

/** "a, b ,, c" → ["a", "b", "c"]. */
function splitList(text: string): string[] {
  return text.split(",").map((s) => s.trim()).filter((s) => s !== "");
}

/** A value shown in a text box: a list as "a, b", anything else as itself. */
function listText(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  return value === undefined || value === null ? "" : String(value);
}

/**
 * A typed-in value as the parameter's type holds it: an Integer or a Double a number, a Boolean
 * true or false, anything else the text. Text that is not a number stays text (a `{dataToday}`
 * default, a half-typed "-"), so nothing typed is ever lost.
 */
function typedValue(type: string | undefined, value: unknown): unknown {
  if (typeof value !== "string") return value;
  if ((type === "Integer" && /^-?\d+$/.test(value.trim())) || (type === "Double" && /^-?\d+(\.\d+)?$/.test(value.trim())))
    return Number(value.trim());
  if (type === "Boolean" && (value === "true" || value === "false")) return value === "true";
  return value;
}

/** A default kept across a change of type, as the new type holds it ("10" becomes 10 for an Integer). */
function retyped(type: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) return value.map((v) => typedValue(type, String(v)));
  return typedValue(type, String(value));
}

/** Options as typed: plain values, or `value=Label` pairs (then every option is a pair). */
function parseOptions(type: string | undefined, raw: string): unknown[] {
  const items = splitList(raw);
  if (!items.some((item) => item.includes("="))) return items.map((item) => typedValue(type, item));
  return items.map((item) => {
    const at = item.indexOf("=");
    const value = at === -1 ? item : item.slice(0, at).trim();
    const label = at === -1 ? item : item.slice(at + 1).trim();
    return { value: typedValue(type, value), label };
  });
}

/** Options as the box shows them: a SELECT as written, pairs as `value=Label`, values as themselves. */
function optionsText(options: unknown): string {
  if (typeof options === "string") return options;
  if (!Array.isArray(options)) return "";
  return options.map((o) => {
    if (o && typeof o === "object" && "value" in (o as Record<string, unknown>))
      return `${String((o as Record<string, unknown>).value ?? "")}=${String((o as Record<string, unknown>).label ?? "")}`;
    return String(o);
  }).join(", ");
}
