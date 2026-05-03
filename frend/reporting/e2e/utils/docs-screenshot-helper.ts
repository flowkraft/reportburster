// ═══════════════════════════════════════════════════════════════════════════════
// docs-screenshot-helper — shared utilities for the screenshot specs that
// produce PNGs consumed by the reportburster.com docs site.
//
// Provides two capture flavors:
//
//   captureDocsScreenshot(page, filename)
//     Plain viewport screenshot saved into the docs repo.
//
//   captureDocsScreenshotWithOverlay(page, filename, overlay)
//     Same, but with an HTML overlay injected into the page just before
//     capture (and removed afterwards) — used to reproduce the "compound
//     layered" visual style of the existing manual screenshots, where the
//     primary UI is captured together with a callout / tooltip / popup.
//
// The DOCS_IMAGES_DIR constant resolves the absolute path to the docs repo's
// `public/images/docs/` folder. Six levels up from this file lands on
// `c:\Projects`, then sideways into kraft-src-company-biz.
// ═══════════════════════════════════════════════════════════════════════════════

import { Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as jetpack from 'fs-jetpack';

/**
 * Absolute path to the docs repo's `public/images/docs/` folder.
 *
 * This file lives at `e2e/utils/`, so 5 `..` hops up land on `c:\Projects`:
 *   utils → e2e → reporting → frend → reportburster → c:\Projects
 * then sideways into the docs repo.
 */
export const DOCS_IMAGES_DIR = path.resolve(
  __dirname,
  '..', '..', '..', '..', '..',
  'kraft-src-company-biz', 'flowkraft', 'www', 'reportburster.com',
  'public', 'images', 'docs',
);

/** Take a viewport screenshot and save it directly into the docs repo. */
export async function captureDocsScreenshot(page: Page, filename: string): Promise<void> {
  await jetpack.dirAsync(DOCS_IMAGES_DIR);
  const fullPath = path.join(DOCS_IMAGES_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  console.log(`[screenshot] ${filename} → ${fullPath}`);
}

export interface OverlaySpec {
  /** Inline CSS for the overlay container — typically positioning, size, background. */
  cssText: string;
  /** Inner HTML of the overlay — text, checkboxes, arrows, etc. */
  html: string;
}

/**
 * Inject a styled HTML overlay into the live page, take the screenshot
 * (so the overlay is rasterized as part of the same image), then remove the
 * overlay so it doesn't leak into the next capture.
 *
 * Use for any callout, tooltip, arrow or highlight box that the docs reader
 * sees together with the primary UI but that isn't part of any real app state.
 */
export async function captureDocsScreenshotWithOverlay(
  page: Page,
  filename: string,
  overlay: OverlaySpec,
): Promise<void> {
  await page.evaluate((spec) => {
    const div = document.createElement('div');
    div.id = '__docscreen_overlay';
    div.style.cssText = `position:fixed;z-index:99999;pointer-events:none;${spec.cssText}`;
    div.innerHTML = spec.html;
    document.body.appendChild(div);
  }, overlay);
  // Brief settle so the browser paints the new layer before the screenshot.
  await page.waitForTimeout(150);
  await captureDocsScreenshot(page, filename);
  await page.evaluate(() => document.getElementById('__docscreen_overlay')?.remove());
}

export interface HighlightSpec {
  /**
   * CSS selector (or a Locator whose first matching element selector we can
   * resolve via `evaluate`) for the element to highlight. The outline is
   * applied DIRECTLY to that element via inline styles, so it can never
   * drift relative to the rendered button.
   */
  target: Locator;
  /** Optional callout text rendered just below the highlighted element. */
  calloutText?: string;
}

/**
 * Highlight a target element by applying a discreet outline directly to its
 * own DOM node (so the outline can never drift), inject a callout positioned
 * relative to the live element, take the screenshot, then revert.
 *
 * Why this over the previous sharp+bbox approach:
 *  - Sharp+bbox drew the rectangle from a Playwright `boundingBox()` call
 *    captured a beat before the screenshot. Any layout settle between bbox
 *    and capture (e.g. a connection dropdown re-render) shifted the button
 *    but not the rect → visible misalignment.
 *  - Applying the outline as inline CSS on the element itself means the
 *    rectangle is laid out by the browser at the moment the screenshot is
 *    taken — no coordinate math, no drift.
 *  - The callout is positioned relative to `getBoundingClientRect()` *inside*
 *    `page.evaluate` so it's also computed live, and its z-index is high
 *    enough to clear stacked Bootstrap modal backdrops.
 */
export async function captureDocsScreenshotWithHighlight(
  page: Page,
  filename: string,
  spec: HighlightSpec,
): Promise<void> {
  await spec.target.waitFor({ state: 'visible', timeout: 10_000 });
  await spec.target.scrollIntoViewIfNeeded().catch(() => {});

  // Strategy: apply `box-shadow: inset` directly on the element — this draws
  // the highlight rectangle INSIDE the button's own border box, where it's
  // part of the element's own paint. It cannot be clipped by any ancestor
  // overflow:hidden, cannot be covered by sibling backgrounds, and doesn't
  // depend on z-index / Bootstrap modal stacking contexts (which is why the
  // previous position:fixed overlay div approach silently failed inside the
  // cube modal — fixed-positioned children of body weren't rendering above
  // the modal's stacking context).
  //
  // The callout is appended to the same element's nearest .modal-content (or
  // body fallback) so it inherits the same stacking context as the modal.
  await spec.target.evaluate((el: HTMLElement, calloutText: string | undefined) => {
    const escapeHtml = (s: string): string =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Save originals so we can restore later.
    el.dataset.docscreenPrevShadow = el.style.boxShadow ?? '';
    el.dataset.docscreenPrevTransition = el.style.transition ?? '';

    // box-shadow: inset = drawn INSIDE the element. Multiple shadows stack:
    //   1. 3px solid blue inner border
    //   2. soft 8px inner glow
    el.style.transition = 'none';
    el.style.boxShadow =
      'inset 0 0 0 3px #2563eb, inset 0 0 0 8px rgba(37, 99, 235, 0.18)';

    if (calloutText) {
      const rect = el.getBoundingClientRect();
      const callout = document.createElement('div');
      callout.id = '__docscreen_highlight_callout';
      const lines = calloutText.split('\n');
      callout.style.cssText = [
        'position: fixed',
        `left: ${Math.round(rect.left)}px`,
        `top: ${Math.round(rect.bottom + 12)}px`,
        'width: 320px',
        'background: #ffffff',
        'border: 1px solid #2563eb',
        'border-left: 4px solid #2563eb',
        'border-radius: 4px',
        'padding: 8px 12px',
        "font-family: 'Source Sans Pro', Arial, sans-serif",
        'color: #1e293b',
        'box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18)',
        'z-index: 99999',
        'pointer-events: none',
      ].join('; ') + ';';
      const headHtml = `<div style="font-weight:600; font-size:13px; color:#2563eb;">↑ ${escapeHtml(lines[0] ?? '')}</div>`;
      const tailHtml = lines[1]
        ? `<div style="font-size:12px; color:#475569; margin-top:2px; line-height:1.4;">${escapeHtml(lines[1])}</div>`
        : '';
      callout.innerHTML = headHtml + tailHtml;
      // Append the callout INSIDE the modal-content so it shares the modal's
      // stacking context (z-index 1050+) instead of competing with it from
      // body. If there's no modal, fall back to body.
      const modalContent = el.closest('.modal-content') as HTMLElement | null;
      (modalContent ?? document.body).appendChild(callout);
    }
  }, spec.calloutText);

  await page.waitForTimeout(150);

  await jetpack.dirAsync(DOCS_IMAGES_DIR);
  const fullPath = path.join(DOCS_IMAGES_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: false });

  await spec.target.evaluate((el: HTMLElement) => {
    document.getElementById('__docscreen_highlight_callout')?.remove();
    el.style.boxShadow = el.dataset.docscreenPrevShadow ?? '';
    el.style.transition = el.dataset.docscreenPrevTransition ?? '';
    delete el.dataset.docscreenPrevShadow;
    delete el.dataset.docscreenPrevTransition;
  });

  console.log(`[screenshot+highlight] ${filename} → ${fullPath}`);
}
