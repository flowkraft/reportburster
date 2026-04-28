"use client";

import { Map as MapIcon, Globe, MapPin, Grid3x3 } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import type { PickShape } from "@/lib/explore-data/smart-defaults/widget-picker";
import { dimensionsOf, measuresOf } from "@/lib/explore-data/widget-defaults";
import { AutoBadge, isAutoField, clearAutoFlag } from "./AutoBadge";

const MAP_TYPES = [
  { type: "auto",   icon: MapIcon, label: "Auto" },
  { type: "region", icon: Globe,   label: "Region" },
  { type: "pin",    icon: MapPin,  label: "Pins" },
  { type: "grid",   icon: Grid3x3, label: "Grid" },
];

const REGIONS = [
  { value: "auto",             label: "Auto-detect" },
  { value: "world_countries",  label: "World countries" },
  { value: "us_states",        label: "US states" },
];

interface MapConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  /** Pre-classified dims/measures view from the widget record.  MapConfig
   *  reads its dropdown contents from this shape (via `dimensionsOf` /
   *  `measuresOf`) instead of re-filtering `columns` by `getFieldKind` at
   *  every render — keeping us aligned with the "one computation, one
   *  cache, everyone reads the same view" rule.  Nullable so we gracefully
   *  handle the pre-query / pre-schema-fetch state. */
  shape: PickShape | null;
  onChange: (config: WidgetDisplayConfig) => void;
}

export function MapConfig({ config, columns, shape, onChange }: MapConfigProps) {
  const mapType  = (config.mapType  as string) || "auto";
  const region   = (config.region   as string) || "auto";
  const dimension = (config.dimension as string) || "";
  const metric    = (config.metric    as string) || "";
  const latField  = (config.latField  as string) || "";
  const lonField  = (config.lonField  as string) || "";

  const dimensions = dimensionsOf(columns, shape);
  const measures   = measuresOf(columns, shape);

  const showRegionFields = mapType === "region" || mapType === "auto";
  const showLatLonFields = mapType === "pin" || mapType === "grid" || mapType === "auto";

  return (
    <div id="configPanel-map" className="space-y-3">
      {/* Map type picker */}
      <div>
        <span className="text-xs text-muted-foreground">
          Map type
          {isAutoField(config, "mapType") && (
            <AutoBadge reason="Picked from data shape (state/country → region; lat+lon → pins; binned lat+lon → grid)." />
          )}
        </span>
        <div className="flex gap-1 mt-1">
          {MAP_TYPES.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              id={`btnMapType-${type}`}
              aria-pressed={mapType === type}
              onClick={() => onChange(clearAutoFlag({ ...config, mapType: type }, "mapType"))}
              className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-md text-[11px] transition-colors ${
                mapType === type
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Region picker — only when region / auto */}
      {showRegionFields && (
        <div>
          <span className="text-xs text-muted-foreground">Region</span>
          <select
            value={region}
            onChange={(e) => onChange(clearAutoFlag({ ...config, region: e.target.value }, "region"))}
            className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Dimension — only when region / auto */}
      {showRegionFields && (
        <div>
          <span className="text-xs text-muted-foreground">
            Location <span className="text-blue-500">(dimension)</span>
            {isAutoField(config, "dimension") && (
              <AutoBadge reason="Picked from the first non-numeric, non-ID column (looks like country/state names)." />
            )}
          </span>
          <select
            value={dimension}
            onChange={(e) => onChange(clearAutoFlag({ ...config, dimension: e.target.value }, "dimension"))}
            className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            <option value="">Auto-detect</option>
            {dimensions.map((c) => (
              <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Lat / Lon — only when pin / grid / auto */}
      {showLatLonFields && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">Latitude</span>
            <select
              value={latField}
              onChange={(e) => onChange({ ...config, latField: e.target.value })}
              className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
            >
              <option value="">Auto-detect</option>
              {measures.map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Longitude</span>
            <select
              value={lonField}
              onChange={(e) => onChange({ ...config, lonField: e.target.value })}
              className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
            >
              <option value="">Auto-detect</option>
              {measures.map((c) => (
                <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Metric — always relevant (drives color intensity in region/grid, popup data in pin) */}
      <div>
        <span className="text-xs text-muted-foreground">
          Metric <span className="text-emerald-500">(measure)</span>
          {isAutoField(config, "metric") && (
            <AutoBadge reason="First numeric column (ID columns excluded)." />
          )}
        </span>
        <select
          value={metric}
          onChange={(e) => onChange(clearAutoFlag({ ...config, metric: e.target.value }, "metric"))}
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          <option value="">Auto-detect</option>
          {measures.map((c) => (
            <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
