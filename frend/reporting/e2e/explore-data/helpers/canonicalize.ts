// Canonicalize a reference-system widget/subtype list into RB widget families.
//
// The reference BI system exposes individual chart subtypes (bar, line, pie, …)
// while RB groups them under a single "chart" widget with an in-panel subtype
// picker. This function folds each reference name into its RB family, deduplicates
// (preserving first-seen order), and returns the result.
//
// Usage in parity assertions:
//   const rbFamilies  = [...palette.recommended].sort();
//   const refFamilies = canonicalize(REFERENCE_SHAPE_DATE_MEASURE_1DIM).sort();
//   expect(rbFamilies).toEqual(refFamilies);
//
// For shapes with documented intentional divergences, call canonicalize() to
// record the reference output and assert the divergence explicitly.

const REFERENCE_TO_FAMILY: Record<string, string> = {
  // All cartesian / polar chart subtypes fold into "chart"
  bar:        "chart",
  row:        "chart",
  line:       "chart",
  area:       "chart",
  combo:      "chart",
  pie:        "chart",
  doughnut:   "chart",
  funnel:     "chart",
  scatter:    "chart",
  bubble:     "chart",
  waterfall:  "chart",
  boxplot:    "chart",
  heatmap:    "chart",
  // Reference table widget maps to our tabulator
  table:      "tabulator",
  // Reference object/row-detail widget maps to our detail
  object:     "detail",
  // Reference scalar (big number) maps to our number
  scalar:     "number",
  // Reference smartscalar (sparkline KPI) maps to our trend
  smartscalar: "trend",
  // Same name in both systems
  map:        "map",
  pivot:      "pivot",
  gauge:      "gauge",
  progress:   "progress",
  sankey:     "sankey",
};

/**
 * Fold a reference-system widget list into RB widget families.
 * Unknown names pass through unchanged so new reference types surface as
 * test failures rather than silently disappearing.
 */
export function canonicalize(list: string[]): string[] {
  const out: string[] = [];
  for (const item of list) {
    const family = REFERENCE_TO_FAMILY[item] ?? item;
    if (!out.includes(family)) out.push(family);
  }
  return out;
}
