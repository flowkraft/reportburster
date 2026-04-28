import { create } from "zustand";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface SaveStatusState {
  status: SaveStatus;
  lastSavedAt: number | null;
  lastError: string | null;
  hasShownFirstSavedToast: boolean;

  markDirty: () => void;
  markSaving: () => void;
  markSaved: () => void;
  markError: (msg: string) => void;
  reset: () => void;
  markFirstSavedToastShown: () => void;
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: "idle",
  lastSavedAt: null,
  lastError: null,
  hasShownFirstSavedToast: false,

  markDirty: () =>
    set((s) => (s.status === "saving" ? s : { ...s, status: "dirty", lastError: null })),
  markSaving: () => set({ status: "saving", lastError: null }),
  markSaved: () => set({ status: "saved", lastSavedAt: Date.now(), lastError: null }),
  markError: (msg) => set({ status: "error", lastError: msg }),
  reset: () =>
    set({ status: "idle", lastSavedAt: null, lastError: null, hasShownFirstSavedToast: false }),
  markFirstSavedToastShown: () => set({ hasShownFirstSavedToast: true }),
}));
