"use client";

import { useEffect, useState } from "react";

/**
 * Wait for a specific rb-* custom element to be registered.
 *
 * The rb-webcomponents UMD bundle is loaded globally by RbWebComponentsLoader
 * (in app/layout.tsx). This hook returns `true` once the given tag name is
 * available in the customElements registry — either because the bundle was
 * already loaded when this widget mounted, or after the "rb-components-loaded"
 * event fires.
 *
 * Same pattern next-playground uses (see app/(main)/charts/page.tsx etc.):
 *   1. Check customElements.get(tagName) at mount.
 *   2. Otherwise, listen for the "rb-components-loaded" custom event.
 */
export function useRbElementReady(tagName: string): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (customElements.get(tagName)) {
      setReady(true);
      return;
    }
    const onLoaded = () => {
      if (customElements.get(tagName)) setReady(true);
    };
    window.addEventListener("rb-components-loaded", onLoaded);
    return () => window.removeEventListener("rb-components-loaded", onLoaded);
  }, [tagName]);

  return ready;
}
