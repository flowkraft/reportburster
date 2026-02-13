"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { RefreshCw, Check, Copy, Table, Grid3x3, Code, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { rbConfig } from "@/lib/rb-config"

interface RbPivotTableElement extends HTMLElement {
  configDsl?: string
  fetchData?: (params?: Record<string, unknown>) => void
}

interface RbTabulatorElement extends HTMLElement {
  fetchData?: (params?: Record<string, unknown>) => void
}

type TabType = "component" | "rawdata" | "config" | "usage"

export default function PivotTablesPage() {
  const demoPivotRef = useRef<RbPivotTableElement>(null)
  const rawDataRef = useRef<RbTabulatorElement>(null)
  const [configDsl, setConfigDsl] = useState("")
  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("component")
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedUsage, setCopiedUsage] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (customElements.get("rb-pivot-table")) {
      setIsReady(true)
      return
    }
    const handleComponentsLoaded = () => setIsReady(true)
    window.addEventListener("rb-components-loaded", handleComponentsLoaded)
    return () => window.removeEventListener("rb-components-loaded", handleComponentsLoaded)
  }, [])

  useEffect(() => {
    if (!isReady || !demoPivotRef.current) return
    const element = demoPivotRef.current

    const updateConfig = () => {
      if (element.configDsl) setConfigDsl(element.configDsl)
    }

    element.addEventListener("configLoaded", updateConfig)
    element.addEventListener("dataFetched", updateConfig)
    setTimeout(updateConfig, 100)
    setTimeout(updateConfig, 500)

    return () => {
      element.removeEventListener("configLoaded", updateConfig)
      element.removeEventListener("dataFetched", updateConfig)
    }
  }, [isReady])

  const copyToClipboard = useCallback(async (text: string, type: "config" | "usage") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "config") {
        setCopiedConfig(true)
        setTimeout(() => setCopiedConfig(false), 2000)
      } else {
        setCopiedUsage(true)
        setTimeout(() => setCopiedUsage(false), 2000)
      }
      toast({ title: "Copied to clipboard!", duration: 2000 })
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 2000 })
    }
  }, [toast])

  const usageCode = `<rb-pivot-table
  report-code="piv-sales-region-prod-qtr"
  api-base-url="\${RbUtils.apiBaseUrl}"
  api-key="\${RbUtils.apiKey}"
></rb-pivot-table>`

  const tabs: { id: string; label: string; icon: React.ReactNode; value: TabType }[] = [
    { id: "component-tab", label: "Pivot Table", icon: <Grid3x3 className="w-4 h-4" />, value: "component" },
    { id: "rawdata-tab", label: "Raw Data", icon: <Table className="w-4 h-4" />, value: "rawdata" },
    { id: "config-tab", label: "Configuration", icon: <Settings className="w-4 h-4" />, value: "config" },
    { id: "usage-tab", label: "Usage", icon: <Code className="w-4 h-4" />, value: "usage" },
  ]

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h4 className="text-2xl font-bold text-foreground mb-2">Pivot Tables</h4>
          <p className="text-muted-foreground">Drag-and-drop data analysis with aggregation and grouping.</p>
        </div>

        {/* Tabs */}
        <div id="pivotTabs" className="border-b border-border mb-0">
          <div className="flex space-x-6 overflow-x-auto" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={tab.id}
                role="tab"
                aria-controls={`${tab.value}-pane`}
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.value
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div id="pivotTabContent" className="bg-card border border-t-0 border-border rounded-b-lg p-4">
          {/* Pivot Table Tab */}
          <div id="component-pane" role="tabpanel" aria-labelledby="component-tab" className={activeTab !== "component" ? "hidden" : ""}>
            <div className="flex justify-end mb-2">
              <Button
                id="refreshBtn"
                onClick={() => demoPivotRef.current?.fetchData?.({})}
                variant="outline"
                size="sm"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            {/* @ts-expect-error - Web component custom element */}
            <rb-pivot-table
              ref={demoPivotRef}
              id="demoPivot"
              report-code="piv-sales-region-prod-qtr"
              api-base-url={rbConfig.apiBaseUrl}
              api-key={rbConfig.apiKey}
            />

            {/* How to Use Section */}
            <div className="mt-8 bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
              <h5 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                <span>💡</span> How to Use This Pivot Table
              </h5>

              <p className="mb-4">
                <strong>What you&apos;re looking at:</strong> 64 rows of sales data &mdash; 4 Regions &times; 4 Products &times; 4 Quarters.
                The pivot table transforms this into an instant analysis grid. No SQL, no formulas.
              </p>

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">Quick Actions (Try These Now)</h6>

              {[
                {
                  title: "1. Change the Metric",
                  lines: [
                    <>Current: <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Sum of Revenue</code></>,
                    <><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Revenue ▼</code> dropdown (top area) → Select <strong>Profit</strong></>,
                  ],
                  insight: "→ Now see profit margins. High revenue but low profit? You'll spot it instantly.",
                },
                {
                  title: "2. Rearrange Dimensions",
                  lines: [
                    <><strong>Try:</strong> Drag <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Quarter</code> from columns → Drop into rows below Region</>,
                  ],
                  insight: '→ Now quarters are rows. "Which quarter was strongest?" — see row totals immediately.',
                },
                {
                  title: "3. Add a Dimension",
                  lines: [
                    <><strong>Try:</strong> Drag <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">SalesRep</code> from unused area → Drop into rows after Product</>,
                  ],
                  insight: '→ See Region → Product → SalesRep hierarchy. "Who sold most Laptops in North?" — answered.',
                },
                {
                  title: "4. Filter Data",
                  lines: [
                    <><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">▼</code> triangle next to Region → Uncheck North and West</>,
                  ],
                  insight: "→ Table now shows ONLY South and East. Focus on what matters.",
                },
                {
                  title: "5. Change Aggregation",
                  lines: [
                    <><strong>Try:</strong> Click <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Sum ▼</code> dropdown (top left) → Select <strong>Average</strong></>,
                  ],
                  insight: '→ See average per transaction, not totals. "Are Q4 prices higher or just more volume?"',
                },
                {
                  title: "6. Visualize as Chart",
                  lines: [
                    <><strong>Try:</strong> Click <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Table ▼</code> dropdown → Select <strong>Grouped Column Chart</strong></>,
                  ],
                  insight: '→ Same data, visual format. Trends jump out. Try "Stacked Bar" or "Line Chart" too.',
                },
              ].map((step) => (
                <div key={step.title} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4 mb-3">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{step.title}</div>
                  {step.lines.map((line, i) => (
                    <p key={i} className="text-sm mb-1">{line}</p>
                  ))}
                  <p className="text-sm text-green-600 dark:text-green-400 italic mb-0">{step.insight}</p>
                </div>
              ))}

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">Real Business Questions This Answers</h6>
              <ul className="list-disc list-inside space-y-1 text-sm mb-0">
                <li><strong>&quot;Which product is our cash cow?&quot;</strong> &mdash; Put Product in rows, look at Totals column. Laptop = $258,000 (highest).</li>
                <li><strong>&quot;Is East region underperforming?&quot;</strong> &mdash; Current view: East = $170,850 vs West = $173,850. Yes, investigate.</li>
                <li><strong>&quot;Who gets the sales bonus?&quot;</strong> &mdash; Drag SalesRep to rows, sort by totals. Highest revenue wins.</li>
                <li><strong>&quot;Are we profitable or just busy?&quot;</strong> &mdash; Switch from Revenue to Profit. High revenue + low margins? Now you see it.</li>
              </ul>

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">The Point: Why This Matters</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="mb-1 font-medium">Without pivot table:</p>
                  <div className="bg-gray-900 text-sky-300 font-mono text-xs p-3 rounded">
                    <pre className="whitespace-pre">{`-- Question 1: Revenue by region
SELECT Region, SUM(Revenue)
FROM sales GROUP BY Region;

-- Question 2: Revenue by product
SELECT Product, SUM(Revenue)
FROM sales GROUP BY Product;

-- 20 more queries for different angles...`}</pre>
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium">With pivot table:</p>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded text-sm">
                    <p><strong>✓</strong> Drag Region to rows → Question 1 answered</p>
                    <p><strong>✓</strong> Drag Product instead → Question 2 answered</p>
                    <p><strong>✓</strong> 3 seconds total, no coding</p>
                    <p><strong>✓</strong> 1000 ways to slice the same data</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm mb-0">
                <strong>Bottom line:</strong> Pivot tables = SQL GROUP BY + Excel formulas + visualization &mdash; combined.
                Drag and drop. Instant answers. Questions answered faster = better decisions.
              </p>
            </div>
          </div>

          {/* Raw Data Tab */}
          <div id="rawdata-pane" role="tabpanel" aria-labelledby="rawdata-tab" className={activeTab !== "rawdata" ? "hidden" : ""}>
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">i</span>
              This is the raw source data (64 rows) that feeds the pivot table.
            </p>
            {/* @ts-expect-error - Web component custom element */}
            <rb-tabulator
              ref={rawDataRef}
              id="rawDataTable"
              report-code="piv-sales-region-prod-qtr"
              api-base-url={rbConfig.apiBaseUrl}
              api-key={rbConfig.apiKey}
            />
          </div>

          {/* Configuration Tab */}
          <div id="config-pane" role="tabpanel" aria-labelledby="config-tab" className={activeTab !== "config" ? "hidden" : ""}>
            <div className="flex justify-between items-start mb-2">
              <Button
                id="copyConfigBtn"
                onClick={() => copyToClipboard(configDsl || "", "config")}
                variant="outline"
                size="sm"
                title="Copy to clipboard"
              >
                {copiedConfig ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre id="configCode" className="font-mono text-sm bg-gradient-to-br from-[#1e1e1e] to-[#2d2d2d] text-[#d4d4d4] rounded-lg p-4 overflow-x-auto whitespace-pre leading-relaxed border border-[#3d3d3d] max-h-[400px]">
              <code>{configDsl || "Loading configuration..."}</code>
            </pre>
          </div>

          {/* Usage Tab */}
          <div id="usage-pane" role="tabpanel" aria-labelledby="usage-tab" className={activeTab !== "usage" ? "hidden" : ""}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">HTML Usage</span>
              <Button
                id="copyUsageBtn"
                onClick={() => copyToClipboard(usageCode, "usage")}
                variant="outline"
                size="sm"
                title="Copy to clipboard"
              >
                {copiedUsage ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre id="usageCode" className="bg-gray-100 dark:bg-slate-800 p-3 border border-border rounded mb-0">
              <code>{usageCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
