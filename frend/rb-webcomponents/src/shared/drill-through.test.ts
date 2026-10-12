//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/drill-through.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { drillFieldsOf, drillHeadingOf, drillParamName, drillValuesOf } from './drill-through.ts';

const tileWith = (fields: string | null) => ({ getAttribute: (name: string) => (name === 'drill-fields' ? fields : null) }) as any;

describe('the rows behind a click', () => {
  test('each group column travels in a parameter of its own', () => {
    assert.equal(drillParamName('channel'), '__drill_channel');
    assert.equal(drillParamName('ship country'), '__drill_ship_country');
  });

  test('a tile names its group columns; a tile that names none is not drilled', () => {
    assert.deepEqual(drillFieldsOf(tileWith('channel,country')), ['channel', 'country']);
    assert.deepEqual(drillFieldsOf(tileWith('')), []);
    assert.deepEqual(drillFieldsOf(tileWith(null)), []);
  });

  test('the values clicked, one per group column', () => {
    assert.deepEqual(drillValuesOf(['channel', 'country'], { channel: 'Web', country: 'DE', orders: 12 }),
      { __drill_channel: 'Web', __drill_country: 'DE' });
  });

  test('a group with no value opens nothing: it would answer every row', () => {
    assert.equal(drillValuesOf(['channel'], { channel: '' }), null);
    assert.equal(drillValuesOf(['channel'], {}), null);
    assert.equal(drillValuesOf([], { channel: 'Web' }), null);
  });

  test('the panel says which group it shows', () => {
    assert.equal(drillHeadingOf(['channel', 'country'], { channel: 'Web', country: 'DE' }), 'Rows: channel Web · country DE');
  });
});
