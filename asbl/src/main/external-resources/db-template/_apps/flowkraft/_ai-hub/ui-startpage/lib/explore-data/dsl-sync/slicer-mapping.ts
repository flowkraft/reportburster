/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this file holds ONLY the canonical DSL Map type for
 * Slicer widgets. The Map is stored at displayConfig.dslConfig and is the
 * single source of truth — read by the Display tab UI panel, the DSL editor,
 * and the canvas widget render.
 * ============================================================================
 */

export type SlicerDslOptions = {
  field?: string;
  label?: string;
  sort?: string;
  maxValues?: number;
  showSearch?: boolean;
  showCount?: boolean;
  /** 'multiselect' (the default) or 'select' - a parameter's `ui(control: ...)` word. */
  control?: "multiselect" | "select";
  height?: string;
  /** Pre-picked values on load - a parameter's word for the same idea. */
  defaultValue?: string[];
  [k: string]: unknown;
};
