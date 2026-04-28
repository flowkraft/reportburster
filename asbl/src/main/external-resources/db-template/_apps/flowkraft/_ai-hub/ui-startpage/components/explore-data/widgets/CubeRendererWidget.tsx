"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { fetchCube, parseCubeDsl } from "@/lib/explore-data/rb-api";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2 } from "lucide-react";
import { suggestRenderModeForCube } from "@/lib/explore-data/smart-defaults";

interface CubeRendererWidgetProps {
  widgetId: string;
}

/**
 * Widget renderer that mounts <rb-cube-renderer> from the rb-webcomponents
 * Svelte bundle. Used by ANY widget type (chart / data table / pivot / value
 * card) when its dataSource has visualQuery.kind === "cube".
 *
 * The bundle is loaded globally by RbWebComponentsLoader in app/layout.tsx.
 */
export function CubeRendererWidget({ widgetId }: CubeRendererWidgetProps) {
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const changeWidgetRenderMode = useCanvasStore((s) => s.changeWidgetRenderMode);

  const cubeId = widget?.dataSource?.visualQuery?.cubeId || "";
  const currentType = widget?.type;

  const ref = useRef<HTMLElement>(null);
  const [cubeConfig, setCubeConfig] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ready = useRbElementReady("rb-cube-renderer");

  // Load the cube DSL and parse it into the structured CubeOptions object
  // that <rb-cube-renderer cubeConfig={...} /> expects (mirrors the Angular
  // pattern in tab-cube-definitions.ts: parseDsl(dslCode) → cubeConfig).
  useEffect(() => {
    if (!cubeId) {
      setCubeConfig(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const cube = await fetchCube(cubeId);
        const parsed = await parseCubeDsl(cube.dslCode);
        if (cancelled) return;
        setCubeConfig(parsed);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load cube");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cubeId]);

  // Push complex props (objects) into the custom element via direct property
  // assignment — same pattern as next-playground does for refs.
  useEffect(() => {
    if (!ready || !ref.current || !cubeConfig) return;
    const el = ref.current as HTMLElement & {
      cubeConfig?: unknown;
      connectionId?: string;
      apiBaseUrl?: string;
      apiKey?: string;
    };
    const rbConfig = (typeof window !== "undefined"
      ? (window as unknown as { rbConfig?: { apiBaseUrl: string; apiKey: string } }).rbConfig
      : undefined);
    el.cubeConfig = cubeConfig;
    el.connectionId = connectionId || "";
    el.apiBaseUrl = rbConfig?.apiBaseUrl || "";
    el.apiKey = rbConfig?.apiKey || "";
  }, [ready, cubeConfig, connectionId]);

  // Listen for cube selection changes → auto-pick the best render mode for
  // the current shape (0 dims → Number, 1 dim → chart, 2+ dims → pivot).
  useEffect(() => {
    if (!ready || !ref.current || !widgetId) return;
    const el = ref.current;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        selectedDimensions?: string[];
        selectedMeasures?: string[];
      };
      const dims = detail?.selectedDimensions ?? [];
      const measures = detail?.selectedMeasures ?? [];
      if (dims.length === 0 && measures.length === 0) return; // nothing picked yet
      const suggested = suggestRenderModeForCube(dims, measures);
      // Only change when the current type differs AND the user hasn't been
      // working inside an already-matching mode (avoid bouncing between modes
      // if the user toggles selections quickly).
      if (suggested && suggested !== currentType) {
        changeWidgetRenderMode(widgetId, suggested);
      }
    };
    el.addEventListener("selectionChanged", handler);
    return () => el.removeEventListener("selectionChanged", handler);
  }, [ready, widgetId, currentType, changeWidgetRenderMode]);

  if (!cubeId) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Pick a cube in the Data tab
      </div>
    );
  }
  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-xs text-destructive p-2 overflow-hidden">Query error: {error.split('\n')[0].slice(0, 200)}</div>;
  if (!ready) return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading components...</div>;

  // @ts-expect-error - Web component custom element
  return <rb-cube-renderer ref={ref} style={{ display: "block", width: "100%", height: "100%", overflow: "auto" }} />;
}
