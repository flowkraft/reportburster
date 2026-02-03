"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, Check, Copy, Database, Table, Grid3x3, Code, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { rbConfig } from "@/lib/rb-config"
import { CodeBlock } from "@/components/CodeBlock"

interface RbPivotTableElement extends HTMLElement {
  configDsl?: string
  fetchData?: (params?: Record<string, unknown>) => void
}

interface RbTabulatorElement extends HTMLElement {
  fetchData?: (params?: Record<string, unknown>) => void
}

type TabType = "pivot" | "warehouse" | "rawdata" | "config" | "usage"

export default function PivotTablesPage() {
  const demoPivotRef = useRef<RbPivotTableElement>(null)
  const warehousePivotRef = useRef<RbPivotTableElement>(null)
  const rawDataRef = useRef<RbTabulatorElement>(null)
  const [configDsl, setConfigDsl] = useState("")
  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("pivot")
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedUsage, setCopiedUsage] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if components are already loaded
    if (customElements.get("rb-pivot-table")) {
      setIsReady(true)
      return
    }

    // Listen for the global loader event
    const handleComponentsLoaded = () => {
      setIsReady(true)
    }
    
    window.addEventListener("rb-components-loaded", handleComponentsLoaded)
    return () => {
      window.removeEventListener("rb-components-loaded", handleComponentsLoaded)
    }
  }, [])

  useEffect(() => {
    if (!isReady || !demoPivotRef.current) return

    const element = demoPivotRef.current

    const updateConfig = () => {
      if (element.configDsl) {
        setConfigDsl(element.configDsl)
      }
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

  const copyToClipboard = async (text: string, type: "config" | "usage") => {
    try {
      await navigator.clipboard.writeText(text)

      if (type === "config") {
        setCopiedConfig(true)
        setTimeout(() => setCopiedConfig(false), 2000)
      } else {
        setCopiedUsage(true)
        setTimeout(() => setCopiedUsage(false), 2000)
      }

      toast({
        title: "Copied to clipboard",
        description: `${type === "config" ? "Configuration" : "Usage code"} copied successfully`,
        duration: 2000,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  const usageCode = `<rb-pivot-table
    report-code="piv-sales-region-prod-qtr"
    api-base-url="${rbConfig.apiBaseUrl}"
    api-key="${rbConfig.apiKey}"
></rb-pivot-table>`

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Pivot Tables
          </h1>
          <p className="text-lg text-muted-foreground">
            Drag-and-drop data analysis with aggregation and grouping.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex space-x-8 overflow-x-auto">
              <button
                id="pivot-tab"
                onClick={() => setActiveTab("pivot")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "pivot"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Pivot Table
              </button>
              <button
                id="warehouse-tab"
                onClick={() => setActiveTab("warehouse")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "warehouse"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Database className="w-4 h-4" />
                Northwind Warehouse DB
              </button>
              <button
                id="rawdata-tab"
                onClick={() => setActiveTab("rawdata")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "rawdata"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Table className="w-4 h-4" />
                Raw Data
              </button>
              <button
                id="config-tab"
                onClick={() => setActiveTab("config")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "config"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Settings className="w-4 h-4" />
                Configuration
              </button>
              <button
                id="usage-tab"
                onClick={() => setActiveTab("usage")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "usage"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Code className="w-4 h-4" />
                Usage
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-lg shadow-sm">
          {activeTab === "pivot" && (
            <div className="p-6">
              <div className="flex justify-end mb-4">
                <Button
                  id="refreshBtn"
                  onClick={() => {
                    if (demoPivotRef.current?.fetchData) {
                      demoPivotRef.current.fetchData({})
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
              <div className="w-full">
                {/* @ts-expect-error - Web component custom element */}
                <rb-pivot-table
                  ref={demoPivotRef}
                  id="demoPivot"
                  report-code="piv-sales-region-prod-qtr"
                  api-base-url={rbConfig.apiBaseUrl}
                  api-key={rbConfig.apiKey}
                />
              </div>
            </div>
          )}

          {activeTab === "warehouse" && (
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <strong className="text-blue-900 dark:text-blue-100">Real Data Warehouse</strong>
                    <span className="text-blue-800 dark:text-blue-200"> — This pivot queries the Northwind DB warehouse (</span>
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-sm">vw_sales_detail</code>
                    <span className="text-blue-800 dark:text-blue-200"> view with Star Schema). ~800 rows currently, designed to scale to 10M+ rows. Server-side engine processing all aggregations.</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mb-4">
                <Button
                  id="refreshWarehouseBtn"
                  onClick={() => {
                    if (warehousePivotRef.current?.fetchData) {
                      warehousePivotRef.current.fetchData({})
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
              <div className="w-full">
                {/* @ts-expect-error - Web component custom element */}
                <rb-pivot-table
                  ref={warehousePivotRef}
                  id="warehousePivot"
                  report-code="piv-northwind-warehouse-sales"
                  api-base-url={rbConfig.apiBaseUrl}
                  api-key={rbConfig.apiKey}
                  engine="duckdb"
                />
              </div>
            </div>
          )}

          {activeTab === "rawdata" && (
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">i</span>
                This is the raw source data (64 rows) that feeds the pivot table.
              </p>
              <div className="w-full">
                {/* @ts-expect-error - Web component custom element */}
                <rb-tabulator
                  ref={rawDataRef}
                  id="rawDataTable"
                  report-code="piv-sales-region-prod-qtr"
                  api-base-url={rbConfig.apiBaseUrl}
                  api-key={rbConfig.apiKey}
                />
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={() => copyToClipboard(configDsl || "", "config")}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-card/80 backdrop-blur"
                >
                  {copiedConfig ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedConfig ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div id="configCode">
                <CodeBlock code={configDsl || "// Configuration will load after component initializes..."} language="groovy" />
              </div>
            </div>
          )}

          {activeTab === "usage" && (
            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={() => copyToClipboard(usageCode, "usage")}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-card/80 backdrop-blur"
                >
                  {copiedUsage ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedUsage ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div id="usageCode">
                <CodeBlock code={usageCode} language="markup" />
              </div>
            </div>
          )}
        </div>

        {/* How to Use Tutorial Section */}
        <div className="mt-8 bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> How to Use This Pivot Table
          </h2>

          <p className="mb-6">
            <strong>What you're looking at:</strong> 64 rows of sales data — 4 Regions × 4 Products × 4 Quarters.
            The pivot table transforms this into an instant analysis grid. No SQL, no formulas.
          </p>

          <h3 className="text-xl font-semibold mb-4">Quick Actions (Try These Now)</h3>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4">
              <div className="font-semibold mb-2">1. Change the Metric</div>
              <p className="text-sm mb-1">Current: <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">Sum of Revenue</code></p>
              <p className="text-sm mb-1"><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">Revenue ▼</code> dropdown (top area) → Select <strong>Profit</strong></p>
              <p className="text-sm text-green-600 dark:text-green-400 italic">→ Now see profit margins. High revenue but low profit? You'll spot it instantly.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4">
              <div className="font-semibold mb-2">2. Rearrange Dimensions</div>
              <p className="text-sm mb-1"><strong>Try:</strong> Drag <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">Quarter</code> from columns → Drop into rows below Region</p>
              <p className="text-sm text-green-600 dark:text-green-400 italic">→ Now quarters are rows. "Which quarter was strongest?" — see row totals immediately.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4">
              <div className="font-semibold mb-2">3. Add a Dimension</div>
              <p className="text-sm mb-1"><strong>Try:</strong> Drag <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">SalesRep</code> from unused area → Drop into rows after Product</p>
              <p className="text-sm text-green-600 dark:text-green-400 italic">→ See Region → Product → SalesRep hierarchy. "Who sold most Laptops in North?" — answered.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4">
              <div className="font-semibold mb-2">4. Filter Data</div>
              <p className="text-sm mb-1"><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">▼</code> triangle next to Region → Uncheck North and West</p>
              <p className="text-sm text-green-600 dark:text-green-400 italic">→ Table now shows ONLY South and East. Focus on what matters.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4">
              <div className="font-semibold mb-2">5. Change Aggregation</div>
              <p className="text-sm mb-1"><strong>Try:</strong> Click <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">Sum ▼</code> dropdown (top left) → Select <strong>Average</strong></p>
              <p className="text-sm text-green-600 dark:text-green-400 italic">→ See average per transaction, not totals. "Are Q4 prices higher or just more volume?"</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4">
              <div className="font-semibold mb-2">6. Visualize as Chart</div>
              <p className="text-sm mb-1"><strong>Try:</strong> Click <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">Table ▼</code> dropdown → Select <strong>Grouped Column Chart</strong></p>
              <p className="text-sm text-green-600 dark:text-green-400 italic">→ Same data, visual format. Trends jump out. Try "Stacked Bar" or "Line Chart" too.</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">Real Business Questions This Answers</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>"Which product is our cash cow?"</strong> — Put Product in rows, look at Totals column. Laptop = $291,800 (highest).</li>
            <li><strong>"Is East region underperforming?"</strong> — Current view: East = $133,850 vs West = $156,050. Yes, investigate.</li>
            <li><strong>"Who gets the sales bonus?"</strong> — Drag SalesRep to rows, sort by totals. Highest revenue wins.</li>
            <li><strong>"Are we profitable or just busy?"</strong> — Switch from Revenue to Profit. High revenue + low margins? Now you see it.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-4">The Point: Why This Matters</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="mb-2 font-medium">Without pivot table:</p>
              <div className="bg-gray-900 text-gray-300 font-mono text-xs p-3 rounded">
                <pre>{`-- Question 1: Revenue by region
SELECT Region, SUM(Revenue)
FROM sales GROUP BY Region;

-- Question 2: Revenue by product
SELECT Product, SUM(Revenue)
FROM sales GROUP BY Product;

-- 20 more queries for different angles...`}</pre>
              </div>
            </div>
            <div>
              <p className="mb-2 font-medium">With pivot table:</p>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded text-sm">
                <p><strong>✓</strong> Drag Region to rows → Question 1 answered</p>
                <p><strong>✓</strong> Drag Product instead → Question 2 answered</p>
                <p><strong>✓</strong> 3 seconds total, no coding</p>
                <p><strong>✓</strong> 1000 ways to slice the same data</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm">
            <strong>Bottom line:</strong> Pivot tables = SQL GROUP BY + Excel formulas + visualization — combined.
            Drag and drop. Instant answers. Questions answered faster = better decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
