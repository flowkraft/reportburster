// The rule a filter pane applies, in plain terms: what is picked, what that binds, and what
// "nothing picked" has to mean.
//
// No test framework and no browser: the selections and the parameter values they make are pure
// data, and Node runs the module as it is. The DOM half (`refreshDataWidgets`) is seen by the
// dashboard's own browser test.
//
//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/pane-selections.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { PaneSelections, paneParamName, isPaneParamName, paneSelectionsFor } from './pane-selections.ts';

describe('a pane parameter', () => {

  test('is the field name under one prefix, with anything unusable replaced', () => {
    assert.equal(paneParamName('channel'), '__pane_channel');
    assert.equal(paneParamName('Ship Country'), '__pane_Ship_Country');
    assert.equal(paneParamName('order.date'), '__pane_order_date');
  });

  test('is told apart from a filter the author declared', () => {
    assert.equal(isPaneParamName('__pane_channel'), true);
    assert.equal(isPaneParamName('channel'), false);
    assert.equal(isPaneParamName('pane_channel'), false);
  });
});

describe('what a reader picked', () => {

  test('nothing picked binds an empty value for every pane field - which is every row', () => {
    const picks = new PaneSelections();
    assert.equal(picks.size, 0);
    assert.deepEqual(picks.paramValues(['channel', 'device']),
      { __pane_channel: '', __pane_device: '' });
  });

  test('the values of one field OR together, comma separated, in the order they were picked', () => {
    const picks = new PaneSelections();
    picks.toggle('channel', 'web');
    picks.toggle('channel', 'mobile_app');
    assert.deepEqual(picks.valuesOf('channel'), ['web', 'mobile_app']);
    assert.deepEqual(picks.paramValues(['channel']), { __pane_channel: 'web,mobile_app' });
  });

  test('different fields are two parameters, which the SQL ANDs', () => {
    const picks = new PaneSelections();
    picks.toggle('channel', 'web');
    picks.toggle('device', 'mobile');
    assert.deepEqual(picks.paramValues(['channel', 'device']),
      { __pane_channel: 'web', __pane_device: 'mobile' });
    assert.deepEqual(picks.fields(), ['channel', 'device']);
  });

  test('a second click on the same value drops it again', () => {
    const picks = new PaneSelections();
    picks.toggle('channel', 'web');
    picks.toggle('channel', 'web');
    assert.equal(picks.size, 0);
    assert.deepEqual(picks.paramValues(['channel']), { __pane_channel: '' });
  });

  test('a single-select pane holds one value: the next pick replaces it', () => {
    const picks = new PaneSelections();
    picks.toggle('channel', 'web', false);
    picks.toggle('channel', 'store', false);
    assert.deepEqual(picks.valuesOf('channel'), ['store']);
    // and the one that is on still comes off, so a reader can get back to no filter
    picks.toggle('channel', 'store', false);
    assert.equal(picks.size, 0);
  });

  test('a chip drops its own pick, Clear all drops every one', () => {
    const picks = new PaneSelections();
    picks.toggle('channel', 'web');
    picks.toggle('device', 'mobile');
    picks.remove('channel', 'web');
    assert.deepEqual(picks.list(), [{ field: 'device', value: 'mobile' }]);
    picks.clear();
    assert.equal(picks.size, 0);
  });

  test('a field with nothing picked still binds its empty value beside a field that has one', () => {
    const picks = new PaneSelections();
    picks.toggle('channel', 'web');
    assert.deepEqual(picks.paramValues(['channel', 'device']),
      { __pane_channel: 'web', __pane_device: '' });
  });
});

describe('two dashboards on one page', () => {

  test('keep their own picks, and each gets the same set back every time', () => {
    const first = paneSelectionsFor('sales-dashboard');
    const second = paneSelectionsFor('support-dashboard');
    first.toggle('channel', 'web');
    assert.equal(second.size, 0);
    assert.equal(paneSelectionsFor('sales-dashboard'), first);
    assert.deepEqual(paneSelectionsFor('sales-dashboard').valuesOf('channel'), ['web']);
    first.clear();
  });
});
