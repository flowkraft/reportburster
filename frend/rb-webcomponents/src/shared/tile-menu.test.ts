//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/tile-menu.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { fileNameOf, rowsToCsv } from './tile-menu.ts';

describe('a tile\'s rows as CSV', () => {
  test('a header of every column, then one line per row', () => {
    assert.equal(rowsToCsv([{ channel: 'web', orders: 12 }, { channel: 'store', orders: 3 }]),
      'channel,orders\r\nweb,12\r\nstore,3\r\n');
  });

  test('a separator, a quote or a line break is quoted; nothing is empty', () => {
    assert.equal(rowsToCsv([{ name: 'Smith, Anna', note: 'say "hi"', more: 'a\nb', none: null }]),
      'name,note,more,none\r\n"Smith, Anna","say ""hi""","a\nb",\r\n');
  });

  test('a column only a later row has is still a column', () => {
    assert.equal(rowsToCsv([{ a: 1 }, { a: 2, b: 'x' }]), 'a,b\r\n1,\r\n2,x\r\n');
  });

  test('no rows: an empty header', () => {
    assert.equal(rowsToCsv([]), '\r\n');
  });
});

describe('the file a tile is saved as', () => {
  test('named after its component id, safely', () => {
    assert.equal(fileNameOf('chart_sales-1', 'png'), 'chart_sales-1.png');
    assert.equal(fileNameOf('a b/c', 'csv'), 'a_b_c.csv');
    assert.equal(fileNameOf('', 'csv'), 'tile.csv');
  });
});
