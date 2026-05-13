// Per-widget "we've already executed this version" tracker — module-level so it
// survives component remounts (the renderer auto-switch unmounts e.g.
// TabulatorWidget and mounts MapWidget; both call useWidgetData(widgetId), and
// the second call must dedup against the first to avoid a redundant fetch).
//
// The map is cleared on canvas load (`loadCanvas` in canvas-store.ts). Without
// that reset, navigating away from a canvas and back to it leaves stale entries
// keyed by the same widgetIds — the first effect run after remount matches the
// stale snapshot and SKIPs the fetch, leaving widgets blank until a hard
// refresh clears module state.

export interface LastExec {
  mode: string;
  executeVersion?: number;
  scriptVersion?: number;
  sql?: string;           // visual mode — built-once SQL signature
  filterSnapshot?: string; // JSON of filter values at last execution
}

export const LAST_EXEC: Map<string, LastExec> = new Map();

export function clearWidgetExecCache(): void {
  LAST_EXEC.clear();
}
