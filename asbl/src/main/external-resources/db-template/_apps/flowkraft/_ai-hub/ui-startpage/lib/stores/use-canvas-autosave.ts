import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCanvasStore } from "./canvas-store";
import { useSaveStatusStore } from "./save-status-store";
import { updateCanvas } from "@/lib/explore-data/rb-api";

const AUTOSAVE_DEBOUNCE_MS = 1200;

type Persisted = {
  name: string;
  description: string;
  connectionId: string | null;
  widgets: unknown;
  filterDsl: string;
};

function snapshotPersisted(): Persisted {
  const { name, description, connectionId, widgets, filterDsl } = useCanvasStore.getState();
  return { name, description, connectionId, widgets, filterDsl };
}

async function pushToServer(canvasId: string): Promise<void> {
  const { name, description, connectionId, widgets, filterDsl } = useCanvasStore.getState();
  await updateCanvas(canvasId, {
    name,
    description,
    connectionId,
    state: JSON.stringify({ widgets, filterDsl }),
  });
}

/**
 * Debounced autosave. Subscribes to the persisted slice of the canvas store;
 * whenever it changes, marks dirty and schedules a save. The first subscription
 * emission after `loadCanvas` is ignored so we don't save right after loading.
 *
 * Returns `flushSave` — call it to cancel the debounce and persist now
 * (used by Ctrl/Cmd+S and the manual Save button).
 */
export function useCanvasAutosave(canvasId: string, enabled: boolean): { flushSave: () => Promise<void> } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotRef = useRef<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const pendingAfterFlightRef = useRef<boolean>(false);

  const doSave = async () => {
    // If a save is already in flight, mark that another save is needed once it finishes.
    if (inFlightRef.current) {
      pendingAfterFlightRef.current = true;
      return;
    }

    const { markSaving, markSaved, markError, hasShownFirstSavedToast, markFirstSavedToastShown } =
      useSaveStatusStore.getState();

    markSaving();
    const req = (async () => {
      try {
        await pushToServer(canvasId);
        lastSnapshotRef.current = JSON.stringify(snapshotPersisted());
        markSaved();
        if (!hasShownFirstSavedToast) {
          toast.success("Canvas saved");
          markFirstSavedToastShown();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        markError(msg);
        toast.error(`Failed to save canvas: ${msg}`);
      }
    })();
    inFlightRef.current = req;
    try {
      await req;
    } finally {
      inFlightRef.current = null;
      if (pendingAfterFlightRef.current) {
        pendingAfterFlightRef.current = false;
        // Another change landed while we were saving — persist the newest state.
        void doSave();
      }
    }
  };

  const flushSave = async (): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await doSave();
  };

  useEffect(() => {
    if (!enabled) return;

    // Capture initial snapshot — subscription won't fire for existing state,
    // but this guards against marking dirty on the first real change when
    // it's identical to the loaded state (e.g. spurious re-emission).
    lastSnapshotRef.current = JSON.stringify(snapshotPersisted());

    const unsub = useCanvasStore.subscribe(() => {
      // Diff via serialized snapshot of the persisted slice only — robust
      // across zustand versions and ignores ephemeral fields like selection,
      // filterVersion, and explore state.
      const nextSnap = JSON.stringify(snapshotPersisted());
      if (nextSnap === lastSnapshotRef.current) return;
      lastSnapshotRef.current = nextSnap;

      useSaveStatusStore.getState().markDirty();

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        void doSave();
      }, AUTOSAVE_DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId, enabled]);

  return { flushSave };
}
