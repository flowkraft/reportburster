"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, Check, Copy, Sliders, Settings, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { rbConfig } from "@/lib/rb-config"
import { CodeBlock } from "@/components/CodeBlock"

interface RbParametersElement extends HTMLElement {
  configDsl?: string
  fetchConfig?: () => void
  getValues?: () => Record<string, unknown>
}

interface RbTabulatorElement extends HTMLElement {
  data?: unknown[]
  fetchData?: (params?: Record<string, unknown>) => void
}

type TabType = "component" | "config" | "usage"

export default function ReportParametersPage() {
  const paramsRef = useRef<RbParametersElement>(null)
  const dataTableRef = useRef<RbTabulatorElement>(null)
  const [configDsl, setConfigDsl] = useState("")
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({})
  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("component")
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedUsage, setCopiedUsage] = useState(false)
  const [isFiltered, setIsFiltered] = useState(false)
  const [recordCount, setRecordCount] = useState("Loading...")
  const [originalDataCount, setOriginalDataCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if components are already loaded
    if (customElements.get("rb-parameters")) {
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
    if (!isReady || !paramsRef.current) return

    const element = paramsRef.current

    const updateConfig = () => {
      if (element.configDsl) {
        setConfigDsl(element.configDsl)
      }
    }

    element.addEventListener("configLoaded", updateConfig)
    element.addEventListener("configFetched", updateConfig)

    element.addEventListener("valueChange", (e: Event) => {
      const detail = (e as CustomEvent).detail
      setParamValues(detail || {})
    })

    setTimeout(updateConfig, 100)
    setTimeout(updateConfig, 500)
    setTimeout(updateConfig, 1000)

    return () => {
      element.removeEventListener("configLoaded", updateConfig)
      element.removeEventListener("configFetched", updateConfig)
    }
  }, [isReady])

  useEffect(() => {
    if (!isReady || !dataTableRef.current) return

    const element = dataTableRef.current

    const handleDataLoaded = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const data = detail?.data || []
      const count = Array.isArray(data) ? data.length : 0
      setOriginalDataCount(count)
      setRecordCount(`${count} records`)
    }

    const handleReady = () => {
      setTimeout(() => {
        if (element.data && Array.isArray(element.data)) {
          const count = element.data.length
          setOriginalDataCount(count)
          setRecordCount(`${count} records`)
        }
      }, 200)
    }

    element.addEventListener("dataLoaded", handleDataLoaded)
    element.addEventListener("ready", handleReady)

    return () => {
      element.removeEventListener("dataLoaded", handleDataLoaded)
      element.removeEventListener("ready", handleReady)
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
        duration: 2000,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  const handleRunReport = async () => {
    setIsSubmitting(true)
    try {
      const currentParamValues = paramsRef.current?.getValues ? paramsRef.current.getValues() : paramValues
      console.log("Running report with params:", currentParamValues)

      const queryParams = new URLSearchParams()
      const appliedFilters: Array<{ key: string; value: string }> = []

      for (const [key, value] of Object.entries(currentParamValues)) {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, String(value))
          appliedFilters.push({ key, value: String(value) })
        }
      }

      const dataUrl = `${rbConfig.apiBaseUrl}/reports/par-employee-hire-dates/data?${queryParams.toString()}`
      console.log("Fetching filtered data from:", dataUrl)

      const response = await fetch(dataUrl, {
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error(`Data fetch failed: ${response.status}`)

      const result = await response.json()
      const data = Array.isArray(result) ? result : result.reportData || []

      console.log("Filtered data received:", data.length, "records")

      if (dataTableRef.current) {
        dataTableRef.current.data = data
      }

      if (appliedFilters.length > 0) {
        setIsFiltered(true)
        setRecordCount(`${data.length} of ${originalDataCount} records`)
      }

      toast({
        title: "Report updated",
        description: `Showing ${data.length} filtered records`,
      })
    } catch (error) {
      console.error("Error running report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearFilters = () => {
    setIsFiltered(false)
    setRecordCount(`${originalDataCount} records`)

    if (dataTableRef.current?.fetchData) {
      dataTableRef.current.fetchData({})
    }

    toast({
      title: "Filters cleared",
      description: "Showing all records",
    })
  }

  const usageCode = `<rb-parameters
  report-code="par-employee-hire-dates"
  api-base-url="${rbConfig.apiBaseUrl}"
  api-key="${rbConfig.apiKey}"
></rb-parameters>`

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Report Parameters
          </h1>
          <p className="text-lg text-muted-foreground">
            Define how users filter and customize reports at runtime.
          </p>
        </div>

        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex space-x-8">
              <button
                id="component-tab"
                onClick={() => setActiveTab("component")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "component"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Sliders className="w-4 h-4" />
                Parameters
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

        <div className="bg-card border border-border rounded-lg shadow-sm">
          {activeTab === "component" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border border-border rounded-lg">
                  <div className="border-b border-border p-4 flex justify-between items-center">
                    <span className="font-semibold">Parameter Form</span>
                    <Button
                      onClick={() => {
                        if (paramsRef.current?.fetchConfig) {
                          paramsRef.current.fetchConfig()
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    {/* @ts-expect-error - Web component custom element */}
                    <rb-parameters
                      ref={paramsRef}
                      id="demoParams"
                      report-code="par-employee-hire-dates"
                      api-base-url={rbConfig.apiBaseUrl}
                      api-key={rbConfig.apiKey}
                    />
                    <hr className="my-4" />
                    <Button id="submitBtn" onClick={handleRunReport} disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Loading..." : "Run Report"}
                    </Button>
                  </div>
                </div>

                <div className="border border-border rounded-lg">
                  <div className="border-b border-border p-4">
                    <span className="font-semibold">Current Values</span>
                  </div>
                  <div className="p-4">
                    <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-64">
                      {JSON.stringify(paramValues, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg ${
                  isFiltered
                    ? "border-yellow-500 shadow-[0_0_0_2px_rgba(234,179,8,0.25)]"
                    : "border-border"
                }`}
              >
                <div
                  className={`border-b p-4 flex justify-between items-center ${
                    isFiltered
                      ? "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-500"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {isFiltered ? "Filtered Results" : "Sample Data"}
                    </span>
                    {isFiltered && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Filtered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span id="recordCount" className="text-sm text-muted-foreground">{recordCount}</span>
                    {isFiltered && (
                      <Button id="clearFiltersBtn" onClick={handleClearFilters} variant="outline" size="sm">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-4 max-h-[450px] overflow-auto">
                  {/* @ts-expect-error - Web component custom element */}
                  <rb-tabulator
                    ref={dataTableRef}
                    id="dataTable"
                    report-code="par-employee-hire-dates"
                    api-base-url={rbConfig.apiBaseUrl}
                    api-key={rbConfig.apiKey}
                  />
                </div>
                <div
                  className={`border-t p-3 text-sm ${
                    isFiltered
                      ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-800 dark:text-yellow-200"
                      : "text-muted-foreground"
                  }`}
                >
                  {isFiltered ? (
                    <span>⚠️ Filters applied. Use the parameters above and click "Run Report" to change filters.</span>
                  ) : (
                    <span>ℹ️ Showing all records. Use the parameters above and click "Run Report" to filter.</span>
                  )}
                </div>
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
      </div>
    </div>
  )
}
