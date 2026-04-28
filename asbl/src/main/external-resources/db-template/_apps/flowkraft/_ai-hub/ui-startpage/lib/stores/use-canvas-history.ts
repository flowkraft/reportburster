import { useRef, useCallback, useEffect } from "react";
import { useCanvasStore, type CanvasState } from "./canvas-store";

const MAX_HISTORY = 50;

type Snapshot = Pick<CanvasState, "widgets" | "filterDsl" | "connectionId">;

function takeSnapshot(): Snapshot {
  const { widgets, filterDsl, connectionId } = useCanvasStore.getState();
  return JSON.parse(JSON.stringify({ widgets, filterDsl, connectionId }));
}

function applySnapshot(snap: Snapshot) {
  useCanvasStore.setState({ widgets: snap.widgets, filterDsl: snap.filterDsl, connectionId: snap.connectionId });
}

export function useCanvasHistory() {
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const skipRef = useRef(false); // skip recording when applying undo/redo
  const lastSnapshotRef = useRef<string>("");

  // Auto-record: subscribe to Zustand and push snapshot when widgets/filterDsl change
  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state) => {
      if (skipRef.current) return;

      // Only snapshot when widgets, filterDsl, or connectionId change
      const key = JSON.stringify({ w: state.widgets, f: state.filterDsl, c: state.connectionId });
      if (key === lastSnapshotRef.current) return;

      // Push previous state to history before it changes
      if (lastSnapshotRef.current) {
        const prev = JSON.parse(lastSnapshotRef.current);
        pastRef.current.push({ widgets: prev.w, filterDsl: prev.f, connectionId: prev.c });
        if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
        futureRef.current = []; // clear redo on new change
      }

      lastSnapshotRef.current = key;
    });

    // Initialize with current state
    const { widgets, filterDsl, connectionId } = useCanvasStore.getState();
    lastSnapshotRef.current = JSON.stringify({ w: widgets, f: filterDsl, c: connectionId });

    return unsub;
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    skipRef.current = true;
    futureRef.current.push(takeSnapshot());
    const prev = pastRef.current.pop()!;
    applySnapshot(prev);
    lastSnapshotRef.current = JSON.stringify({ w: prev.widgets, f: prev.filterDsl, c: prev.connectionId });
    skipRef.current = false;
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    skipRef.current = true;
    pastRef.current.push(takeSnapshot());
    const next = futureRef.current.pop()!;
    applySnapshot(next);
    lastSnapshotRef.current = JSON.stringify({ w: next.widgets, f: next.filterDsl, c: next.connectionId });
    skipRef.current = false;
  }, []);

  return {
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
