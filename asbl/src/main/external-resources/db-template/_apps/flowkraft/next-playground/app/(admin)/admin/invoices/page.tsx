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

const statusVariant: Record<InvoiceStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "secondary",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
        <Link href="/admin/invoices/new">
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {/* Simple Search */}
      <Input
        placeholder="Search invoices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm border-slate-200 dark:border-slate-700 focus:ring-violet-500"
      />

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Invoice #</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Customer</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Issue Date</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Due Date</TableHead>
              <TableHead className="text-right text-slate-600 dark:text-slate-400 font-semibold">Total</TableHead>
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
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No invoices found. Run `npm run db:seed` to generate demo data.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-medium text-slate-900 dark:text-white">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-white">{invoice.customerName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">{invoice.customerEmail || invoice.customerId}</div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/invoices/${invoice.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                        onClick={() => setDeleteId(invoice.id)}
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
            <DialogTitle>Delete Invoice</DialogTitle>
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
