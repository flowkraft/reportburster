"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { Save, Eye, Pencil, Download, Maximize2, Undo2, Redo2 } from "lucide-react";
import { ExportDialog } from "./export/ExportDialog";

interface CanvasToolbarProps {
  canvasId: string;
  onSave: () => void;
  saving: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function CanvasToolbar({ canvasId, onSave, saving, onUndo, onRedo, canUndo, canRedo }: CanvasToolbarProps) {
  const { name, setName, editMode, setEditMode } = useCanvasStore();
  const [editing, setEditing] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const router = useRouter();

  return (
    <div className="h-12 shrink-0 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4">
      {/* Left: canvas name */}
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            className="text-sm font-semibold bg-transparent border-b border-primary outline-none text-foreground px-1 py-0.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }}
          />
        ) : (
          <button
            onClick={() => editMode && setEditing(true)}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            {name}
          </button>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
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
          onClick={() => router.push(`/data-canvas/${canvasId}/preview`)}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors"
          title="Full-screen preview"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save"}
        </button>

        {/* Export to ReportBurster */}
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Save to ReportBurster
        </button>
      </div>

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
