import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSettings, ColumnSettingsMap } from "@/lib/explore-data/column-settings";

/**
 * Tabulator UI ↔ DSL mapping.
 *
 * UI keys owned here:
 *   tabulatorLayout, tabulatorPagination, tabulatorPageSize, tabulatorTheme — top-level options
 *   columnSettings[field].columnTitle → DSL column.title
 *   columnSettings[field].hidden + hiddenColumns[] → DSL column.visible = false
 *   columnSettings[field].{decimals,numberStyle,currency,…} → DSL column.*
 *
 * Round-trip fidelity:
 *   _dslColumns stores the raw parsed column objects from the last DSL parse.
 *   uiToTabulatorDsl merges UI overrides on top of _dslColumns so that arbitrary
 *   user-written column properties (sorter, width, formatter, etc.) survive any
 *   UI-driven re-serialize cycle without being stripped.
 *
 * Theme (tabulatorTheme ↔ DSL theme) is synced bidirectionally so that the
 * selected theme is persisted through the DSL and applied when dashboards are
 * rendered in DataPallas.
 * Unknown top-level DSL keys (the user writes e.g. headerSort false) survive
 * via the [k: string]: unknown index — the emitter re-emits them unchanged.
 */

/** All ColumnSettings keys that map 1-to-1 to DSL column properties. */
const FORMAT_KEYS = [
  "numberStyle",
  "currency",
  "currencyStyle",
  "decimals",
  "scale",
  "prefix",
  "suffix",
  "compact",
  "dateUnit",
  "viewAs",
] as const satisfies ReadonlyArray<keyof ColumnSettings>;

type FormatKey = (typeof FORMAT_KEYS)[number];

function hasFormatSettings(s?: ColumnSettings): boolean {
  if (!s) return false;
  return FORMAT_KEYS.some((k) => s[k] !== undefined);
}

/** Shape of one column entry as the DSL parser / emitter expects it. */
type DslColumn = { field: string; title?: string; visible?: boolean; [k: string]: unknown };

export type TabulatorDslOptions = {
  layout?: string;
  pagination?: boolean;
  paginationSize?: number;
  theme?: string;
  columns?: DslColumn[];
  [k: string]: unknown;
};

/**
 * UI displayConfig → DSL options map sent to /api/dsl/tabulator/serialize.
 *
 * Column entries are built by merging:
 *   1. _dslColumns — the raw column objects from the last DSL parse
 *      (preserves sorter, width, formatter, etc. written by the user)
 *   2. columnSettings — UI-side overrides (columnTitle → title, hidden → visible:false,
 *      decimals/numberStyle/… → matching DSL column properties)
 *   3. hiddenColumns — visibility toggles from the TabulatorConfig panel
 *
 * A column entry is only emitted when it has at least one property beyond `field`
 * (i.e. when there is something to customize). Columns with no overrides and no
 * DSL-written properties are omitted, keeping the DSL minimal.
 */
export function uiToTabulatorDsl(dc: WidgetDisplayConfig): TabulatorDslOptions {
  const opts: TabulatorDslOptions = {};

  const layout = dc.tabulatorLayout as string | undefined;
  if (layout) opts.layout = layout;

  const pag = dc.tabulatorPagination as boolean | undefined;
  if (typeof pag === "boolean") opts.pagination = pag;

  const size = dc.tabulatorPageSize as number | undefined;
  if (typeof size === "number") opts.paginationSize = size;

  const theme = dc.tabulatorTheme as string | undefined;
  if (theme) opts.theme = theme;

  // ── Column entries ─────────────────────────────────────────────────────────
  const dslColumns = (dc._dslColumns as DslColumn[] | undefined) ?? [];
  const colSettings = (dc.columnSettings as ColumnSettingsMap | undefined) ?? {};
  const hiddenArr = (dc.hiddenColumns as string[] | undefined) ?? [];
  const hiddenSet = new Set(hiddenArr.map((s) => s.toLowerCase()));

  // Union of all fields that might need a column entry.
  const fieldSet = new Set<string>([
    ...dslColumns.map((c) => c.field).filter(Boolean),
    ...Object.keys(colSettings).filter((f) => {
      const s = colSettings[f];
      return s?.columnTitle || s?.hidden || hasFormatSettings(s);
    }),
    ...hiddenArr,
  ]);

  const columns: DslColumn[] = [];
  for (const field of fieldSet) {
    // Start from the DSL-written column (preserves sorter, width, formatter, etc.)
    const base = dslColumns.find((c) => c.field === field);
    const entry: DslColumn = base ? { ...base } : { field };

    const settings = colSettings[field];

    // ── title ──────────────────────────────────────────────────────────────
    if (settings?.columnTitle && settings.columnTitle !== field) {
      entry.title = settings.columnTitle;
    } else {
      delete entry.title;
    }

    // ── visibility ─────────────────────────────────────────────────────────
    if (settings?.hidden || hiddenSet.has(field.toLowerCase())) {
      entry.visible = false;
    } else {
      delete entry.visible;
    }

    // ── formatting fields — all map 1-to-1 ────────────────────────────────
    for (const key of FORMAT_KEYS) {
      const val = settings?.[key as FormatKey];
      if (val !== undefined) {
        entry[key] = val;
      } else {
        delete entry[key];
      }
    }

    // Only emit this column entry if it carries something beyond just `field`.
    const { field: _f, ...rest } = entry;
    if (Object.keys(rest).length > 0) {
      columns.push(entry);
    }
  }

  if (columns.length > 0) opts.columns = columns;

  return opts;
}

/**
 * Parsed DSL options → UI displayConfig.
 *
 * For the columns array:
 *   - Stores the full raw column objects in _dslColumns (round-trip passthrough)
 *   - Extracts title overrides → columnSettings[field].columnTitle
 *   - Extracts visible:false → columnSettings[field].hidden + hiddenColumns[]
 *   - Extracts formatting fields → columnSettings[field].{decimals,numberStyle,…}
 *   - DSL is authoritative for columns it mentions: existing UI settings for
 *     those fields are replaced; settings for columns NOT in the DSL are kept.
 */
export function tabulatorDslToUi(opts: TabulatorDslOptions, dc: WidgetDisplayConfig): WidgetDisplayConfig {
  const next: WidgetDisplayConfig = { ...dc };

  if ("layout" in opts && typeof opts.layout === "string") next.tabulatorLayout = opts.layout;
  if ("pagination" in opts && typeof opts.pagination === "boolean") next.tabulatorPagination = opts.pagination;
  if ("paginationSize" in opts && typeof opts.paginationSize === "number") next.tabulatorPageSize = opts.paginationSize;
  if ("theme" in opts && typeof opts.theme === "string") next.tabulatorTheme = opts.theme;

  // ── Columns ────────────────────────────────────────────────────────────────
  if (Array.isArray(opts.columns) && opts.columns.length > 0) {
    // Preserve the full raw column objects for lossless re-serialize.
    next._dslColumns = opts.columns;

    const prevSettings = (dc.columnSettings as ColumnSettingsMap | undefined) ?? {};
    const newSettings: ColumnSettingsMap = { ...prevSettings };
    const newHidden: string[] = [];

    for (const col of opts.columns) {
      const field = col.field;
      if (!field) continue;

      const prev: ColumnSettings = { ...(newSettings[field] ?? {}) };

      // title → columnTitle override (only when it differs from the raw field name)
      if (typeof col.title === "string" && col.title !== field) {
        prev.columnTitle = col.title;
      } else {
        delete prev.columnTitle;
      }

      // visible: false → hidden
      if (col.visible === false) {
        prev.hidden = true;
        newHidden.push(field);
      } else {
        delete prev.hidden;
      }

      // formatting fields — DSL is authoritative: set if present, clear if absent
      for (const key of FORMAT_KEYS) {
        if (key in col && col[key] !== undefined) {
          (prev as Record<string, unknown>)[key] = col[key];
        } else {
          delete (prev as Record<string, unknown>)[key];
        }
      }

      if (Object.keys(prev).length === 0) {
        delete newSettings[field];
      } else {
        newSettings[field] = prev;
      }
    }

    next.columnSettings = newSettings;

    // Rebuild hiddenColumns: keep entries for columns NOT in the DSL (UI-panel-only
    // hidden state), replace entries for columns the DSL explicitly mentions.
    const dslFields = new Set(
      opts.columns.map((c) => c.field?.toLowerCase()).filter(Boolean) as string[],
    );
    const preserved = ((dc.hiddenColumns as string[]) || []).filter(
      (f) => !dslFields.has(f.toLowerCase()),
    );
    next.hiddenColumns = [...preserved, ...newHidden];
  } else if ("columns" in opts) {
    // Explicit empty columns array in DSL — clear cached columns and hidden state.
    next._dslColumns = undefined;
    next.columnSettings = {};
    next.hiddenColumns = [];
  }
  // If `columns` key is absent from opts entirely, leave existing _dslColumns alone.

  return next;
}
