/**
 * The words a tile shows when its query answers no rows (#30), as its author wrote them in the
 * Canvas. The published tile carries them (`data-no-data` on its grid item); each time its widget
 * says what it fetched (`dataFetched`), an empty answer hides the widget behind the words
 * (`tileNoData-<component id>`) and an answer with rows brings it back. A tile with no words set
 * shows what it always showed.
 */
import { DATA_WIDGET_TAGS } from './slicer-selections.ts';

export const NO_DATA_ATTR = 'data-no-data';

/** How many rows a widget says it fetched, or null when it does not say. */
export function rowsFetched(detail: unknown): number | null {
  const d = detail as { data?: unknown; totalRows?: unknown } | undefined;
  if (Array.isArray(d?.data)) return d!.data.length;
  if (typeof d?.totalRows === 'number') return d.totalRows;
  return null;
}

/** Show the words, or take them away, for one widget of a tile. */
export function showNoData(item: Element, widget: HTMLElement, rows: number | null): void {
  const message = item.getAttribute(NO_DATA_ATTR) ?? '';
  const id = `tileNoData-${widget.getAttribute('component-id') ?? ''}`;
  let box = item.querySelector(`[id="${id}"]`) as HTMLElement | null;
  if (rows === 0 && message) {
    if (!box) {
      box = item.ownerDocument.createElement('div');
      box.id = id;
      box.className = 'rb-no-data';
      box.setAttribute('style', 'padding: 12px; font-size: 13px; opacity: 0.7; text-align: center;');
      item.appendChild(box);
    }
    box.textContent = message;
    widget.style.display = 'none';
  } else if (rows !== null) {
    box?.remove();
    widget.style.display = '';
  }
}

/** Listen to every data widget of a dashboard whose tile has words for no rows, and to the ones that replace them. */
export function wireNoData(root: Element | null | undefined): void {
  if (!root || (root as any).__rbNoData) return;
  (root as any).__rbNoData = true;
  const heard = new WeakSet<Element>();
  const listen = (widget: Element) => {
    const item = widget.closest(`[${NO_DATA_ATTR}]`);
    if (!item || heard.has(widget)) return;
    heard.add(widget);
    widget.addEventListener('dataFetched', (event: Event) =>
      showNoData(item, widget as HTMLElement, rowsFetched((event as CustomEvent).detail)));
  };
  root.querySelectorAll(DATA_WIDGET_TAGS).forEach(listen);
  new MutationObserver((changes) => {
    for (const change of changes) {
      change.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(DATA_WIDGET_TAGS)) listen(node);
        node.querySelectorAll(DATA_WIDGET_TAGS).forEach(listen);
      });
    }
  }).observe(root, { childList: true, subtree: true });
}
