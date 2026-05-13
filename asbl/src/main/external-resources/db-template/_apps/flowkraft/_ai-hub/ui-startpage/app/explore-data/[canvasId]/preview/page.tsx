"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore, type ParametersConfig } from "@/lib/stores/canvas-store";
import { fetchCanvas } from "@/lib/explore-data/rb-api";
import { Canvas } from "@/components/explore-data/Canvas";
import { FilterBar } from "@/components/explore-data/FilterBar";
import { SelectionBar } from "@/components/explore-data/SelectionBar";
import { X } from "lucide-react";

interface PageProps {
  params: Promise<{ canvasId: string }>;
}

export default function CanvasPreviewPage({ params }: PageProps) {
  const { canvasId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const store = useCanvasStore();

  useEffect(() => {
    const load = async () => {
      let canvas: Record<string, unknown>;
      try {
        canvas = await fetchCanvas(canvasId) as Record<string, unknown>;
      } catch {
        router.push("/explore-data");
        return;
      }
      const state = JSON.parse((canvas.state as string) || "{}");

      store.loadCanvas({
        id: canvas.id as string,
        name: canvas.name as string,
        description: (canvas.description as string) || "",
        connectionId: (canvas.connectionId as string) || null,
        widgets: state.widgets || [],
        parametersConfig: (state.parametersConfig as ParametersConfig | undefined) ?? { parameters: [] },
        filterValues: {},
        filterVersion: 0,
        selectedWidgetId: null,
        editMode: false,
        exportedReportCode: (canvas.exportedReportCode as string) || null,
        exploreSelections: [],
        exploreFieldStates: {},
        exploreVersion: 0,
      });
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground text-sm">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Minimal header */}
      <div className="h-10 shrink-0 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4">
        <span className="text-sm font-semibold text-foreground">{store.name}</span>
        <button
          onClick={() => router.push(`/explore-data/${canvasId}`)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Close Preview
        </button>
      </div>

      {/* Filters + explore selections */}
      <FilterBar />
      <SelectionBar />

      {/* Canvas — full width, no palette or config panel */}
      <Canvas />
    </div>
  );
}
