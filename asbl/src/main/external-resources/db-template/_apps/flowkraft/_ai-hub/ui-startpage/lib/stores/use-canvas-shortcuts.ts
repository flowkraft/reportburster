import { useEffect } from "react";
import { useCanvasStore } from "./canvas-store";

interface ShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
}

export function useCanvasShortcuts({ onUndo, onRedo }: ShortcutHandlers) {
  const { editMode, selectedWidgetId, removeWidget, selectWidget } = useCanvasStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Delete — remove selected widget
      if ((e.key === "Delete" || e.key === "Backspace") && editMode && selectedWidgetId) {
        e.preventDefault();
        removeWidget(selectedWidgetId);
      }

      // Escape — deselect widget
      if (e.key === "Escape" && selectedWidgetId) {
        e.preventDefault();
        selectWidget(null);
      }

      // Ctrl+Z — undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }

      // Ctrl+Shift+Z — redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, selectedWidgetId, removeWidget, selectWidget, onUndo, onRedo]);
}
