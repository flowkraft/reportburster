"use client"

import { useEffect, useRef, useState } from "react"
import { ComponentDemo } from "@/components/ComponentDemo"
import { rbConfig } from "@/lib/rb-config"

interface RbTabulatorElement extends HTMLElement {
  configDsl?: string
  fetchData?: (params?: Record<string, unknown>) => void
}

export default function TabulatorPage() {
  const componentRef = useRef<RbTabulatorElement>(null)
  const [configDsl, setConfigDsl] = useState("")
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    if (!customElements.get("rb-tabulator")) {
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

    const handleTableBuilt = () => {
      if (element.configDsl) {
        setConfigDsl(element.configDsl)
      }
    }

    element.addEventListener("configLoaded", handleConfigLoaded)
    element.addEventListener("dataFetched", handleDataFetched)
    element.addEventListener("tableBuilt", handleTableBuilt)

    return () => {
      element.removeEventListener("configLoaded", handleConfigLoaded)
      element.removeEventListener("dataFetched", handleDataFetched)
      element.removeEventListener("tableBuilt", handleTableBuilt)
    }
  }, [isScriptLoaded])

  const handleRefresh = () => {
    if (componentRef.current?.fetchData) {
      componentRef.current.fetchData({})
    }
  }

  const usageCode = `<rb-tabulator
  report-code="g-scr2htm-trend"
  api-base-url="${rbConfig.apiBaseUrl}"
  api-key="${rbConfig.apiKey}"
></rb-tabulator>

<script src="${rbConfig.apiBaseUrl}/web-components/reportburster.js"></script>

<script>
  const tabulatorComponent = document.querySelector('rb-tabulator');

  // Listen to events
  tabulatorComponent.addEventListener('configLoaded', () => {
    console.log('Config loaded:', tabulatorComponent.configDsl);
  });

  tabulatorComponent.addEventListener('dataFetched', (e) => {
    console.log('Data fetched:', e.detail);
  });

  tabulatorComponent.addEventListener('tableBuilt', () => {
    console.log('Table built');
  });

  // Refresh data
  tabulatorComponent.fetchData({});
</script>`

  return (
    <ComponentDemo
      title="Tabulator"
      description="Interactive data tables with sorting, filtering, and pagination. Fetches data from ReportBurster API and provides powerful table functionality."
      component={
        <div className="w-full">
          {/* @ts-expect-error - Web component custom element */}
          <rb-tabulator
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
