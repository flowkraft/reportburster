"use client"

import { useState, useEffect } from "react"
import { rbConfig } from "@/lib/rb-config"
import {
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  TrendingUp,
  PieChart,
  Users,
  Timer,
  Globe,
  Trophy,
  Wine,
} from "lucide-react"

export default function DashboardsPage() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (customElements.get("rb-chart") && customElements.get("rb-tabulator")) {
      setIsReady(true)
      return
    }
    const handleLoaded = () => setIsReady(true)
    window.addEventListener("rb-components-loaded", handleLoaded)
    return () => window.removeEventListener("rb-components-loaded", handleLoaded)
  }, [])

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Toolbar: title + dashboard selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h4 className="text-2xl font-bold text-foreground mb-1">Dashboards</h4>
            <p className="text-sm text-muted-foreground">
              Pre-built executive dashboards powered by <code className="bg-muted text-foreground px-1 rounded">&lt;rb-chart&gt;</code> and <code className="bg-muted text-foreground px-1 rounded">&lt;rb-tabulator&gt;</code> components.
            </p>
          </div>
          <select id="dashboard-select" className="w-auto border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground">
            <option value="cfo">CFO Analytics Dashboard</option>
          </select>
        </div>

        {!isReady ? (
          <div className="text-center py-12 text-muted-foreground">Loading web components...</div>
        ) : (
          <>
            {/* KPI Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <KpiCard
                id="kpi-revenue"
                label="Total Revenue"
                value="$847,320"
                detail={<><span className="text-green-600 dark:text-green-400"><ArrowUp className="w-3 h-3 inline" /> 12.5%</span> vs last period</>}
                borderColor="border-l-green-500"
              />
              <KpiCard
                id="kpi-profit"
                label="Gross Profit"
                value="$292,180"
                detail={<><span className="text-blue-600 dark:text-blue-400 font-semibold">34.5%</span> profit margin</>}
                borderColor="border-l-blue-500"
              />
              <KpiCard
                id="kpi-orders"
                label="Total Orders"
                value="1,247"
                detail={<><span className="text-green-600 dark:text-green-400"><ArrowUp className="w-3 h-3 inline" /> 8.3%</span> avg. $680/order</>}
                borderColor="border-l-purple-500"
              />
              <KpiCard
                id="kpi-ar"
                label="Outstanding AR"
                value="$128,450"
                detail={<><span className="text-amber-600 dark:text-amber-400"><AlertTriangle className="w-3 h-3 inline" /> 23 invoices</span> overdue</>}
                borderColor="border-l-red-500"
              />
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard
                id="kpi-top-customer"
                label="Top Customer"
                value="Save-a-lot Markets"
                valueSize="text-lg"
                detail={<><strong>$89,340</strong> YTD revenue</>}
                borderColor="border-l-cyan-500"
              />
              <KpiCard
                id="kpi-top-product"
                label="Top Product"
                value="C&ocirc;te de Blaye"
                valueSize="text-lg"
                detail={<><strong>89 units</strong> this period</>}
                borderColor="border-l-orange-500"
                valueHtml
              />
              <KpiCard
                id="kpi-dso"
                label="Days Sales Outstanding"
                value="28"
                detail={<><span className="text-green-600 dark:text-green-400"><ArrowDown className="w-3 h-3 inline" /> 3 days</span> vs target: 30</>}
                borderColor="border-l-yellow-500"
              />
              <KpiCard
                id="kpi-top-region"
                label="Top Region"
                value="Germany"
                valueSize="text-lg"
                detail={<><strong>$198,520</strong> (23.4% of total)</>}
                borderColor="border-l-pink-500"
              />
            </div>

            {/* Charts Row: Revenue Trend + Revenue by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <DashPanel id="panel-revenueTrend" title="Revenue Trend" icon={<TrendingUp className="w-4 h-4 text-blue-500" />}>
                <div style={{ height: "280px", position: "relative", overflow: "hidden" }}>
                  {/* @ts-expect-error - Web component custom element */}
                  <rb-chart
                    id="rb-revenueTrend"
                    report-id="dashboard-cfo"
                    component-id="revenueTrend"
                    api-base-url={rbConfig.apiBaseUrl}
                    api-key={rbConfig.apiKey}
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </div>
              </DashPanel>
              <DashPanel id="panel-revenueByCategory" title="Revenue by Category" icon={<PieChart className="w-4 h-4 text-purple-500" />}>
                <div style={{ height: "280px", position: "relative", overflow: "hidden" }}>
                  {/* @ts-expect-error - Web component custom element */}
                  <rb-chart
                    id="rb-revenueByCategory"
                    report-id="dashboard-cfo"
                    component-id="revenueByCategory"
                    api-base-url={rbConfig.apiBaseUrl}
                    api-key={rbConfig.apiKey}
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </div>
              </DashPanel>
            </div>

            {/* Bottom Row: Customers + AR Aging + Country */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DashPanel id="panel-topCustomers" title="Top 5 Customers" icon={<Users className="w-4 h-4 text-cyan-500" />}>
                {/* @ts-expect-error - Web component custom element */}
                <rb-tabulator
                  id="rb-topCustomers"
                  report-id="dashboard-cfo"
                  component-id="topCustomers"
                  api-base-url={rbConfig.apiBaseUrl}
                  api-key={rbConfig.apiKey}
                  style={{ display: "block", width: "100%" }}
                />
              </DashPanel>
              <DashPanel id="panel-arAging" title="Accounts Receivable Aging" icon={<Timer className="w-4 h-4 text-yellow-500" />}>
                <div style={{ height: "280px", position: "relative", overflow: "hidden" }}>
                  {/* @ts-expect-error - Web component custom element */}
                  <rb-chart
                    id="rb-arAging"
                    report-id="dashboard-cfo"
                    component-id="arAging"
                    api-base-url={rbConfig.apiBaseUrl}
                    api-key={rbConfig.apiKey}
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </div>
              </DashPanel>
              <DashPanel id="panel-revenueByCountry" title="Revenue by Country" icon={<Globe className="w-4 h-4 text-pink-500" />}>
                <div style={{ height: "280px", position: "relative", overflow: "hidden" }}>
                  {/* @ts-expect-error - Web component custom element */}
                  <rb-chart
                    id="rb-revenueByCountry"
                    report-id="dashboard-cfo"
                    component-id="revenueByCountry"
                    api-base-url={rbConfig.apiBaseUrl}
                    api-key={rbConfig.apiKey}
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </div>
              </DashPanel>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  id,
  label,
  value,
  detail,
  borderColor,
  valueSize = "text-2xl",
  valueHtml = false,
}: {
  id: string
  label: string
  value: string
  detail: React.ReactNode
  borderColor: string
  valueSize?: string
  valueHtml?: boolean
}) {
  return (
    <div id={id} className={`border border-border rounded-lg p-5 border-l-4 ${borderColor} bg-card transition-all hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {valueHtml ? (
        <div className={`${valueSize} font-bold text-foreground mb-2`} dangerouslySetInnerHTML={{ __html: "C\u00f4te de Blaye" }} />
      ) : (
        <div className={`${valueSize} font-bold text-foreground mb-2`}>{value}</div>
      )}
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}

function DashPanel({
  id,
  title,
  icon,
  children,
}: {
  id: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div id={id} className="border border-border rounded-lg p-5 bg-card">
      <h6 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h6>
      {children}
    </div>
  )
}
