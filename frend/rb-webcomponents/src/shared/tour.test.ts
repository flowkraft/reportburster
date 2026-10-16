//   npm test        (inside frend/rb-webcomponents)
//   node --experimental-strip-types --test src/shared/tour.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { unionBox, clampBox, spotlightBox, placeDialog, placeInWindow, placeInEmptySpace, richText, intersectBox, dimPath, mergeNear } from './tour.ts';

const VIEW = { width: 1000, height: 700 };
const CARD = { width: 300, height: 160 };

describe('the box a tour lights', () => {
  test('several targets are lit as one box; none, or nothing with a size, is no box', () => {
    assert.deepEqual(
      unionBox([{ left: 10, top: 20, width: 50, height: 10 }, { left: 100, top: 5, width: 20, height: 40 }]),
      { left: 10, top: 5, width: 110, height: 40 },
    );
    assert.equal(unionBox([]), null);
    assert.equal(unionBox([{ left: 5, top: 5, width: 0, height: 0 }]), null);
  });

  test('a target taller than the screen is lit as far as it is seen', () => {
    assert.deepEqual(clampBox({ left: -20, top: -50, width: 400, height: 2000 }, VIEW), { left: 0, top: 0, width: 380, height: 700 });
    // Wholly off the screen there is nothing to light.
    assert.equal(clampBox({ left: 2000, top: 10, width: 50, height: 50 }, VIEW).width, 0);
  });

  test('the lit box has air round the target and stays inside the screen', () => {
    assert.deepEqual(spotlightBox({ left: 100, top: 100, width: 200, height: 50 }, 8, VIEW), { left: 92, top: 92, width: 216, height: 66 });
    assert.deepEqual(spotlightBox({ left: 2, top: 2, width: 100, height: 50 }, 8, VIEW), { left: 0, top: 0, width: 110, height: 60 });
  });
});

describe('where the card goes', () => {
  test('no target: the card is in the middle of the screen, with no pointer', () => {
    const p = placeDialog(null, CARD, VIEW);
    assert.equal(p.side, 'center');
    assert.equal(p.arrow, -1);
    assert.equal(p.left, (1000 - 300) / 2);
  });

  test('below the target when it fits, centred on it, the pointer under the target\'s middle', () => {
    const p = placeDialog({ left: 400, top: 100, width: 200, height: 50 }, CARD, VIEW);
    assert.equal(p.side, 'bottom');
    assert.equal(p.top, 100 + 50 + 14);
    assert.equal(p.left, 500 - 150);
    assert.equal(p.arrow, 150);
  });

  test('above the target when there is no room below', () => {
    const p = placeDialog({ left: 400, top: 560, width: 200, height: 100 }, CARD, VIEW);
    assert.equal(p.side, 'top');
    assert.equal(p.top, 560 - 14 - 160);
  });

  test('beside a target that is tall and wide-set: to its right, then to its left', () => {
    const tall = { left: 20, top: 20, width: 400, height: 660 };
    assert.equal(placeDialog(tall, CARD, VIEW).side, 'right');
    const right = { left: 600, top: 20, width: 380, height: 660 };
    assert.equal(placeDialog(right, CARD, VIEW).side, 'left');
  });

  test('a card near an edge is kept off it, and its pointer still points at the target', () => {
    const p = placeDialog({ left: 0, top: 100, width: 40, height: 40 }, CARD, VIEW);
    assert.equal(p.side, 'bottom');
    assert.equal(p.left, 12);
    // The target's middle is 8 px into the card, nearer the corner than the pointer may go.
    assert.equal(p.arrow, 16);
  });

  test('a target that fills the screen: the card sits at the bottom of it, with no pointer', () => {
    const p = placeDialog({ left: 0, top: 0, width: 1000, height: 700 }, CARD, VIEW);
    assert.equal(p.side, 'center');
    assert.equal(p.arrow, -1);
    assert.equal(p.top, 700 - 160 - 12);
  });
});

describe('the words in a card', () => {
  test('**word** is bold and nothing a story\'s author wrote is markup', () => {
    assert.equal(richText('Tick **Net Sales** now'), 'Tick <strong>Net Sales</strong> now');
    assert.equal(richText('<b>x</b> & "y"'), '&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;');
    assert.equal(richText('an **unpaired star'), 'an **unpaired star');
    assert.equal(richText(undefined as unknown as string), '');
  });
});

describe('lighting several boxes at once', () => {
  test('the part of a box inside a panel is what can be seen; a box outside it is nothing', () => {
    const panel = { left: 100, top: 100, width: 400, height: 300 };
    assert.deepEqual(intersectBox({ left: 120, top: 150, width: 80, height: 20 }, panel), { left: 120, top: 150, width: 80, height: 20 });
    assert.deepEqual(intersectBox({ left: 90, top: 380, width: 80, height: 40 }, panel), { left: 100, top: 380, width: 70, height: 20 });
    assert.equal(intersectBox({ left: 120, top: 700, width: 80, height: 20 }, panel).width, 0);
  });

  test('the dimmed screen has the whole screen once and one rounded hole for each box', () => {
    const d = dimPath({ width: 1000, height: 700 }, [{ left: 10, top: 20, width: 100, height: 30 }, { left: 300, top: 400, width: 60, height: 24 }]);
    assert.ok(d.startsWith('M0 0H1000V700H0Z'));
    assert.equal((d.match(/M/g) ?? []).length, 3, 'the screen and two holes');
    assert.equal((d.match(/Z/g) ?? []).length, 3);
    assert.equal(dimPath({ width: 10, height: 10 }, []), 'M0 0H10V10H0Z');
  });
});

describe('boxes that touch are lit as one', () => {
  test('neighbouring rows become one box; a row far away stays alone', () => {
    const rows = [
      { left: 10, top: 10, width: 100, height: 20 },
      { left: 10, top: 32, width: 100, height: 20 },
      { left: 10, top: 400, width: 100, height: 20 },
    ];
    assert.deepEqual(mergeNear(rows, 4), [{ left: 10, top: 10, width: 100, height: 42 }, rows[2]]);
    assert.deepEqual(mergeNear(rows, 0).length, 3, 'a gap bigger than the allowance keeps them apart');
    assert.deepEqual(mergeNear([], 4), []);
  });
});

describe('the card of a tour in a frame as tall as its page', () => {
  const FRAME = { width: 1000, height: 2400 };
  const ROOM = 800;
  const inWindow = (r: { windowTop: number; place: { top: number } }, card: { height: number }) =>
    r.place.top >= r.windowTop && r.place.top + card.height <= r.windowTop + ROOM;

  test('a target and its card that fit are centred in the window, the card below', () => {
    const target = { left: 100, top: 1000, width: 600, height: 400 };
    const r = placeInWindow(target, CARD, FRAME, ROOM);
    assert.equal(r.place.side, 'bottom');
    assert.ok(inWindow(r, CARD));
    assert.ok(r.windowTop <= target.top && target.top + target.height <= r.windowTop + ROOM, 'the target is in the window too');
    const above = target.top - r.windowTop;
    const below = r.windowTop + ROOM - (target.top + target.height + CARD.height);
    assert.ok(Math.abs(above - below) < 30, 'about the same air above the target and below its card');
  });

  test('a target that fits but leaves no room above or below for the card is centred, the card beside it', () => {
    const tall = { width: 300, height: 420 };
    const target = { left: 600, top: 1000, width: 380, height: 600 };
    const r = placeInWindow(target, tall, FRAME, ROOM);
    assert.equal(r.place.side, 'left');
    assert.ok(inWindow(r, tall));
    assert.ok(r.windowTop <= target.top && target.top + target.height <= r.windowTop + ROOM, 'all of the target is in the window');
    assert.ok(r.place.left + tall.width < target.left, 'the card is left of the target, not on it');
  });

  test('with no side to go to, the card takes the empty right of a table that fills only its left', () => {
    const card = { width: 300, height: 300 };
    const target = { left: 0, top: 1000, width: 1000, height: 540 };
    const table = [{ left: 0, top: 1000, width: 400, height: 40 }, { left: 0, top: 1040, width: 400, height: 400 }];
    const r = placeInWindow(target, card, FRAME, ROOM, 14, 12, () => table);
    assert.equal(r.place.side, 'center');
    assert.ok(r.place.left >= 400 + 8, 'right of the data, not on it');
    assert.ok(r.place.left + card.width <= target.left + target.width);
    assert.ok(inWindow(r, card));
  });

  test('an empty part is preferred to a side, and the target is centred alone', () => {
    const card = { width: 300, height: 200 };
    const target = { left: 0, top: 1000, width: 1000, height: 400 };
    const r = placeInWindow(target, card, FRAME, ROOM, 14, 12, () => [{ left: 0, top: 1000, width: 400, height: 400 }]);
    assert.equal(r.place.side, 'center');
    assert.equal(r.windowTop, target.top + target.height / 2 - ROOM / 2);
    assert.ok(r.place.left >= 408);
  });

  test('a target full of content leaves the card on the bottom of the window, as before', () => {
    const card = { width: 300, height: 300 };
    const target = { left: 0, top: 1000, width: 1000, height: 540 };
    const r = placeInWindow(target, card, FRAME, ROOM, 14, 12, () => [target]);
    assert.equal(r.place.side, 'center');
    assert.equal(r.place.top, r.windowTop + ROOM - card.height - 12);
  });

  test('the empty space is looked for only inside what the reader sees, and left when the right is taken', () => {
    const card = { width: 300, height: 200 };
    const target = { left: 0, top: 0, width: 1000, height: 2000 };
    const right = [{ left: 650, top: 0, width: 350, height: 2000 }];
    const r = placeInEmptySpace(target, right, card, 500, 800);
    assert.ok(r && r.left === 12 && r.top >= 512 && r.top + card.height <= 1288);
    assert.equal(placeInEmptySpace(target, [{ left: 0, top: 0, width: 1000, height: 2000 }], card, 500, 800), null);
  });

  test('a target that nearly fills the window is shown whole, not lined up by its top', () => {
    const target = { left: 0, top: 1000, width: 700, height: ROOM - 10 };
    const r = placeInWindow(target, CARD, FRAME, ROOM);
    assert.ok(r.windowTop <= target.top && target.top + target.height <= r.windowTop + ROOM, 'all of it, down to its last row, is in the window');
    assert.ok(inWindow(r, CARD));
  });

  test('a target taller than the window is lined up by its top and the card sits on it, inside the window', () => {
    const target = { left: 50, top: 1200, width: 900, height: 1100 };
    const r = placeInWindow(target, CARD, FRAME, ROOM);
    assert.equal(r.windowTop, target.top - 24);
    assert.equal(r.place.side, 'center');
    assert.ok(inWindow(r, CARD));
  });

  test('near the top or the bottom of the frame the window stays on the frame, the card in it', () => {
    const high = placeInWindow({ left: 100, top: 40, width: 600, height: 120 }, CARD, FRAME, ROOM);
    assert.equal(high.windowTop, 0);
    assert.ok(inWindow(high, CARD));
    const low = placeInWindow({ left: 100, top: 2250, width: 600, height: 100 }, CARD, FRAME, ROOM);
    assert.equal(low.windowTop, FRAME.height - ROOM);
    assert.ok(inWindow(low, CARD));
  });

  test('a frame shorter than the window is not scrolled', () => {
    const r = placeInWindow({ left: 100, top: 300, width: 600, height: 100 }, CARD, { width: 1000, height: 500 }, ROOM);
    assert.equal(r.windowTop, 0);
  });
});
