// The "⋯" menu on each tile of a published dashboard (#19): download the tile's rows as CSV, save a
// chart as PNG, maximise the tile, refresh it.
//
// One menu per tile, added where the dashboard is put on the page (`RbReport`'s injection), so the
// 25 shipped templates and every published canvas get it the same way and none of them carries a line
// of it. The menu sits on the tile (`.grid-item`), not on the widget inside it: a refresh or a filter
// change replaces the widget with a fresh copy of itself, and the menu has to outlive that. Each action
// finds the widget the tile holds at the moment it is clicked.
//
// Ids, for tests and for people: `widgetMenu-<componentId>` is the "⋯" button, and its entries are
// `widgetMenuCsv-`, `widgetMenuPng-` (charts only), `widgetMenuMaximise-` and `widgetMenuRefresh-`.
//
// `rowsToCsv` is a plain function so `npm test` can ask it directly; the rest needs a browser.

import { reportQuery } from './report-query.ts';
import { DATA_WIDGET_TAGS, freshCopy } from './slicer-selections.ts';

/** One cell as CSV writes it: quoted when it holds a separator, a quote or a line break. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows as CSV: a header of every column any row has, in the order they first appear. */
export function rowsToCsv(rows: ReadonlyArray<Record<string, unknown>>): string {
  const columns: string[] = [];
  for (const row of rows) for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
  const lines = [columns.map(csvCell).join(',')];
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c])).join(','));
  return lines.join('\r\n') + '\r\n';
}

/** A file name made of a component id: letters, digits, dash and underscore. */
export function fileNameOf(componentId: string, extension: string): string {
  const base = String(componentId || 'tile').replace(/[^A-Za-z0-9_-]+/g, '_') || 'tile';
  return `${base}.${extension}`;
}

const STYLE_ID = 'rb-tile-menu-style';
const STYLE = `
.grid-item.rb-has-tile-menu { position: relative; }
.rb-tile-menu-btn { position: absolute; top: 4px; right: 4px; z-index: 5; border: none; background: transparent;
  color: inherit; opacity: .55; cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 6px; border-radius: 4px; }
.rb-tile-menu-btn:hover, .rb-tile-menu-btn[aria-expanded="true"] { opacity: 1;
  background: color-mix(in srgb, currentColor 10%, transparent); }
.rb-tile-menu-list { position: absolute; top: 26px; right: 4px; z-index: 6; min-width: 150px; padding: 4px 0;
  background: var(--color-base-100, #fff); color: var(--color-base-content, #222);
  border: 1px solid var(--rb-border, color-mix(in srgb, currentColor 18%, transparent)); border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0,0,0,.15); }
.rb-tile-menu-list[hidden] { display: none; }
.rb-tile-menu-list button { display: block; width: 100%; text-align: left; border: none; background: transparent;
  color: inherit; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.rb-tile-menu-list button:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
.grid-item.rb-tile-maximised { position: fixed !important; inset: 16px; z-index: 1000; margin: 0 !important;
  width: auto !important; height: auto !important; background: var(--color-base-100, #fff);
  box-shadow: 0 10px 40px rgba(0,0,0,.35); overflow: auto; }
@media print { .rb-tile-menu-btn, .rb-tile-menu-list { display: none !important; } }
`;

function ensureStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE;
  doc.head.appendChild(style);
}

/** The data widget a tile holds right now. */
function widgetOf(tile: Element): HTMLElement | null {
  return tile.querySelector(DATA_WIDGET_TAGS) as HTMLElement | null;
}

function download(doc: Document, href: string, name: string): void {
  const a = doc.createElement('a');
  a.href = href;
  a.download = name;
  a.style.display = 'none';
  doc.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * The rows the tile shows, asked of its report exactly as the tile asked for them. A drill (#21) asks
 * the same way for another of the report's components (`<component id>__rows`), with the values
 * clicked beside the tile's own.
 */
export async function tileRows(
  widget: HTMLElement,
  ask: { componentId?: string; values?: Record<string, string> } = {},
): Promise<Record<string, unknown>[]> {
  const reportId = widget.getAttribute('report-id') || '';
  const apiBaseUrl = widget.getAttribute('api-base-url') || '';
  const componentId = ask.componentId ?? (widget.getAttribute('component-id') || '');
  let params: Record<string, unknown> = {};
  try {
    params = JSON.parse(widget.getAttribute('report-params') || '{}') || {};
  } catch {
    params = {};
  }
  const query = reportQuery({ ...params, ...(ask.values ?? {}) });
  if (componentId) query.set('componentId', componentId);
  const headers: Record<string, string> = {};
  const token = widget.getAttribute('embed-token');
  if (token) headers['X-Embed-Token'] = token;
  const response = await fetch(`${apiBaseUrl}/reports/${encodeURIComponent(reportId)}/data?${query}`, { headers });
  if (!response.ok) throw new Error(`the rows could not be read (${response.status})`);
  const answer = await response.json();
  return Array.isArray(answer) ? answer : (answer?.data || []);
}

function setMaximised(doc: Document, tile: HTMLElement, button: HTMLButtonElement, on: boolean): void {
  tile.classList.toggle('rb-tile-maximised', on);
  button.textContent = on ? 'Restore' : 'Maximise';
  // Charts and maps draw to the size of their box: tell them it changed.
  doc.defaultView?.dispatchEvent(new Event('resize'));
}

/** Add the menu to one tile, unless it has one or holds no data widget with a component id. */
function decorateTile(doc: Document, tile: HTMLElement): void {
  if (tile.classList.contains('rb-has-tile-menu')) return;
  const widget = widgetOf(tile);
  const cid = widget?.getAttribute('component-id');
  if (!widget || !cid) return;
  // A live cube has its own toolbar (export, view SQL, its own refresh), next to its own controls.
  if (widget.tagName.toLowerCase() === 'rb-cube-renderer') return;
  tile.classList.add('rb-has-tile-menu');

  const button = doc.createElement('button');
  button.type = 'button';
  button.id = `widgetMenu-${cid}`;
  button.className = 'rb-tile-menu-btn';
  button.title = 'More';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  button.textContent = '⋯';

  const list = doc.createElement('div');
  list.className = 'rb-tile-menu-list';
  list.id = `widgetMenuList-${cid}`;
  list.hidden = true;
  const close = () => { list.hidden = true; button.setAttribute('aria-expanded', 'false'); };
  const item = (id: string, label: string, act: () => void | Promise<void>) => {
    const entry = doc.createElement('button');
    entry.type = 'button';
    entry.id = `${id}-${cid}`;
    entry.textContent = label;
    entry.addEventListener('click', async (e) => {
      e.stopPropagation();
      close();
      try {
        await act();
      } catch (err) {
        console.warn(`rb tile menu: ${label} did not work for ${cid}`, err);
      }
    });
    list.appendChild(entry);
    return entry;
  };

  item('widgetMenuCsv', 'Download CSV', async () => {
    const rows = await tileRows(widgetOf(tile) as HTMLElement);
    const href = URL.createObjectURL(new Blob([rowsToCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    download(doc, href, fileNameOf(cid, 'csv'));
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  });
  if (widget.tagName.toLowerCase() === 'rb-chart') {
    item('widgetMenuPng', 'Save as PNG', () => {
      const chart = (widgetOf(tile) as any)?.getChartInstance?.();
      if (!chart) throw new Error('the chart is not drawn yet');
      download(doc, chart.toBase64Image('image/png', 1), fileNameOf(cid, 'png'));
    });
  }
  const maximise = item('widgetMenuMaximise', 'Maximise', () => {
    setMaximised(doc, tile, maximise, !tile.classList.contains('rb-tile-maximised'));
  });
  item('widgetMenuRefresh', 'Refresh', () => {
    const current = widgetOf(tile);
    if (current) current.parentNode?.replaceChild(freshCopy(current), current);
  });

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const opening = list.hidden;
    doc.querySelectorAll('.rb-tile-menu-list').forEach((other) => { (other as HTMLElement).hidden = true; });
    doc.querySelectorAll('.rb-tile-menu-btn').forEach((other) => other.setAttribute('aria-expanded', 'false'));
    list.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
  });
  doc.addEventListener('click', (e) => { if (!list.contains(e.target as Node)) close(); });
  doc.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    close();
    if (tile.classList.contains('rb-tile-maximised')) setMaximised(doc, tile, maximise, false);
  });

  tile.appendChild(button);
  tile.appendChild(list);
}

/** Give every tile of a dashboard its menu: each `.grid-item` that holds a data widget. */
export function decorateTiles(root: Element | null | undefined): void {
  if (!root) return;
  const doc = root.ownerDocument;
  if (!doc) return;
  ensureStyle(doc);
  root.querySelectorAll('.grid-item').forEach((tile) => decorateTile(doc, tile as HTMLElement));
}
