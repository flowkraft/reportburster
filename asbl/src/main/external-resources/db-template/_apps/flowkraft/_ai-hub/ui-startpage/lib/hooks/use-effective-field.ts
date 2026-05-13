"use client";

import { useMemo, useCallback } from "react";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { inferColumnsFromRow } from "@/lib/explore-data/widget-defaults";

/**
 * ============================================================================
 * useEffectiveField — single-source-of-truth hook for widget field picking.
 *
 * Encapsulates the two patterns every widget needs when binding a saved
 * `displayConfig.<field>` reference to a current query result:
 *
 *   1. Infer columns from the result's first row via the centralized
 *      `inferColumnsFromRow` (lib/explore-data/widget-defaults.ts:127).
 *      This satisfies the SINGLE TRUTH PRINCIPLE in
 *      lib/explore-data/smart-defaults/classification.ts which explicitly
 *      forbids local `Object.entries(row).map(...)` reimplementations.
 *
 *   2. Validate a saved configField against the current result keys.
 *      A stale reference (e.g. saved as "gross_value" but the result row
 *      now keys on "gross_value_sum" because the user added a SUM
 *      aggregation) must NOT be passed through to the web component as a
 *      phantom field — it should fall back to auto-pick.
 *
 * Use the returned helpers in this idiom:
 *
 *   const { inferredColumns, keys, validateField } = useEffectiveField(result);
 *   const auto = useMemo(() => pickXxxField(inferredColumns, tableSchema), ...);
 *   const effectiveField = validateField(configField) || auto.field || keys[0] || "";
 *
 * For multi-field widgets (Pivot's pivotRows/Cols/Vals arrays):
 *
 *   const validRows = validateFields(configRows);   // strips missing names
 *   const validCols = validateFields(configCols);
 *
 * Replaces inline column inference + ad-hoc field-staleness handling that
 * historically caused widgets to silently break on view + aggregation
 * combinations (the SQL alias diverges from the column name the widget saved).
 * ============================================================================
 */

export interface UseEffectiveFieldResult {
  /** Columns inferred from result.data[0] via the centralized helper. */
  inferredColumns: ColumnSchema[];
  /** Column names in result-row order. */
  keys: string[];
  /** Returns configField iff it exists in the current result schema; null otherwise. */
  validateField: (configField: string) => string | null;
  /** Filters an array of saved column names down to those present in the result. */
  validateFields: (configFields: string[]) => string[];
}

export function useEffectiveField(
  result: { data?: Record<string, unknown>[] } | null | undefined,
): UseEffectiveFieldResult {
  const inferredColumns = useMemo<ColumnSchema[]>(() => {
    const row0 = result?.data?.[0];
    return row0 ? inferColumnsFromRow(row0) : [];
  }, [result]);

  const keys = useMemo(() => inferredColumns.map((c) => c.columnName), [inferredColumns]);

  const validateField = useCallback(
    (configField: string): string | null =>
      configField && keys.includes(configField) ? configField : null,
    [keys],
  );

  const validateFields = useCallback(
    (configFields: string[]): string[] =>
      configFields.filter((f) => keys.includes(f)),
    [keys],
  );

  return { inferredColumns, keys, validateField, validateFields };
}
