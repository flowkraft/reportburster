//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/auto-refresh.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { autoRefreshMinutesOf } from './auto-refresh.ts';

const rootWith = (minutes: string | null) => ({
  matches: () => false,
  querySelector: () => (minutes === null ? null : { getAttribute: () => minutes }),
}) as any;

describe('how often a published dashboard refreshes', () => {
  test('the minutes its root says', () => {
    assert.equal(autoRefreshMinutesOf(rootWith('5')), 5);
  });

  test('a dashboard that says nothing never refreshes by itself', () => {
    assert.equal(autoRefreshMinutesOf(rootWith(null)), 0);
    assert.equal(autoRefreshMinutesOf(null), 0);
  });

  test('anything but a whole number from 1 up is never', () => {
    for (const text of ['0', '', '1.5', '-2', 'ten']) assert.equal(autoRefreshMinutesOf(rootWith(text)), 0, text);
  });
});
