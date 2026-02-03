package com.flowkraft

/**
 * Payslip domain class - matches Next.js schema exactly
 * Used for employee payslip management in the admin panel
 */
class Payslip {

    String payslipNumber      // Unique identifier (e.g., PAY-2024-001)
    String employeeId         // Employee reference (e.g., EMP-001)
    String employeeName       // Full name
    String employeeEmail      // Optional email for notifications
    String department         // Optional department

    Date payPeriodStart       // Pay period start date
    Date payPeriodEnd         // Pay period end date

    BigDecimal grossAmount    // Gross pay amount
    BigDecimal deductions = 0 // Total deductions
    BigDecimal netAmount      // Net pay (grossAmount - deductions)

    String currency = "USD"   // Currency code
    String status = "draft"   // Status: draft, sent, viewed, downloaded

    Date dateCreated
    Date lastUpdated

    static constraints = {
        payslipNumber blank: false, unique: true, maxSize: 50
        employeeId blank: false, maxSize: 50
        employeeName blank: false, maxSize: 200
        employeeEmail nullable: true, email: true, maxSize: 255
        department nullable: true, maxSize: 100
        payPeriodStart nullable: false
        payPeriodEnd nullable: false
        grossAmount nullable: false, min: 0.0
        deductions nullable: true, min: 0.0
        netAmount nullable: false
        currency nullable: false, maxSize: 3, inList: ["USD", "EUR", "GBP", "CAD", "AUD"]
        status nullable: false, inList: ["draft", "sent", "viewed", "downloaded"]
    }

    static mapping = {
        table 'payslips'
        payslipNumber column: 'payslip_number'
        employeeId column: 'employee_id'
        employeeName column: 'employee_name'
        employeeEmail column: 'employee_email'
        payPeriodStart column: 'pay_period_start'
        payPeriodEnd column: 'pay_period_end'
        grossAmount column: 'gross_amount'
        netAmount column: 'net_amount'
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
            case 'viewed': return 'bg-primary'
            case 'downloaded': return 'bg-success'
            default: return 'bg-secondary'
        }
    }

    /**
     * Format pay period as readable string
     */
    String getPayPeriodFormatted() {
        def startFmt = payPeriodStart ? new java.text.SimpleDateFormat('MMM d').format(payPeriodStart) : ''
        def endFmt = payPeriodEnd ? new java.text.SimpleDateFormat('MMM d, yyyy').format(payPeriodEnd) : ''
        return "${startFmt} - ${endFmt}"
    }

    /**
     * Format currency amount
     */
    String formatAmount(BigDecimal amount) {
        def symbol = currency == 'EUR' ? '€' : (currency == 'GBP' ? '£' : '$')
        return "${symbol}${String.format('%,.2f', amount)}"
    }

    String toString() {
        return "${payslipNumber} - ${employeeName}"
    }
}
