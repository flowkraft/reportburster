"use client"

import { useEffect, useRef, useState } from "react"
import { ComponentDemo } from "@/components/ComponentDemo"
import { rbConfig } from "@/lib/rb-config"

interface RbChartElement extends HTMLElement {
  configDsl?: string
  fetchData?: (params?: Record<string, unknown>) => void
}

export default function ChartsPage() {
  const componentRef = useRef<RbChartElement>(null)
  const [configDsl, setConfigDsl] = useState("")
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    if (!customElements.get("rb-chart")) {
      const script = document.createElement("script")
      script.src = `${rbConfig.apiBaseUrl}/web-components/reportburster.js`
      script.onload = () => {
        console.log("ReportBurster web components loaded")
        setIsScriptLoaded(true)
      }
      script.onerror = () => {
        console.error("Failed to load ReportBurster web components")
      }
      document.head.appendChild(script)
    } else {
      setIsScriptLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isScriptLoaded || !componentRef.current) return

    const element = componentRef.current

    const handleConfigLoaded = () => {
      if (element.configDsl) {
        setConfigDsl(element.configDsl)
      }
    }

    const handleDataFetched = () => {
      if (element.configDsl) {
        setConfigDsl(element.configDsl)
      }
    }

    const handleChartBuilt = () => {
      if (element.configDsl) {
        setConfigDsl(element.configDsl)
      }
    }

    element.addEventListener("configLoaded", handleConfigLoaded)
    element.addEventListener("dataFetched", handleDataFetched)
    element.addEventListener("chartBuilt", handleChartBuilt)

    return () => {
      element.removeEventListener("configLoaded", handleConfigLoaded)
      element.removeEventListener("dataFetched", handleDataFetched)
      element.removeEventListener("chartBuilt", handleChartBuilt)
    }
  }, [isScriptLoaded])

  const handleRefresh = () => {
    if (componentRef.current?.fetchData) {
      componentRef.current.fetchData({})
    }
  }

  const usageCode = `<rb-chart
  report-code="g-scr2htm-trend"
  api-base-url="${rbConfig.apiBaseUrl}"
  api-key="${rbConfig.apiKey}"
></rb-chart>

<script src="${rbConfig.apiBaseUrl}/web-components/reportburster.js"></script>

<script>
  const chartComponent = document.querySelector('rb-chart');

  // Listen to events
  chartComponent.addEventListener('configLoaded', () => {
    console.log('Config loaded:', chartComponent.configDsl);
  });

  chartComponent.addEventListener('dataFetched', (e) => {
    console.log('Data fetched:', e.detail);
  });

  chartComponent.addEventListener('chartBuilt', () => {
    console.log('Chart built');
  });

  // Refresh data
  chartComponent.fetchData({});
</script>`

  return (
    <ComponentDemo
      title="Charts"
      description="Visualize your data with interactive charts. Support for line, bar, pie, area, and more chart types with full customization options."
      component={
        <div id="chartContainer" className="w-full" style={{ maxWidth: "882px", aspectRatio: "882 / 446" }}>
          {/* @ts-expect-error - Web component custom element */}
          <rb-chart
            ref={componentRef}
            report-code="g-scr2htm-trend"
            api-base-url={rbConfig.apiBaseUrl}
            api-key={rbConfig.apiKey}
          />
        </div>
      }
      configuration={configDsl || "// Configuration will load after component initializes..."}
      usageCode={usageCode}
      onRefresh={handleRefresh}
    />
  )
}
