//   node --experimental-strip-types --test src/shared/show-me-view.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { spanOf, showMeWindowTop, panelScroll } from './show-me-view.ts';

const ROOM = 800;
const FRAME = 3000;

describe('where the view goes after Show Me', () => {
  test('the ticks and the card are whole with air, and the rest of the window shows the answer', () => {
    const ticks = { top: 1000, bottom: 1400 };
    const card = { top: 900, bottom: 1100 };
    const top = showMeWindowTop(ticks, card, { top: 1500, bottom: 2300 }, ROOM, FRAME);
    assert.equal(top, 900 - 24, 'the window starts just above the highest of them');
    assert.ok(1400 + 24 <= top + ROOM && 1500 < top + ROOM, 'the ticks fit, and the answer starts inside the window');
  });

  test('neither the ticks nor the card touch the top or the bottom', () => {
    for (const [ticks, card] of [[{ top: 1200, bottom: 1500 }, { top: 1250, bottom: 1400 }], [{ top: 300, bottom: 360 }, { top: 700, bottom: 900 }]] as const) {
      const top = showMeWindowTop(ticks, card, null, ROOM, FRAME);
      for (const span of [ticks, card]) assert.ok(span.top - top >= 24 || top === 0, 'air above');
      assert.ok(Math.max(ticks.bottom, card.bottom) + 24 <= top + ROOM, 'air below');
    }
  });

  test('too tall for both: the ticks stay whole, and the window leans to the card', () => {
    const ticks = { top: 1400, bottom: 1900 };
    const above = showMeWindowTop(ticks, { top: 700, bottom: 900 }, null, ROOM, FRAME);
    assert.equal(above, 1900 + 24 - ROOM);
    assert.ok(above <= ticks.top - 24 && ticks.bottom + 24 <= above + ROOM);
    const below = showMeWindowTop(ticks, { top: 2300, bottom: 2500 }, null, ROOM, FRAME);
    assert.equal(below, 1400 - 24);
  });

  test('ticks taller than the window are lined up by their top; no ticks means the card, then the answer', () => {
    assert.equal(showMeWindowTop({ top: 1000, bottom: 2400 }, { top: 900, bottom: 1000 }, null, ROOM, FRAME), 1000 - 24);
    assert.equal(showMeWindowTop(null, { top: 1000, bottom: 1200 }, null, ROOM, FRAME), 1000 - 24);
    assert.equal(showMeWindowTop(null, null, { top: 1500, bottom: 2000 }, ROOM, FRAME), 1500 - 24);
    assert.equal(showMeWindowTop(null, null, null, ROOM, FRAME), 0);
  });

  test('the window stays on the frame', () => {
    assert.equal(showMeWindowTop({ top: 10, bottom: 100 }, null, null, ROOM, FRAME), 0);
    assert.equal(showMeWindowTop({ top: 2900, bottom: 2980 }, null, null, ROOM, FRAME), FRAME - ROOM);
  });

  test('spans: the one holding all, and nothing for nothing', () => {
    assert.deepEqual(spanOf([{ top: 5, bottom: 9 }, null, { top: 2, bottom: 6 }]), { top: 2, bottom: 9 });
    assert.equal(spanOf([null, { top: 3, bottom: 3 }]), null);
  });
});

describe('a panel that scrolls on its own', () => {
  const panel = { top: 100, bottom: 700 };
  test('boxes already clear of both edges do not move it', () => {
    assert.equal(panelScroll({ top: 200, bottom: 500 }, panel), 0);
  });
  test('boxes near an edge are centred, so the air above and below is the same', () => {
    assert.equal(panelScroll({ top: 105, bottom: 305 }, panel), 205 - 400);
    assert.equal(panelScroll({ top: 500, bottom: 690 }, panel), 595 - 400);
  });
  test('boxes below the panel are brought up, and boxes taller than it are lined up by their top', () => {
    assert.equal(panelScroll({ top: 900, bottom: 1100 }, panel), 1000 - 400);
    assert.equal(panelScroll({ top: 400, bottom: 1300 }, panel), 400 - 100 - 24);
  });
});
