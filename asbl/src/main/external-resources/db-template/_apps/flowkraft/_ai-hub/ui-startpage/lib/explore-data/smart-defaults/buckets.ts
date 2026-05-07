// Bucketing helpers — time-truncation, time-extraction, numeric nice-width.
//
// Two distinct shapes of "bucket":
//   - Truncation (day/week/month/quarter/year): keeps the temporal ordering —
//     line charts.
//   - Extraction (day-of-week, hour-of-day, month-of-year, quarter-of-year):
//     produces discrete integer categories — bar charts. `isTemporalExtraction`
//     below is the predicate callers use to branch on this.
//
// Numeric nice-width picks a pleasing bin width from the data range using the
// classic 1 / 1.25 / 2 / 2.5 / 3 / 5 / 7.5 / 10 progression.

import type { TimeBucket } from "@/lib/stores/canvas-store";

// ─────────────────────────────────────────────────────────────────────────────
// Time buckets
// ─────────────────────────────────────────────────────────────────────────────

/** Temporal buckets that produce discrete categorical values (not a timeline). */
const TEMPORAL_EXTRACTIONS = new Set<TimeBucket>([
  "day-of-week",
  "hour-of-day",
  "month-of-year",
  "quarter-of-year",
]);

export function isTemporalExtraction(bucket?: TimeBucket | null): boolean {
  return !!bucket && TEMPORAL_EXTRACTIONS.has(bucket);
}

/**
 * Data-range-aware bucket picker for date-truncation. Returns the bucket that
 * gives a readable number of points across the observed span.
 *
 * Thresholds are tuned to land each span in the 20–60 points zone — dense
 * enough to show shape, sparse enough to label.
 *
 *   span < 60 days   → day        (~60 points)
 *   span < 6 months  → week       (~26 points)
 *   span < 2 years   → month      (~24 points)
 *   span < 10 years  → quarter    (~40 points)
 *   else             → year
 *
 * Sub-day ranges fall back to `day`: our `TimeBucket` enum doesn't include
 * `minute`/`hour` truncation buckets yet (would need DATE_TRUNC('hour', …)
 * support across all 9 SQL dialects). Extraction buckets (hour-of-day,
 * day-of-week) are available but represent categorical analysis, not
 * timeline continuity — so this picker doesn't auto-return them.
 */
export function guessTimeBucket(minDate: string, maxDate: string): TimeBucket {
  const min = parseDateBoundary(minDate);
  const max = parseDateBoundary(maxDate);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return "month";
  const days = (max - min) / (1000 * 60 * 60 * 24);
  if (days < 60)        return "day";
  if (days < 180)       return "week";
  if (days < 365 * 2)   return "month";
  if (days < 365 * 10)  return "quarter";
  return "year";
}

/**
 * Parse a min/max boundary into a millisecond timestamp.
 *
 * Vendor-agnostic by design — accepts ISO strings, pure-digit epoch strings
 * (ms or seconds), or already-numeric input wrapped to string. The probe
 * layer (probeDateRange) normalizes SQLite epoch columns to ISO via
 * sqliteDateNormalize, so this defensive parser is belt-and-suspenders for
 * the rare path where a probe somehow returns numeric strings (e.g. a third-
 * party tool, a future driver change, or a custom SQL probe).
 *
 * Threshold 1e12 (~2001-09-09 in epoch ms) cleanly separates ms from seconds
 * without false matches on small numeric IDs that happened to slip through.
 */
function parseDateBoundary(s: string): number {
  if (typeof s === "string" && /^\d+$/.test(s)) {
    const n = Number(s);
    return n > 1e12 ? n : n * 1000;
  }
  return new Date(s).getTime();
}

// ─────────────────────────────────────────────────────────────────────────────
// Numeric nice-number buckets
// ─────────────────────────────────────────────────────────────────────────────

/** "Pleasing" bin widths that scale across orders of magnitude. */
const NICE_STEPS = [1, 1.25, 2, 2.5, 3, 5, 7.5, 10] as const;

/**
 * Pick a bin width that yields roughly `targetBins` bins across [min, max],
 * snapped to a nice number. Example: range 15 → width 2.5, not 1.5.
 *
 * Returns 1 as a safe fallback when the range is non-finite or zero.
 */
export function nicerBinWidth(min: number, max: number, targetBins = 10): number {
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) return 1;
  const raw = range / targetBins;
  const scale = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / scale;
  const step = NICE_STEPS.find((s) => s >= normalized) ?? 10;
  return step * scale;
}
