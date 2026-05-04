/*
 * Chart Examples Showcase
 *
 * This Groovy DSL is a thin pass-through wrapper over Chart.js (https://www.chartjs.org/).
 * Any configuration that Chart.js supports works here in the most direct/intuitive way possible.
 * Use these examples together with the Chart.js docs for the full picture.
 *
 * The DSL mirrors Chart.js structure 1:1:
 *   chart {
 *     type '...'
 *     data {
 *       labelField '...'        ← DSL-only: which reportData column → labels
 *       datasets {
 *         dataset {
 *           field '...'          ← DSL-only: which reportData column → data
 *           label '...'          ← everything else is native Chart.js
 *           backgroundColor '...'
 *         }
 *       }
 *     }
 *     options { ... }            ← native Chart.js options
 *   }
 *
 * Only TWO properties are DSL-specific: labelField and field.
 * Everything else is verbatim Chart.js vocabulary.
 *
 * ⚠️  IMPORTANT — These examples use named blocks as a SHOWCASE CONVENIENCE only
 *
 * ALL examples use chart('name') { ... } because they are packed into a
 * SINGLE report file so they can all be previewed in one place. The names keep
 * each example's config and data separate within this one showcase report.
 *
 * In real-world usage, the typical case is ONE chart per report.
 * Use the UNNAMED syntax — this is the default and correct starting point:
 *
 *   chart {               ← no name, no quotes, no parentheses
 *     type 'bar'
 *     data {
 *       labelField 'Month'
 *       datasets {
 *         dataset { field 'Revenue'; label 'Revenue ($)'; backgroundColor '#4e79a7' }
 *       }
 *     }
 *   }
 *
 * And in the data script: ctx.reportData(rows)  ← no name argument
 *
 * Use named blocks (chart('myId') { ... }) ONLY when a single report
 * needs multiple tabulators, charts, or pivot tables together — the
 * "Multi-Component Reports" aggregator pattern described at:
 * https://datapallas.com/docs/bi-analytics/dashboards#multi-component-reports
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 1 — Every dashboard has these (>90%)
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// #1  Monthly Sales Trend — Line Chart
//     THE universal chart. If a dashboard has one chart, it's a line showing
//     a metric over time — revenue, pipeline, MRR, stock price, traffic.
//     Used by: CRM, ERP, Finance, SaaS, Operations — every app type
// ─────────────────────────────────────────────────────────────────────────────
chart('monthlySalesTrend') {
  type 'line'
  data {
    labelField 'Month'
    datasets {
      dataset {
        field 'Revenue'
        label 'Monthly Revenue ($)'
        borderColor '#4e79a7'
        backgroundColor 'rgba(78, 121, 167, 0.1)'
        tension 0.3
        borderWidth 2
        pointRadius 4
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Monthly Sales Trend' }
      legend { position 'bottom' }
    }
    scales {
      y { beginAtZero true; title { display true; text 'Revenue ($)' } }
      x { title { display true; text 'Month' } }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// #2  Sales by Region — Bar Chart
//     A single metric compared across categories — the simplest bar chart
//     users reach for. "Sales by region", "output by plant", "income by source".
//     Used by: CRM, ERP, Finance, SaaS — every app type
// ─────────────────────────────────────────────────────────────────────────────
chart('salesByRegion') {
  type 'bar'
  data {
    labelField 'Region'
    datasets {
      dataset {
        field 'Sales'
        label 'Total Sales ($)'
        backgroundColor 'rgba(78, 121, 167, 0.7)'
        borderColor '#4e79a7'
        borderWidth 1
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Sales by Region' }
      legend { display false }
    }
    scales {
      y { beginAtZero true; title { display true; text 'Sales ($)' } }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// #3  Revenue vs Expenses — Grouped Bar Chart
//     P&L side-by-side in every ERP and finance dashboard. "Revenue vs Cost",
//     "This Year vs Last Year", "Budget vs Actual" — always two bars per
//     category so managers can compare at a glance.
//     Used by: ERP, Finance, SaaS — any app comparing two metrics side-by-side
// ─────────────────────────────────────────────────────────────────────────────
chart('revenueVsExpenses') {
  type 'bar'
  data {
    labelField 'Quarter'
    datasets {
      dataset {
        field 'Revenue'
        label 'Revenue'
        backgroundColor 'rgba(78, 121, 167, 0.7)'
        borderColor '#4e79a7'
        borderWidth 1
      }
      dataset {
        field 'Expenses'
        label 'Expenses'
        backgroundColor 'rgba(225, 87, 89, 0.7)'
        borderColor '#e15759'
        borderWidth 1
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Revenue vs Expenses by Quarter' }
      legend { position 'bottom' }
    }
    scales {
      y { beginAtZero true }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 2 — Very common (70-90%)
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// #4  Expense Breakdown — Pie Chart
//     "Where does the money go?" Every finance team, every budget review,
//     every department head meeting. Pie is the go-to for showing proportions
//     of a whole — expense categories, revenue sources, cost centers.
//     Used by: Finance, ERP, CRM, SaaS — any app showing proportions of a whole
// ─────────────────────────────────────────────────────────────────────────────
chart('expenseBreakdown') {
  type 'pie'
  data {
    labelField 'Category'
    datasets {
      dataset {
        field 'Amount'
        label 'Expenses'
        backgroundColor(['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'])
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Expense Breakdown by Category' }
      legend { position 'right' }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// #5  Revenue and Profit Margin — Dual Y-Axis Mixed Chart
//     Executive KPI dashboard: Revenue ($, bars, left axis) + Profit Margin
//     (%, line, right axis). CFOs and VPs of Sales always want to see the
//     dollar amount alongside the percentage in one view.
//     Used by: ERP, Finance, SaaS — executive dashboards correlating $ with %
// ─────────────────────────────────────────────────────────────────────────────
chart('revenueAndProfitMargin') {
  type 'bar'
  data {
    labelField 'Quarter'
    datasets {
      dataset {
        field 'Revenue'
        label 'Revenue ($)'
        backgroundColor 'rgba(78, 121, 167, 0.7)'
        borderColor '#4e79a7'
        borderWidth 1
        yAxisID 'y'
        order 1
      }
      dataset {
        field 'ProfitMargin'
        label 'Profit Margin (%)'
        type 'line'
        borderColor '#e15759'
        backgroundColor 'rgba(225, 87, 89, 0.1)'
        borderWidth 3
        pointRadius 5
        pointStyle 'circle'
        tension 0.3
        fill false
        yAxisID 'y1'
        order 0
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Revenue & Profit Margin' }
    }
    scales {
      y {
        type 'linear'
        position 'left'
        beginAtZero true
        title { display true; text 'Revenue ($)' }
      }
      y1 {
        type 'linear'
        position 'right'
        beginAtZero true
        max 100
        title { display true; text 'Margin (%)' }
        grid { drawOnChartArea false }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// #6  Quarterly Revenue by Product Line — Stacked Bar Chart
//     "How much of Q3 revenue came from each product line?" Stacked bars show
//     composition over time — extremely common in ERP product analytics,
//     SaaS plan-level MRR breakdowns, and regional contribution reports.
//     Used by: ERP, SaaS, Finance — composition analysis over time periods
// ─────────────────────────────────────────────────────────────────────────────
chart('quarterlyRevenueByProduct') {
  type 'bar'
  data {
    labelField 'Quarter'
    datasets {
      dataset {
        field 'Software'
        label 'Software'
        backgroundColor 'rgba(78, 121, 167, 0.8)'
      }
      dataset {
        field 'Services'
        label 'Professional Services'
        backgroundColor 'rgba(242, 142, 43, 0.8)'
      }
      dataset {
        field 'Support'
        label 'Support & Maintenance'
        backgroundColor 'rgba(89, 161, 79, 0.8)'
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Quarterly Revenue by Product Line' }
      legend { position 'bottom' }
      tooltip { mode 'index'; intersect false }
    }
    scales {
      x { stacked true }
      y { stacked true; beginAtZero true; title { display true; text 'Revenue ($)' } }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 3 — Common in specific domains (40-70%)
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// #7  Portfolio Allocation — Doughnut Chart
//     Financial apps: investment portfolio split, fund allocation, asset class
//     weights. Also used for market share, product revenue mix. Doughnut with
//     cutout is the modern alternative to pie when you want to show a KPI or
//     total in the center hole.
//     Used by: Finance, SaaS, CRM — portfolio views, market share, plan mix
// ─────────────────────────────────────────────────────────────────────────────
chart('portfolioAllocation') {
  type 'doughnut'
  data {
    labelField 'AssetClass'
    datasets {
      dataset {
        field 'Allocation'
        label 'Portfolio Weight (%)'
        backgroundColor(['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'])
        borderWidth 2
      }
    }
  }
  options {
    responsive true
    cutout '60%'
    plugins {
      title { display true; text 'Portfolio Allocation by Asset Class' }
      legend { position 'right' }
      tooltip { enabled true }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// #8  Budget vs Actual Spending — Area Chart (Line with Fill)
//     Financial planning: budget as a filled area, actual spend as a line
//     overlay. Also used for sales target tracking ("target zone" vs actual),
//     project spend monitoring, and forecast vs reality comparisons.
//     Used by: Finance, ERP, Operations — budget tracking, forecast vs actual
// ─────────────────────────────────────────────────────────────────────────────
chart('budgetVsActual') {
  type 'line'
  data {
    labelField 'Month'
    datasets {
      dataset {
        field 'Budget'
        label 'Budget'
        borderColor '#4e79a7'
        backgroundColor 'rgba(78, 121, 167, 0.3)'
        fill 'origin'
        tension 0.4
        pointRadius 3
      }
      dataset {
        field 'Actual'
        label 'Actual Spending'
        borderColor '#e15759'
        borderDash([5, 5])
        borderWidth 2
        fill false
        pointRadius 4
        pointStyle 'circle'
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Budget vs Actual Spending' }
      legend { position 'bottom' }
    }
    scales {
      y { beginAtZero true; title { display true; text 'Amount ($)' } }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// #9  Top 10 Customers by Revenue — Horizontal Bar Chart
//     CRM ranking reports: "Top 10 Customers", "Top Products by Units Sold",
//     "Sales Leaderboard by Rep". Horizontal bars are the natural choice for
//     ranked lists where category labels (company names) are long.
//     Key: indexAxis 'y' in options flips the bar orientation.
//     Used by: CRM, ERP, SaaS — ranked lists, leaderboards, Pareto analysis
// ─────────────────────────────────────────────────────────────────────────────
chart('topCustomersByRevenue') {
  type 'bar'
  data {
    labelField 'Customer'
    datasets {
      dataset {
        field 'Revenue'
        label 'Revenue ($)'
        backgroundColor 'rgba(89, 161, 79, 0.7)'
        borderColor '#59a14f'
        borderWidth 1
      }
    }
  }
  options {
    indexAxis 'y'
    responsive true
    plugins {
      title { display true; text 'Top 10 Customers by Revenue' }
      legend { display false }
    }
    scales {
      x { beginAtZero true; title { display true; text 'Revenue ($)' } }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 4 — Specialized but important (10-30%)
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// #10 Employee Performance Review — Radar Chart
//     HR: comparing an employee's scores across 6-8 skill dimensions against
//     the team average. Also used for supplier evaluation scorecards and
//     product feature comparison matrices.
//     Used by: HR, Operations, ERP — performance reviews, supplier scorecards
// ─────────────────────────────────────────────────────────────────────────────
chart('employeePerformance') {
  type 'radar'
  data {
    labelField 'Skill'
    datasets {
      dataset {
        field 'EmployeeScore'
        label 'Employee'
        borderColor '#4e79a7'
        backgroundColor 'rgba(78, 121, 167, 0.2)'
        pointRadius 4
        pointStyle 'rectRot'
      }
      dataset {
        field 'TeamAverage'
        label 'Team Average'
        borderColor '#e15759'
        backgroundColor 'rgba(225, 87, 89, 0.2)'
        pointRadius 4
        pointStyle 'circle'
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Performance Review: Skills Assessment' }
    }
    scales {
      r {
        beginAtZero true
        max 10
        ticks { stepSize 2 }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// #11 Customer Satisfaction by Channel — Polar Area Chart
//     Customer success / quality teams: NPS or CSAT scores broken down by
//     support channel (phone, email, chat, in-person). Each wedge's radius
//     shows the score magnitude — useful when categories aren't parts of a
//     whole but each has an independent score.
//     Used by: CRM, SaaS — customer success teams, NPS/CSAT analysis
// ─────────────────────────────────────────────────────────────────────────────
chart('customerSatisfaction') {
  type 'polarArea'
  data {
    labelField 'Channel'
    datasets {
      dataset {
        field 'SatisfactionScore'
        label 'CSAT Score'
        backgroundColor(['rgba(78,121,167,0.6)', 'rgba(242,142,43,0.6)', 'rgba(225,87,89,0.6)', 'rgba(118,183,178,0.6)', 'rgba(89,161,79,0.6)'])
      }
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Customer Satisfaction by Support Channel' }
      legend { position 'right' }
    }
    scales {
      r { beginAtZero true; max 100 }
    }
  }
}
