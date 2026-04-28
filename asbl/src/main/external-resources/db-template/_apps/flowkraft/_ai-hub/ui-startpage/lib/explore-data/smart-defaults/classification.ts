// Column classification + semantic-type predicates.
//
// ═══════════════════════════════════════════════════════════════════════════
// SINGLE TRUTH PRINCIPLE — READ BEFORE EDITING OR ADDING ANY CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════
//
// Every question of the form "is this column X?" (temporal, country, state,
// measure, id, boolean, …) has EXACTLY ONE authoritative answer — the
// predicate exported from THIS file.  Shape-building (`classifyColumn` →
// `shape.dims[].kind`), widget-picker auto-pick, config-panel option
// filters, chart-ranking, and every downstream consumer MUST compose this
// one predicate.  No local copies.  No inline regex.  No "just this once"
// shortcut in a component.  No file-level helper that "almost" does the
// same thing.
//
// WHY — drift from parallel implementations has broken the test suite
// multiple times.  Historical breakage examples:
//   - `TrendConfig.tsx` inlined `/date|time|timestamp/i.test(typeName)`
//     (narrow, type-only) while `pickTrendFields` used the broad
//     `isTemporalLike` (type ∪ name).  `order_month:VARCHAR` was picked
//     as the date field but its `<option>` was missing from the select.
//   - `classifyColumn` checked `TEMPORAL_TYPES.has(type)` only, while
//     `isTemporalLike` added a name-pattern fallback.  `shape.dims[].kind`
//     reported "category-low" for `order_month:VARCHAR` even though every
//     picker downstream treated it as temporal.
//   - `widget-defaults.ts` tried to patch the above by re-typing
//     date-shaped strings as "TIMESTAMP" at column-inference time — a
//     lie that forced narrow `isTemporal` (formatter dispatch) to
//     mis-format VARCHAR values as dates.
// In every case, the fix was not a new clever predicate — it was
// deleting the duplicate and routing through the one in this file.
//
// HOW TO ADD A NEW CLASSIFIER
//   1. Add ONE exported function here, with a comment stating its
//      semantics in plain English and what consumers should use it for.
//   2. If there's a close cousin (narrow vs broad, type-only vs
//      name-aware), document both explicitly and point readers at the
//      right one for their use case.
//   3. Route `classifyColumn`'s ColumnKind decision through the new
//      predicate if it affects shape — DO NOT duplicate the rule inline.
//   4. Do NOT re-implement the rule in any consumer file.  If a consumer
//      needs shape-awareness, read `widget.shape` (populated by
//      `computeWidgetShape`); if it needs a raw column check, import
//      the predicate from here.
//
// HOW TO MODIFY AN EXISTING CLASSIFIER
//   Change the predicate in this file.  That's the whole workflow.
//   `classifyColumn` and every consumer will pick up the new rule
//   automatically.  If you feel tempted to "override" a classifier's
//   answer in a specific caller, stop — that impulse is the drift
//   pattern that keeps breaking us.  Fix the predicate instead.
//
// TWO LEGITIMATELY-DIFFERENT SEMANTICS (both live here, don't merge)
//   - `isTemporal(col)` — NARROW, type-only.  For icon/formatter dispatch
//     where a VARCHAR must NOT be formatted as a Date.
//   - `isTemporalLike(col)` — BROAD, type ∪ name.  For widget-picker /
//     option-list / shape.dims[].kind — "can I treat this as time for
//     a widget?"  `classifyColumn` routes through THIS one.
// These aren't duplicates — they answer different questions.  The rule
// is "one predicate per question", not "one predicate per column".
//
// ─── HOW SINGLE TRUTH WORKS TODAY (data flow) ──────────────────────────────
//
//   query result lands
//         │
//         ▼
//   canvas-store.setWidgetQueryResult()
//         │ calls
//         ▼
//   widget-defaults.computeWidgetShape()          ← the ONE place shape is built
//         │ calls
//         ▼
//   smart-defaults/display.shapeFromResult()
//         │ for each column calls
//         ▼
//   classification.classifyColumn()               ← the ONE classifier
//         │ for temporal branch calls
//         ▼
//   classification.isTemporalLike()               ← the ONE "is temporal?" rule
//         │
//         ▼
//   widget.columns + widget.shape written atomically to store
//         │
//         ▼
//   every consumer reads from widget.columns / widget.shape:
//     - ConfigPanel → TrendConfig → temporalDimensionsOf(cols, shape)
//     - ChartWidget → shape (for axis assignment + chart-ranking)
//     - widget-picker → shape (for best-fit type)
//     - palette → shape (for recommendation ranking)
//
// One classifier, one shape, one store write, N readers.  Changing
// `isTemporalLike` changes the answer for all consumers in lockstep.
//
// ─── BAD vs GOOD EXAMPLES ──────────────────────────────────────────────────
//
// ❌ BAD — local regex in a component (this is how D-trend broke)
//    // TrendConfig.tsx
//    const dates = columns.filter((c) => /date|time|timestamp/i.test(c.typeName));
//    // Drifts from isTemporalLike — misses `order_month:VARCHAR` that
//    // classifier considers temporal.  Select has no option, DOM is wrong.
//
// ✅ GOOD — read from shape, which went through the one classifier
//    // TrendConfig.tsx
//    const dates = temporalDimensionsOf(columns, shape);
//    // temporalDimensionsOf reads shape.dims where kind === "temporal".
//    // shape was built by classifyColumn → isTemporalLike.  Agreement
//    // is structural, not coincidental.
//
// ❌ BAD — local helper "just for this file" that re-implements the rule
//    // chart-ranking.ts (historical)
//    function isTemporal(col: ColumnSchema): boolean {
//      return TEMPORAL_TYPES.has(normalizeType(col.typeName))
//          || isTemporalByName(col.columnName);
//    }
//    // This is a copy of isTemporalLike.  Today it matches; tomorrow
//    // someone adds `|| /_at$/.test(col.columnName)` here and forgets
//    // the other copy.  Silent divergence, broken downstream.
//
// ✅ GOOD — import the one predicate
//    import { isTemporalLike } from "./classification";
//    const temporalCols = cols.filter(isTemporalLike);
//
// ❌ BAD — rebuild columns locally from a query result at each consumer
//    // Some component
//    const myColumns = Object.entries(result.data[0]).map(([name, v]) => ({
//      columnName: name,
//      typeName: typeof v === "number" ? "DOUBLE" : "VARCHAR",
//      isNullable: true,
//    }));
//    // Now this consumer sees a different ColumnSchema[] than everyone
//    // else — races, drift, divergent classification downstream.
//
// ✅ GOOD — read from the widget record, populated once by the store
//    const columns = selectedWidget?.columns ?? [];
//    const shape   = selectedWidget?.shape   ?? null;
//    // Written atomically by setWidgetQueryResult → computeWidgetShape.
//    // Every consumer agrees by construction.
//
// ❌ BAD — patch the type string to force a classifier answer
//    // widget-defaults.ts (historical — the DATE_VALUE_RX band-aid)
//    if (typeof value === "string" && DATE_VALUE_RX.test(value)) return "TIMESTAMP";
//    // Forcing VARCHAR "2024-01" to look like TIMESTAMP makes the narrow
//    // `isTemporal` lie → date formatter runs on a string → wrong output.
//    // Also papers over the real bug instead of fixing the classifier.
//
// ✅ GOOD — fix the classifier rule in ONE place
//    // classification.ts
//    export function isTemporalLike(col: ColumnSchema): boolean {
//      return TEMPORAL_TYPES.has(normalizeType(col.typeName))
//          || isTemporalByName(col.columnName);  // ← the rule lives HERE
//    }
//    // classifyColumn calls this.  Every consumer agrees.  No lies.
//
// ❌ BAD — override the classifier's answer in a specific caller
//    // "I know this column is really temporal even though the shape says
//    //  category-low, let me hard-code a check here."
//    const kind = col.columnName === "order_month" ? "temporal" : shape.kind;
//    // Band-aid on a band-aid.  The bug is still in the classifier; now
//    // it's papered over in two places.  Next computed-alias will break
//    // unless someone remembers to add it here too.
//
// ✅ GOOD — if the classifier is wrong, fix the classifier
//    // classification.ts — adjust isTemporalByName's pattern to cover
//    // the missed case, or add a new semantic predicate for the class
//    // of values.  Test once, correct everywhere.
//
// ─── THE ONE RULE ──────────────────────────────────────────────────────────
//
//   If you're about to write a classification check OUTSIDE this file,
//   stop.  Either (a) the predicate already exists here — import it, or
//   (b) it doesn't exist yet — add it here, then import it.  There is no
//   third option that doesn't eventually cause drift.
// ═══════════════════════════════════════════════════════════════════════════
//
// Two output layers:
//   1. ColumnKind — a coarse shape classification.  Used everywhere:
//      SummarizeShape dims, autoSummarize candidate filtering, filter-pane
//      auto-pick, widget-picker.  One answer per column, via `classifyColumn`.
//   2. Semantic predicates (isState / isCountry / isLatLon / isCurrency / …)
//      — finer-grained yes/no flags layered on top of ColumnKind.  One
//      predicate per question, via the exported `is*` functions below.
//
// Four input signals feed these layers.  We use all four because JDBC schemas
// carry no user-tagged semantic metadata — name alone is brittle, type alone
// misses computed aliases, and cardinality/values disambiguate everything
// else.  Naming one "THE" signal would be the same mistake as naming one
// "THE" predicate — drift follows.
//
//   (a) JDBC type name — `typeName` as returned by the driver.  Normalised
//       via `normalizeType` (Postgres TIMESTAMP/TIMESTAMPTZ → TIMESTAMP, etc.)
//       then matched against the `*_TYPES` sets (NUMERIC_TYPES, TEMPORAL_TYPES,
//       BOOLEAN_TYPES, TEXT_FREE_TYPES).  The primary signal for measure/
//       temporal/boolean where it's reliable.
//
//   (b) Column name patterns — regexes like TEMPORAL_NAME_PATTERN
//       (`date|time|month|year|…`), STATE / COUNTRY / CURRENCY / EMAIL
//       name tokens, and `isIdColumn` PK/FK detection against the parent
//       table.  Covers computed SQL aliases (`order_month` VARCHAR produced
//       by `strftime`) and conventional name conventions that JDBC types
//       can't see.
//
//   (c) Cardinality (distinct-count) — `CardinalityMap` produced by
//       `probes.probeCardinality` (SQL `COUNT(DISTINCT col)`, 5-min cache).
//       Splits string columns into `boolean` (n=2), `category-low`
//       (n < CATEGORY_LOW_MAX=50), and `category-high`.  Also narrows
//       filter-pane candidate selection and palette ranking.
//
//   (d) Value fingerprinting — `probes.probeSemanticType` samples up to
//       200 rows and runs per-type value matchers (state-name list,
//       country list, URL / email / ZIP regexes, image-URL suffixes,
//       JSON shape).  Produces `SemanticHint` ∈ `{image_url, url, email,
//       json, state, country, zip_code, city}` when the match rate
//       exceeds `FINGERPRINT_THRESHOLDS`.  Also value-range probes
//       (`probeDateRange`, `probeNumericRange`) for bin widths and
//       axis extents.  Also the first-row `typeof` in
//       `widget-defaults.inferColumnsFromRow` — used only when we have
//       results but no source-table schema (SQL / AI-SQL / Script modes).
//
// The SINGLE TRUTH principle above applies to all four: combine them
// inside the predicates that live HERE, and every consumer gets one
// coherent answer.  DO NOT sample result rows, re-fetch cardinality,
// or invent a new name regex in a consumer file — compose the
// predicates exported below.

import type { ColumnSchema, TableSchema } from "../types";

export type ColumnKind =
  | "id"
  | "temporal"
  | "measure"
  | "category-low"
  | "category-high"
  | "boolean"
  | "text-free";

/** Distinct-value threshold above which a string column is "category-high". */
export const CATEGORY_LOW_MAX = 50;

/** Distinct-count map: column name → count. Filled by `probeCardinality`. */
export type CardinalityMap = Record<string, number>;

export const NUMERIC_TYPES = new Set([
  // ── SQLite ──
  "INTEGER", "REAL",
  // ── MySQL / MariaDB ──
  "INT", "TINYINT", "SMALLINT", "MEDIUMINT", "BIGINT",
  "FLOAT", "DOUBLE", "DECIMAL", "NUMERIC", "YEAR",
  // ── SQL Server ──
  "MONEY", "SMALLMONEY",
  // ── PostgreSQL / Supabase ──
  "INT2", "INT4", "INT8", "FLOAT4", "FLOAT8",
  "SERIAL", "BIGSERIAL", "SMALLSERIAL",
  // ── Oracle ──
  "NUMBER", "BINARY_DOUBLE", "BINARY_FLOAT",
  // ── IBM Db2 ──
  "DECFLOAT",
  // ── DuckDB ──
  "HUGEINT", "UINTEGER", "UBIGINT", "UHUGEINT", "USMALLINT", "UTINYINT",
  // ── ClickHouse ──
  "UINT8", "UINT16", "UINT32", "UINT64", "UINT128", "UINT256",
  "INT8", "INT16", "INT32", "INT64", "INT128", "INT256",
  "FLOAT32", "FLOAT64",
  "DECIMAL32", "DECIMAL64", "DECIMAL128", "DECIMAL256",
]);

export const TEMPORAL_TYPES = new Set([
  // ── SQLite ──
  "DATE", "DATETIME", "TIMESTAMP", "TIME",
  // ── MySQL / MariaDB ──
  // (DATE, DATETIME, TIMESTAMP, TIME already listed above)
  // ── SQL Server ──
  "DATETIME2", "DATETIMEOFFSET", "SMALLDATETIME",
  // ── PostgreSQL / Supabase ──
  "TIMESTAMPTZ", "TIMETZ",
  // ── Oracle ──
  // (DATE, TIMESTAMP already listed above)
  // ── IBM Db2 ──
  // (DATE, TIME, TIMESTAMP already listed above)
  // ── DuckDB ──
  // (DATE, TIME, TIMESTAMP, TIMESTAMPTZ already listed above)
  // ── ClickHouse ──
  "DATE32", "DATETIME32", "DATETIME64",
]);

export const BOOLEAN_TYPES = new Set([
  // ── Cross-vendor ──
  "BOOLEAN", "BOOL",
  // ── SQL Server ──
  "BIT",
]);

export const TEXT_FREE_TYPES = new Set([
  // ── Cross-vendor ──
  "CLOB", "TEXT", "BLOB",
  // ── MySQL / MariaDB ──
  "LONGTEXT", "MEDIUMTEXT", "TINYTEXT",
]);

export function normalizeType(typeName: string): string {
  let t = (typeName || "").toUpperCase().trim();
  // Unwrap ClickHouse wrappers: Nullable(Type), LowCardinality(Nullable(Type))
  const wrapperMatch = t.match(/^(?:LOWCARDINALITY\()?NULLABLE\((.+?)\)(\))?$/);
  if (wrapperMatch) t = wrapperMatch[1].trim();
  return t.split("(")[0].trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ID / PK / FK detection
// ─────────────────────────────────────────────────────────────────────────────

export function isIdColumn(columnName: string, table?: TableSchema): boolean {
  if (/(^|_)(id|code|key)$/i.test(columnName)) return true;
  if (table?.primaryKeyColumns?.includes(columnName)) return true;
  // FK hint from the JDBC `getImportedKeys` DTO — catches cases where the FK
  // name doesn't match the `/id|code|key$/i` pattern (e.g., `ShipVia` in Orders
  // is an int FK to Shippers but has no `*_id` suffix).
  const fks = table?.foreignKeys;
  if (fks && fks.some((fk) => fk.fkColumnName === columnName)) return true;
  return false;
}

export function isPK(col: ColumnSchema, table?: TableSchema): boolean {
  return !!table?.primaryKeyColumns?.includes(col.columnName);
}

export function isFK(col: ColumnSchema, table?: TableSchema): boolean {
  return !!table?.foreignKeys?.some((fk) => fk.fkColumnName === col.columnName);
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic-type predicates — name-regex + type-name heuristics.
// JDBC schemas don't carry user-tagged semantic types, so each predicate
// fires off (a) the probe-derived semanticHint when present, (b) a name
// regex, (c) a type-family guard that blocks obvious false positives.
// ─────────────────────────────────────────────────────────────────────────────

// ── Geographic name patterns ────────────────────────────────────────────────
// LOGIC-MIRROR of frend/rb-webcomponents/src/shared/map-column-names.ts —
// keyword lists + tokenizer + matcher must stay behavior-identical to the
// web-component copy so the Next.js classifier and the RbMap Svelte component
// agree on what looks like a geographic column. Both sides need these as
// build-time constants; the rsync-to-3-locations deploy pattern makes a single
// source file non-trivial to share, so we mirror the logic here. Diff the two
// files to detect drift.
//
// Why not strict-exact regex? CRM schemas routinely prefix geo columns
// (Orders.ShipCountry, Customers.BillingState, etc.). Strict /^country$/i
// misses all of them. Tokenize camelCase+snake_case and match if the FIRST
// or LAST token is a geo keyword — catches prefix AND suffix forms without
// the over-matching of "any token" (which would e.g. flag
// `contact_country_name` as a country column).
const STATE_KEYWORDS     = ["state", "province", "region", "us_state"];
const COUNTRY_KEYWORDS   = ["country", "nation", "iso_country", "iso2", "iso3"];
const LATITUDE_KEYWORDS  = ["lat", "latitude"];
const LONGITUDE_KEYWORDS = ["lon", "lng", "long", "longitude"];

function geoTokens(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .split(/[_\s]+/)
    .map((s) => s.toLowerCase())
    .filter(Boolean);
}

function geoHeadOrTail(name: string, keywords: string[]): boolean {
  const toks = geoTokens(name);
  if (toks.length === 0) return false;
  if (keywords.includes(toks[0]) || keywords.includes(toks[toks.length - 1])) return true;
  // Fallback: some JDBC drivers (SQLite, MySQL with lower_case_table_names)
  // return column names lowercased — `ShipCountry` → `shipcountry` — which
  // destroys the camelCase boundary geoTokens relies on.  Single-token result
  // `shipcountry` won't match the keyword list at head/tail even though the
  // name unambiguously means "country".  Substring anchor on full lowercased
  // name recovers these cases.  Still safe against `contact_country_name`
  // (the classic over-match): that tokenizes to ["contact","country","name"]
  // with ends-with("name"), not "country" — excluded, unchanged behaviour.
  const lower = name.toLowerCase();
  for (const kw of keywords) {
    if (lower.endsWith(kw) || lower.startsWith(kw)) return true;
  }
  return false;
}

const ADDRESS_RX        = /\b(address|street|address_line)\b/i;

// ── Web / contact ───────────────────────────────────────────────────────────
const EMAIL_RX      = /^(email|e_?mail|email_address|user_email)$/i;
const URL_RX        = /^(url|link|website|homepage)$/i;
const IMAGE_URL_RX  = /(image|photo|picture|avatar|logo|thumbnail).*url$|^image$|^photo$/i;
const AVATAR_URL_RX = /^(avatar|profile_pic|profile_picture|avatar_url)$/i;

// ── Text roles ──────────────────────────────────────────────────────────────
const NAME_RX        = /^(name|full_name|first_name|last_name|contact_name|customer_name|product_name|display_name)$/i;
const TITLE_RX       = /^(title|heading|subject)$/i;
const DESCRIPTION_RX = /^(description|details|summary|notes|note|about)$/i;
const COMMENT_RX     = /^(comment|comments|remarks|feedback)$/i;

// ── Numeric roles ───────────────────────────────────────────────────────────
const QUANTITY_RX = /\b(quantity|qty|count|num_|number_of|units)\b|_count$/i;
const SCORE_RX    = /\b(score|rating|rank|grade)\b/i;
const DURATION_RX = /\b(duration|elapsed|time_taken|seconds|minutes|hours|days|ms|millis)\b/i;

// ── Percentage / Currency ───────────────────────────────────────────────────
const CURRENCY_NAME_RX    = /\b(price|amount|cost|revenue|total|salary|fee|charge|payable|payment|income|expense|balance|sales|profit|earnings|discount|tax)\b/i;
const PERCENTAGE_NAME_RX  = /\b(percent|pct|rate|ratio|share)\b/i;
const PERCENTAGE_SUFFIX_RX = /_(pct|percent|rate|ratio)$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Predicate bodies. Pattern is the same for every one: check the
// `semanticHint` (populated by the fingerprint probe) first, then fall back
// to a name regex. Type filters (numeric vs text) prevent false positives
// like `isLatitude` firing on a TEXT column called "lat".
// ─────────────────────────────────────────────────────────────────────────────

// Geographic — name regex imported from the shared map-column-names module
// (same source of truth as rb-webcomponents/RbMap). The type-family guards
// here prevent false positives like `isLatitude` firing on a TEXT column
// called "lat".
export function isState(col: ColumnSchema): boolean {
  if (col.semanticHint === "state") return true;
  return geoHeadOrTail(col.columnName, STATE_KEYWORDS) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isCountry(col: ColumnSchema): boolean {
  if (col.semanticHint === "country") return true;
  return geoHeadOrTail(col.columnName, COUNTRY_KEYWORDS) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isLatitude(col: ColumnSchema): boolean {
  if (col.semanticHint === "latitude") return true;
  return geoHeadOrTail(col.columnName, LATITUDE_KEYWORDS) && NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isLongitude(col: ColumnSchema): boolean {
  if (col.semanticHint === "longitude") return true;
  return geoHeadOrTail(col.columnName, LONGITUDE_KEYWORDS) && NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isCoordinate(col: ColumnSchema): boolean {
  return isLatitude(col) || isLongitude(col);
}
export function hasLatLonColumns(cols: ColumnSchema[]): boolean {
  return cols.some(isLatitude) && cols.some(isLongitude);
}
export function isAddress(col: ColumnSchema): boolean {
  return ADDRESS_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isLocation(col: ColumnSchema): boolean {
  return isState(col) || isCountry(col)
    || isLatitude(col) || isLongitude(col) || isAddress(col);
}

/** Name-based temporal heuristic. Last-resort fallback for columns whose JDBC
 *  type was lost in translation — e.g. SQLite stores dates as TEXT, or a
 *  computed SQL alias like `order_month` from `strftime('%Y-%m', OrderDate)`
 *  comes back as VARCHAR.  Matches loosely (no word boundaries) on purpose —
 *  false positives are tolerable (bar vs line is user-flippable); false
 *  negatives lose the temporal default entirely.  Used by both chart-ranking
 *  (palette subtype ranker) and display (result-shape classifier) so the two
 *  classifiers agree on computed-alias temporal detection. */
export const TEMPORAL_NAME_PATTERN = /date|time|month|year|week|day|quarter|hour/i;

export function isTemporalByName(columnName: string): boolean {
  return TEMPORAL_NAME_PATTERN.test(columnName);
}

/** Broad "time-axis candidate?" predicate: true for TEMPORAL-typed columns
 *  AND for columns whose NAME matches the temporal regex (`order_month`,
 *  `created_year`, …).  Contrast with `isTemporal` below, which checks JDBC
 *  type only — that one drives icon/formatter dispatch where a VARCHAR must
 *  NOT be formatted as a Date.  Use THIS predicate wherever the question
 *  is "can I treat this column as time for a widget?" — widget-picker,
 *  auto-pick, options-list filters.  Single source of truth: prior local
 *  copies in `row2-auto-pick.ts` and `chart-ranking.ts` drifted from a
 *  fourth inline regex in `TrendConfig.tsx`, which broke D-trend. */
export function isTemporalLike(col: ColumnSchema): boolean {
  // Extraction columns (day_of_week, month_of_year, hour_of_day, …) are
  // cyclical categories, not time axes — mirrors the reference isTemporalExtraction guard.
  if (/_of_/i.test(col.columnName)) return false;
  return TEMPORAL_TYPES.has(normalizeType(col.typeName))
      || isTemporalByName(col.columnName);
}

// Web / contact
export function isEmail(col: ColumnSchema): boolean {
  if (col.semanticHint === "email") return true;
  return EMAIL_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isURL(col: ColumnSchema): boolean {
  if (col.semanticHint === "url" || col.semanticHint === "image_url" || col.semanticHint === "avatar_url") return true;
  return URL_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isImageURL(col: ColumnSchema): boolean {
  if (col.semanticHint === "image_url") return true;
  return IMAGE_URL_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isAvatarURL(col: ColumnSchema): boolean {
  if (col.semanticHint === "avatar_url") return true;
  return AVATAR_URL_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}

// Text roles
export function isName(col: ColumnSchema): boolean {
  return NAME_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isTitle(col: ColumnSchema): boolean {
  return TITLE_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isDescription(col: ColumnSchema): boolean {
  return DESCRIPTION_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isComment(col: ColumnSchema): boolean {
  return COMMENT_RX.test(col.columnName) && !NUMERIC_TYPES.has(normalizeType(col.typeName));
}

// Currency — the CURRENCY_NAME_RX below already matches price/cost/discount/
// revenue/income/etc., so one predicate covers all the money-like roles.
export function isCurrency(col: ColumnSchema): boolean {
  if (col.semanticHint === "currency") return true;
  const type = normalizeType(col.typeName);
  if (type === "MONEY") return true;
  if (!NUMERIC_TYPES.has(type)) return false;
  return CURRENCY_NAME_RX.test(col.columnName);
}

export function isPercentage(col: ColumnSchema): boolean {
  if (col.semanticHint === "percentage") return true;
  const type = normalizeType(col.typeName);
  if (!NUMERIC_TYPES.has(type)) return false;
  return PERCENTAGE_NAME_RX.test(col.columnName) || PERCENTAGE_SUFFIX_RX.test(col.columnName);
}

// Numeric roles
export function isQuantity(col: ColumnSchema): boolean {
  const type = normalizeType(col.typeName);
  if (!NUMERIC_TYPES.has(type)) return false;
  return QUANTITY_RX.test(col.columnName);
}
export function isScore(col: ColumnSchema): boolean {
  const type = normalizeType(col.typeName);
  if (!NUMERIC_TYPES.has(type)) return false;
  return SCORE_RX.test(col.columnName);
}
export function isDuration(col: ColumnSchema): boolean {
  const type = normalizeType(col.typeName);
  if (!NUMERIC_TYPES.has(type)) return false;
  return DURATION_RX.test(col.columnName);
}

// Generic shape checks — useful for formatter/icon dispatch.
export function isNumeric(col: ColumnSchema): boolean {
  return NUMERIC_TYPES.has(normalizeType(col.typeName));
}
export function isTemporal(col: ColumnSchema): boolean {
  return TEMPORAL_TYPES.has(normalizeType(col.typeName));
}
export function isBooleanCol(col: ColumnSchema): boolean {
  return BOOLEAN_TYPES.has(normalizeType(col.typeName));
}
export function isText(col: ColumnSchema): boolean {
  const t = normalizeType(col.typeName);
  return !NUMERIC_TYPES.has(t) && !TEMPORAL_TYPES.has(t) && !BOOLEAN_TYPES.has(t);
}

// ─────────────────────────────────────────────────────────────────────────────
// Coarse classification (cardinality-aware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify one column. When `cardinality` is provided, it's used to split
 * category-low (< CATEGORY_LOW_MAX) from category-high. Exactly-2-distinct
 * string columns are promoted to boolean (covers "Y"/"N", "active"/"inactive",
 * etc. that aren't declared as BOOLEAN in the schema).
 */
export function classifyColumn(
  col: ColumnSchema,
  table?: TableSchema,
  cardinality?: CardinalityMap,
): ColumnKind {
  const type = normalizeType(col.typeName);
  if (isIdColumn(col.columnName, table)) return "id";
  // SINGLE TRUTH: "is this temporal?" has ONE answer — `isTemporalLike`.
  // Used both here (to set shape.dims[].kind that drives widget-picker
  // and config-panel option filters) and directly by pickTrendFields /
  // chart-ranking / row2-auto-pick as a boolean candidate check.  A
  // prior narrow type-only rule HERE diverged from the broad rule
  // there, producing the D-trend drift where pickTrendFields said
  // "temporal" but shape said "category-low" for `order_month:VARCHAR`.
  if (isTemporalLike(col)) return "temporal";
  if (BOOLEAN_TYPES.has(type)) return "boolean";
  if (NUMERIC_TYPES.has(type)) return "measure";
  if (TEXT_FREE_TYPES.has(type)) return "text-free";

  // String-like column. If we have a distinct count, use it to pick kind:
  if (cardinality && typeof cardinality[col.columnName] === "number") {
    const n = cardinality[col.columnName];
    if (n === 2) return "boolean";
    if (n < CATEGORY_LOW_MAX) return "category-low";
    return "category-high";
  }

  // No cardinality yet → optimistic default (category-low).
  // Top-N bar clipping in ChartWidget prevents the worst outcomes.
  return "category-low";
}

export function classifyTable(
  table: TableSchema,
  cardinality?: CardinalityMap,
): Record<string, ColumnKind> {
  const out: Record<string, ColumnKind> = {};
  for (const col of table.columns) out[col.columnName] = classifyColumn(col, table, cardinality);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Boolean-by-value detection (no schema probe)
// ─────────────────────────────────────────────────────────────────────────────

const BOOL_LIKE_VALUES = new Set([
  "y", "n", "yes", "no", "true", "false", "0", "1",
  "on", "off", "active", "inactive", "enabled", "disabled",
]);

/**
 * Scans up to `sampleSize` rows for the two most common non-null distinct
 * values of `column`. Returns true when exactly 2 distinct values appear AND
 * they look like a boolean pair ("Y"/"N", "true"/"false", "yes"/"no", 0/1, etc.).
 */
export function looksLikeBoolean(
  rows: Record<string, unknown>[],
  column: string,
  sampleSize = 50,
): boolean {
  const seen = new Set<string>();
  const limit = Math.min(rows.length, sampleSize);
  for (let i = 0; i < limit; i++) {
    const v = rows[i][column];
    if (v === null || v === undefined || v === "") continue;
    const s = String(v).toLowerCase().trim();
    seen.add(s);
    if (seen.size > 2) return false;
  }
  if (seen.size !== 2) return false;
  return [...seen].every((v) => BOOL_LIKE_VALUES.has(v));
}
