"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Check, Copy, Database, Table, Settings, Code, ArrowDown, Globe, HardDrive, Server, AlertTriangle, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { rbConfig } from "@/lib/rb-config"

interface RbPivotTableElement extends HTMLElement {
  configDsl?: string
  fetchData?: (params?: Record<string, unknown>) => void
}

type TabType = "warehouse" | "rawdata" | "config" | "usage"

export default function DataWarehousePage() {
  const warehouseBrowserRef = useRef<RbPivotTableElement>(null)
  const warehouseDuckdbRef = useRef<RbPivotTableElement>(null)
  const warehouseClickhouseRef = useRef<RbPivotTableElement>(null)

  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("warehouse")
  const [clickhouseWarningVisible, setClickhouseWarningVisible] = useState(true)
  const { toast } = useToast()

  // Config DSL per engine
  const [configBrowser, setConfigBrowser] = useState("")
  const [configDuckdb, setConfigDuckdb] = useState("")
  const [configClickhouse, setConfigClickhouse] = useState("")

  // Copy state per button
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  // Raw data pagination state
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([])
  const [rawColumns, setRawColumns] = useState<string[]>([])
  const [rawCurrentPage, setRawCurrentPage] = useState(0)
  const [rawPageSize, setRawPageSize] = useState(10)
  const [rawTotalRows, setRawTotalRows] = useState(0)
  const [rawLoading, setRawLoading] = useState(false)
  const [rawError, setRawError] = useState("")
  const [rawLoaded, setRawLoaded] = useState(false)

  // Web component readiness
  useEffect(() => {
    if (customElements.get("rb-pivot-table")) {
      setIsReady(true)
      return
    }
    const handleComponentsLoaded = () => setIsReady(true)
    window.addEventListener("rb-components-loaded", handleComponentsLoaded)
    return () => window.removeEventListener("rb-components-loaded", handleComponentsLoaded)
  }, [])

  // Listen for config events on each pivot component
  useEffect(() => {
    if (!isReady) return

    const engines = [
      { ref: warehouseBrowserRef, setter: setConfigBrowser },
      { ref: warehouseDuckdbRef, setter: setConfigDuckdb },
      { ref: warehouseClickhouseRef, setter: setConfigClickhouse },
    ]

    const cleanups: (() => void)[] = []

    for (const { ref, setter } of engines) {
      const el = ref.current
      if (!el) continue

      const updateConfig = () => {
        if (el.configDsl) setter(el.configDsl)
      }

      el.addEventListener("configLoaded", updateConfig)
      el.addEventListener("dataFetched", updateConfig)
      setTimeout(updateConfig, 100)
      setTimeout(updateConfig, 500)

      cleanups.push(() => {
        el.removeEventListener("configLoaded", updateConfig)
        el.removeEventListener("dataFetched", updateConfig)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [isReady])

  // ClickHouse warning: hide on pivotExecuted, show on error
  useEffect(() => {
    if (!isReady) return
    const el = warehouseClickhouseRef.current
    if (!el) return

    const onSuccess = () => setClickhouseWarningVisible(false)
    const onError = () => {
      setClickhouseWarningVisible(true)
      toast({ title: "ClickHouse connection failed", description: "Start the ClickHouse starter pack from the Connections page.", variant: "destructive", duration: 5000 })
    }

    el.addEventListener("pivotExecuted", onSuccess)
    el.addEventListener("error", onError)
    return () => {
      el.removeEventListener("pivotExecuted", onSuccess)
      el.removeEventListener("error", onError)
    }
  }, [isReady, toast])

  // Raw data fetch
  const fetchRawPage = useCallback(async (page: number, size: number) => {
    setRawLoading(true)
    setRawError("")
    try {
      const offset = page * size
      const res = await fetch(`${rbConfig.apiBaseUrl}/reports/piv-northwind-warehouse-browser/data?offset=${offset}&limit=${size}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      const data: Record<string, unknown>[] = Array.isArray(result) ? result : (result?.reportData || [])
      const total = result?.totalRows ?? data.length

      if (data.length > 0 && rawColumns.length === 0) {
        const cols = result?.reportColumnNames || Object.keys(data[0])
        setRawColumns(cols)
      }

      setRawData(data)
      setRawTotalRows(total)
    } catch (err) {
      setRawError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setRawLoading(false)
    }
  }, [rawColumns.length])

  // Load raw data on tab activation
  useEffect(() => {
    if (activeTab === "rawdata" && !rawLoaded) {
      setRawLoaded(true)
      fetchRawPage(0, rawPageSize)
    }
  }, [activeTab, rawLoaded, rawPageSize, fetchRawPage])

  // Copy to clipboard helper
  const copyWithFeedback = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => setCopiedStates((prev) => ({ ...prev, [key]: false })), 2000)
      toast({ title: "Copied to clipboard!", duration: 2000 })
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 2000 })
    }
  }, [toast])

  // Pagination helpers
  const totalPages = Math.ceil(rawTotalRows / rawPageSize)
  const showingFrom = rawCurrentPage * rawPageSize + 1
  const showingTo = Math.min((rawCurrentPage + 1) * rawPageSize, rawTotalRows)

  const handlePageChange = (newPage: number) => {
    setRawCurrentPage(newPage)
    fetchRawPage(newPage, rawPageSize)
  }

  const handlePageSizeChange = (newSize: number) => {
    setRawPageSize(newSize)
    setRawCurrentPage(0)
    fetchRawPage(0, newSize)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null
    const pages: (number | "...")[] = []
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || Math.abs(i - rawCurrentPage) <= 2) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...")
      }
    }

    return (
      <nav id="rawDataPagination" aria-label="Raw data pagination" className="flex justify-center mt-3">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => handlePageChange(rawCurrentPage - 1)}
            disabled={rawCurrentPage === 0}
            className="px-2 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &laquo;
          </button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-muted-foreground">...</span>
            ) : (
              <button
                key={p}
                data-page={p}
                onClick={() => handlePageChange(p)}
                className={`px-2.5 py-1 text-sm border rounded ${
                  p === rawCurrentPage
                    ? "bg-rb-cyan text-white border-rb-cyan"
                    : "border-border hover:bg-accent"
                }`}
              >
                {p + 1}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(rawCurrentPage + 1)}
            disabled={rawCurrentPage >= totalPages - 1}
            className="px-2 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &raquo;
          </button>
        </div>
      </nav>
    )
  }

  // Usage code snippets
  const usageBrowser = `<rb-pivot-table
  report-code="piv-northwind-warehouse-browser"
  api-base-url="\${RbUtils.apiBaseUrl}"
  api-key="\${RbUtils.apiKey}"
></rb-pivot-table>`

  const usageDuckdb = `<rb-pivot-table
  report-code="piv-northwind-warehouse-duckdb"
  api-base-url="\${RbUtils.apiBaseUrl}"
  api-key="\${RbUtils.apiKey}"
></rb-pivot-table>`

  const usageClickhouse = `<rb-pivot-table
  report-code="piv-northwind-warehouse-clickhouse"
  api-base-url="\${RbUtils.apiBaseUrl}"
  api-key="\${RbUtils.apiKey}"
></rb-pivot-table>`

  const tabs: { id: string; label: string; icon: React.ReactNode; value: TabType }[] = [
    { id: "warehouse-tab", label: "Data Warehouse", icon: <Database className="w-4 h-4" />, value: "warehouse" },
    { id: "rawdata-tab", label: "Raw Data", icon: <Table className="w-4 h-4" />, value: "rawdata" },
    { id: "config-tab", label: "Configuration", icon: <Settings className="w-4 h-4" />, value: "config" },
    { id: "usage-tab", label: "Usage", icon: <Code className="w-4 h-4" />, value: "usage" },
  ]

  const isCopied = (key: string) => copiedStates[key] || false

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h4 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Database className="w-6 h-6" />
            Northwind Data Warehouse (Sample Data)
          </h4>
          <p className="text-muted-foreground">
            OLAP analysis on ~8,000 sample sales transactions with Browser, DuckDB, and ClickHouse engines.
            All three engines share the same data and the same pivot configuration &mdash; so you can compare them side by side and switch engines without changing anything else.
          </p>
        </div>

        {/* Data Warehouse Facts */}
        <div className="mb-6">
          <p className="mb-2 text-sm">
            Data warehouses store large volumes of business data for historical analysis and reporting.
            Processing these volumes requires specialized techniques &mdash; but more tools mean more infrastructure, more complexity, and higher costs.
          </p>
          <p className="mb-4 text-sm">
            <strong>ReportBurster&apos;s approach:</strong> start with the simplest option. Only move to the next tier when your data volume actually demands it.
          </p>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Browser Tier */}
            <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h6 className="font-semibold mb-1 flex items-center gap-1">
                <Globe className="w-4 h-4" /> Browser Pivot
              </h6>
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mb-2">
                Up to ~100K rows
              </span>
              <p className="text-sm text-muted-foreground mb-2">
                Zero setup. Client-side JavaScript does all the work. Most business reports never need more than this.
              </p>
              <a href="#engine-browser" className="text-sm text-rb-cyan hover:underline flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Jump to Browser
              </a>
            </div>

            {/* DuckDB Tier */}
            <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h6 className="font-semibold mb-1 flex items-center gap-1">
                <HardDrive className="w-4 h-4" /> DuckDB
              </h6>
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-2">
                ~100K &ndash; 100M rows
              </span>
              <p className="text-sm text-muted-foreground mb-2">
                Almost no overhead &mdash; a single file on disk. Server-side aggregation handles medium to large volumes. You just need to be aware it exists and use / enable it.
              </p>
              <a href="#engine-duckdb" className="text-sm text-rb-cyan hover:underline flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Jump to DuckDB
              </a>
            </div>

            {/* ClickHouse Tier */}
            <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h6 className="font-semibold mb-1 flex items-center gap-1">
                <Server className="w-4 h-4" /> ClickHouse
              </h6>
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 mb-2">
                100M &ndash; 10B+ rows
              </span>
              <p className="text-sm text-muted-foreground mb-2">
                For truly massive volumes. A dedicated OLAP server with sub-second queries on billions of rows.
                Additional infrastructure and maintenance cost, but unmatched performance at scale.
              </p>
              <a href="#engine-clickhouse" className="text-sm text-rb-cyan hover:underline flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Jump to ClickHouse
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div id="warehouseTabs" className="border-b border-border mb-0">
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
        <div id="warehouseTabContent" className="bg-card border border-t-0 border-border rounded-b-lg p-4">

          {/* Data Warehouse Pane */}
          <div id="warehouse-pane" role="tabpanel" aria-labelledby="warehouse-tab" className={activeTab !== "warehouse" ? "hidden" : ""}>
            {/* Alert */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4 text-sm">
              <span className="text-blue-800 dark:text-blue-200">
                ~8,000 sales transactions from the Northwind Star Schema (view: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">vw_sales_detail</code>).
                Countries &times; Categories &times; Quarters with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">net_revenue</code> as the default measure.
              </span>
            </div>

            {/* Browser Engine */}
            <div className="engine-section mb-6 scroll-mt-20" id="engine-browser">
              <h6 className="font-semibold mb-1 flex items-center gap-1.5 text-base">
                <Globe className="w-4 h-4" /> Browser Engine
              </h6>
              <p className="text-sm text-muted-foreground mb-3">
                Client-side pivot &mdash; all processing in the browser. Great for quick exploration and datasets up to ~100K rows.
                Zero infrastructure needed, works offline once data is loaded.
              </p>
              {/* @ts-expect-error - Web component custom element */}
              <rb-pivot-table
                ref={warehouseBrowserRef}
                id="warehousePivotBrowser"
                report-code="piv-northwind-warehouse-browser"
                api-base-url={rbConfig.apiBaseUrl}
                api-key={rbConfig.apiKey}
              />
            </div>

            {/* DuckDB Engine */}
            <div className="engine-section mb-6 scroll-mt-20" id="engine-duckdb">
              <h6 className="font-semibold mb-1 flex items-center gap-1.5 text-base">
                <HardDrive className="w-4 h-4" /> DuckDB Engine
              </h6>
              <p className="text-sm text-muted-foreground mb-3">
                Server-side embedded OLAP (single file, no server to manage).
                Handles <strong>medium to large volumes</strong> with fast columnar queries.
                Think of it as SQLite for analytics &mdash; <strong>100K&ndash;100M rows</strong> is comfortable territory.
              </p>
              {/* @ts-expect-error - Web component custom element */}
              <rb-pivot-table
                ref={warehouseDuckdbRef}
                id="warehousePivotDuckdb"
                report-code="piv-northwind-warehouse-duckdb"
                api-base-url={rbConfig.apiBaseUrl}
                api-key={rbConfig.apiKey}
              />
            </div>

            {/* ClickHouse Engine */}
            <div className="engine-section mb-6 scroll-mt-20" id="engine-clickhouse">
              <h6 className="font-semibold mb-1 flex items-center gap-1.5 text-base">
                <Server className="w-4 h-4" /> ClickHouse Engine
              </h6>
              <p className="text-sm text-muted-foreground mb-3">
                Server-side columnar OLAP database (requires ClickHouse starter pack).
                Built for scale: handles <strong>millions to billions of rows</strong> with sub-second queries.
                The go-to for production analytics &mdash; <strong>100M&ndash;10B+ rows</strong> is everyday territory.
              </p>
              {clickhouseWarningVisible && (
                <div id="clickhouseWarning" className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-3 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  <span className="text-yellow-800 dark:text-yellow-200">
                    Start the ClickHouse starter pack from the Connections page to see warehouse data.
                  </span>
                </div>
              )}
              {/* @ts-expect-error - Web component custom element */}
              <rb-pivot-table
                ref={warehouseClickhouseRef}
                id="warehousePivotClickhouse"
                report-code="piv-northwind-warehouse-clickhouse"
                api-base-url={rbConfig.apiBaseUrl}
                api-key={rbConfig.apiKey}
              />
            </div>

            {/* How to Use Section */}
            <div className="mt-8 bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
              <h5 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                <span>💡</span> How to Use This Warehouse Pivot
              </h5>

              <p className="mb-1"><strong>What you&apos;re looking at right now:</strong></p>
              <p className="mb-2 text-sm">
                The default view shows <strong>Country → Category</strong> as rows, <strong>Year-Quarter</strong> as columns,
                and <strong>Sum of net_revenue</strong> in each cell. This is a real data warehouse layout &mdash; the same kind of
                analysis people build in Excel every Monday morning, except here it&apos;s instant and interactive.
              </p>
              <p className="mb-4 text-sm">
                ~8,000 transactions. 10 countries. 8 product categories. 8 quarters. 30 customers. 16 products. 3 sales reps. Try everything below &mdash; every step works on the live data in front of you.
              </p>

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">Step-by-Step: Do These Now</h6>

              {[
                { title: "1. Find the Biggest Market", lines: [<>Look at the <strong>row totals</strong> (rightmost column). Which country drives the most revenue?</>, <><strong>Try:</strong> Scan the <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Totals</code> column. USA and Germany should be at the top &mdash; they&apos;re the largest markets.</>], insight: "→ You just answered \"Where should we focus sales effort?\" without writing a single query." },
                { title: "2. Drill Into a Country", lines: [<>Each country row has category sub-rows (Country → Category hierarchy).</>, <><strong>Try:</strong> Find <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Germany</code> and look at its category breakdown. <strong>Dairy Products</strong> and <strong>Confections</strong> should be notably higher than Meat &mdash; Europeans buy more dairy.</>, <>Now find <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">USA</code>. <strong>Meat/Poultry</strong> and <strong>Condiments</strong> should be stronger &mdash; different regional preferences.</>], insight: "→ Same product catalog, completely different buying patterns by geography. This is exactly what OLAP reveals." },
                { title: "3. Compare Continents Instead of Countries", lines: [<><strong>Try:</strong> Drag <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">continent</code> from the unused fields area → Drop it into the <strong>rows area</strong>, above <code>customer_country</code>. Then drag <code>customer_country</code> out (back to unused).</>, <>Now you see: <strong>Europe vs North America vs South America</strong> &mdash; clean continent-level totals per quarter.</>], insight: "→ \"Is Europe or the Americas our bigger market?\" — answered. One drag, zero SQL." },
                { title: "4. Spot the Seasonal Pattern", lines: [<>Look across the quarter columns (2023-Q1 through 2024-Q4).</>, <><strong>Try:</strong> Compare any country&apos;s <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Q4</code> vs <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Q1</code> values. Q4 (holiday season) should be noticeably higher than Q1 (post-holiday slowdown).</>], insight: "→ \"Is our business seasonal?\" — the pattern is right there: Q1 < Q2 < Q3 < Q4, every year. Plan inventory accordingly." },
                { title: "5. Check Year-over-Year Growth", lines: [<><strong>Try:</strong> Compare <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">2023-Q1</code> column totals vs <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">2024-Q1</code>. The 2024 numbers should be ~5% higher across the board.</>], insight: "→ \"Are we growing?\" — yes, consistently. This is how CFOs track performance without a BI team." },
                { title: "6. Gross vs Net — What Are Discounts Costing Us?", lines: [<><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">net_revenue ▼</code> dropdown in the values area → Select <strong>gross_revenue</strong> instead.</>, <>The numbers go up. The difference = discount impact. Switch back to <code>net_revenue</code>.</>, <>Now try: Select <strong>both</strong> <code>net_revenue</code> and <code>gross_revenue</code> at the same time (if supported) or toggle between them.</>], insight: "→ \"How much margin are we giving away in discounts?\" — the gap between gross and net tells you instantly." },
                { title: "7. Who's Selling What? (Sales Rep Analysis)", lines: [<><strong>Try:</strong> Drag <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">employee_name</code> into rows. You&apos;ll see Nancy Davolio, Andrew Fuller, and Janet Leverling.</>, <>Now drag <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">category_name</code> below <code>employee_name</code> in rows.</>], insight: "→ \"Which rep sells the most Seafood?\" \"Who's our Dairy specialist?\" — it's a performance review in one glance." },
                { title: "8. Average Transaction Value (Not Just Totals)", lines: [<><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Sum ▼</code> dropdown (top-left) → Select <strong>Average</strong>.</>, <>Now cells show average revenue per transaction, not totals. High-volume countries might have <em>lower</em> averages.</>], insight: "→ \"Are we making money through volume or premium pricing?\" — Average separates the two." },
                { title: "9. Filter to Focus", lines: [<><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">▼</code> triangle next to <code>customer_country</code> → Uncheck everything except <strong>USA</strong>, <strong>Germany</strong>, and <strong>France</strong>.</>], insight: "→ Noise gone. Three key markets compared side by side. This is how you prepare a board presentation in 10 seconds." },
                { title: "10. Visualize It", lines: [<><strong>Try:</strong> Click the <code className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-sm">Table ▼</code> renderer dropdown → Select <strong>Grouped Column Chart</strong>.</>, <>Countries become colored bars, quarters become groups. Trends jump out visually.</>, <>Try <strong>Stacked Bar Chart</strong> (see category proportions) or <strong>Line Chart</strong> (see trends over time).</>], insight: "→ Same data, different presentation. Charts make the pattern obvious for non-technical stakeholders." },
              ].map((step) => (
                <div key={step.title} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md p-4 mb-3">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{step.title}</div>
                  {step.lines.map((line, i) => (
                    <p key={i} className="text-sm mb-1">{line}</p>
                  ))}
                  <p className="text-sm text-green-600 dark:text-green-400 italic mb-0">{step.insight}</p>
                </div>
              ))}

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">Real Questions This Data Answers</h6>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>&quot;Which country-category combo is our gold mine?&quot;</strong> &mdash; Default view. Scan for the biggest cells. Germany &times; Dairy? USA &times; Meat?</li>
                <li><strong>&quot;Should we invest more in Europe or the Americas?&quot;</strong> &mdash; Drag <code>continent</code> to rows. Compare totals. Decision made.</li>
                <li><strong>&quot;Are discounts eating our margins?&quot;</strong> &mdash; Toggle between <code>gross_revenue</code> and <code>net_revenue</code>. The gap = discount cost.</li>
                <li><strong>&quot;What&apos;s our Q4 holiday uplift?&quot;</strong> &mdash; Compare Q4 vs Q2 columns. The difference is your seasonal revenue.</li>
                <li><strong>&quot;Do Europeans buy different products than Americans?&quot;</strong> &mdash; Rows: <code>continent</code> → <code>category_name</code>. Europe leans Dairy + Confections. Americas lean Meat + Condiments.</li>
                <li><strong>&quot;Which product should we discontinue?&quot;</strong> &mdash; Drag <code>product_name</code> to rows, remove countries. Sort by totals. Lowest performer = candidate.</li>
                <li><strong>&quot;Who gets the sales bonus this quarter?&quot;</strong> &mdash; Drag <code>employee_name</code> to rows. Highest total wins.</li>
                <li><strong>&quot;Is Sweden worth keeping as a market?&quot;</strong> &mdash; Filter to just Sweden. Small revenue? Compare cost of operations vs revenue. The data tells the story.</li>
              </ul>

              <h6 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mt-5 mb-3">Why This Matters &mdash; The &quot;Excel Problem&quot;</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="mb-1 font-medium">What teams do today:</p>
                  <div className="bg-gray-900 text-sky-300 font-mono text-xs p-3 rounded">
                    <pre className="whitespace-pre">{`1. Export data to CSV
2. Open in Excel
3. Build pivot table manually
4. Email the spreadsheet
5. Someone asks "now show me by quarter"
6. Rebuild the pivot table
7. Repeat 47 times...`}</pre>
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium">What this does instead:</p>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded text-sm">
                    <p><strong>✓</strong> Data stays in the warehouse (no CSV exports)</p>
                    <p><strong>✓</strong> Anyone opens the link, drags dimensions, gets answers</p>
                    <p><strong>✓</strong> &quot;Show me by quarter&quot; = one drag, 2 seconds</p>
                    <p><strong>✓</strong> Always live data, never a stale spreadsheet</p>
                    <p><strong>✓</strong> Works on 8,000 rows or 8 million (switch engines)</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm mb-0">
                <strong>Bottom line:</strong> If your team currently exports to Excel to build pivot tables, they already know
                how to use this &mdash; it&apos;s the same concept, except it&apos;s live, connected to the database, and sharable via URL.
                No more &quot;which version of the spreadsheet is correct?&quot; conversations.
              </p>
            </div>
          </div>

          {/* Raw Data Pane */}
          <div id="rawdata-pane" role="tabpanel" aria-labelledby="rawdata-tab" className={activeTab !== "rawdata" ? "hidden" : ""}>
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              Raw data from the Browser engine report (<code>piv-northwind-warehouse-browser</code>). Server-side pagination &mdash; only the visible page is loaded.
            </p>

            {/* Controls */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Page size:</label>
                <select
                  id="rawDataPageSize"
                  value={rawPageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="text-sm border border-border rounded px-2 py-1 bg-card"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <span id="rawDataInfo" className="text-sm text-muted-foreground">
                {rawTotalRows > 0 ? `Showing ${showingFrom}-${showingTo} of ${rawTotalRows} rows` : ""}
              </span>
            </div>

            {/* Loading */}
            <div id="rawDataLoading" className={rawLoading ? "text-center py-4" : "hidden"}>
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
              <span className="text-sm text-muted-foreground">Loading data...</span>
            </div>

            {/* Error */}
            {rawError && (
              <div id="rawDataError" className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3 text-red-800 dark:text-red-200 text-sm">
                {rawError}
              </div>
            )}

            {/* Table */}
            {!rawLoading && !rawError && rawData.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table id="rawDataTable" className="w-full text-sm border-collapse">
                    <thead id="rawDataHead">
                      <tr className="border-b border-border bg-muted/50">
                        {rawColumns.map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody id="rawDataBody">
                      {rawData.map((row, i) => (
                        <tr key={i} className="border-b border-border hover:bg-muted/30">
                          {rawColumns.map((col) => (
                            <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination()}
              </>
            )}
          </div>

          {/* Configuration Pane */}
          <div id="config-pane" role="tabpanel" aria-labelledby="config-tab" className={activeTab !== "config" ? "hidden" : ""}>
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              All three reports use the same pivot table configuration &mdash; only the OLAP backend engine differs.
              This lets you choose the engine that matches your data volume without changing your report definition.
            </p>

            {[
              { label: "Browser Engine", icon: <Globe className="w-4 h-4" />, id: "configCodeBrowser", config: configBrowser, copyKey: "config-browser" },
              { label: "DuckDB Engine", icon: <HardDrive className="w-4 h-4" />, id: "configCodeDuckdb", config: configDuckdb, copyKey: "config-duckdb" },
              { label: "ClickHouse Engine", icon: <Server className="w-4 h-4" />, id: "configCodeClickhouse", config: configClickhouse, copyKey: "config-clickhouse" },
            ].map((eng) => (
              <div key={eng.id} className="engine-section mb-3">
                <div className="flex justify-between items-center">
                  <h6 className="font-semibold flex items-center gap-1.5 mb-0">{eng.icon} {eng.label}</h6>
                  <Button
                    variant="outline"
                    size="sm"
                    className="copy-config-btn"
                    data-target={eng.id}
                    title="Copy to clipboard"
                    onClick={() => copyWithFeedback(eng.copyKey, eng.config || "")}
                  >
                    {isCopied(eng.copyKey) ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <pre id={eng.id} className="font-mono text-sm bg-gradient-to-br from-[#1e1e1e] to-[#2d2d2d] text-[#d4d4d4] rounded-lg p-4 overflow-x-auto whitespace-pre leading-relaxed border border-[#3d3d3d] max-h-[400px] mt-2">
                  <code>{eng.config || "Loading configuration..."}</code>
                </pre>
              </div>
            ))}
          </div>

          {/* Usage Pane */}
          <div id="usage-pane" role="tabpanel" aria-labelledby="usage-tab" className={activeTab !== "usage" ? "hidden" : ""}>
            {[
              { label: "Browser Engine", icon: <Globe className="w-4 h-4" />, id: "usageCodeBrowser", code: usageBrowser, copyKey: "usage-browser" },
              { label: "DuckDB Engine", icon: <HardDrive className="w-4 h-4" />, id: "usageCodeDuckdb", code: usageDuckdb, copyKey: "usage-duckdb" },
              { label: "ClickHouse Engine", icon: <Server className="w-4 h-4" />, id: "usageCodeClickhouse", code: usageClickhouse, copyKey: "usage-clickhouse" },
            ].map((eng) => (
              <div key={eng.id} className="engine-section mb-3">
                <div className="flex justify-between items-center">
                  <h6 className="font-semibold flex items-center gap-1.5 mb-0">{eng.icon} {eng.label}</h6>
                  <Button
                    variant="outline"
                    size="sm"
                    className="copy-usage-btn"
                    data-target={eng.id}
                    title="Copy to clipboard"
                    onClick={() => copyWithFeedback(eng.copyKey, eng.code)}
                  >
                    {isCopied(eng.copyKey) ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <pre id={eng.id} className="bg-gray-100 dark:bg-slate-800 p-3 border border-border rounded mb-0 mt-2">
                  <code>{eng.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
