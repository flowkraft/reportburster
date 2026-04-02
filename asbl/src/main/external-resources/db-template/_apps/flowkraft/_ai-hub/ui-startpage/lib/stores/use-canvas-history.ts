import { useRef, useCallback, useEffect } from "react";
import { useCanvasStore, type CanvasState } from "./canvas-store";

const MAX_HISTORY = 50;

type Snapshot = Pick<CanvasState, "widgets" | "filters" | "connectionId">;

function takeSnapshot(): Snapshot {
  const { widgets, filters, connectionId } = useCanvasStore.getState();
  return JSON.parse(JSON.stringify({ widgets, filters, connectionId }));
}

function applySnapshot(snap: Snapshot) {
  useCanvasStore.setState({ widgets: snap.widgets, filters: snap.filters, connectionId: snap.connectionId });
}

export function useCanvasHistory() {
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const skipRef = useRef(false); // skip recording when applying undo/redo
  const lastSnapshotRef = useRef<string>("");

  // Auto-record: subscribe to Zustand and push snapshot when widgets/filters change
  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state) => {
      if (skipRef.current) return;

      // Only snapshot when widgets or filters change (not on every state update)
      const key = JSON.stringify({ w: state.widgets, f: state.filters, c: state.connectionId });
      if (key === lastSnapshotRef.current) return;

      // Push previous state to history before it changes
      if (lastSnapshotRef.current) {
        const prev = JSON.parse(lastSnapshotRef.current);
        pastRef.current.push({ widgets: prev.w, filters: prev.f, connectionId: prev.c });
        if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
        futureRef.current = []; // clear redo on new change
      }

      lastSnapshotRef.current = key;
    });

    // Initialize with current state
    const { widgets, filters, connectionId } = useCanvasStore.getState();
    lastSnapshotRef.current = JSON.stringify({ w: widgets, f: filters, c: connectionId });

    return unsub;
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    skipRef.current = true;
    futureRef.current.push(takeSnapshot());
    const prev = pastRef.current.pop()!;
    applySnapshot(prev);
    lastSnapshotRef.current = JSON.stringify({ w: prev.widgets, f: prev.filters, c: prev.connectionId });
    skipRef.current = false;
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    skipRef.current = true;
    pastRef.current.push(takeSnapshot());
    const next = futureRef.current.pop()!;
    applySnapshot(next);
    lastSnapshotRef.current = JSON.stringify({ w: next.widgets, f: next.filters, c: next.connectionId });
    skipRef.current = false;
  }, []);

  return {
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
