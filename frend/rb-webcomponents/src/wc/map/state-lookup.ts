// US state name → USPS two-letter code (uppercase).
// Used by the choropleth "us_states" mode. The US Census TIGER GeoJSONs key
// states by STUSPS (e.g., "CA"), while data often arrives as full names
// ("California") or mixed case. This lookup handles the common variants.
//
// Also includes DC and the 5 populated US territories (PR, VI, GU, AS, MP) —
// the standard us-states.json excludes these but they're not harmful if a data
// row happens to reference one.

const CODES_BY_NAME: Record<string, string> = {
  alabama: "AL", al: "AL",
  alaska: "AK", ak: "AK",
  arizona: "AZ", az: "AZ",
  arkansas: "AR", ar: "AR",
  california: "CA", ca: "CA",
  colorado: "CO", co: "CO",
  connecticut: "CT", ct: "CT",
  delaware: "DE", de: "DE",
  "districtofcolumbia": "DC", "washingtondc": "DC", dc: "DC",
  florida: "FL", fl: "FL",
  georgia: "GA", ga: "GA",
  hawaii: "HI", hi: "HI",
  idaho: "ID", id: "ID",
  illinois: "IL", il: "IL",
  indiana: "IN", in: "IN",
  iowa: "IA", ia: "IA",
  kansas: "KS", ks: "KS",
  kentucky: "KY", ky: "KY",
  louisiana: "LA", la: "LA",
  maine: "ME", me: "ME",
  maryland: "MD", md: "MD",
  massachusetts: "MA", ma: "MA",
  michigan: "MI", mi: "MI",
  minnesota: "MN", mn: "MN",
  mississippi: "MS", ms: "MS",
  missouri: "MO", mo: "MO",
  montana: "MT", mt: "MT",
  nebraska: "NE", ne: "NE",
  nevada: "NV", nv: "NV",
  "newhampshire": "NH", nh: "NH",
  "newjersey": "NJ", nj: "NJ",
  "newmexico": "NM", nm: "NM",
  "newyork": "NY", ny: "NY",
  "northcarolina": "NC", nc: "NC",
  "northdakota": "ND", nd: "ND",
  ohio: "OH", oh: "OH",
  oklahoma: "OK", ok: "OK",
  oregon: "OR", or: "OR",
  pennsylvania: "PA", pa: "PA",
  "rhodeisland": "RI", ri: "RI",
  "southcarolina": "SC", sc: "SC",
  "southdakota": "SD", sd: "SD",
  tennessee: "TN", tn: "TN",
  texas: "TX", tx: "TX",
  utah: "UT", ut: "UT",
  vermont: "VT", vt: "VT",
  virginia: "VA", va: "VA",
  washington: "WA", wa: "WA",
  "westvirginia": "WV", wv: "WV",
  wisconsin: "WI", wi: "WI",
  wyoming: "WY", wy: "WY",
  // territories
  "puertorico": "PR", pr: "PR",
  "usvirginislands": "VI", "virginislands": "VI", vi: "VI",
  guam: "GU", gu: "GU",
  "americansamoa": "AS", as: "AS",
  "northernmarianaislands": "MP", mp: "MP",
};

/** Normalize a raw US-state value (name or abbreviation) → USPS 2-letter code
 *  uppercase, or null when unknown. Ignores punctuation / spaces / case. */
export function normalizeStateToUsps(raw: unknown): string | null {
  if (raw == null) return null;
  const key = String(raw).toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return null;
  return CODES_BY_NAME[key] ?? null;
}
