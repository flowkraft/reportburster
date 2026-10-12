"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";

/** Minutes typed into the box: a whole number from 1 up, or nothing (never). */
export function autoRefreshMinutesOf(text: string): number | undefined | null {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  if (!/^\d+$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  return minutes >= 1 ? minutes : null;
}

/**
 * The settings that are the whole dashboard's, not one widget's (`DashboardSettings`): one dialog
 * for them, opened from the toolbar, so a setting of the page never has to find a home on a widget.
 * Each change is stored at once, as every other edit on the canvas is, and published with the rest.
 */
export function DashboardSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dashboardSettings = useCanvasStore((s) => s.dashboardSettings);
  const setDashboardSettings = useCanvasStore((s) => s.setDashboardSettings);
  const [minutes, setMinutes] = useState("");

  useEffect(() => {
    if (open) setMinutes(dashboardSettings.autoRefreshMinutes ? String(dashboardSettings.autoRefreshMinutes) : "");
    // Only when the dialog opens: what is typed afterwards is the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const parsed = autoRefreshMinutesOf(minutes);
  const typeMinutes = (text: string) => {
    setMinutes(text);
    const next = autoRefreshMinutesOf(text);
    if (next === null) return;
    const others = { ...dashboardSettings };
    delete others.autoRefreshMinutes;
    setDashboardSettings(next === undefined ? others : { ...others, autoRefreshMinutes: next });
  };

  return (
    <div
      id="overlayDashboardSettings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="dashboardSettings"
        className="bg-base-100 border border-base-300 rounded-xl shadow-lg w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-sm font-semibold text-base-content">Dashboard settings</h2>

        <label htmlFor="inputAutoRefresh" className="block text-xs font-medium text-base-content mt-4">
          Refresh the data every
        </label>
        <div className="flex items-center gap-2 mt-1">
          <input
            id="inputAutoRefresh"
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => typeMinutes(e.target.value)}
            placeholder="never"
            className="w-20 px-2 py-1 text-xs rounded-md border border-base-300 bg-base-100 text-base-content"
          />
          <span className="text-xs text-base-content/60">minutes</span>
        </div>
        {parsed === null ? (
          <p id="autoRefreshError" className="text-xs text-error mt-1">A whole number of minutes, 1 or more.</p>
        ) : (
          <p id="autoRefreshHint" className="text-xs text-base-content/60 mt-1">
            {parsed === undefined
              ? "The published dashboard shows its data as it was when it was opened."
              : `The published dashboard asks for its data again every ${parsed} minute${parsed === 1 ? "" : "s"}.`}
          </p>
        )}

        <div className="flex items-center justify-end mt-4">
          <button
            id="btnCloseDashboardSettings"
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-base-300 text-base-content hover:bg-base-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
