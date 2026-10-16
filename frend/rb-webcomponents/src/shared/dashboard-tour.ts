/**
 * The tour of a dashboard: what a DataPallas dashboard can do, not what one dashboard says.
 *
 * It is written once for every dashboard made of the usual parts and finds those parts in the page:
 * the filter (`rb-parameters`), the headline numbers (`rb-value`), a chart (`rb-chart`), a table
 * (`rb-tabulator`) and the cube explorer (`rb-cube-renderer`), whose own steps - its first story,
 * from the question to the answer - come in from `cube-tour.ts` and sit in the middle of the walk.
 * A part the dashboard does not have is left out. Every target is asked for again whenever the page
 * moves, so a widget that draws itself again is found again.
 */

import type { TourStep } from './tour';

export interface DashboardTourOptions {
  /** The dashboard: everything the tour looks at is inside it. */
  root: ParentNode;
  /** The steps the explorer adds (`rb-cube-renderer`'s `tourSteps()`); none if it has no stories. */
  cubeSteps: TourStep[];
}

/** The tile a widget sits in, so the tour lights the whole card rather than the widget inside it. */
function tileOf(el: Element): Element {
  return el.closest('.grid-item, .params-bar') ?? el;
}

/** The elements of one kind that belong to the dashboard itself - not to the explorer, which draws tables of its own. */
function widgets(root: ParentNode, tag: string): Element[] {
  return Array.from(root.querySelectorAll(tag)).filter((el) => !el.closest('rb-cube-renderer'));
}

/** What the filter is called on the page ("Country"): the first label inside it. */
function filterLabel(root: ParentNode): string {
  // The filter keeps its labels in a shadow tree of its own, which a plain selector does not enter.
  const host = root.querySelector('rb-parameters');
  const label = root.querySelector('rb-parameters label')?.textContent ?? host?.shadowRoot?.querySelector('label')?.textContent ?? '';
  return label.replace(/[*\s]+/g, ' ').trim();
}

/** "a, b and c" */
function sentenceList(items: string[]): string {
  return items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1] : items.join('');
}

export function dashboardTourSteps(o: DashboardTourOptions): TourStep[] {
  const { root, cubeSteps } = o;
  const has = (tag: string) => widgets(root, tag).length > 0;
  const hasCube = !!root.querySelector('rb-cube-renderer');
  const steps: TourStep[] = [];

  // What the opening says is what the page has: a dashboard without a chart does not promise one.
  const shown = [
    has('rb-value') ? 'headline **numbers**' : '',
    has('rb-chart') ? 'a **chart**' : '',
    has('rb-tabulator') ? 'a **table**' : '',
  ].filter(Boolean);
  const list = sentenceList(shown);
  const filtered = root.querySelector('rb-parameters') ? ', all moved by one **filter**' : '';
  steps.push({
    title: 'A short tour of this page',
    content:
      'The dashboard holds good answers to a few data questions' + (list ? ': ' + list + filtered : '') + '.\n\n' +
      (hasCube
        ? 'The tour goes through them, then ends where you take over and ask **ad hoc** data questions of **your own**.'
        : 'The tour goes through them one by one.'),
  });

  if (root.querySelector('rb-parameters')) {
    const label = filterLabel(root);
    const name = label.replace(/\*/g, '').trim();
    const aOrAn = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
    const recalculated = sentenceList(
      [has('rb-value') ? 'the numbers' : '', has('rb-chart') ? 'the chart' : '', has('rb-tabulator') ? 'the table' : '', hasCube ? 'the interactive data explorer at the bottom' : ''].filter(Boolean),
    );
    steps.push({
      target: () => {
        const el = root.querySelector('rb-parameters');
        return el ? tileOf(el) : null;
      },
      title: 'One filter moves the whole dashboard',
      content:
        'The filter decides what data the dashboard is showing. ' +
        'Here you could choose ' + (name ? aOrAn(name) + ' ' + name.toLowerCase() : 'a value') + ' and press **Apply**: everything would be calculated again for it' +
        (recalculated ? ' - ' + recalculated : '') +
        '.',
    });
  }

  if (has('rb-value')) {
    steps.push({
      target: () => Array.from(new Set(widgets(root, 'rb-value').map(tileOf))),
      title: 'The headline numbers',
      content: 'The totals that tell you in one look how things stand. They are asked of the database each time the page opens or the filter changes, so they always match what the filter says.',
    });
  }

  if (has('rb-chart')) {
    steps.push({
      target: () => {
        const el = widgets(root, 'rb-chart')[0];
        return el ? tileOf(el) : null;
      },
      title: 'The shape of it',
      content: 'A chart shows at a glance which parts are big and which are small, which a column of numbers hides. Point at a bar for its exact value.',
    });
  }

  if (has('rb-tabulator')) {
    steps.push({
      target: () => {
        const el = widgets(root, 'rb-tabulator')[0];
        return el ? tileOf(el) : null;
      },
      title: 'The exact figures',
      content: 'When the shape is not enough, the table has the numbers to the cent. Click a column heading to sort by it.',
    });
  }

  if (hasCube) {
    steps.push({
      // The whole explorer, from its "Interactive Data Explorer" label down: the outer box that holds the title, the
      // two halves and the answer. It is taller than a screen, so the tour lines its top up with the top of the screen
      // and the label is the first thing seen.
      target: () => {
        const el = root.querySelector('rb-cube-renderer');
        return el ? (el.querySelector('.rb-cube-root') ?? tileOf(el)) : null;
      },
      title: 'Your own questions',
      content:
        'Dashboards are great: each one is a **prebuilt recipe**, a data question prepared in advance and answered at a glance. When it is your question, nothing is faster.\n\n' +
        'Here is something even better. Sooner or later you want another angle, another comparison, a hunch - the ad-hoc questions an SQL ninja would type straight into the database. You do not have to be one: this **interactive data explorer** lets you ask your business data whatever comes to mind, day or night, just by ticking boxes.' +
        (cubeSteps.length > 0
          ? '\n\nIt comes with **Data Stories** to get you started; the tour follows the first one.'
          : '\n\nTick the numbers you want, and what to group them by.'),
    });
    steps.push(...cubeSteps);
  }

  steps.push({
    title: 'Your turn',
    content: hasCube
      ? 'That was the whole way: a **filter** that moves everything, the **numbers**, and an **explorer** for the questions nobody prepared. Pick a story and press **Show Me**, or tick your own boxes - and ask your data whatever you wonder about.'
      : 'That was the whole way: a **filter** that moves everything, then the numbers, a chart and a table. Change the filter and watch it all follow.',
    art: 'celebrate',
  });
  return steps;
}
