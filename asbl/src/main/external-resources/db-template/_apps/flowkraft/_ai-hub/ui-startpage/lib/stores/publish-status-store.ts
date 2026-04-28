/**
 * Tracks whether the canvas has unpublished changes — independent from
 * autosave. Autosave persists to SQLite on every keystroke; publishing to
 * DataPallas is a separate, explicit user action that writes the dashboard
 * files (config + template). The two concerns must not interfere.
 *
 * Flow:
 *   - Canvas loads: dirty = true  if no exportedReportCode (never published)
 *                   dirty = false if exportedReportCode is set (assume the
 *                   currently-persisted state matches the last publish —
 *                   true in practice because autosave is always in sync).
 *   - Any persisted-slice change (widgets / name / filterDsl / connectionId)
 *     → markDirty().
 *   - Publish dialog reports success → markClean().
 */
import { create } from "zustand";

interface PublishStatusState {
  dirty: boolean;
  markDirty: () => void;
  markClean: () => void;
  /** Called by the canvas-load effect with whether the canvas has ever been
   *  published. Resets internal state at load time. */
  reset: (hasBeenPublished: boolean) => void;
}

export const usePublishStatusStore = create<PublishStatusState>((set) => ({
  dirty: true,
  markDirty: () => set((s) => (s.dirty ? s : { dirty: true })),
  markClean: () => set((s) => (s.dirty ? { dirty: false } : s)),
  reset: (hasBeenPublished) => set({ dirty: !hasBeenPublished }),
}));
