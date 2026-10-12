//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/no-data.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { rowsFetched, showNoData } from './no-data.ts';

/** A tile and its widget, just enough of the DOM for the words to come and go. */
function tile(message: string | null) {
  const children: any[] = [];
  const widget: any = { style: { display: '' }, getAttribute: (n: string) => (n === 'component-id' ? 'tabulator_x' : null) };
  const item: any = {
    getAttribute: (n: string) => (n === 'data-no-data' ? message : null),
    querySelector: (sel: string) => children.find((c) => sel.includes(c.id)) ?? null,
    appendChild: (c: any) => { children.push(c); c.remove = () => children.splice(children.indexOf(c), 1); },
    ownerDocument: { createElement: () => ({ setAttribute() {}, id: '', textContent: '' }) },
  };
  return { item, widget, children };
}

describe('the words for no rows', () => {
  test('how many rows a widget says it fetched', () => {
    assert.equal(rowsFetched({ data: [1, 2] }), 2);
    assert.equal(rowsFetched({ totalRows: 0 }), 0);
    assert.equal(rowsFetched({}), null);
  });

  test('no rows: the words in the widget\'s place; rows again: the widget back', () => {
    const t = tile('Nothing sold yet');
    showNoData(t.item, t.widget, 0);
    assert.equal(t.children.length, 1);
    assert.equal(t.children[0].id, 'tileNoData-tabulator_x');
    assert.equal(t.children[0].textContent, 'Nothing sold yet');
    assert.equal(t.widget.style.display, 'none');
    showNoData(t.item, t.widget, 3);
    assert.equal(t.children.length, 0);
    assert.equal(t.widget.style.display, '');
  });

  test('a tile with no words shows what it always showed', () => {
    const t = tile('');
    showNoData(t.item, t.widget, 0);
    assert.equal(t.children.length, 0);
    assert.equal(t.widget.style.display, '');
  });
});
