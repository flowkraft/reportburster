"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useSaveStatusStore } from "@/lib/stores/save-status-store";
import { usePublishStatusStore } from "@/lib/stores/publish-status-store";
import { usePublishDirty } from "@/lib/stores/use-publish-dirty";
import { fetchCanvas } from "@/lib/explore-data/rb-api";
import { useCanvasAutosave } from "@/lib/stores/use-canvas-autosave";
import { useCanvasHistory } from "@/lib/stores/use-canvas-history";
import { useCanvasShortcuts } from "@/lib/stores/use-canvas-shortcuts";
import { Canvas } from "@/components/explore-data/Canvas";
import { SchemaBrowser } from "@/components/explore-data/SchemaBrowser";
import { ConfigPanel } from "@/components/explore-data/ConfigPanel";
import { CanvasToolbar } from "@/components/explore-data/CanvasToolbar";
import { FilterBar } from "@/components/explore-data/FilterBar";
import { SelectionBar } from "@/components/explore-data/SelectionBar";
import { toast } from "sonner";

const RB_BASE = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:9090/api";

/**
 * Parse the canvas filterDsl via the backend and return a {paramId: defaultValue}
 * map for params whose defaultValue is a non-empty string. Used to pre-seed the
 * canvas store's filterValues BEFORE any widget mounts — prevents Visual-mode
 * preview queries from firing with empty params against SQL containing ${param}.
 * Failures (bad DSL, network) are swallowed and yield an empty map — the
 * existing FilterBar async seed is still a backstop.
 */
async function seedFilterValuesFromDsl(filterDsl: string): Promise<Record<string, string>> {
  if (!filterDsl?.trim()) return {};
  try {
    const res = await fetch(`${RB_BASE}/dsl/reportparameters/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dslCode: filterDsl }),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { parameters?: Array<{ id: string; defaultValue?: unknown }> };
    const out: Record<string, string> = {};
    for (const p of data.parameters ?? []) {
      if (p.defaultValue != null && String(p.defaultValue) !== "") out[p.id] = String(p.defaultValue);
    }
    return out;
  } catch {
    return {};
  }
}

interface PageProps {
  params: Promise<{ canvasId: string }>;
}

export default function CanvasEditorPage({ params }: PageProps) {
  const { canvasId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const store = useCanvasStore();
  const history = useCanvasHistory();

  // Sidebar collapse state
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  // Track if the user manually closed the right panel — if so, don't auto-reopen.
  const rightManualClose = useRef(false);

  // Auto-show right panel when a widget is selected; auto-hide when deselected.
  const selectedWidgetId = store.selectedWidgetId;
  useEffect(() => {
    if (selectedWidgetId) {
      rightManualClose.current = false;
      setRightOpen(true);
    } else {
      setRightOpen(false);
    }
  }, [selectedWidgetId]);

  useCanvasShortcuts({ onUndo: history.undo, onRedo: history.redo });

  const { flushSave } = useCanvasAutosave(canvasId, !loading);
  usePublishDirty(!loading);

  useEffect(() => {
    const load = async () => {
      useSaveStatusStore.getState().reset();
      usePublishStatusStore.getState().reset(false);
      let canvas: Record<string, unknown>;
      try {
        canvas = await fetchCanvas(canvasId) as Record<string, unknown>;
      } catch {
        toast.error("Canvas not found");
        router.push("/explore-data");
        return;
      }
      const state = JSON.parse((canvas.state as string) || "{}");
      const filterDsl: string = state.filterDsl || "";
      // Pre-seed filterValues from param defaults so Visual-mode widgets bound
      // to ${param} never race against the FilterBar's async DSL parse. Without
      // this, a widget can fire its preview query with filterValues={} BEFORE
      // FilterBar's 300ms-debounced parse completes, sending literal ${param}
      // to the backend and erroring out.
      const seededFilterValues = await seedFilterValuesFromDsl(filterDsl);
      store.loadCanvas({
        id: canvas.id as string,
        name: canvas.name as string,
        description: (canvas.description as string) || "",
        connectionId: (canvas.connectionId as string) || null,
        widgets: state.widgets || [],
        filterDsl,
        filterValues: seededFilterValues,
        filterVersion: 0,
        selectedWidgetId: null,
        editMode: true,
        exportedReportCode: (canvas.exportedReportCode as string) || null,
        exploreSelections: [],
        exploreFieldStates: {},
        exploreVersion: 0,
      });
      usePublishStatusStore.getState().reset(!!canvas.exportedReportCode);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId]);

  const handleSave = useCallback(() => { void flushSave(); }, [flushSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flushSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flushSave]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const s = useSaveStatusStore.getState().status;
      if (s === "dirty" || s === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-muted-foreground text-sm">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <CanvasToolbar
        canvasId={canvasId}
        onSave={handleSave}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />
      <FilterBar />
      <SelectionBar />
      <div className="flex flex-1 overflow-hidden">
        {store.editMode && (
          leftOpen ? (
            <SchemaBrowser onCollapse={() => setLeftOpen(false)} />
          ) : (
            <button
              id="btnExpandLeftPanel"
              onClick={() => setLeftOpen(true)}
              className="w-6 shrink-0 border-r border-border bg-muted/30 flex items-center justify-center hover:bg-accent transition-colors"
              title="Show sidebar"
            >
              <ChevronRight className="w-5 h-5 text-foreground font-bold" />
            </button>
          )
        )}
        <Canvas />
        {store.editMode && (
          rightOpen ? (
            <ConfigPanel
              onCollapse={() => { rightManualClose.current = true; setRightOpen(false); }}
            />
          ) : (
            <button
              id="btnExpandRightPanel"
              onClick={() => { rightManualClose.current = false; setRightOpen(true); }}
              className="w-6 shrink-0 border-l border-border bg-muted/30 flex items-center justify-center hover:bg-accent transition-colors"
              title="Show config panel"
            >
              <ChevronLeft className="w-5 h-5 text-foreground font-bold" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
