import type { TabulatorDslOptions } from "@/lib/explore-data/dsl-sync/tabulator-mapping";
import type { ChartDslOptions } from "@/lib/explore-data/dsl-sync/chart-mapping";
import type { PivotDslOptions } from "@/lib/explore-data/dsl-sync/pivot-mapping";
import type { FilterPaneDslOptions } from "@/lib/explore-data/dsl-sync/filter-pane-mapping";

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: the DSL Map IS the canvas's render input. The Map
 * stored at displayConfig.dslConfig is the ONE canonical configuration for
 * the widget. UI gestures, the DSL editor, and the canvas widget render
 * itself are three views into this same Map.
 * ============================================================================
 */

/** The 5 widget types that use the bidirectional DSL system. */
export type DslWidgetType = "tabulator" | "chart" | "pivot" | "filterpane" | "parameters";

/** Shape of the canonical DSL Map per widget type. The Map stored at
 *  displayConfig.dslConfig has this type for the corresponding widget. */
export interface DslMapByWidgetType {
  tabulator: TabulatorDslOptions;
  chart: ChartDslOptions;
  pivot: PivotDslOptions;
  filterpane: FilterPaneDslOptions;
  parameters: Record<string, unknown>;
}

/** Canonical key on displayConfig that holds the widget's DSL Map. */
export const DSL_CONFIG_KEY = "dslConfig" as const;
