"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

const statusVariant: Record<PayslipStatus, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  sent: "outline",
  viewed: "default",
  downloaded: "default",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payslips</h1>
        <Link href="/admin/payslips/new">
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {/* Simple Search */}
      <Input
        placeholder="Search payslips..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm border-slate-200 dark:border-slate-700 focus:ring-cyan-500"
      />

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Payslip #</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Employee</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Department</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Period</TableHead>
              <TableHead className="text-right text-slate-600 dark:text-slate-400 font-semibold">Net</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPayslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No payslips found. Run `npm run db:seed` to generate demo data.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayslips.map((payslip) => (
                <TableRow key={payslip.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-medium text-slate-900 dark:text-white">{payslip.payslipNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-white">{payslip.employeeName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">{payslip.employeeId}</div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{payslip.department || "-"}</TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(payslip.payPeriodStart)} - {formatDate(payslip.payPeriodEnd)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(payslip.netAmount, payslip.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[payslip.status]}>{payslip.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/payslips/${payslip.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/payslips/${payslip.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                        onClick={() => setDeleteId(payslip.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payslip</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

