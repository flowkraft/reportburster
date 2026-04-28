"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, LayoutDashboard, AlertTriangle, Loader2 } from "lucide-react";
import type { Canvas } from "@/lib/db/schema";
import { listCanvases, createCanvas as apiCreateCanvas, deleteCanvas as apiDeleteCanvas } from "@/lib/explore-data/rb-api";

export default function DataCanvasListPage() {
  const router = useRouter();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Canvas | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCanvases = async () => {
    const data = await listCanvases();
    setCanvases(data as Canvas[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCanvases();
  }, []);

  const handleCreate = async () => {
    const canvas = await apiCreateCanvas("Untitled Canvas");
    router.push(`/explore-data/${canvas.id}`);
  };

  const handleDeleteClick = (canvas: Canvas, e: React.MouseEvent) => {
    e.stopPropagation();
    setToDelete(canvas);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiDeleteCanvas(toDelete.id);
      setCanvases((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!toDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setToDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toDelete, deleting]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 id="explore-data-page-heading" className="text-2xl font-bold text-foreground">Explore Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build interactive dashboards visually
          </p>
        </div>
        <button
          id="btnNewCanvas"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Canvas
        </button>
      </div>

      {canvases.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground mb-1">No canvases yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first canvas to start building a dashboard
          </p>
          <button
            id="btnNewCanvasEmpty"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Canvas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {canvases.map((canvas) => {
            const state = JSON.parse(canvas.state || "{}");
            const widgetCount = state.widgets?.length || 0;
            return (
              <div
                key={canvas.id}
                onClick={() => router.push(`/explore-data/${canvas.id}`)}
                className="group relative border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-foreground text-sm truncate pr-6">
                    {canvas.name}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteClick(canvas, e)}
                    aria-label={`Delete canvas ${canvas.name}`}
                    className="absolute top-4 right-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{widgetCount} component{widgetCount !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{new Date(canvas.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !deleting && setToDelete(null)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-lg w-full max-w-sm mx-4 p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-canvas-title"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="delete-canvas-title" className="text-sm font-semibold text-foreground">
                  Delete canvas?
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{toDelete.name}</span> will be
                  permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="btnConfirmDeleteCanvas"
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                autoFocus
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                {deleting ? "Deleting…" : "Delete canvas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
