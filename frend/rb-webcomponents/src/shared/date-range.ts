// A date range in the filter bar: one control that fills two Date parameters.
//
// The dashboard declares the two days as it always has - `dateFrom` and `dateTo`, each a Date
// parameter with its own default, constraints and `${}` in the SQL - and asks for them to be drawn
// as one range by giving the first one `ui(control: 'date-range')`. Nothing new is declared and
// nothing is renamed, so every query that says `${dateFrom}` and `${dateTo}` keeps working, and the
// Report-Parameters DSL stays as it is. The range is a way of drawing two parameters, not a third one.
//
// The presets count from the data's today when the dashboard's connection has one - the day a
// `{dataToday}` default is read against (`CubeDataToday` on the server, `getDataToday` in the
// Canvas) - so "last 30 days" and a `{dataToday:minus 29 days}` default mean the same days. Without
// one, it is the browser's own date.
//
// Plain functions in a module of their own, so `npm test` can ask them directly.

import { controlTypeOf, type ParameterControlMeta } from './parameter-controls.ts';

/** A parameter as far as the range is concerned. */
export interface RangeParamMeta extends ParameterControlMeta {
  id: string;
}

/** The presets the range offers, in the order its dropdown lists them. */
export const DATE_RANGE_PRESETS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'last_7_days', label: 'Last 7 days' },
  { id: 'last_30_days', label: 'Last 30 days' },
  { id: 'last_90_days', label: 'Last 90 days' },
  { id: 'this_month', label: 'This month' },
  { id: 'quarter_to_date', label: 'Quarter to date' },
  { id: 'year_to_date', label: 'Year to date' },
  { id: 'last_year', label: 'Last year' },
];

/** The id of the parameter a range's first day pairs with: `dateFrom` → `dateTo`, and `order_date_from`
 *  → `order_date_to` (the Canvas filter dialog slugs a label into that form). */
export function rangeToIdOf(fromId: string): string | null {
  const m = /^(.+?)(From|_from)$/.exec(fromId ?? '');
  return m ? m[1] + (m[2] === 'From' ? 'To' : '_to') : null;
}

/**
 * The parameter that holds the last day of the range this one starts, or null when this one is not
 * the first day of a range: it does not ask for `date-range`, its id does not end in `From`, or the
 * dashboard declares no `<id>To` next to it. A range with no partner is drawn as the date it is.
 */
export function rangePartnerOf<P extends RangeParamMeta>(p: P, parameters: readonly P[]): P | null {
  if (controlTypeOf(p) !== 'date-range') return null;
  const toId = rangeToIdOf(p.id);
  if (!toId) return null;
  return parameters.find((q) => q.id === toId) ?? null;
}

/** The ids drawn inside a range rather than on their own: every partner's `<id>To`. */
export function rangePartnerIds<P extends RangeParamMeta>(parameters: readonly P[]): Set<string> {
  const ids = new Set<string>();
  for (const p of parameters) {
    const partner = rangePartnerOf(p, parameters);
    if (partner) ids.add(partner.id);
  }
  return ids;
}

/** Today as the plain `yyyy-mm-dd` the range counts from: the data's today, or the browser's own date. */
export function rangeToday(dataToday: string | null | undefined, now: Date = new Date()): string {
  if (typeof dataToday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataToday.trim())) return dataToday.trim();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function parts(day: string): [number, number, number] {
  const [y, m, d] = day.split('-').map(Number);
  return [y, m, d];
}

function iso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function day(y: number, m: number, d: number): string {
  return iso(new Date(Date.UTC(y, m - 1, d)));
}

/**
 * The first and the last day a preset means, both included, as the two date boxes hold them. Null for
 * an id that is not a preset.
 */
export function presetRange(presetId: string, today: string): { from: string; to: string } | null {
  const [y, m, d] = parts(today);
  switch (presetId) {
    case 'last_7_days': return { from: day(y, m, d - 6), to: today };
    case 'last_30_days': return { from: day(y, m, d - 29), to: today };
    case 'last_90_days': return { from: day(y, m, d - 89), to: today };
    case 'this_month': return { from: day(y, m, 1), to: day(y, m + 1, 0) };
    case 'quarter_to_date': return { from: day(y, Math.floor((m - 1) / 3) * 3 + 1, 1), to: today };
    case 'year_to_date': return { from: day(y, 1, 1), to: today };
    case 'last_year': return { from: day(y - 1, 1, 1), to: day(y - 1, 12, 31) };
    default: return null;
  }
}

/** The preset two days are, so the dropdown names it; '' when they are days of the reader's own. */
export function presetOf(from: unknown, to: unknown, today: string): string {
  for (const { id } of DATE_RANGE_PRESETS) {
    const r = presetRange(id, today);
    if (r && r.from === String(from ?? '') && r.to === String(to ?? '')) return id;
  }
  return '';
}
