package com.flowkraft

import grails.gorm.transactions.Transactional
import grails.validation.ValidationException

/**
 * Invoice Controller (Admin)
 * CRUD operations for invoice management with payment tracking
 */
class InvoiceController {

    static layout = 'admin'
    static allowedMethods = [save: "POST", update: "POST", delete: "DELETE"]

    // Inject payment services
    def stripeService
    def payPalService

    /**
     * List all invoices with optional filtering
     */
    def index() {
        def params_max = Math.min(params.max ? params.int('max') : 25, 100)
        def offset = params.offset ? params.int('offset') : 0
def sortField = params.sort ?: 'dateCreated'
        def sortOrder = params.order ?: 'desc'

        def criteria = Invoice.createCriteria()
        def invoices = criteria.list(max: params_max, offset: offset) {
            if (params.status) {
                eq('status', params.status)
            }
            if (params.search) {
                or {
                    ilike('invoiceNumber', "%${params.search}%")
                    ilike('customerName', "%${params.search}%")
                    ilike('customerEmail', "%${params.search}%")
                }
            }
            order(sortField, sortOrder)
        }
        
        def totalCount = invoices.totalCount
        
        [
            invoiceList: invoices, 
            invoiceCount: totalCount,
            statusCounts: getStatusCounts()
        ]
    }

    /**
     * Show single invoice details
     */
    def show(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        [invoice: invoice]
    }

    /**
     * Create form
     */
    def create() {
        [invoice: new Invoice(params)]
    }

    /**
     * Save new invoice
     */
    @Transactional
    def save() {
        def invoice = new Invoice(params)
        
        // Generate invoice number if not provided
        if (!invoice.invoiceNumber) {
            invoice.invoiceNumber = generateInvoiceNumber()
        }
        
        // Calculate totals
        invoice.calculateTotals()
        
        try {
            invoice.save(failOnError: true)
            flash.message = "Invoice '${invoice.invoiceNumber}' created successfully"
            redirect action: 'show', id: invoice.id
        } catch (ValidationException e) {
            flash.error = "Error creating invoice"
            render view: 'create', model: [invoice: invoice]
        }
    }

    /**
     * Edit form
     */
    def edit(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        [invoice: invoice]
    }

    /**
     * Update existing invoice
     */
    @Transactional
    def update(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        
        invoice.properties = params
        
        // Recalculate totals
        invoice.calculateTotals()
        
        try {
            invoice.save(failOnError: true)
            flash.message = "Invoice '${invoice.invoiceNumber}' updated successfully"
            redirect action: 'show', id: invoice.id
        } catch (ValidationException e) {
            flash.error = "Error updating invoice"
            render view: 'edit', model: [invoice: invoice]
        }
    }

    /**
     * Delete invoice
     */
    @Transactional
    def delete(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        
        def invoiceNumber = invoice.invoiceNumber
        invoice.delete()
        flash.message = "Invoice '${invoiceNumber}' deleted successfully"
        redirect action: 'index'
    }

    /**
     * Send invoice to customer
     */
    @Transactional
    def send(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        
        invoice.status = 'sent'
        invoice.save()
        
        // TODO: Send email notification to customer with payment link
        
        flash.message = "Invoice '${invoice.invoiceNumber}' sent to ${invoice.customerEmail}"
        redirect action: 'show', id: invoice.id
    }

    /**
     * Mark invoice as paid manually
     */
    @Transactional
    def markPaid(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        
        def paymentMethod = params.paymentMethod ?: 'other'
        def paymentReference = params.paymentReference ?: "MANUAL-${System.currentTimeMillis()}"
        
        invoice.markAsPaid(paymentMethod, paymentReference)
        invoice.save()
        
        flash.message = "Invoice '${invoice.invoiceNumber}' marked as paid"
        redirect action: 'show', id: invoice.id
    }

    /**
     * Cancel invoice
     */
    @Transactional
    def cancel(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        
        invoice.status = 'cancelled'
        invoice.save()
        
        flash.message = "Invoice '${invoice.invoiceNumber}' cancelled"
        redirect action: 'show', id: invoice.id
    }

    /**
     * Download invoice as PDF
     */
    def download(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        
        // TODO: Generate and return PDF
        flash.message = "PDF download will be implemented"
        redirect action: 'show', id: invoice.id
    }

    /**
     * Check and update overdue invoices
     */
    @Transactional
    def checkOverdue() {
        def today = new Date()
        def overdueInvoices = Invoice.findAllByStatusInListAndDueDateLessThan(
            ['draft', 'sent'], today
        )
        
        overdueInvoices.each { invoice ->
            invoice.status = 'overdue'
            invoice.save()
        }
        
        flash.message = "${overdueInvoices.size()} invoice(s) marked as overdue"
        redirect action: 'index'
    }

    // ===== Private Helper Methods =====

    private String generateInvoiceNumber() {
        def prefix = "INV"
        def year = new java.text.SimpleDateFormat('yyyy').format(new Date())
        def count = Invoice.count() + 1
        return "${prefix}-${year}-${String.format('%06d', count)}"
    }

    private Map getStatusCounts() {
        [
            all: Invoice.count(),
            draft: Invoice.countByStatus('draft'),
            sent: Invoice.countByStatus('sent'),
            paid: Invoice.countByStatus('paid'),
            overdue: Invoice.countByStatus('overdue'),
            cancelled: Invoice.countByStatus('cancelled')
        ]
    }
}
