"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, Copy } from "lucide-react"
import { rbConfig } from "@/lib/rb-config"
import { CodeBlock } from "@/components/CodeBlock"

type PageTab = "examples" | "configuration" | "usage"

interface PivotExample {
  id: string
  title: string
  desc: string
}

interface PivotCategory {
  name: string
  examples: PivotExample[]
}

const pivotCategories: PivotCategory[] = [
  {
    name: "Fundamentals",
    examples: [
      { id: "salesByRegionSum", title: "Basic Sum Pivot Table", desc: "One row dimension, one value field, Sum aggregation — the four properties every pivot config needs. Groups revenue by region." },
      { id: "orderCountByProductQuarter", title: "Cross-Tabulation", desc: "Adding cols turns a flat list into a matrix. Products form rows, quarters form columns, Count aggregator tallies orders per cell." },
      { id: "revenueMultiDimension", title: "Multi-Dimension", desc: "Multiple entries in rows and cols create nested hierarchies — region then country on the left, product line across the top." },
      { id: "avgOrderValueByChannel", title: "Average Aggregator", desc: "Average instead of Sum reveals that Enterprise orders are 10x the size of Marketplace orders — information hidden when you only look at totals." },
    ],
  },
  {
    name: "Filtering & Sorting",
    examples: [
      { id: "filteredByStatus", title: "Value Filter", desc: "valueFilter removes specific dimension values before any calculation runs. Here Inactive and Pending records are excluded — only Active revenue shown." },
      { id: "sortedRevenue", title: "Sorted by Value Descending", desc: "rowOrder value_z_to_a ranks rows by aggregated total (highest revenue first), colOrder key_a_to_z keeps years chronological. Standard executive summary layout." },
      { id: "customSorters", title: "Custom Sort Order", desc: "sorters overrides alphabetical ordering with a business-specific sequence: West → Central → East → International, matching sales org structure." },
    ],
  },
  {
    name: "Renderers",
    examples: [
      { id: "pipelineHeatmap", title: "Heatmap", desc: "Table Heatmap colors every cell relative to the global maximum. Spot the single biggest number at a glance — Nora's Negotiation deals stand out as the peak." },
      { id: "pipelineGroupedBar", title: "Grouped Bar Chart", desc: "One bar per column value side by side for each row. Three bars per deal stage — one per sales rep — compare individual contributions within a stage." },
      { id: "pipelineLineChart", title: "Line Chart", desc: "One line per sales rep across deal stages shows pipeline trajectory. All reps peak at Negotiation before dropping at Closed Won — the classic funnel shape." },
    ],
  },
  {
    name: "Aggregators",
    examples: [
      { id: "revenuePerUnit", title: "Revenue per Unit (Ratio)", desc: "Sum over Sum divides revenue by quantity — producing price-per-unit. Widget B commands ~$800/unit (premium), Gadget X ~$155/unit (volume play)." },
      { id: "fractionOfTotal", title: "Percentage of Total", desc: "Sum as Fraction of Total converts raw numbers into percentages. North America Software alone accounts for nearly a third of all revenue." },
      { id: "countUniqueValues", title: "Count Distinct", desc: "Count Unique Values counts distinct values, not row count. Answers: how many different products were ordered per region per quarter?" },
    ],
  },
  {
    name: "Advanced",
    examples: [
      { id: "derivedAttributes", title: "Derived Attributes (Year from Date)", desc: "derivedAttributes creates new dimensions from existing fields at render time — year and quarter extracted from raw orderDate timestamps." },
      { id: "fieldVisibility", title: "Field Visibility Controls", desc: "Three levels: hiddenAttributes removes fields entirely (IDs), hiddenFromAggregators prevents sum/avg (names), hiddenFromDragDrop locks fields in place." },
    ],
  },
]

const usageCode = `<rb-pivot-table
  report-code="your-report-code"
  component-id="yourComponentId"
  api-base-url="\${apiBaseUrl}"
  api-key="\${apiKey}"
></rb-pivot-table>`

type SoTab = "pivot" | "rawdata" | "config" | "usage"

const soUsageCode = `<rb-pivot-table
  report-code="piv-examples"
  component-id="salesOverview"
  api-base-url="\${apiBaseUrl}"
  api-key="\${apiKey}"
></rb-pivot-table>`

function SalesOverviewSection({ copyFn, copiedKey }: { copyFn: (text: string, key: string) => void; copiedKey: string | null }) {
  const [soTab, setSoTab] = useState<SoTab>("pivot")
  const [soConfigDsl, setSoConfigDsl] = useState("")

  useEffect(() => {
    const el = document.getElementById("demoPivot") as any
    if (!el) return
    const handler = () => { if (el.configDsl) setSoConfigDsl(el.configDsl) }
    el.addEventListener("configLoaded", handler)
    el.addEventListener("dataFetched", handler)
    setTimeout(handler, 500)
    return () => {
      el.removeEventListener("configLoaded", handler)
      el.removeEventListener("dataFetched", handler)
    }
  }, [])

  const soTabClass = (tab: SoTab) =>
    `pb-2 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
      soTab === tab
        ? "border-rb-cyan text-rb-cyan"
        : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
    }`

  const stepCardClass = "bg-card border border-border rounded-md p-4 mb-3"
  const stepTitleClass = "font-semibold text-foreground mb-2"
  const actionClass = "font-mono bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm text-indigo-800 dark:text-indigo-200"
  const insightClass = "text-emerald-600 dark:text-emerald-400 italic"

  return (
    <div>
      <h5 className="text-lg font-bold mt-8 mb-4 pb-2 border-b-2 border-rb-cyan">
        Putting It All Together
      </h5>

      <div className="border border-border rounded-lg mb-4 overflow-hidden p-4">
        <h6 className="font-semibold text-sm mb-1">Sales Overview — Region × Product × Quarter</h6>
        <p className="text-xs text-muted-foreground mb-3">64 rows of sales data (4 Regions × 4 Products × 4 Quarters). Drag, filter, aggregate, visualize — instant analysis grid.</p>

        {/* Inner tabs */}
        <div className="border-b border-border mb-3">
          <div className="flex space-x-4" role="tablist">
            <button id="so-pivot-tab" role="tab" onClick={() => setSoTab("pivot")} className={soTabClass("pivot")}>Pivot Table</button>
            <button id="so-rawdata-tab" role="tab" onClick={() => setSoTab("rawdata")} className={soTabClass("rawdata")}>Raw Data</button>
            <button id="so-config-tab" role="tab" onClick={() => setSoTab("config")} className={soTabClass("config")}>Configuration</button>
            <button id="so-usage-tab" role="tab" onClick={() => setSoTab("usage")} className={soTabClass("usage")}>Usage</button>
          </div>
        </div>

        {/* Pivot Table Tab */}
        {soTab === "pivot" && (
          <div>
            {/* @ts-expect-error - Web component custom element */}
            <rb-pivot-table
              id="demoPivot"
              report-code="piv-examples"
              component-id="salesOverview"
              api-base-url={rbConfig.apiBaseUrl}
              api-key={rbConfig.apiKey}
              style={{ display: "block", width: "100%" }}
            />

            {/* How to Use narrative */}
            <div className="bg-muted text-foreground rounded-lg p-6 mt-8">
              <h5 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
                How to Use This Pivot Table
              </h5>

              <p className="mb-4">
                <strong>What you&apos;re looking at:</strong> 64 rows of sales data &mdash; 4 Regions &times; 4 Products &times; 4 Quarters.
                The pivot table transforms this into an instant analysis grid. No SQL, no formulas.
              </p>

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">Quick Actions (Try These Now)</h6>

              <div className={stepCardClass}>
                <div className={stepTitleClass}>1. Change the Metric</div>
                <p className="mb-1">Current: <span className={actionClass}>Sum of Revenue</span></p>
                <p className="mb-1"><strong>Try:</strong> Click the <span className={actionClass}>Revenue ▼</span> dropdown (top area) → Select <strong>Profit</strong></p>
                <p className={`mb-0 ${insightClass}`}>→ Now see profit margins. High revenue but low profit? You&apos;ll spot it instantly.</p>
              </div>

              <div className={stepCardClass}>
                <div className={stepTitleClass}>2. Rearrange Dimensions</div>
                <p className="mb-1"><strong>Try:</strong> Drag <span className={actionClass}>Quarter</span> from columns → Drop into rows below Region</p>
                <p className={`mb-0 ${insightClass}`}>→ Now quarters are rows. &quot;Which quarter was strongest?&quot; — see row totals immediately.</p>
              </div>

              <div className={stepCardClass}>
                <div className={stepTitleClass}>3. Add a Dimension</div>
                <p className="mb-1"><strong>Try:</strong> Drag <span className={actionClass}>SalesRep</span> from unused area → Drop into rows after Product</p>
                <p className={`mb-0 ${insightClass}`}>→ See Region → Product → SalesRep hierarchy. &quot;Who sold most Laptops in North?&quot; — answered.</p>
              </div>

              <div className={stepCardClass}>
                <div className={stepTitleClass}>4. Filter Data</div>
                <p className="mb-1"><strong>Try:</strong> Click the <span className={actionClass}>▼</span> triangle next to Region → Uncheck North and West</p>
                <p className={`mb-0 ${insightClass}`}>→ Table now shows ONLY South and East. Focus on what matters.</p>
              </div>

              <div className={stepCardClass}>
                <div className={stepTitleClass}>5. Change Aggregation</div>
                <p className="mb-1"><strong>Try:</strong> Click <span className={actionClass}>Sum ▼</span> dropdown (top left) → Select <strong>Average</strong></p>
                <p className={`mb-0 ${insightClass}`}>→ See average per transaction, not totals. &quot;Are Q4 prices higher or just more volume?&quot;</p>
              </div>

              <div className={stepCardClass}>
                <div className={stepTitleClass}>6. Visualize as Chart</div>
                <p className="mb-1"><strong>Try:</strong> Click <span className={actionClass}>Table ▼</span> dropdown → Select <strong>Grouped Column Chart</strong></p>
                <p className={`mb-0 ${insightClass}`}>→ Same data, visual format. Trends jump out. Try &quot;Stacked Bar&quot; or &quot;Line Chart&quot; too.</p>
              </div>

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">Real Business Questions This Answers</h6>
              <ul className="space-y-1 mb-0">
                <li><strong>&quot;Which product is our cash cow?&quot;</strong> — Put Product in rows, look at Totals column. Laptop has the highest revenue.</li>
                <li><strong>&quot;Is East region underperforming?&quot;</strong> — Compare region totals in the current view. Spot gaps instantly.</li>
                <li><strong>&quot;Who gets the sales bonus?&quot;</strong> — Drag SalesRep to rows, sort by totals. Highest revenue wins.</li>
                <li><strong>&quot;Are we profitable or just busy?&quot;</strong> — Switch from Revenue to Profit. High revenue + low margins? Now you see it.</li>
              </ul>

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">The Point: Why This Matters</h6>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-1"><strong>Without pivot table:</strong></p>
                  <pre className="bg-[#1e1e1e] text-[#9cdcfe] font-mono text-xs p-3 rounded-md">
{`-- Question 1: Revenue by region
SELECT Region, SUM(Revenue)
FROM sales GROUP BY Region;

-- Question 2: Revenue by product
SELECT Product, SUM(Revenue)
FROM sales GROUP BY Product;

-- 20 more queries for different angles...`}
                  </pre>
                </div>
                <div>
                  <p className="mb-1"><strong>With pivot table:</strong></p>
                  <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-md mt-2">
                    <strong>✓</strong> Drag Region to rows → Question 1 answered<br />
                    <strong>✓</strong> Drag Product instead → Question 2 answered<br />
                    <strong>✓</strong> 3 seconds total, no coding<br />
                    <strong>✓</strong> 1000 ways to slice the same data
                  </div>
                </div>
              </div>

              <p className="mt-4 mb-0">
                <strong>Bottom line:</strong> Pivot tables = SQL GROUP BY + Excel formulas + visualization — combined.
                Drag and drop. Instant answers. Questions answered faster = better decisions.
              </p>
            </div>
          </div>
        )}

        {/* Raw Data Tab */}
        {soTab === "rawdata" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              This is the raw source data (64 rows) that feeds the pivot table.
            </p>
            {/* @ts-expect-error - Web component custom element */}
            <rb-tabulator
              id="rawDataTable"
              report-code="piv-examples"
              component-id="salesOverview"
              api-base-url={rbConfig.apiBaseUrl}
              api-key={rbConfig.apiKey}
              style={{ display: "block", width: "100%", minHeight: "300px" }}
            />
          </div>
        )}

        {/* Configuration Tab */}
        {soTab === "config" && (
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Groovy DSL — salesOverview configuration</span>
              <button onClick={() => copyFn(soConfigDsl, "soConfig")} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted">
                {copiedKey === "soConfig" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div id="soConfigCode">
              <CodeBlock code={soConfigDsl || "Loading configuration..."} language="groovy" style={{ maxHeight: "600px" }} />
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {soTab === "usage" && (
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">HTML Usage</span>
              <button onClick={() => copyFn(soUsageCode, "soUsage")} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted">
                {copiedKey === "soUsage" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div id="soUsageCode">
              <CodeBlock code={soUsageCode} language="markup" style={{ maxHeight: "600px" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PivotTablesPage() {
  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<PageTab>("examples")
  const [configDsl, setConfigDsl] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (customElements.get("rb-pivot-table")) {
      setIsReady(true)
      return
    }
    const handleLoaded = () => setIsReady(true)
    window.addEventListener("rb-components-loaded", handleLoaded)
    return () => window.removeEventListener("rb-components-loaded", handleLoaded)
  }, [])

  // Listen to first rb-pivot-table for shared configDsl
  useEffect(() => {
    if (!isReady) return
    const el = document.querySelector('rb-pivot-table[report-code="piv-examples"]') as any
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
        <h4 className="text-2xl font-bold text-foreground mb-2">Pivot Tables</h4>
        <p className="text-muted-foreground mb-6">
          Drag-and-drop data analysis with aggregation and grouping, powered by <code className="text-sm bg-muted text-foreground px-1 rounded">&lt;rb-pivot-table&gt;</code>.
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
              <>
              {pivotCategories.map((category) => (
                <div key={category.name}>
                  <h5 className="text-lg font-bold mt-8 mb-4 pb-2 border-b-2 border-rb-cyan">
                    {category.name}
                  </h5>
                  {category.examples.map((example) => (
                    <div key={example.id} id={`example-${example.id}`} className="border border-border rounded-lg mb-4 overflow-hidden p-4">
                      <h6 className="font-semibold text-sm mb-1">{example.title}</h6>
                      <p className="text-xs text-muted-foreground mb-3">{example.desc}</p>
                      {/* @ts-expect-error - Web component custom element */}
                      <rb-pivot-table
                        id={`rb-${example.id}`}
                        report-code="piv-examples"
                        component-id={example.id}
                        api-base-url={rbConfig.apiBaseUrl}
                        api-key={rbConfig.apiKey}
                        style={{ display: "block", width: "100%" }}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <SalesOverviewSection copyFn={copyToClipboard} copiedKey={copied} />
              </>
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
