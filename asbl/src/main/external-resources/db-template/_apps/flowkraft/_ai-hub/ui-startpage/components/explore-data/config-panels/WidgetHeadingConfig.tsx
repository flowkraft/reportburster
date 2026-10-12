"use client";

import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";

/** The words over a widget (#23): a title and a line under it, both optional. */
export function widgetHeadingOf(config: WidgetDisplayConfig | undefined): { title: string; subtitle: string; noData: string } {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  return { title: text(config?.widgetTitle), subtitle: text(config?.widgetSubtitle), noData: text(config?.noDataMessage) };
}

/**
 * The title and subtitle every data widget can carry, at the top of its Display tab. They are
 * written into the widget's display settings as typed, shown over the widget in the Canvas and over
 * its tile on the published page; empty, the widget shows none, as before.
 */
export function WidgetHeadingConfig({
  config,
  onChange,
}: {
  config: WidgetDisplayConfig;
  onChange: (config: WidgetDisplayConfig) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-xs text-base-content/60">Title</span>
        <input
          id="inputWidgetTitle"
          value={(config.widgetTitle as string) || ""}
          onChange={(e) => onChange({ ...config, widgetTitle: e.target.value })}
          placeholder="none"
          className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
        />
      </div>
      <div>
        <span className="text-xs text-base-content/60">Subtitle</span>
        <input
          id="inputWidgetSubtitle"
          value={(config.widgetSubtitle as string) || ""}
          onChange={(e) => onChange({ ...config, widgetSubtitle: e.target.value })}
          placeholder="none"
          className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
        />
      </div>
      {/* #30: what the widget says when its query answers no rows; empty, it shows what it always did. */}
      <div>
        <span className="text-xs text-base-content/60">When there is no data, say</span>
        <input
          id="inputNoDataMessage"
          value={(config.noDataMessage as string) || ""}
          onChange={(e) => onChange({ ...config, noDataMessage: e.target.value })}
          placeholder="nothing"
          className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
        />
      </div>
    </div>
  );
}
