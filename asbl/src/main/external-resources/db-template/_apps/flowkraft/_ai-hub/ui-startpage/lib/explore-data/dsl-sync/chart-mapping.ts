/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this file holds ONLY the canonical DSL Map type for
 * Chart widgets. The Map is stored at displayConfig.dslConfig and is the
 * single source of truth — read by the Display tab UI panel, the DSL editor,
 * and the canvas widget render.
 * ============================================================================
 */

/** Chart's `data` block — Chart.js-aligned wrapper for axis/series fields. */
export type ChartDataBlock = {
  labelField?: string;
  /** Series breakout column — chart runtime pivots reportData by this field. */
  seriesField?: string;
  datasets?: { field: string; label?: string }[];
};

export type ChartDslOptions = {
  type?: string;
  data?: ChartDataBlock;
  options?: Record<string, unknown>;
  palette?: string;
  bubbleSizeField?: string;
  [k: string]: unknown;
};
