//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/stack-percent.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyStackPercent, formatPercent, stackPercentOn, toPercentOfStack } from './stack-percent.ts';

describe('100% stacked', () => {
  test('only a chart that asks for it', () => {
    assert.equal(stackPercentOn({ rbStack100: true }), true);
    assert.equal(stackPercentOn({}), false);
    assert.equal(stackPercentOn(undefined), false);
  });

  test('each value is its share of the stack, and every stack makes 100', () => {
    const out = toPercentOfStack([{ data: [1, 3, 0] }, { data: [3, 1, 0] }]);
    assert.deepEqual(out.map((ds) => ds.data), [[25, 75, 0], [75, 25, 0]]);
    assert.deepEqual(out[0].rbRaw, [1, 3, 0]);
  });

  test('a gap counts as nothing', () => {
    const out = toPercentOfStack([{ data: [2, null] }, { data: [2] }]);
    assert.deepEqual(out.map((ds) => ds.data), [[50, 0], [50, 0]]);
  });

  test('the config: shares, both axes stacked, a 0-100 value axis', () => {
    const config: any = { type: 'bar', data: { labels: ['a'], datasets: [{ data: [1] }, { data: [3] }] },
      options: { rbStack100: true, scales: { y: { min: 5 } } } };
    applyStackPercent(config);
    assert.deepEqual(config.data.datasets.map((ds: any) => ds.data), [[25], [75]]);
    assert.equal(config.options.scales.x.stacked, true);
    assert.equal(config.options.scales.y.stacked, true);
    assert.equal(config.options.scales.y.min, 0);
    assert.equal(config.options.scales.y.max, 100);
    assert.equal(config.options.scales.y.ticks.callback(50), '50%');
  });

  test('a row chart measures its shares along x', () => {
    const config: any = { type: 'bar', data: { datasets: [{ data: [1] }] }, options: { rbStack100: true, indexAxis: 'y' } };
    applyStackPercent(config);
    assert.equal(config.options.scales.x.max, 100);
    assert.equal(config.options.scales.y.stacked, true);
  });

  test('a chart that does not ask is left alone', () => {
    const config: any = { type: 'bar', data: { datasets: [{ data: [1] }] }, options: {} };
    applyStackPercent(config);
    assert.deepEqual(config.data.datasets[0].data, [1]);
    assert.equal(config.options.scales, undefined);
  });

  test('a share reads with at most one decimal', () => {
    assert.equal(formatPercent(33.3333), '33.3%');
  });
});
