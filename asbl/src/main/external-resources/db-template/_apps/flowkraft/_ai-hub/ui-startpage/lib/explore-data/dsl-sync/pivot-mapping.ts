/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this file holds ONLY the canonical DSL Map type for
 * Pivot widgets. The Map is stored at displayConfig.dslConfig and is the
 * single source of truth — read by the Display tab UI panel, the DSL editor,
 * and the canvas widget render.
 * ============================================================================
 */

export type PivotDslOptions = {
  rows?: string[];
  cols?: string[];
  vals?: string[];
  aggregatorName?: string;
  rendererName?: string;
  rowOrder?: string;
  colOrder?: string;
  rowTotals?: boolean;
  colTotals?: boolean;
  [k: string]: unknown;
};
