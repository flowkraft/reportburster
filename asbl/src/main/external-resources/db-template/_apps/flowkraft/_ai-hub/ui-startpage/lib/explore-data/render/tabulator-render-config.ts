import type { TabulatorDslOptions } from "@/lib/explore-data/dsl-sync/tabulator-mapping";

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this is THE function that turns the DSL Map into
 * the config the <rb-tabulator> web component consumes. Both canvas (directly)
 * and the published page (after DSL→parse round-trip) call this with the
 * SAME Map shape — so they cannot diverge.
 * ============================================================================
 */

/** What gets pushed to <rb-tabulator>. */
export interface TabulatorRenderConfig {
  data: Record<string, unknown>[];
  options: Record<string, unknown>;
  /** Only set when the Map has explicit `columns` array (user wrote DSL with
   *  a complete column list). For visibility-only configs, autoColumns +
   *  autoColumnsDefinitions live in `options` and Tabulator auto-detects. */
  columns?: Record<string, unknown>[];
}

/**
 * Translate the canonical DSL Map into <rb-tabulator>'s consumed shape.
 *
 * Tabulator 6.4 native config keys pass through verbatim — `layout`,
 * `pagination`, `paginationSize`, `theme`, `autoColumns`, `autoColumnsDefinitions`,
 * and any user-written extras (the methodMissing parser captures them).
 *
 * Per Principle 4 (DSLPrinciplesReadme), this function is called by:
 *   • The canvas widget — on the Map produced by useDslConfig
 *   • The publisher — on the Map produced by parsing the published DSL text
 * Same Map → same config. Drift impossible.
 */
export function mapToTabulatorRenderConfig(
  map: TabulatorDslOptions | undefined,
  data: Record<string, unknown>[],
): TabulatorRenderConfig {
  const safe = map ?? {};

  // Top-level options: everything except `columns` and `autoColumnsDefinitions`
  // becomes a Tabulator option. autoColumnsDefinitions also goes to options
  // (Tabulator reads it from the options object).
  const options: Record<string, unknown> = {};
  const skipKeys = new Set(["columns"]);
  for (const [key, value] of Object.entries(safe)) {
    if (skipKeys.has(key)) continue;
    if (value === undefined) continue;
    options[key] = value;
  }

  // Sensible defaults (overridden by anything in the Map):
  if (options.layout === undefined) options.layout = "fitColumns";

  // If the user (or `uiToTabulatorDsl` post-fix) has set autoColumns:true with
  // optional autoColumnsDefinitions, that's enough — Tabulator auto-generates
  // columns from data and applies per-field overrides. No explicit `columns`
  // array needed.
  //
  // If the user wrote DSL with an explicit `columns: [...]` array, pass it
  // through as-is. Tabulator will show only those columns.
  const result: TabulatorRenderConfig = { data, options };
  if (Array.isArray(safe.columns) && safe.columns.length > 0) {
    result.columns = safe.columns as Record<string, unknown>[];
  }
  return result;
}
