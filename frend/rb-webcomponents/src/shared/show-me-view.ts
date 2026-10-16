/**
 * Where the reader should be looking after Show Me is pressed, in a frame as tall as its page.
 *
 * Three things matter, in this order: the fields the story ticked (whole, with air above and below, so none
 * touches an edge), the card Show Me was pressed on (whole, so the reader sees what they pressed), and then as much
 * as can be seen of the answer under them. All are spans in the frame's own coordinates; the answer lies below the
 * other two, so the window starts at the top of what is needed and the rest of it shows the answer.
 */

export interface Span {
  top: number;
  bottom: number;
}

/** The smallest span holding all of them, or null when there are none. */
export function spanOf(spans: Array<Span | null | undefined>): Span | null {
  const real = spans.filter((s): s is Span => !!s && Number.isFinite(s.top) && Number.isFinite(s.bottom) && s.bottom > s.top);
  if (real.length === 0) return null;
  return { top: Math.min(...real.map((s) => s.top)), bottom: Math.max(...real.map((s) => s.bottom)) };
}

/** The top of the window, in the frame's coordinates, that shows these best. `room` is how much the reader can see at once. */
export function showMeWindowTop(ticks: Span | null, card: Span | null, answer: Span | null, room: number, frameHeight: number, air = 24): number {
  const needed = spanOf([ticks, card]);
  let top: number;
  if (!needed) {
    top = answer ? answer.top - air : 0;
  } else if (needed.bottom - needed.top + 2 * air <= room) {
    top = needed.top - air;
  } else if (ticks && ticks.bottom - ticks.top + 2 * air <= room) {
    // Both together are too tall: the ticked fields stay whole, and the window leans towards the card.
    top = card && card.top < ticks.top ? ticks.bottom + air - room : ticks.top - air;
  } else {
    top = (ticks ?? needed).top - air;
  }
  return Math.max(0, Math.min(top, Math.max(0, frameHeight - room)));
}

/**
 * How far a panel that scrolls on its own has to scroll to show these boxes (its own viewport's coordinates)
 * clear of both edges: 0 when they already are. Boxes that fit are centred, so the air above and below is the same;
 * boxes taller than the panel are lined up by their top, which is where they start.
 */
export function panelScroll(boxes: Span, panel: Span, air = 24): number {
  const room = panel.bottom - panel.top;
  if (boxes.top >= panel.top + air && boxes.bottom <= panel.bottom - air) return 0;
  if (boxes.bottom - boxes.top + 2 * air <= room) return (boxes.top + boxes.bottom) / 2 - (panel.top + panel.bottom) / 2;
  return boxes.top - panel.top - air;
}
