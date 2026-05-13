import { useEffect, useRef } from "react";
import { useCanvasStore } from "./canvas-store";
import { usePublishStatusStore } from "./publish-status-store";

/**
 * Subscribes to the canvas-store's publish-relevant slice and flips the
 * publish-dirty flag on every change — independent from autosave.
 *
 * Enable only once the canvas has finished loading; the first subscription
 * emission after `loadCanvas` is ignored so the initial hydration doesn't
 * falsely mark the canvas dirty-for-publish.
 */
export function usePublishDirty(enabled: boolean): void {
  const lastSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const snapshot = () => {
      const { widgets, parametersConfig, name, connectionId } = useCanvasStore.getState();
      return JSON.stringify({ widgets, parametersConfig, name, connectionId });
    };
    lastSnapshotRef.current = snapshot();

    const unsub = useCanvasStore.subscribe(() => {
      const next = snapshot();
      if (next === lastSnapshotRef.current) return;
      lastSnapshotRef.current = next;
      usePublishStatusStore.getState().markDirty();
    });
    return () => unsub();
  }, [enabled]);
}
