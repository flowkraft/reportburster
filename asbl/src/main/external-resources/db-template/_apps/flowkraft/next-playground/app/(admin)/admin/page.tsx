import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, FileText, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  // In a real app, these would come from the database
  const stats = {
    totalPayslips: 156,
    totalInvoices: 89,
    totalRevenue: 125400,
    pendingPayments: 12,
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome to your admin dashboard. Manage payslips and invoices from here.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Payslips</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalPayslips}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">+12%</span>
              <span className="text-xs text-slate-500 dark:text-slate-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Invoices</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalInvoices}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">+8%</span>
              <span className="text-xs text-slate-500 dark:text-slate-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">+20.1%</span>
              <span className="text-xs text-slate-500 dark:text-slate-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Payments</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingPayments}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">-4</span>
              <span className="text-xs text-slate-500 dark:text-slate-500">since yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Payslips</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Manage employee payslips and salary records
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link
              href="/admin/payslips"
              className="inline-flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
            >
              View All Payslips
            </Link>
            <Link
              href="/admin/payslips/new"
              className="inline-flex items-center gap-1.5 justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create New
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Invoices</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Manage customer invoices and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link
              href="/admin/invoices"
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
            >
              View All Invoices
            </Link>
            <Link
              href="/admin/invoices/new"
              className="inline-flex items-center gap-1.5 justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create New
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
