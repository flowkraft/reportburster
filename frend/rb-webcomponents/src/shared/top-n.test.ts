//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/top-n.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyTopN, isOtherIndex, topNOf } from './top-n.ts';

const bars = () => ({ type: 'bar', options: { rbTopN: 2 },
  data: { labels: ['a', 'b', 'c', 'd'], datasets: [{ label: 'n', data: [5, 40, 10, 30] }] } });

describe('top N plus Other', () => {
  test('only a whole N from 1 up', () => {
    assert.equal(topNOf({ rbTopN: 3 }), 3);
    assert.equal(topNOf({ rbTopN: 0 }), 0);
    assert.equal(topNOf({ rbTopN: 2.5 }), 0);
    assert.equal(topNOf({}), 0);
  });

  test('the biggest N stay where they were; the rest are one Other at the end', () => {
    const config: any = bars();
    applyTopN(config);
    assert.deepEqual(config.data.labels, ['b', 'd', 'Other']);
    assert.deepEqual(config.data.datasets[0].data, [40, 30, 15]);
    assert.equal(config.data.rbOtherIndex, 2);
    assert.equal(isOtherIndex({ data: config.data }, 2), true);
    assert.equal(isOtherIndex({ data: config.data }, 0), false);
  });

  test('several measures are ranked by their total, each folded on its own', () => {
    const config: any = { type: 'bar', options: { rbTopN: 1 },
      data: { labels: ['a', 'b', 'c'], datasets: [{ data: [1, 9, 2] }, { data: [8, 1, 3] }] } };
    applyTopN(config);
    assert.deepEqual(config.data.labels, ['b', 'Other']);
    assert.deepEqual(config.data.datasets.map((ds: any) => ds.data), [[9, 3], [1, 11]]);
  });

  test('a pie keeps the colours of the slices it keeps', () => {
    const config: any = { type: 'pie', options: { rbTopN: 1 },
      data: { labels: ['a', 'b', 'c'], datasets: [{ data: [1, 9, 2], backgroundColor: ['red', 'blue', 'green'] }] } };
    applyTopN(config);
    assert.deepEqual(config.data.datasets[0].backgroundColor, ['blue', '#9ca3af']);
  });

  test('nothing to fold: few rows, a line, a combo, a waterfall, no N', () => {
    for (const config of [
      { ...bars(), options: { rbTopN: 3 } },
      { ...bars(), type: 'line' },
      { ...bars(), data: { labels: ['a', 'b', 'c', 'd'], datasets: [{ data: [1, 2, 3, 4], type: 'line' }] } },
      { ...bars(), options: {} },
    ] as any[]) {
      const before = JSON.stringify(config.data);
      applyTopN(config);
      assert.equal(JSON.stringify(config.data), before);
    }
  });
});
