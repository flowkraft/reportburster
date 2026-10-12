//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/value-labels.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { formatValueLabel, labelPlacement, valueLabelsOn, valueLabelsPlugin, valueOf } from './value-labels.ts';

describe('data labels on a chart', () => {
  test('only a chart that asks for them gets them', () => {
    assert.equal(valueLabelsOn({ display: true }), true);
    assert.equal(valueLabelsOn({}), false);
    assert.equal(valueLabelsOn(undefined), false);
    assert.equal(valueLabelsOn({ display: 'yes' }), false);
  });

  test('the value of a point: a number, or the coordinate it is measured along', () => {
    assert.equal(valueOf(12), 12);
    assert.equal(valueOf({ x: 3, y: 7 }), 7);
    assert.equal(valueOf({ x: 3, y: 7 }, true), 3);
    assert.equal(valueOf(null), null);
    assert.equal(valueOf(Number.NaN), null);
  });

  test('a label reads grouped, with at most two decimals', () => {
    assert.equal(formatValueLabel(13169), '13,169');
    assert.equal(formatValueLabel(2.456), '2.46');
  });

  test('a bar is labelled past its end, a stacked one in its middle, a slice at its centre', () => {
    assert.deepEqual(labelPlacement('bar', { x: 10, y: 50, base: 100 }, false, false),
      { x: 10, y: 46, align: 'center', baseline: 'bottom' });
    assert.deepEqual(labelPlacement('bar', { x: 80, y: 20, base: 0 }, true, false),
      { x: 84, y: 20, align: 'left', baseline: 'middle' });
    assert.deepEqual(labelPlacement('bar', { x: 10, y: 50, base: 100 }, false, true),
      { x: 10, y: 75, align: 'center', baseline: 'middle' });
    assert.deepEqual(labelPlacement('pie', { x: 0, y: 0, tooltipPosition: () => ({ x: 5, y: 6 }) }, false, false),
      { x: 5, y: 6, align: 'center', baseline: 'middle' });
  });

  test('the plugin writes one label per visible value and says which', () => {
    const drawn: string[] = [];
    const ctx = { save() {}, restore() {}, fillText: (t: string) => drawn.push(t) } as any;
    const chart: any = {
      ctx,
      options: { color: '#000', scales: {} },
      data: { datasets: [{ data: [5, 1200.5, null] }, { data: [1], backgroundColor: 'rgba(0,0,0,0)' }] },
      isDatasetVisible: () => true,
      getDatasetMeta: (i: number) => ({ type: 'bar', data: i === 0 ? [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] : [{ x: 1, y: 1 }] }),
    };
    valueLabelsPlugin.afterDatasetsDraw(chart, {}, { display: true });
    assert.deepEqual(drawn, ['5', '1,200.5']);
    assert.deepEqual(chart.$rbValueLabels, ['5', '1,200.5']);
    valueLabelsPlugin.afterDatasetsDraw(chart, {}, {});
    assert.deepEqual(chart.$rbValueLabels, []);
  });

  test('on a 100% stacked chart a label is a share', () => {
    const ctx = { save() {}, restore() {}, fillText() {} } as any;
    const chart: any = {
      ctx,
      config: { options: { rbStack100: true } },
      options: { scales: { y: { stacked: true } } },
      data: { datasets: [{ data: [25] }] },
      isDatasetVisible: () => true,
      getDatasetMeta: () => ({ type: 'bar', data: [{ x: 1, y: 1, base: 2 }] }),
    };
    valueLabelsPlugin.afterDatasetsDraw(chart, {}, { display: true });
    assert.deepEqual(chart.$rbValueLabels, ['25%']);
  });
});
