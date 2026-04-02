"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, LayoutDashboard } from "lucide-react";
import type { Canvas } from "@/lib/db/schema";

export default function DataCanvasListPage() {
  const router = useRouter();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCanvases = async () => {
    const res = await fetch("/api/data-canvas");
    const data = await res.json();
    setCanvases(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCanvases();
  }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/data-canvas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled Canvas" }),
    });
    const canvas = await res.json();
    router.push(`/data-canvas/${canvas.id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/data-canvas/${id}`, { method: "DELETE" });
    setCanvases((prev) => prev.filter((c) => c.id !== id));
  };

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
          <h1 className="text-2xl font-bold text-foreground">Data Canvas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build interactive dashboards visually
          </p>
        </div>
        <button
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
                onClick={() => router.push(`/data-canvas/${canvas.id}`)}
                className="group relative border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-foreground text-sm truncate pr-6">
                    {canvas.name}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(canvas.id, e)}
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
    </div>
  );
}
