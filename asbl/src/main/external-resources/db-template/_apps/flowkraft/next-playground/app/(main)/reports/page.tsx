"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, Check, Copy, FileText, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { rbConfig } from "@/lib/rb-config"
import { CodeBlock } from "@/components/CodeBlock"

interface RbReportElement extends HTMLElement {
  entityCode?: string
  setAttribute(name: string, value: string): void
}

type TabType = "component" | "usage"

interface Employee {
  code: string
  name: string
  department: string
}

const employees: Employee[] = [
  { code: "EMP001", name: "Alice Johnson", department: "Engineering" },
  { code: "EMP002", name: "Bob Smith", department: "Sales" },
  { code: "EMP003", name: "Carol Williams", department: "Marketing" },
]

export default function ReportsPage() {
  const reportRef = useRef<RbReportElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("component")
  const [copiedUsage, setCopiedUsage] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check if components are already loaded
    if (customElements.get("rb-report")) {
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

  const selectEmployee = (code: string) => {
    console.log("Selecting employee:", code)
    setSelectedEmployee(code)
    setShowPlaceholder(false)

    if (reportRef.current) {
      const element = reportRef.current

      // Set entity-code attribute
      element.setAttribute("entity-code", code)

      // Force re-fetch by toggling entityCode property
      element.entityCode = ""
      setTimeout(() => {
        element.entityCode = code
        console.log("Set entityCode to:", code)
      }, 10)
    }
  }

  const handleRefresh = () => {
    if (selectedEmployee && reportRef.current) {
      const element = reportRef.current
      element.entityCode = ""
      setTimeout(() => {
        if (selectedEmployee) {
          element.entityCode = selectedEmployee
        }
      }, 10)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUsage(true)
      setTimeout(() => setCopiedUsage(false), 2000)

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

  const usageCode = `<rb-report
  report-code="rep-employee-payslip"
  entity-code="EMP001"
  api-base-url="${rbConfig.apiBaseUrl}"
  api-key="${rbConfig.apiKey}"
></rb-report>

<!-- The entity-code attribute specifies which
     employee's payslip to render. The component
     fetches data and renders the HTML template
     server-side for that specific entity. -->`

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Reports
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Embed full reports using the <code className="bg-muted px-2 py-1 rounded text-sm">&lt;rb-report&gt;</code> component in{" "}
            <code className="bg-muted px-2 py-1 rounded text-sm">entity-code</code> mode.
            Click a person's name to view their document.
          </p>
        </div>

        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("component")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "component"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                Report
              </button>
              <button
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
              {/* Employee Selection */}
              <div className="mb-4">
                <label className="block font-semibold mb-3">Select Employee:</label>
                <div className="flex gap-4 flex-wrap">
                  {employees.map((emp) => (
                    <div
                      key={emp.code}
                      onClick={() => selectEmployee(emp.code)}
                      className={`
                        px-6 py-4 border-2 rounded-lg cursor-pointer transition-all min-w-[180px]
                        ${
                          selectedEmployee === emp.code
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                        }
                      `}
                    >
                      <div className="font-semibold text-blue-900 dark:text-blue-100">
                        {emp.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {emp.code} • {emp.department}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payslip Display */}
              <div className="border border-border rounded-lg">
                <div className="border-b border-border p-4 flex justify-between items-center">
                  <span className="font-semibold">Employee Payslip</span>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={!selectedEmployee}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-6 min-h-[400px] relative">
                  {showPlaceholder && (
                    <div className="text-center text-muted-foreground py-20">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Select an employee above to view their payslip</p>
                    </div>
                  )}
                  {/* @ts-expect-error - Web component custom element */}
                  <rb-report
                    ref={reportRef}
                    id="demoReport"
                    report-code="rep-employee-payslip"
                    api-base-url={rbConfig.apiBaseUrl}
                    api-key={rbConfig.apiKey}
                    show-print-button
                    print-button-label="Print / Save PDF"
                    style={{ display: showPlaceholder ? "none" : "block" }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "usage" && (
            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={() => copyToClipboard(usageCode)}
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
              <CodeBlock code={usageCode} language="markup" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
