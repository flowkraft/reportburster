package com.flowkraft

/**
 * Portal Invoice Controller
 * Customer-facing invoice viewing and payment
 */
class PortalInvoiceController {

    static layout = 'portal'
    
    def stripeService
    def payPalService

    /**
     * List invoices for the current customer
     * In a real app, this would filter by logged-in user
     */
    def index() {
        // For demo purposes, show all invoices
        // In production, filter by customer ID from session
        def invoices = Invoice.list(sort: 'dateCreated', order: 'desc', max: 20)
        [invoiceList: invoices]
    }

    /**
     * View a single invoice with payment options
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
     * Payment page for an invoice
     */
    def pay(Long id) {
        def invoice = Invoice.get(id)
        if (!invoice) {
            flash.error = "Invoice not found"
            redirect action: 'index'
            return
        }
        
        if (!invoice.isPayable()) {
            flash.error = "This invoice cannot be paid"
            redirect action: 'show', id: invoice.id
            return
        }
        
        [invoice: invoice]
    }

    /**
     * Download invoice PDF
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
}
