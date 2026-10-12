//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/chart-number-format.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyChartNumberFormat, chartNumberFormatOf, drawModeOf } from './chart-number-format.ts';
import { formatMeasure } from './cube-format.ts';

describe('number formats on a chart', () => {
  test('only the formats a table knows', () => {
    assert.equal(chartNumberFormatOf({ rbNumberFormat: 'currency' }), 'currency');
    assert.equal(chartNumberFormatOf({ rbNumberFormat: 'roman' }), '');
    assert.equal(chartNumberFormatOf(undefined), '');
  });

  test('compact is the same everywhere: 1.2K, 3.5M', () => {
    assert.equal(formatMeasure(1234, 'compact'), '1.2K');
    assert.equal(formatMeasure(3_456_789, 'compact'), '3.5M');
    assert.equal(formatMeasure(12, 'compact'), '12');
  });

  test('the value axis and the tooltip of a bar chart', () => {
    const config: any = { type: 'bar', data: {}, options: { rbNumberFormat: 'currency' } };
    applyChartNumberFormat(config);
    assert.equal(config.options.scales.y.ticks.callback(1500), '$1,500.00');
    assert.equal(config.options.plugins.tooltip.callbacks.label({ dataset: { label: 'Sales' }, parsed: { x: 0, y: 2.5 } }),
      'Sales: $2.50');
  });

  test('a row chart is measured along x', () => {
    const config: any = { type: 'bar', data: {}, options: { rbNumberFormat: 'compact', indexAxis: 'y' } };
    applyChartNumberFormat(config);
    assert.equal(config.options.scales.x.ticks.callback(25000), '25K');
    assert.equal(config.options.scales.y, undefined);
  });

  test('a pie has no axis: its tooltip names the slice', () => {
    const config: any = { type: 'pie', data: {}, options: { rbNumberFormat: 'percent' } };
    applyChartNumberFormat(config);
    assert.equal(config.options.scales, undefined);
    assert.equal(config.options.plugins.tooltip.callbacks.label({ label: 'web', raw: 0.25 }), 'web: 25.0%');
  });

  test('a 100% stacked chart keeps its shares; a chart with no format is left alone', () => {
    const shares: any = { type: 'bar', data: {}, options: { rbNumberFormat: 'currency', rbStack100: true } };
    applyChartNumberFormat(shares);
    assert.equal(shares.options.scales, undefined);
    const plain: any = { type: 'bar', data: {}, options: {} };
    applyChartNumberFormat(plain);
    assert.deepEqual(plain.options, {});
  });

  test('a change of format or of shares draws the chart anew', () => {
    assert.notEqual(drawModeOf({}), drawModeOf({ rbNumberFormat: 'compact' }));
    assert.notEqual(drawModeOf({}), drawModeOf({ rbStack100: true }));
    assert.equal(drawModeOf({ responsive: true }), drawModeOf({}));
  });
});
