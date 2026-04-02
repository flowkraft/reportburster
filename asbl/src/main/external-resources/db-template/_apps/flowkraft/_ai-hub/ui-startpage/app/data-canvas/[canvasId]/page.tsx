"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useCanvasHistory } from "@/lib/stores/use-canvas-history";
import { useCanvasShortcuts } from "@/lib/stores/use-canvas-shortcuts";
import { Canvas } from "@/components/data-canvas/Canvas";
import { ComponentPalette } from "@/components/data-canvas/ComponentPalette";
import { ConfigPanel } from "@/components/data-canvas/ConfigPanel";
import { CanvasToolbar } from "@/components/data-canvas/CanvasToolbar";
import { FilterBar } from "@/components/data-canvas/FilterBar";
import { SelectionBar } from "@/components/data-canvas/SelectionBar";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ canvasId: string }>;
}

export default function CanvasEditorPage({ params }: PageProps) {
  const { canvasId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const store = useCanvasStore();
  const history = useCanvasHistory();

  // Keyboard shortcuts: Delete, Escape, Ctrl+Z, Ctrl+Shift+Z
  useCanvasShortcuts({ onUndo: history.undo, onRedo: history.redo });

  // Load canvas from API
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/data-canvas/${canvasId}`);
      if (!res.ok) {
        toast.error("Canvas not found");
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
        editMode: true,
        exploreSelections: [],
        exploreFieldStates: {},
        exploreVersion: 0,
      });
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { id, name, description, connectionId, widgets, filters } = useCanvasStore.getState();
      await fetch(`/api/data-canvas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          connectionId,
          state: JSON.stringify({ widgets, filters }),
        }),
      });
      toast.success("Canvas saved");
    } catch {
      toast.error("Failed to save canvas");
    } finally {
      setSaving(false);
    }
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
        saving={saving}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />
      <FilterBar />
      <SelectionBar />
      <div className="flex flex-1 overflow-hidden">
        {store.editMode && <ComponentPalette />}
        <Canvas />
        {store.editMode && <ConfigPanel canvasId={canvasId} />}
      </div>
    </div>
  );
}
