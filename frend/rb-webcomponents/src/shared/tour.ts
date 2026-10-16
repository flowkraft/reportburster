/**
 * The arithmetic of a guided tour: where the highlight goes, where the card goes beside it, and the
 * words in the card. Nothing here touches the page, so every rule can be tested without a browser;
 * `RbTour.wc.svelte` measures the page, asks these, and draws what they answer.
 *
 * All boxes are in viewport coordinates (what `getBoundingClientRect` gives), because the highlight
 * and the card are drawn `position: fixed`: a page that scrolls, or a panel that scrolls inside it,
 * moves the target and not the coordinates' origin.
 */

export interface Box { left: number; top: number; width: number; height: number }
export interface Size { width: number; height: number }

/** The side of the target the card sits on; `center` is the card with no target (or no room beside it). */
export type Side = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface Placement {
  side: Side;
  left: number;
  top: number;
  /** Where the card's pointer sits along the card's edge, in px from its left (top/bottom) or top (left/right); -1 for none. */
  arrow: number;
}

/** What a step of a tour is. */
/** What a step points at: a CSS selector, an element, several of either, or a function giving them. */
export type TourTarget = string | Element | Array<string | Element> | (() => Element | Element[] | null | undefined);

export interface TourStep {
  /**
   * What the step points at: a CSS selector, an element, several of either (the highlight is the box
   * around all of them) or a function giving them, asked again whenever the page moves, so a table that
   * was drawn again is found again. No target: a card in the middle of a dimmed page.
   */
  target?: TourTarget;
  title?: string;
  /** Plain text; `**word**` is bold, a line break starts a new line, and nothing else is markup. */
  content: string;
  /** Runs when the step is reached going forward (not on Back), and is waited for: it may press a button on the reader's behalf. */
  before?: () => void | Promise<void>;
  /**
   * What to bring onto the screen when the step is shown, if that is not the first target: the whole panel the
   * targets are in, so all of them - not only the first - are seen together. Centred when it fits on the screen,
   * lined up by its top when it does not.
   */
  focus?: () => Element | null | undefined;
  /**
   * Changes the page for as long as this step is shown - going forward or Back - and returns what puts it all
   * back. The undo runs when the step is left (Next, Back, or the tour closing), so nothing is left changed.
   */
  during?: () => (() => void) | void;
  /** A target that is not on the page skips the step instead of showing a card pointing at nothing. */
  optional?: boolean;
  /**
   * Light each target by itself - one lit box round every one that can be seen - instead of one box round
   * them all. For targets that are scattered: a box round all of them would light everything between.
   * A target scrolled out of sight inside its panel is left out.
   */
  each?: boolean;
  /** A picture under the words: `celebrate` is the one for the end of a tour (see tour-art.ts). */
  art?: 'celebrate';
}

/** The pointer must stay this far from a corner of the card, so it never hangs off the rounded edge. */
const ARROW_INSET = 16;

export function toBox(rect: { left: number; top: number; width: number; height: number }): Box {
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

/** The one box around all of them; none when there is nothing to put a box around. */
export function unionBox(boxes: Box[]): Box | null {
  const real = boxes.filter((b) => b && (b.width > 0 || b.height > 0));
  if (real.length === 0) return null;
  const left = Math.min(...real.map((b) => b.left));
  const top = Math.min(...real.map((b) => b.top));
  const right = Math.max(...real.map((b) => b.left + b.width));
  const bottom = Math.max(...real.map((b) => b.top + b.height));
  return { left, top, width: right - left, height: bottom - top };
}

/** The part of a box inside the viewport. A target taller than the screen is lit as far as it is seen. */
export function clampBox(box: Box, view: Size): Box {
  const left = Math.max(0, box.left);
  const top = Math.max(0, box.top);
  const right = Math.min(view.width, box.left + box.width);
  const bottom = Math.min(view.height, box.top + box.height);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/** The lit box: the target and a little air round it, kept inside the viewport. */
export function spotlightBox(target: Box, padding: number, view: Size): Box {
  return clampBox({
    left: target.left - padding,
    top: target.top - padding,
    width: target.width + padding * 2,
    height: target.height + padding * 2,
  }, view);
}

function clamp(value: number, low: number, high: number): number {
  // A card wider than the room gets the low edge: it is cut on the right, never off the left.
  return Math.max(low, Math.min(value, Math.max(low, high)));
}

/**
 * Where the card goes. Below the target when it fits there, else above, else right, else left; when
 * the target leaves room on no side (a panel that fills the screen) the card sits at the bottom of the
 * screen with no pointer. Across the target it is centred on it and kept `margin` from the screen's edge.
 */
export function placeDialog(target: Box | null, dialog: Size, view: Size, gap = 14, margin = 12): Placement {
  if (!target) {
    return {
      side: 'center',
      left: Math.max(margin, (view.width - dialog.width) / 2),
      top: Math.max(margin, (view.height - dialog.height) / 2.2),
      arrow: -1,
    };
  }
  const room = {
    bottom: view.height - (target.top + target.height) - gap - margin,
    top: target.top - gap - margin,
    right: view.width - (target.left + target.width) - gap - margin,
    left: target.left - gap - margin,
  };
  const fits = {
    bottom: dialog.height <= room.bottom,
    top: dialog.height <= room.top,
    right: dialog.width <= room.right,
    left: dialog.width <= room.left,
  };
  const side = (['bottom', 'top', 'right', 'left'] as const).find((s) => fits[s]);
  if (!side) {
    return {
      side: 'center',
      left: Math.max(margin, (view.width - dialog.width) / 2),
      top: Math.max(margin, view.height - dialog.height - margin),
      arrow: -1,
    };
  }
  const centreX = target.left + target.width / 2;
  const centreY = target.top + target.height / 2;
  if (side === 'bottom' || side === 'top') {
    const left = clamp(centreX - dialog.width / 2, margin, view.width - dialog.width - margin);
    return {
      side,
      left,
      top: side === 'bottom' ? target.top + target.height + gap : target.top - gap - dialog.height,
      arrow: clamp(centreX - left, ARROW_INSET, dialog.width - ARROW_INSET),
    };
  }
  const top = clamp(centreY - dialog.height / 2, margin, view.height - dialog.height - margin);
  return {
    side,
    left: side === 'right' ? target.left + target.width + gap : target.left - gap - dialog.width,
    top,
    arrow: clamp(centreY - top, ARROW_INSET, dialog.height - ARROW_INSET),
  };
}

/**
 * Where the card goes, and which part of the frame the reader should be looking at, for a tour in a frame
 * that is as tall as the page inside it: the page around the frame is what scrolls, and what it can show at
 * once is `room` px of the frame, from `windowTop`.
 *
 * A target with an empty part, as wide as the card and as tall as it, gets the card there (`contents` says what is
 * not empty), centred in the window: nothing is covered. Otherwise: a target and its card that fit in the room one
 * above the other are centred in it, the card below the target.
 * A target that fits but leaves no room for the card above or below it is centred in the room and the card goes
 * beside it. A target taller than the room is lined up by its top, with the card on top of it at the bottom of
 * the room: its start is the part a reader needs. The card is always inside the window, so it is always seen.
 */
export function placeInWindow(
  target: Box,
  dialog: Size,
  frame: Size,
  room: number,
  gap = 14,
  margin = 12,
  contents?: () => Box[],
): { windowTop: number; place: Placement } {
  const onFrame = (top: number) => Math.max(0, Math.min(top, Math.max(0, frame.height - room)));
  // The room already keeps air from the page's header and from the screen's edge: a target that fills it is still whole.
  const fits = target.height <= room;
  if (contents && target.height >= dialog.height + 2 * margin) {
    // Where the target has an empty part the card can lie on, nothing is covered and nothing needs room around it.
    const top = onFrame(fits ? target.top + target.height / 2 - room / 2 : target.top - 2 * margin);
    const empty = placeInEmptySpace(target, contents(), dialog, top, room, margin);
    if (empty) return { windowTop: top, place: empty };
  }
  const free = room - (target.height + dialog.height + gap + margin);
  const windowTop = onFrame(free >= 0 ? target.top - free / 2 : fits ? target.top + target.height / 2 - room / 2 : target.top - 2 * margin);
  const inside = placeDialog({ ...target, top: target.top - windowTop }, dialog, { width: frame.width, height: room }, gap, margin);
  return { windowTop, place: { ...inside, top: inside.top + windowTop } };
}

/**
 * The card inside the target, where it covers nothing: a table that fills a third of its box leaves the rest
 * empty. `contents` are the boxes of what the target really shows (text, pictures, controls). The card keeps to
 * the part of the target the reader sees (`windowTop`..`windowTop + room`), goes to the right first and to the
 * left second, and as near the middle as it can. No pointer: it is on the target. Null when there is no such place.
 */
export function placeInEmptySpace(
  target: Box,
  contents: Box[],
  dialog: Size,
  windowTop: number,
  room: number,
  margin = 12,
): Placement | null {
  const lowest = Math.max(target.top, windowTop) + margin;
  const highest = Math.min(target.top + target.height, windowTop + room) - margin - dialog.height;
  if (highest < lowest) return null;
  const air = 8;
  const free = (left: number, top: number) =>
    !contents.some(
      (c) =>
        c.width > 0 && c.height > 0 &&
        c.left < left + dialog.width + air && c.left + c.width > left - air &&
        c.top < top + dialog.height + air && c.top + c.height > top - air,
    );
  const middle = (lowest + highest) / 2;
  const lefts = [target.left + target.width - margin - dialog.width, target.left + margin];
  for (const left of lefts) {
    if (left < target.left) continue;
    for (let d = 0; d <= highest - lowest; d += 8) {
      for (const top of d === 0 ? [middle] : [middle - d, middle + d]) {
        if (top >= lowest && top <= highest && free(left, top)) return { side: 'center', left, top, arrow: -1 };
      }
    }
  }
  return null;
}

/**
 * A step's sentence as HTML, with `**word**` bold. The text is escaped first and only `**…**`
 * becomes a `<strong>`, so what a story's author wrote can put no markup on the page.
 */
export function richText(text: string): string {
  const escaped = String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

/** The part of `box` that is inside `clip`, or an empty box (width 0) when they do not meet. */
export function intersectBox(box: Box, clip: Box): Box {
  const left = Math.max(box.left, clip.left);
  const top = Math.max(box.top, clip.top);
  const right = Math.min(box.left + box.width, clip.left + clip.width);
  const bottom = Math.min(box.top + box.height, clip.top + clip.height);
  if (right <= left || bottom <= top) return { left, top, width: 0, height: 0 };
  return { left, top, width: right - left, height: bottom - top };
}

/**
 * The path of a dimmed screen with a hole at each box (even-odd fill): what a tour draws to light
 * several separate boxes at once, which one shadow round one box cannot do.
 */
export function dimPath(view: Size, holes: Box[], radius: number = 6): string {
  let d = `M0 0H${view.width}V${view.height}H0Z`;
  for (const h of holes) {
    const r = Math.min(radius, h.width / 2, h.height / 2);
    d +=
      `M${h.left + r} ${h.top}h${h.width - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h.height - 2 * r}` +
      `a${r} ${r} 0 0 1 -${r} ${r}h-${h.width - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h.height - 2 * r}` +
      `a${r} ${r} 0 0 1 ${r} -${r}Z`;
  }
  return d;
}

/**
 * Boxes that touch or overlap (within `gap` px) become one box round both, so two ticks on neighbouring
 * rows are lit as one block instead of two rings crossing each other.
 */
export function mergeNear(boxes: Box[], gap: number = 0): Box[] {
  const out = boxes.map((b) => ({ ...b }));
  let again = true;
  while (again) {
    again = false;
    for (let i = 0; i < out.length && !again; i++) {
      for (let j = i + 1; j < out.length && !again; j++) {
        const a = out[i];
        const b = out[j];
        const apart =
          b.left > a.left + a.width + gap || a.left > b.left + b.width + gap ||
          b.top > a.top + a.height + gap || a.top > b.top + b.height + gap;
        if (!apart) {
          out[i] = unionBox([a, b])!;
          out.splice(j, 1);
          again = true;
        }
      }
    }
  }
  return out;
}
