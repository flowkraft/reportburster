// Per-column user-overrides. Layered on top of the auto-picked FormatSpec
// (from `pickColumnFormat`) so users can refine formatting one column at a
// time without touching the underlying schema.
//
// Persisted inside `widget.displayConfig.columnSettings[columnName]`, keyed
// by column name — the query result columns don't carry stable refs, so the
// name is our only handle.

import type { FormatSpec, FormatKind, CurrencyStyle, DateUnit } from "./type-formatters";

export type NumberStyle = "decimal" | "percent" | "scientific" | "currency";

/** User-set overrides for one column in one widget. All fields optional; an
 *  absent field means "use the auto-picked default". Fields present here
 *  always win over the auto-picker. */
export interface ColumnSettings {
  /** Override the auto-picked header label. */
  columnTitle?: string;
  /** Hide this column entirely (Tabulator / Detail only). */
  hidden?: boolean;

  // ── Number family ─────────────────────────────────────────────────────────
  /** Force a number sub-style. Overrides the auto-picked `kind`. */
  numberStyle?: NumberStyle;
  /** ISO-4217 code (USD/EUR/GBP/…). Used when numberStyle="currency". */
  currency?: string;
  /** "$" vs "USD" vs "US dollars". */
  currencyStyle?: CurrencyStyle;
  /** Explicit decimal-place count. */
  decimals?: number;
  /** Multiply raw value before formatting. Useful to display 0-1 ratios as %. */
  scale?: number;
  /** Prepended after format (e.g., "~"). */
  prefix?: string;
  /** Appended after format (e.g., " USD"). */
  suffix?: string;
  /** Compact notation: 1.2K / 3.4M / 1.5B. */
  compact?: boolean;

  // ── Date family ───────────────────────────────────────────────────────────
  /** Force a temporal bucket (year/quarter/month/week/day/hour/minute or
   *  an extraction). Overrides the auto-detected bucket from visualQuery. */
  dateUnit?: DateUnit;

  // ── Display as ────────────────────────────────────────────────────────────
  /** Force a formatter kind — e.g., tell us "render this text column as URL"
   *  when the name doesn't hint and the fingerprint missed. */
  viewAs?: FormatKind;
}

/** Map from column name → user settings, stored on widget.displayConfig. */
export type ColumnSettingsMap = Record<string, ColumnSettings>;

/** Merge user column-settings onto the auto-picked FormatSpec. User fields
 *  win; unspecified fields fall back to auto-pick. Returns a NEW FormatSpec
 *  — callers should treat it as immutable. */
export function mergeColumnFormat(base: FormatSpec, user?: ColumnSettings): FormatSpec {
  if (!user) return base;

  // Step 1: pick the effective `kind`. numberStyle / viewAs override the auto-picked kind.
  let kind: FormatKind = base.kind;
  if (user.viewAs) {
    kind = user.viewAs;
  } else if (user.numberStyle) {
    switch (user.numberStyle) {
      case "currency":   kind = "currency"; break;
      case "percent":    kind = "percentage"; break;
      case "scientific": kind = "number"; break;  // compact-ish scientific via decimals
      case "decimal":    kind = "number"; break;
    }
  }

  // Step 2: compose the output. User fields always take precedence.
  const out: FormatSpec = {
    ...base,
    kind,
    currency:      user.currency      ?? base.currency,
    currencyStyle: user.currencyStyle ?? base.currencyStyle,
    decimals:      user.decimals      ?? base.decimals,
    scale:         user.scale         ?? base.scale,
    prefix:        user.prefix        ?? base.prefix,
    suffix:        user.suffix        ?? base.suffix,
    compact:       user.compact       ?? base.compact,
    dateUnit:      user.dateUnit      ?? base.dateUnit,
  };

  // Step 3: if user picked currency style but no currency code, fall back to USD.
  if (out.kind === "currency" && !out.currency) out.currency = "USD";

  return out;
}

/** Is every field of `settings` either unset or matching the auto-picked
 *  default? Used by "Reset" button logic and the settings-dirty indicator. */
export function isSettingsEmpty(s?: ColumnSettings): boolean {
  if (!s) return true;
  return Object.values(s).every((v) => v === undefined || v === "" || v === null);
}
