// ═══════════════════════════════════════════════════════════════════════════
// Demo CRM — the sales opportunities, open, won and lost
// ═══════════════════════════════════════════════════════════════════════════
//
// What it holds: one row per opportunity, with the customer it is for and the
// salesperson who owns it.
//
// Grain: one opportunity. Opportunities counts them all; Won and Lost count the
// closed ones by how they ended; Won Amount and Pipeline sum the deal amounts
// of the won ones and of the ones still open.
//
// Joins, both many_to_one, so no measure is multiplied: dash_demo.customers on
// customer_id, and dash_demo.employees on owner_employee_id, the salesperson.
// The generator writes them as LEFT joins.
//
// Win Rate is a measure of measures (type 'number'): the won opportunities as
// a share of the closed ones, won or lost. The open ones are not in it, because
// nobody knows yet how they end. That is the demo data's own definition.
//
// What it can answer: which lead source wins most often, how much is still in
// the pipeline and at which stage, which salesperson closes, by created or
// closed month, quarter or year.
//
// Data: dash_demo.crm_opportunities (2,400 opportunities created between
// 2024-01-01 and 2026-09-30): 718 won for 14,579,254.00, 1,397 lost, so a win
// rate of 33.95%; 285 still open, worth 5,255,334.00.
// ═══════════════════════════════════════════════════════════════════════════

cube {
  sql_table 'dash_demo.crm_opportunities'
  title 'Demo CRM'
  description 'Opportunities won, lost and still open, win rate and pipeline, by lead source, stage, salesperson and month'
  currency 'EUR'

  join {
    name 'dash_demo.customers'
    title 'Customers'
    description 'The customer the opportunity is for'
    sql '${CUBE}.customer_id = dash_demo.customers.customer_id'
    relationship 'many_to_one'
  }
  join {
    name 'dash_demo.employees'
    title 'Salespeople'
    description 'The salesperson who owns the opportunity'
    sql '${CUBE}.owner_employee_id = dash_demo.employees.employee_id'
    relationship 'many_to_one'
  }

  dimension {
    name 'OpportunityId'
    title 'Opportunity'
    description 'The opportunity number'
    sql '${CUBE}.opportunity_id'
    type 'number'
    primary_key true
  }
  dimension {
    name 'CreatedAt'
    title 'Created'
    description 'When the opportunity was opened. Group it by month, quarter or year'
    sql '${CUBE}.created_date'
    type 'time'
  }
  dimension {
    name 'ClosedAt'
    title 'Closed'
    description 'When the opportunity was won or lost. Empty while it is still open'
    sql '${CUBE}.closed_date'
    type 'time'
  }
  dimension {
    name 'Stage'
    title 'Stage'
    description 'prospecting, qualified, proposal or negotiation while it is open; won or lost once it is closed'
    sql '${CUBE}.stage'
    type 'string'
  }
  dimension {
    name 'LeadSource'
    title 'Lead Source'
    description 'Where the lead came from: referral, inbound, outbound, paid_search, event or partner'
    sql '${CUBE}.lead_source'
    type 'string'
  }
  dimension {
    name 'Salesperson'
    title 'Salesperson'
    description 'The salesperson who owns the opportunity'
    sql 'dash_demo.employees.name'
    type 'string'
  }
  dimension {
    name 'Segment'
    title 'Segment'
    description 'The segment the customer is in: Consumer, SMB or Enterprise'
    sql 'dash_demo.customers.segment'
    type 'string'
  }

  measure {
    name 'Opportunities'
    title 'Opportunities'
    description 'How many opportunities there are, open and closed'
    type 'count'
  }
  measure {
    name 'Won'
    title 'Won'
    description 'How many opportunities were won'
    type 'count'
    filters {
      filter sql: "\${CUBE}.stage = 'won'"
    }
  }
  measure {
    name 'Lost'
    title 'Lost'
    description 'How many opportunities were lost'
    type 'count'
    filters {
      filter sql: "\${CUBE}.stage = 'lost'"
    }
  }
  measure {
    name 'WinRatePct'
    title 'Win Rate'
    description 'The won opportunities as a share of the closed ones, won or lost, a fraction from 0.0 to 1.0 shown as a percentage. The open ones are not in it. PICK THIS WHEN: comparing lead sources or salespeople that do not work the same number of deals'
    sql '1.0 * ${Won} / NULLIF(${Won} + ${Lost}, 0)'
    type 'number'
    format 'percent'
  }
  measure {
    name 'WonAmount'
    title 'Won Amount'
    description 'What the won opportunities are worth'
    sql '${CUBE}.amount'
    type 'sum'
    format 'currency'
    filters {
      filter sql: "\${CUBE}.stage = 'won'"
    }
  }
  measure {
    name 'Pipeline'
    title 'Pipeline'
    description 'What the opportunities still open are worth. PICK THIS WHEN: the question is what may still come in, not what came in'
    sql '${CUBE}.amount'
    type 'sum'
    format 'currency'
    filters {
      filter sql: "\${CUBE}.stage NOT IN ('won', 'lost')"
    }
  }

  segment {
    name 'open'
    title 'Still open'
    description 'Opportunities nobody has won or lost yet'
    sql "\${CUBE}.stage NOT IN ('won', 'lost')"
  }
}
