"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useSaveStatusStore, type SaveStatus } from "@/lib/stores/save-status-store";
import { usePublishStatusStore } from "@/lib/stores/publish-status-store";
import { Save, Eye, Pencil, Download, Maximize2, Undo2, Redo2, Loader2, AlertCircle, Check, Circle } from "lucide-react";
import { ExportDialog } from "./export/ExportDialog";

interface CanvasToolbarProps {
  canvasId: string;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

function formatRelative(ms: number): string {
  if (ms < 5_000) return "just now";
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
}

function SaveStatusIndicator() {
  const status = useSaveStatusStore((s) => s.status);
  const lastSavedAt = useSaveStatusStore((s) => s.lastSavedAt);
  const lastError = useSaveStatusStore((s) => s.lastError);

  // Re-render every 15s so "Saved · 2s ago" updates its relative time.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (status !== "saved") return;
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, [status]);

  const render = (icon: React.ReactNode, text: string, extraCls: string, title?: string) => (
    <div className={`flex items-center gap-1.5 text-[11px] ${extraCls}`} title={title}>
      {icon}
      <span>{text}</span>
    </div>
  );

  switch (status as SaveStatus) {
    case "saving":
      return render(<Loader2 className="w-3 h-3 animate-spin" />, "Saving…", "text-muted-foreground");
    case "dirty":
      return render(<Circle className="w-2.5 h-2.5 fill-current" />, "Unsaved changes", "text-amber-600");
    case "saved":
      return render(
        <Check className="w-3 h-3" />,
        lastSavedAt ? `Saved · ${formatRelative(Date.now() - lastSavedAt)}` : "Saved",
        "text-emerald-600",
      );
    case "error":
      return render(
        <AlertCircle className="w-3 h-3" />,
        "Save failed",
        "text-destructive",
        lastError ?? undefined,
      );
    case "idle":
    default:
      return null;
  }
}

export function CanvasToolbar({ canvasId, onSave, onUndo, onRedo, canUndo, canRedo }: CanvasToolbarProps) {
  const { name, setName, editMode, setEditMode } = useCanvasStore();
  const widgetCount = useCanvasStore((s) => s.widgets.length);
  const publishDirty = usePublishStatusStore((s) => s.dirty);
  const saveStatus = useSaveStatusStore((s) => s.status);
  const [editing, setEditing] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const router = useRouter();

  const saving = saveStatus === "saving";

  return (
    <div className="h-12 shrink-0 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4">
      {/* Left: canvas name */}
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            id="txtDashboardName"
            autoFocus
            className="text-sm font-semibold bg-transparent border-b border-primary outline-none text-foreground px-1 py-0.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          />
        ) : (
          <button
            id="btnCanvasName"
            onClick={() => editMode && setEditing(true)}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            {name}
          </button>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Save-state indicator */}
        {editMode && (
          <>
            <SaveStatusIndicator />
            <div className="w-px h-5 bg-border mx-1" />
          </>
        )}

        {/* Undo/Redo (edit mode only) */}
        {editMode && onUndo && onRedo && (
          <>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
          </>
        )}

        {/* Edit/Preview toggle */}
        <button
          id="btnEditPreview"
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            editMode
              ? "text-muted-foreground hover:bg-accent"
              : "text-primary bg-primary/10"
          }`}
        >
          {editMode ? (
            <><Eye className="w-3.5 h-3.5" />Preview</>
          ) : (
            <><Pencil className="w-3.5 h-3.5" />Edit</>
          )}
        </button>

        {/* Full-screen preview */}
        <button
          onClick={() => router.push(`/explore-data/${canvasId}/preview`)}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors"
          title="Full-screen preview"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Publish to DataPallas — enabled only when canvas has widgets
            AND there are unpublished changes since the last publish.
            Independent from autosave (see publish-status-store). */}
        <button
          id="btnPublishDashboard"
          onClick={() => setShowExport(true)}
          disabled={widgetCount === 0 || !publishDirty}
          title={
            widgetCount === 0
              ? "Add at least one widget before publishing"
              : !publishDirty
                ? "No changes to publish"
                : "Publish Dashboard"
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
        >
          <Download className="w-3.5 h-3.5" />
          Publish Dashboard
        </button>
      </div>

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
