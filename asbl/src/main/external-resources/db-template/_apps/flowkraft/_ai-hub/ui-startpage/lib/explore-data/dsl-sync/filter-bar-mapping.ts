import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";

/**
 * Filter-bar DSL mapping stubs.
 *
 * The filter bar is a canvas-level component: its DSL is stored in
 * `CanvasState.filterDsl` (not in a widget's `displayConfig.customDsl`).
 * `FilterBarConfigPanel` manages bidirectional sync directly against the
 * canvas store — it does NOT go through `useDslSync` / `BidirectionalDslCustomizer`.
 *
 * These stubs satisfy the `Mapping` type contract in `BidirectionalDslCustomizer`
 * so that `"filter-bar"` can be registered in `DSL_TYPE_PATH` + `MAPPINGS`
 * as the canonical reference for the backend endpoint discriminator
 * (`"reportparameters"`). They are intentionally no-ops.
 */

export function uiToFilterBarDsl(_dc: WidgetDisplayConfig): Record<string, unknown> {
  // Canvas-level: no displayConfig fields to project into DSL options.
  return {};
}

export function filterBarDslToUi(
  _opts: Record<string, unknown>,
  dc: WidgetDisplayConfig,
): WidgetDisplayConfig {
  // Canvas-level: nothing to merge back into displayConfig.
  return dc;
}
