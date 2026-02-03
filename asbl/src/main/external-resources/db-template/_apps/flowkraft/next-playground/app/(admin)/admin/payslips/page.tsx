"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PayslipStatus = "draft" | "sent" | "viewed" | "downloaded"

interface Payslip {
  id: number
  payslipNumber: string
  employeeId: string
  employeeName: string
  department: string | null
  payPeriodStart: string
  payPeriodEnd: string
  grossAmount: number
  netAmount: number
  currency: string
  status: PayslipStatus
}

const getStatusStyle = (status: PayslipStatus) => {
  switch (status) {
    case "viewed":
    case "downloaded":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
  }
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchPayslips = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payslips")
      if (res.ok) {
        const data = await res.json()
        setPayslips(data)
      }
    } catch (error) {
      console.error("Error fetching payslips:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayslips()
  }, [])

  const filteredPayslips = payslips.filter((p) =>
    p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    p.payslipNumber.toLowerCase().includes(search.toLowerCase()) ||
    (p.department?.toLowerCase() || "").includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/payslips/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        setPayslips(payslips.filter((p) => p.id !== deleteId))
      }
    } catch (error) {
      console.error("Error deleting payslip:", error)
    } finally {
      setDeleteId(null)
    }
  }

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div id="payslips-header" className="flex items-center justify-between">
        <h1 id="payslips-page-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">Payslips</h1>
        <Link href="/admin/payslips/new">
          <Button id="btn-new-payslip" size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div id="payslips-search">
        <Input
          id="payslips-search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm border-slate-200 dark:border-slate-600"
        />
      </div>

      {/* Table */}
      <div id="payslips-table-card" className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <Table id="payslips-table">
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Payslip</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Employee</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Dept</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Period</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Net</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-sm text-slate-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPayslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-sm text-slate-500">
                  No payslips found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayslips.map((payslip) => (
                <TableRow key={payslip.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-200">{payslip.payslipNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-800 dark:text-slate-200">{payslip.employeeName}</div>
                    <div className="text-xs text-slate-400">{payslip.employeeId}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{payslip.department || "-"}</TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(payslip.payPeriodStart)} - {formatDate(payslip.payPeriodEnd)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(payslip.netAmount, payslip.currency)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle(payslip.status)}`}>
                      {payslip.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Link href={`/admin/payslips/${payslip.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/payslips/${payslip.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => setDeleteId(payslip.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">Delete Payslip</DialogTitle>
            <DialogDescription>
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

