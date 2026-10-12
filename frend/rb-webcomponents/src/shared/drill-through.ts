/**
 * A click on a bar or a table row of a published Visual-tab widget opens the rows behind it (#21).
 *
 * The canvas wrote the question when the widget was published: the widget's query without its
 * aggregation, plus one condition per group column bound to `__drill_<column>`, served by the
 * report as the component `<component id>__rows`, and the tile names those group columns in its
 * `drill-fields` attribute. This module only hears the click, sends the values clicked, and shows
 * what comes back in `<rb-drill-rows>`, the panel a cube's drill opens too.
 *
 * A widget whose clicks filter the dashboard keeps doing that: one click does one thing. A chart
 * names one group by its bar, so a chart grouped by two columns opens nothing; a table row carries
 * all of them.
 */
import { tileRows } from './tile-menu.ts';

/**
 * The prefix of a clicked group value's parameter, `__drill_<column>`.
 *
 * LOGIC-MIRROR of {@code DRILL_PARAM_PREFIX} in {@code ui-startpage/lib/explore-data/drill-rows.ts},
 * which writes the condition, and in {@code ScriptAssembler.java}, which declares the parameter.
 */
export const DRILL_PARAM_PREFIX = '__drill_';

/** LOGIC-MIRROR of {@code DRILL_ROWS_LIMIT} in {@code drill-rows.ts}: the most rows a click opens. */
export const DRILL_ROWS_LIMIT = 500;

/** LOGIC-MIRROR of {@code ROWS_COMPONENT_SUFFIX} in {@code ScriptAssembler.java}. */
export const ROWS_COMPONENT_SUFFIX = '__rows';

/** The parameter one group column's clicked value travels in. */
export function drillParamName(column: string): string {
  return DRILL_PARAM_PREFIX + column.replace(/[^A-Za-z0-9_]/g, '_');
}

/** The group columns a tile's click names, from its `drill-fields` attribute. */
export function drillFieldsOf(widget: Element): string[] {
  return (widget.getAttribute('drill-fields') || '')
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field.length > 0);
}

/** The parameters a click sends, or null when a group column has no value in what was clicked. */
export function drillValuesOf(fields: readonly string[], clicked: Record<string, unknown>): Record<string, string> | null {
  if (fields.length === 0) return null;
  const values: Record<string, string> = {};
  for (const column of fields) {
    const value = clicked[column];
    if (value === null || value === undefined || String(value) === '') return null;
    values[drillParamName(column)] = String(value);
  }
  return values;
}

/** "Rows: channel Web · country DE" - the group clicked, said in words. */
export function drillHeadingOf(fields: readonly string[], clicked: Record<string, unknown>): string {
  return 'Rows: ' + fields.map((field) => `${field} ${String(clicked[field])}`).join(' · ');
}

/** What one click names: the bar's label for a chart grouped by one column, the row for a table. */
function clickedOf(widget: HTMLElement, type: string, detail: any, fields: readonly string[]): Record<string, unknown> | null {
  if (type === 'cellClick') return detail?.rowData ?? null;
  if (fields.length !== 1 || detail?.index === undefined) return null;
  const chart = (widget as any).getChartInstance?.();
  return { [fields[0]]: chart?.data?.labels?.[detail.index] };
}

function closeAll(root: Element): void {
  root.querySelectorAll('rb-drill-rows[data-rb-drill-through]').forEach((panel) => panel.remove());
}

async function openRows(root: Element, widget: HTMLElement, type: string, detail: any): Promise<void> {
  const fields = drillFieldsOf(widget);
  if (fields.length === 0) return;
  if ((widget as any).clicksFilter === true || widget.getAttribute('clicks-filter') === 'true') return;
  const clicked = clickedOf(widget, type, detail, fields);
  const values = clicked ? drillValuesOf(fields, clicked) : null;
  if (!clicked || !values) return;

  const doc = widget.ownerDocument;
  const tile = (widget.closest('.grid-item') as HTMLElement | null) ?? widget.parentElement;
  if (!tile) return;
  if (doc.defaultView?.getComputedStyle(tile).position === 'static') tile.style.position = 'relative';
  closeAll(root);
  const panel = doc.createElement('rb-drill-rows') as HTMLElement & Record<string, unknown>;
  panel.setAttribute('data-rb-drill-through', '');
  panel.idPrefix = 'widgetDrill';
  panel.closeId = 'btnWidgetDrillClose';
  panel.heading = drillHeadingOf(fields, clicked);
  panel.loading = true;
  panel.addEventListener('close', () => panel.remove());
  tile.appendChild(panel);

  const componentId = (widget.getAttribute('component-id') || '') + ROWS_COMPONENT_SUFFIX;
  try {
    const rows = await tileRows(widget, { componentId, values });
    panel.rows = rows;
    panel.truncated = rows.length >= DRILL_ROWS_LIMIT;
  } catch (err: any) {
    panel.error = String(err?.message || err || 'The rows behind this could not be read.');
  } finally {
    panel.loading = false;
  }
}

/**
 * Hear the clicks of every widget a dashboard holds that names its group columns. A widget's own
 * events reach only listeners on the widget itself (a Svelte element calls them; no DOM event goes
 * up the page), and a filter change, Apply or a tile's Refresh puts new copies in the widgets'
 * places - so each widget is listened to as it arrives. Escape closes the panel, as it closes a
 * cube's.
 */
export function wireDrillThrough(root: Element | null | undefined): void {
  if (!root || (root as any).__rbDrillThrough) return;
  (root as any).__rbDrillThrough = true;
  const heard = new WeakSet<Element>();
  const listen = (widget: Element) => {
    if (heard.has(widget)) return;
    heard.add(widget);
    for (const type of ['chartClick', 'cellClick']) {
      widget.addEventListener(type, (event: Event) => {
        openRows(root, widget as HTMLElement, type, (event as CustomEvent).detail).catch((err) =>
          console.warn('rb drill-through: the rows could not be opened', err));
      });
    }
  };
  root.querySelectorAll('[drill-fields]').forEach(listen);
  new MutationObserver((changes) => {
    for (const change of changes) {
      change.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.hasAttribute('drill-fields')) listen(node);
        node.querySelectorAll('[drill-fields]').forEach(listen);
      });
    }
  }).observe(root, { childList: true, subtree: true });
  root.ownerDocument?.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeAll(root);
  });
}
