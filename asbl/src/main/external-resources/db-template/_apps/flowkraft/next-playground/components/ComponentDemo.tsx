"use client"

import { ReactNode, useState } from "react"
import { Check, Copy, RefreshCw } from "lucide-react"
import { CodeBlock } from "@/components/CodeBlock"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ComponentDemoProps {
  title: string
  description: string
  component: ReactNode
  configuration: string
  usageCode: string
  onRefresh?: () => void
}

type TabType = "component" | "configuration" | "usage"

export function ComponentDemo({
  title,
  description,
  component,
  configuration,
  usageCode,
  onRefresh,
}: ComponentDemoProps) {
  const [activeTab, setActiveTab] = useState<TabType>("component")
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedUsage, setCopiedUsage] = useState(false)
  const { toast } = useToast()

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

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex space-x-8">
              <button
                id="component-tab"
                onClick={() => setActiveTab("component")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "component"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Component
              </button>
              <button
                id="config-tab"
                onClick={() => setActiveTab("configuration")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "configuration"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Configuration
              </button>
              <button
                id="usage-tab"
                onClick={() => setActiveTab("usage")}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "usage"
                    ? "border-rb-cyan text-rb-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Usage
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-lg shadow-sm">
          {activeTab === "component" && (
            <div className="p-6">
              <div className="flex justify-end mb-4">
                {onRefresh && (
                  <Button
                    id="refreshBtn"
                    onClick={onRefresh}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                )}
              </div>
              <div className="w-full">{component}</div>
            </div>
          )}

          {activeTab === "configuration" && (
            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={() => copyToClipboard(configuration, "config")}
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
                <CodeBlock
                  code={configuration}
                  language="groovy"
                />
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
                <CodeBlock
                  code={usageCode}
                  language="markup"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
