// ═══════════════════════════════════════════════════════════════════════════
// Demo Web — the visits to the shop, and how many of them bought
// ═══════════════════════════════════════════════════════════════════════════
//
// What it holds: one row per web or app session, a sample of them: the demo
// data keeps one session in eight (dash_demo.as_of.web_session_sample_rate),
// so every purchase in it is one in eight of the real web and app orders.
//
// Grain: one session. Sessions counts the sampled sessions; the counts are an
// eighth of the traffic, the rates and the averages are the traffic's own, and
// they are what this cube is for.
//
// No joins: everything a session is split by - source, device, country - is on
// the session itself.
//
// Conversion is the sessions that bought as a share of all sessions; Checkout
// Conversion the sessions that bought as a share of the ones that reached the
// checkout. Both are measures of measures (type 'number'), the demo data's own
// definitions, so they follow every split.
//
// What it can answer: which traffic source converts, which device loses people
// at the checkout, how long a visit is, by month, quarter or year.
//
// Data: dash_demo.web_sessions (60,000 sampled sessions between 2024-01-01 and
// 2026-09-30): 3,964 reached the checkout and 2,263 bought, so 3.77% of the
// sessions converted and 57.09% of the checkouts.
// ═══════════════════════════════════════════════════════════════════════════

cube {
  sql_table 'dash_demo.web_sessions'
  title 'Demo Web'
  description 'Sessions, conversion and checkout conversion, pages and time on site, by traffic source, device, country and month'

  dimension {
    name 'SessionId'
    title 'Session'
    description 'The session number'
    sql '${CUBE}.session_id'
    type 'number'
    primary_key true
  }
  dimension {
    name 'StartedAt'
    title 'Started'
    description 'When the session started. Group it by month, quarter or year'
    sql '${CUBE}.started_ts'
    type 'time'
  }
  dimension {
    name 'TrafficSource'
    title 'Traffic Source'
    description 'Where the visitor came from: organic, paid_search, paid_social, email, referral or direct'
    sql '${CUBE}.traffic_source'
    type 'string'
  }
  dimension {
    name 'Device'
    title 'Device'
    description 'desktop, mobile or tablet'
    sql '${CUBE}.device'
    type 'string'
  }
  dimension {
    name 'CountryCode'
    title 'Country Code'
    description 'The two-letter code of the country the visit came from'
    sql '${CUBE}.country_code'
    type 'string'
  }

  measure {
    name 'Sessions'
    title 'Sessions'
    description 'How many sampled sessions there are: one in eight of the real ones'
    type 'count'
  }
  measure {
    name 'ReachedCheckout'
    title 'Reached Checkout'
    description 'How many sampled sessions got as far as the checkout'
    type 'count'
    filters {
      filter sql: '${CUBE}.reached_checkout = true'
    }
  }
  measure {
    name 'Purchases'
    title 'Purchases'
    description 'How many sampled sessions ended in a purchase'
    type 'count'
    filters {
      filter sql: '${CUBE}.purchased = true'
    }
  }
  measure {
    name 'ConversionPct'
    title 'Conversion'
    description 'The sessions that bought as a share of all sessions, a fraction from 0.0 to 1.0 shown as a percentage. PICK THIS WHEN: comparing traffic sources or devices that do not bring the same number of visits'
    sql '1.0 * ${Purchases} / NULLIF(${Sessions}, 0)'
    type 'number'
    format 'percent'
  }
  measure {
    name 'CheckoutConversionPct'
    title 'Checkout Conversion'
    description 'The sessions that bought as a share of the ones that reached the checkout, a fraction from 0.0 to 1.0 shown as a percentage. PICK THIS WHEN: the question is whether the checkout itself loses people'
    sql '1.0 * ${Purchases} / NULLIF(${ReachedCheckout}, 0)'
    type 'number'
    format 'percent'
  }
  measure {
    name 'AvgPages'
    title 'Average Pages'
    description 'How many pages a session viewed, on average'
    sql '${CUBE}.pages_viewed'
    type 'avg'
    format 'number'
  }
  measure {
    name 'AvgDurationSec'
    title 'Average Seconds'
    description 'How long a session lasted, in seconds, on average'
    sql '${CUBE}.duration_sec'
    type 'avg'
    format 'number'
  }

  segment {
    name 'reached_checkout'
    title 'Reached the checkout'
    description 'Sessions that got as far as the checkout'
    sql '${CUBE}.reached_checkout = true'
  }
}
