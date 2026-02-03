"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, FileText, DollarSign, Clock, Plus } from "lucide-react"
import Link from "next/link"

interface Stats {
  totalPayslips: number
  totalInvoices: number
  totalRevenue: number
  pendingPayments: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPayslips: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 id="admin-page-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage payslips and invoices
        </p>
      </div>

      {/* Stats Cards - Simplified */}
      <div id="admin-stats-grid" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card id="stat-card-payslips" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Payslips</CardTitle>
            <Receipt className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div id="stat-value-payslips" className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {loading ? "..." : stats.totalPayslips}
            </div>
          </CardContent>
        </Card>

        <Card id="stat-card-invoices" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div id="stat-value-invoices" className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {loading ? "..." : stats.totalInvoices}
            </div>
          </CardContent>
        </Card>

        <Card id="stat-card-revenue" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div id="stat-value-revenue" className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {loading ? "..." : `$${stats.totalRevenue.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>

        <Card id="stat-card-pending" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Pending</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div id="stat-value-pending" className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {loading ? "..." : stats.pendingPayments}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Simplified */}
      <div id="admin-quick-actions" className="grid gap-3 md:grid-cols-2">
        <Card id="quick-actions-payslips" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Payslips</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 px-4 pb-4">
            <Link
              id="btn-view-payslips"
              href="/admin/payslips"
              className="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-600 text-white hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors"
            >
              View All
            </Link>
            <Link
              id="btn-new-payslip"
              href="/admin/payslips/new"
              className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              New
            </Link>
          </CardContent>
        </Card>

        <Card id="quick-actions-invoices" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 px-4 pb-4">
            <Link
              id="btn-view-invoices"
              href="/admin/invoices"
              className="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-600 text-white hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors"
            >
              View All
            </Link>
            <Link
              id="btn-new-invoice"
              href="/admin/invoices/new"
              className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              New
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
