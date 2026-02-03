package com.flowkraft

/**
 * Invoice domain class - matches Next.js schema exactly
 * Used for customer invoice management with payment tracking
 */
class Invoice {

    String invoiceNumber      // Unique identifier (e.g., INV-2024-001)
    String customerId         // Customer reference (e.g., CUST-001)
    String customerName       // Full company/customer name
    String customerEmail      // Optional email for notifications
    String customerAddress    // Optional billing address

    Date issueDate            // Invoice issue date
    Date dueDate              // Payment due date

    BigDecimal subtotal       // Subtotal before tax/discount
    BigDecimal taxRate = 0    // Tax rate percentage (e.g., 10 for 10%)
    BigDecimal taxAmount = 0  // Calculated tax amount
    BigDecimal discount = 0   // Discount amount
    BigDecimal totalAmount    // Final total (subtotal + taxAmount - discount)

    String currency = "USD"   // Currency code
    String status = "draft"   // Status: draft, sent, paid, overdue, cancelled
    String notes              // Optional notes/terms

    // Payment tracking fields
    Date paidAt               // When payment was received
    String paymentMethod      // stripe, paypal, bank_transfer, cash, other
    String paymentReference   // Transaction ID or reference number

    Date dateCreated
    Date lastUpdated

    static constraints = {
        invoiceNumber blank: false, unique: true, maxSize: 50
        customerId blank: false, maxSize: 50
        customerName blank: false, maxSize: 200
        customerEmail nullable: true, email: true, maxSize: 255
        customerAddress nullable: true, maxSize: 500
        issueDate nullable: false
        dueDate nullable: false
        subtotal nullable: false, min: 0.0
        taxRate nullable: true, min: 0.0, max: 100.0
        taxAmount nullable: true, min: 0.0
        discount nullable: true, min: 0.0
        totalAmount nullable: false, min: 0.0
        currency nullable: false, maxSize: 3, inList: ["USD", "EUR", "GBP", "CAD", "AUD"]
        status nullable: false, inList: ["draft", "sent", "paid", "overdue", "cancelled"]
        notes nullable: true, maxSize: 2000
        paidAt nullable: true
        paymentMethod nullable: true, inList: ["stripe", "paypal", "bank_transfer", "cash", "other"]
        paymentReference nullable: true, maxSize: 255
    }

    static mapping = {
        table 'invoices'
        invoiceNumber column: 'invoice_number'
        customerId column: 'customer_id'
        customerName column: 'customer_name'
        customerEmail column: 'customer_email'
        customerAddress column: 'customer_address'
        issueDate column: 'issue_date'
        dueDate column: 'due_date'
        taxRate column: 'tax_rate'
        taxAmount column: 'tax_amount'
        totalAmount column: 'total_amount'
        paidAt column: 'paid_at'
        paymentMethod column: 'payment_method'
        paymentReference column: 'payment_reference'
        dateCreated column: 'created_at'
        lastUpdated column: 'updated_at'
    }

    /**
     * Get status badge CSS class for display
     */
    String getStatusBadgeClass() {
        switch (status) {
            case 'draft': return 'bg-secondary'
            case 'sent': return 'bg-info'
            case 'paid': return 'bg-success'
            case 'overdue': return 'bg-danger'
            case 'cancelled': return 'bg-dark'
            default: return 'bg-secondary'
        }
    }

    /**
     * Check if invoice is payable (not already paid/cancelled)
     */
    boolean isPayable() {
        return status in ['draft', 'sent', 'overdue']
    }

    /**
     * Check if invoice is overdue
     */
    boolean isOverdue() {
        return status != 'paid' && status != 'cancelled' && dueDate && dueDate < new Date()
    }

    /**
     * Calculate totals based on subtotal, taxRate, discount
     */
    void calculateTotals() {
        taxAmount = (subtotal ?: 0) * ((taxRate ?: 0) / 100)
        totalAmount = (subtotal ?: 0) + taxAmount - (discount ?: 0)
    }

    /**
     * Mark invoice as paid
     */
    void markAsPaid(String method, String reference = null) {
        this.status = 'paid'
        this.paidAt = new Date()
        this.paymentMethod = method
        this.paymentReference = reference
    }

    /**
     * Format currency amount
     */
    String formatAmount(BigDecimal amount) {
        def symbol = currency == 'EUR' ? '€' : (currency == 'GBP' ? '£' : '$')
        return "${symbol}${String.format('%,.2f', amount ?: 0)}"
    }

    /**
     * Get payment method display name
     */
    String getPaymentMethodDisplay() {
        switch (paymentMethod) {
            case 'stripe': return 'Stripe'
            case 'paypal': return 'PayPal'
            case 'bank_transfer': return 'Bank Transfer'
            case 'cash': return 'Cash'
            case 'other': return 'Other'
            default: return paymentMethod ?: 'N/A'
        }
    }

    String toString() {
        return "${invoiceNumber} - ${customerName}"
    }
}
