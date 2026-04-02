"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { Canvas } from "@/components/data-canvas/Canvas";
import { FilterBar } from "@/components/data-canvas/FilterBar";
import { SelectionBar } from "@/components/data-canvas/SelectionBar";
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
      const res = await fetch(`/api/data-canvas/${canvasId}`);
      if (!res.ok) {
        router.push("/data-canvas");
        return;
      }
      const canvas = await res.json();
      const state = JSON.parse(canvas.state || "{}");

      store.loadCanvas({
        id: canvas.id,
        name: canvas.name,
        description: canvas.description || "",
        connectionId: canvas.connectionId,
        widgets: state.widgets || [],
        filters: state.filters || [],
        filterValues: {},
        filterVersion: 0,
        selectedWidgetId: null,
        editMode: false,
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
          onClick={() => router.push(`/data-canvas/${canvasId}`)}
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
