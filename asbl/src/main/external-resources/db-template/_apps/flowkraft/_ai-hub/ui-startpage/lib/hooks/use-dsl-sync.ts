import { useEffect, useRef, useState } from "react";
import { useCanvasStore, type WidgetDisplayConfig } from "@/lib/stores/canvas-store";

const SERIALIZE_DEBOUNCE_MS = 500;
const PARSE_DEBOUNCE_MS = 600;

// Java Spring Boot backend base URL (port 9090). Same env-var convention as
// lib/explore-data/rb-api.ts — never hit Next.js (port 8440) for /api/dsl.
const RB_BASE = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:9090/api";

export type DslSyncStatus = "synced" | "syncing" | "error";

export interface UseDslSyncReturn {
  status: DslSyncStatus;
  errorMessage: string | null;
  onDslTextChange: (next: string) => void;
  dslText: string;
}

type Origin = "ui" | "dsl" | null;

/**
 * Generic bidirectional UI ↔ DSL sync for a single widget.
 *
 * Caller supplies:
 *   - `dslType`: the backend endpoint discriminator ("filterpane" | "pivot" | ...)
 *   - `uiToDsl(displayConfig)`: produces the DSL options map the UI owns
 *   - `dslToUi(options, displayConfig)`: merges parsed DSL options into the UI config
 *
 * Unknown DSL keys (ones the UI doesn't own) stay in the customDsl text —
 * the backend emits whatever the parser captured, so they survive any
 * UI-driven serialize round-trip without being stripped.
 */
export function useDslSync<DslOpts>(
  widgetId: string,
  dslType: string,
  uiToDsl: (dc: WidgetDisplayConfig) => DslOpts,
  dslToUi: (opts: DslOpts, dc: WidgetDisplayConfig) => WidgetDisplayConfig,
): UseDslSyncReturn {
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const updateWidgetDisplayConfig = useCanvasStore((s) => s.updateWidgetDisplayConfig);

  const [status, setStatus] = useState<DslSyncStatus>("synced");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dslText, setDslText] = useState<string>(
    (widget?.displayConfig.customDsl as string) || "",
  );

  const originRef = useRef<Origin>(null);
  const serializeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When customDsl is already populated (saved canvas reopened): initialize the
  // snapshot to the current UI state so the first effect run is a no-op — this
  // prevents a spurious re-serialize that would overwrite user-written DSL extras.
  // When customDsl is empty (freshly mounted/type-switched widget): use a sentinel
  // that can never match a real JSON snapshot, so the first effect run fires the
  // initial populate serialize and fills the editor.
  const lastUiSnapshotRef = useRef<string>(
    (widget?.displayConfig.customDsl as string)
      ? (widget ? JSON.stringify(uiToDsl(widget.displayConfig)) : "")
      : "<<needs-initial-serialize>>",
  );

  // ── UI → DSL ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!widget) return;
    if (originRef.current === "dsl") return;

    const opts = uiToDsl(widget.displayConfig);
    const snap = JSON.stringify(opts);
    if (snap === lastUiSnapshotRef.current) return;
    lastUiSnapshotRef.current = snap;

    setStatus("syncing");
    if (serializeTimer.current) clearTimeout(serializeTimer.current);
    serializeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${RB_BASE}/dsl/${dslType}/serialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            options: opts,
            priorDslCode: (widget.displayConfig.customDsl as string) || "",
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { dslCode } = (await res.json()) as { dslCode: string };

        originRef.current = "ui";
        setDslText(dslCode);
        updateWidgetDisplayConfig(widget.id, { ...widget.displayConfig, customDsl: dslCode });
        setStatus("synced");
        setErrorMessage(null);
        setTimeout(() => { originRef.current = null; }, 0);
      } catch (e) {
        setStatus("error");
        setErrorMessage(e instanceof Error ? e.message : String(e));
      }
    }, SERIALIZE_DEBOUNCE_MS);

    return () => {
      if (serializeTimer.current) {
        clearTimeout(serializeTimer.current);
        serializeTimer.current = null;
      }
    };
  }, [widget, updateWidgetDisplayConfig, dslType, uiToDsl]);

  // ── DSL → UI ────────────────────────────────────────────────────────────────
  const onDslTextChange = (next: string) => {
    setDslText(next);
    originRef.current = "dsl";
    setStatus("syncing");

    if (parseTimer.current) clearTimeout(parseTimer.current);
    parseTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${RB_BASE}/dsl/${dslType}/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dslCode: next }),
        });
        const data = (await res.json()) as { options?: DslOpts; error?: string };
        if (!res.ok || data.error) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        if (!widget) return;

        const merged = dslToUi((data.options ?? {}) as DslOpts, widget.displayConfig);
        updateWidgetDisplayConfig(widget.id, { ...merged, customDsl: next });
        lastUiSnapshotRef.current = JSON.stringify(uiToDsl(merged));
        setStatus("synced");
        setErrorMessage(null);
        setTimeout(() => { originRef.current = null; }, 0);
      } catch (e) {
        setStatus("error");
        setErrorMessage(e instanceof Error ? e.message : String(e));
      }
    }, PARSE_DEBOUNCE_MS);
  };

  useEffect(() => {
    const incoming = (widget?.displayConfig.customDsl as string) || "";
    if (originRef.current === null && incoming !== dslText) {
      setDslText(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget?.displayConfig.customDsl]);

  return { status, errorMessage, onDslTextChange, dslText };
}
