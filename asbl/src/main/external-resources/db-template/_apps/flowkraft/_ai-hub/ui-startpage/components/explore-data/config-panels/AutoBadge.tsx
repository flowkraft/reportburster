"use client";

import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";

/**
 * Tiny "(auto)" pill with a hover tooltip explaining why the field was picked.
 * Rendered next to dropdown labels in Config panels when a field is currently
 * showing its auto-picked default.
 */
export function AutoBadge({ reason }: { reason?: string }) {
  return (
    <span
      title={reason ?? "Auto-picked based on data shape."}
      className="ml-1 inline-flex items-center text-[9px] px-1 py-0 rounded-sm bg-primary/10 text-primary/70 font-medium uppercase tracking-wide border border-primary/15 cursor-help"
    >
      auto
    </span>
  );
}

/**
 * Is this config field currently showing its auto-picked default?
 *   1. Empty string / undefined / empty array → user hasn't set anything, widget
 *      falls back to auto-pick at render time.
 *   2. Field name appears in `config._autoPicked` → widget set the value via
 *      an Auto-* button, but the user hasn't manually overridden it yet.
 */
export function isAutoField(config: WidgetDisplayConfig, fieldName: string): boolean {
  const v = config[fieldName];
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  const autoList = config._autoPicked as string[] | undefined;
  if (Array.isArray(autoList) && autoList.includes(fieldName)) return true;
  return false;
}

/**
 * Strip a field name from the `_autoPicked` list — called when the user
 * manually edits that field via a config input.
 */
export function clearAutoFlag(
  config: WidgetDisplayConfig,
  fieldName: string,
): WidgetDisplayConfig {
  const list = config._autoPicked as string[] | undefined;
  if (!Array.isArray(list) || !list.includes(fieldName)) return config;
  return { ...config, _autoPicked: list.filter((f) => f !== fieldName) };
}
