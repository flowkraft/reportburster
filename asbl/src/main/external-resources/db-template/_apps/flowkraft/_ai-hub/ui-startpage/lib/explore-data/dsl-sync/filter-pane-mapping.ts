/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this file holds ONLY the canonical DSL Map type for
 * FilterPane widgets. The Map is stored at displayConfig.dslConfig and is the
 * single source of truth — read by the Display tab UI panel, the DSL editor,
 * and the canvas widget render.
 * ============================================================================
 */

export type FilterPaneDslOptions = {
  field?: string;
  label?: string;
  sort?: string;
  maxValues?: number;
  showSearch?: boolean;
  showCount?: boolean;
  multiSelect?: boolean;
  height?: string;
  defaultSelected?: string[];
  [k: string]: unknown;
};
