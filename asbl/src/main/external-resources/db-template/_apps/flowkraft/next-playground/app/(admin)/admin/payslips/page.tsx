"use client"

import { useEffect, useState, useCallback } from "react"
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
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 25

  const fetchPayslips = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) })
      if (currentSearch) params.set("search", currentSearch)
      const res = await fetch(`/api/payslips?${params}`)
      if (res.ok) {
        const json = await res.json()
        setPayslips(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      }
    } catch (error) {
      console.error("Error fetching payslips:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayslips(page, search)
  }, [page, fetchPayslips])

  useEffect(() => {
    setPage(1)
    fetchPayslips(1, search)
  }, [search, fetchPayslips])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/payslips/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        fetchPayslips(page, search)
        toast({ title: "Payslip deleted", duration: 3000 })
      } else {
        toast({ title: "Failed to delete payslip", variant: "destructive", duration: 3000 })
      }
    } catch (error) {
      console.error("Error deleting payslip:", error)
      toast({ title: "Failed to delete payslip", variant: "destructive", duration: 3000 })
    } finally {
      setDeleteId(null)
    }
  }

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })

  const showingFrom = total > 0 ? (page - 1) * pageSize + 1 : 0
  const showingTo = Math.min(page * pageSize, total)

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
              <TableHead className="w-52"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-sm text-slate-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-sm text-slate-500">
                  No payslips found.
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((payslip) => (
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
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          <Eye className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                      <Link href={`/admin/payslips/${payslip.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 btn-edit">
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 btn-delete"
                        onClick={() => setDeleteId(payslip.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex justify-between items-center mt-3 px-1" id="pagination-controls">
          <span className="text-sm text-slate-500 dark:text-slate-400" id="pagination-info">
            Showing {showingFrom}-{showingTo} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" id="btn-prev-page"
              disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" id="btn-next-page"
              disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent id="deleteModal" className="sm:max-w-md">
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
            <Button id="btn-confirm-delete" variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
