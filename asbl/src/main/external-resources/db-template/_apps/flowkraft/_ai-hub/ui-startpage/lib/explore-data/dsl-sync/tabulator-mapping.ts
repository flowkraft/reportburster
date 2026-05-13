/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this file holds ONLY the canonical DSL Map type for
 * Tabulator widgets. The Map is stored at displayConfig.dslConfig and is the
 * single source of truth — read by the Display tab UI panel, the DSL editor,
 * and the canvas widget render.
 * ============================================================================
 */

/** Shape of one column entry as the DSL parser / emitter expects it. */
type DslColumn = { field: string; title?: string; visible?: boolean; [k: string]: unknown };

export type TabulatorDslOptions = {
  layout?: string;
  pagination?: boolean;
  paginationSize?: number;
  theme?: string;
  autoColumns?: boolean;
  // Tabulator accepts EITHER an array of column defs OR an object keyed by
  // field name. The Display tab emits the array form; the parser accepts either.
  autoColumnsDefinitions?: DslColumn[] | Record<string, Record<string, unknown>>;
  columns?: DslColumn[];
  [k: string]: unknown;
};
