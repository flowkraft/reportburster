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

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

interface Invoice {
  id: number
  invoiceNumber: string
  customerId: string
  customerName: string
  customerEmail: string | null
  issueDate: string
  dueDate: string
  totalAmount: number
  currency: string
  status: InvoiceStatus
}

const getStatusStyle = (status: InvoiceStatus) => {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "overdue":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/invoices")
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const filteredInvoices = invoices.filter((inv) =>
    inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customerEmail?.toLowerCase() || "").includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/invoices/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        setInvoices(invoices.filter((inv) => inv.id !== deleteId))
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
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
      <div id="invoices-header" className="flex items-center justify-between">
        <h1 id="invoices-page-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">Invoices</h1>
        <Link href="/admin/invoices/new">
          <Button id="btn-new-invoice" size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div id="invoices-search">
        <Input
          id="invoices-search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm border-slate-200 dark:border-slate-600"
      />
      </div>

      {/* Table */}
      <div id="invoices-table-card" className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <Table id="invoices-table">
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoice</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Issued</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Due</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</TableHead>
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
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-sm text-slate-500">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-800 dark:text-slate-200">{invoice.customerName}</div>
                    <div className="text-xs text-slate-400">{invoice.customerEmail || invoice.customerId}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Link href={`/admin/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/invoices/${invoice.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => setDeleteId(invoice.id)}
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
            <DialogTitle className="text-slate-800 dark:text-slate-100">Delete Invoice</DialogTitle>
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
