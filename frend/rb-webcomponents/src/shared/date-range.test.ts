//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/date-range.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  DATE_RANGE_PRESETS, presetOf, presetRange, rangePartnerIds, rangePartnerOf, rangeToday, rangeToIdOf,
} from './date-range.ts';
import { controlTypeOf } from './parameter-controls.ts';

const range = (fromId: string, toId: string) => [
  { id: fromId, type: 'Date', uiHints: { control: 'date-range' } },
  { id: toId, type: 'Date', uiHints: {} },
];

describe('a date range pairs two declared Date parameters', () => {
  test('the first day is <id>From, its partner <id>To', () => {
    assert.equal(rangeToIdOf('dateFrom'), 'dateTo');
    assert.equal(rangeToIdOf('issuedFrom'), 'issuedTo');
    assert.equal(rangeToIdOf('order_date_from'), 'order_date_to');
    assert.equal(rangeToIdOf('From'), null);
    assert.equal(rangeToIdOf('period'), null);
  });

  test('the range control draws the partner inside it; the partner is not drawn twice', () => {
    const params = range('closeFrom', 'closeTo');
    assert.equal(rangePartnerOf(params[0], params)?.id, 'closeTo');
    assert.equal(rangePartnerOf(params[1], params), null);
    assert.deepEqual([...rangePartnerIds(params)], ['closeTo']);
  });

  test('the dialog\'s word and the DSL\'s word are one control', () => {
    assert.equal(controlTypeOf({ id: 'dateFrom', uiHints: { control: 'date-range' } }), 'date-range');
    assert.equal(controlTypeOf({ id: 'dateFrom', uiHints: { widget: 'daterange' } }), 'date-range');
  });

  test('no partner, a plain date: nothing is paired and nothing hidden', () => {
    const lonely = [{ id: 'dateFrom', type: 'Date', uiHints: { control: 'date-range' } }];
    assert.equal(rangePartnerOf(lonely[0], lonely), null);
    assert.equal(rangePartnerIds(lonely).size, 0);
    const plain = [{ id: 'dateFrom', type: 'Date', uiHints: {} }, { id: 'dateTo', type: 'Date', uiHints: {} }];
    assert.equal(rangePartnerIds(plain).size, 0);
  });
});

describe('the presets count from one today', () => {
  const today = '2026-09-30';

  test('the data\'s today wins; without one, the browser\'s date', () => {
    assert.equal(rangeToday('2026-09-30', new Date(2030, 0, 5)), '2026-09-30');
    assert.equal(rangeToday(null, new Date(2030, 0, 5)), '2030-01-05');
    assert.equal(rangeToday('not a day', new Date(2030, 0, 5)), '2030-01-05');
  });

  test('each preset, both days included', () => {
    assert.deepEqual(presetRange('last_7_days', today), { from: '2026-09-24', to: '2026-09-30' });
    assert.deepEqual(presetRange('last_30_days', today), { from: '2026-09-01', to: '2026-09-30' });
    assert.deepEqual(presetRange('last_90_days', today), { from: '2026-07-03', to: '2026-09-30' });
    assert.deepEqual(presetRange('this_month', today), { from: '2026-09-01', to: '2026-09-30' });
    assert.deepEqual(presetRange('quarter_to_date', today), { from: '2026-07-01', to: '2026-09-30' });
    assert.deepEqual(presetRange('year_to_date', today), { from: '2026-01-01', to: '2026-09-30' });
    assert.deepEqual(presetRange('last_year', today), { from: '2025-01-01', to: '2025-12-31' });
    assert.equal(presetRange('someday', today), null);
  });

  test('across a year and a leap day', () => {
    assert.deepEqual(presetRange('last_7_days', '2026-01-03'), { from: '2025-12-28', to: '2026-01-03' });
    assert.deepEqual(presetRange('this_month', '2028-02-10'), { from: '2028-02-01', to: '2028-02-29' });
    assert.deepEqual(presetRange('quarter_to_date', '2026-12-31'), { from: '2026-10-01', to: '2026-12-31' });
  });

  test('two days are named as the preset they are, or as the reader\'s own', () => {
    assert.equal(presetOf('2026-09-24', '2026-09-30', today), 'last_7_days');
    assert.equal(presetOf('2025-01-01', '2025-12-31', today), 'last_year');
    assert.equal(presetOf('2026-09-02', '2026-09-30', today), '');
    assert.equal(presetOf('', '', today), '');
  });

  test('every preset has a range', () => {
    for (const { id } of DATE_RANGE_PRESETS) assert.ok(presetRange(id, today), id);
  });
});
