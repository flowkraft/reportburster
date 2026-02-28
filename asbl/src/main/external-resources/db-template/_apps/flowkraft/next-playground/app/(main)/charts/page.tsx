"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, Copy } from "lucide-react"
import { rbConfig } from "@/lib/rb-config"
import { CodeBlock } from "@/components/CodeBlock"

type PageTab = "examples" | "configuration" | "usage"

interface Example {
  id: string
  title: string
  desc: string
}

interface Category {
  name: string
  examples: Example[]
}

const categories: Category[] = [
  {
    name: "Live Examples",
    examples: [
      { id: "monthlySalesTrend", title: "Line Chart", desc: "If a dashboard has one chart, it is a line showing a metric over time — revenue, pipeline, MRR, stock price, traffic. This dataset includes a seasonal dip in summer and a strong Q4 holiday spike to demonstrate trend visualization." },
      { id: "salesByRegion", title: "Bar Chart", desc: "A single metric compared across categories — the simplest bar chart users reach for. Sales by region, output by plant, income by source. Clear differences between regions make the bar comparisons immediately meaningful." },
      { id: "revenueVsExpenses", title: "Grouped Bar Chart", desc: "P&L side-by-side in every ERP and finance dashboard. Revenue vs Cost, This Year vs Last Year, Budget vs Actual — always two bars per category so managers can compare at a glance. Revenue grows each quarter but expenses grow faster in Q3 (investment), then normalize — the visual gap tells the P&L story." },
      { id: "expenseBreakdown", title: "Pie Chart", desc: "Where does the money go? Every finance team, every budget review, every department head meeting. Pie is the go-to for showing proportions of a whole — expense categories, revenue sources, cost centers. Salaries dominate (as they do in reality), with clear visual wedge differences." },
      { id: "revenueAndProfitMargin", title: "Dual Y-Axis Mixed Chart", desc: "Executive KPI dashboard: Revenue ($, bars, left axis) + Profit Margin (%, line, right axis). CFOs and VPs of Sales always want to see the dollar amount alongside the percentage in one view. Revenue grows but margin compresses in Q3 (investment quarter), then recovers — the inverse relationship tells the story." },
      { id: "quarterlyRevenueByProduct", title: "Stacked Bar Chart", desc: "How much of Q3 revenue came from each product line? Stacked bars show composition over time — extremely common in ERP product analytics, SaaS plan-level MRR breakdowns, and regional contribution reports. Software is the largest segment and growing, Services is stable, Support grows modestly." },
      { id: "portfolioAllocation", title: "Doughnut Chart", desc: "Financial apps: investment portfolio split, fund allocation, asset class weights. Also used for market share, product revenue mix. Doughnut with cutout is the modern alternative to pie when you want to show a KPI or total in the center hole. Classic 60/40 portfolio skew — equities dominate, bonds buffer, alternatives are a small slice." },
      { id: "budgetVsActual", title: "Area Chart", desc: "Financial planning: budget as a filled baseline area, actual as a dashed line overlay. January-March: under budget (good). April-May: over budget (warning). June-August: back on track. This pattern makes the overlay meaningful. Also used for sales target tracking, project spend monitoring, and forecast vs reality comparisons." },
      { id: "topCustomersByRevenue", title: "Horizontal Bar Chart", desc: "CRM ranking reports: Top 10 Customers, Top Products by Units Sold, Sales Leaderboard by Rep. Horizontal bars are the natural choice for ranked lists where category labels (company names) are long. Sorted descending so the biggest customer is on top." },
      { id: "employeePerformance", title: "Radar Chart", desc: "HR: comparing an employee's scores across 6-8 skill dimensions against the team average. This employee excels at Technical Skills and Problem Solving but falls below team average on Communication and Time Management — a realistic review profile. Also used for supplier evaluation scorecards and product feature comparison matrices." },
      { id: "customerSatisfaction", title: "Polar Area Chart", desc: "Customer success / quality teams: NPS or CSAT scores broken down by support channel (phone, email, chat, in-person). Each wedge's radius shows the score magnitude — useful when categories are not parts of a whole but each has an independent score. Live Chat scores highest, Social Media lowest — typical CSAT pattern where newer channels still lag traditional support." },
    ],
  },
]

const usageCode = `<rb-chart
  report-code="your-report-code"
  component-id="yourComponentId"
  api-base-url="\${apiBaseUrl}"
  api-key="\${apiKey}"
></rb-chart>`

export default function ChartsPage() {
  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<PageTab>("examples")
  const [configDsl, setConfigDsl] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (customElements.get("rb-chart")) {
      setIsReady(true)
      return
    }
    const handleLoaded = () => setIsReady(true)
    window.addEventListener("rb-components-loaded", handleLoaded)
    return () => window.removeEventListener("rb-components-loaded", handleLoaded)
  }, [])

  // Listen to first rb-chart for shared configDsl
  useEffect(() => {
    if (!isReady) return
    const el = document.querySelector('rb-chart[report-code="charts-examples"]') as any
    if (!el) return
    const handler = () => { if (el.configDsl) setConfigDsl(el.configDsl) }
    el.addEventListener("configLoaded", handler)
    el.addEventListener("dataFetched", handler)
    setTimeout(handler, 500)
    return () => {
      el.removeEventListener("configLoaded", handler)
      el.removeEventListener("dataFetched", handler)
    }
  }, [isReady])

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* ignore */ }
  }, [])

  const tabClass = (tab: PageTab) =>
    `pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
      activeTab === tab
        ? "border-rb-cyan text-rb-cyan"
        : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
    }`

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h4 className="text-2xl font-bold text-foreground mb-2">Charts</h4>
        <p className="text-muted-foreground mb-6">
          Data visualization powered by <code className="text-sm bg-muted text-foreground px-1 rounded">&lt;rb-chart&gt;</code>.
        </p>

        {/* Page-level tabs */}
        <div className="border-b border-border mb-0">
          <div className="flex space-x-6" role="tablist">
            <button id="examples-tab" role="tab" onClick={() => setActiveTab("examples")} className={tabClass("examples")}>Examples</button>
            <button id="config-tab" role="tab" onClick={() => setActiveTab("configuration")} className={tabClass("configuration")}>Configuration</button>
            <button id="usage-tab" role="tab" onClick={() => setActiveTab("usage")} className={tabClass("usage")}>Usage</button>
          </div>
        </div>

        <div className="bg-card border border-t-0 border-border rounded-b-lg p-4">
          {/* Examples Tab */}
          {activeTab === "examples" && (
            isReady ? (
              categories.map((category) => (
                <div key={category.name}>
                  <h5 className="text-lg font-bold mt-8 mb-4 pb-2 border-b-2 border-rb-cyan">
                    {category.name}
                  </h5>
                  {category.examples.map((example) => (
                    <div key={example.id} id={`example-${example.id}`} className="border border-border rounded-lg mb-4 overflow-hidden p-4">
                      <h6 className="font-semibold text-sm mb-1">{example.title}</h6>
                      <p className="text-xs text-muted-foreground mb-3">{example.desc}</p>
                      <div style={{ height: "400px" }}>
                        {/* @ts-expect-error - Web component custom element */}
                        <rb-chart
                          id={`rb-${example.id}`}
                          report-code="charts-examples"
                          component-id={example.id}
                          api-base-url={rbConfig.apiBaseUrl}
                          api-key={rbConfig.apiKey}
                          style={{ display: "block", width: "100%", height: "100%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">Loading web components...</div>
            )
          )}

          {/* Configuration Tab */}
          {activeTab === "configuration" && (
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-muted-foreground">Groovy DSL — shared configuration for all examples</span>
                <button onClick={() => copyToClipboard(configDsl, "config")} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted">
                  {copied === "config" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div id="configCode">
                <CodeBlock code={configDsl || "Loading configuration..."} language="groovy" style={{ maxHeight: "600px" }} />
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === "usage" && (
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-muted-foreground">HTML Usage</span>
                <button onClick={() => copyToClipboard(usageCode, "usage")} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted">
                  {copied === "usage" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div id="usageCode">
                <CodeBlock code={usageCode} language="markup" style={{ maxHeight: "600px" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
