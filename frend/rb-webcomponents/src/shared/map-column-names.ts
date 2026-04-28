// Single source of truth for column-NAME predicates used by RbMap rendering.
//
// Pure name predicates, no type information, no data sampling. Callers with
// type info combine these with numeric/string checks (see the Next.js
// ui-startpage's `classification.ts` → `isState` / `isLatitude` / etc.).
//
// LOGIC-MIRRORED by hand in
//   asbl/.../ui-startpage/lib/data-canvas/smart-defaults/classification.ts
// The rsync-to-3-locations deploy pattern makes a single-file setup
// non-trivial. If you edit a keyword list or the tokenizer here, edit the
// mirror identically; diff the two files to detect drift.
//
// Why not strict-exact regex? CRM schemas routinely prefix geo columns
// (Orders.ShipCountry, Customers.BillingState, etc.). `/^country$/i` misses
// all of them. Tokenize camelCase+snake_case and match if the FIRST or LAST
// token is a geo keyword — head-or-tail match catches prefix AND suffix forms
// without the over-matching of "any token" (which would e.g. flag
// `contact_country_name` as a country column).

const STATE_KEYWORDS     = ["state", "province", "region", "us_state"];
const COUNTRY_KEYWORDS   = ["country", "nation", "iso_country", "iso2", "iso3"];
const LATITUDE_KEYWORDS  = ["lat", "latitude"];
const LONGITUDE_KEYWORDS = ["lon", "lng", "long", "longitude"];

/** Tokenize camelCase + snake_case → lowercase tokens.
 *    "ShipCountry"   → ["ship", "country"]
 *    "country_code"  → ["country", "code"]
 *    "Region"        → ["region"]
 */
function nameTokens(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .split(/[_\s]+/)
    .map((s) => s.toLowerCase())
    .filter(Boolean);
}

/** Match keyword against FIRST or LAST token only.
 *   - last token = "country" catches ShipCountry, BillingCountry, ...
 *   - first token = "country" catches country_code, country_name, ...
 */
function matchesHeadOrTail(name: string, keywords: string[]): boolean {
  const toks = nameTokens(name);
  if (toks.length === 0) return false;
  return keywords.includes(toks[0]) || keywords.includes(toks[toks.length - 1]);
}

export const isStateColumnName     = (name: string): boolean => matchesHeadOrTail(name, STATE_KEYWORDS);
export const isCountryColumnName   = (name: string): boolean => matchesHeadOrTail(name, COUNTRY_KEYWORDS);
export const isLatitudeColumnName  = (name: string): boolean => matchesHeadOrTail(name, LATITUDE_KEYWORDS);
export const isLongitudeColumnName = (name: string): boolean => matchesHeadOrTail(name, LONGITUDE_KEYWORDS);

/** True when the column set contains both a latitude-named and a
 *  longitude-named column — the prerequisite for "pin" map mode. */
export function hasLatLonColumnNames(names: string[]): boolean {
  return names.some(isLatitudeColumnName) && names.some(isLongitudeColumnName);
}

/** Pick a lat column name from the set, null if none. */
export function findLatitudeColumn(names: string[]): string | null {
  return names.find(isLatitudeColumnName) ?? null;
}

/** Pick a lon column name from the set, null if none. */
export function findLongitudeColumn(names: string[]): string | null {
  return names.find(isLongitudeColumnName) ?? null;
}

/** Name-based region detection. Returns the region type when one of the
 *  column names looks like a state or country column; null otherwise. */
export function detectMapRegionFromNames(
  names: string[],
): "us_states" | "world_countries" | null {
  if (names.some(isStateColumnName)) return "us_states";
  if (names.some(isCountryColumnName)) return "world_countries";
  return null;
}

/** Top-level map-mode guess from column names alone. */
export function detectMapModeFromNames(
  names: string[],
): "pin" | "region" | null {
  if (hasLatLonColumnNames(names)) return "pin";
  if (detectMapRegionFromNames(names)) return "region";
  return null;
}
