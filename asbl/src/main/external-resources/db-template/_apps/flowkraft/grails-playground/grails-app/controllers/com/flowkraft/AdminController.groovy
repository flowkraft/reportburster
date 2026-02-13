package com.flowkraft

import grails.gorm.transactions.Transactional

/**
 * Admin Dashboard Controller
 * Provides dashboard statistics and admin settings management
 */
class AdminController {

    static layout = 'admin'

    /**
     * Admin Dashboard - shows overview statistics
     */
    def index() {
        def stats = [
            totalPayslips: Payslip.count(),
            sentPayslips: Payslip.countByStatus('sent'),
            draftPayslips: Payslip.countByStatus('draft'),
            totalInvoices: Invoice.count(),
            paidInvoices: Invoice.countByStatus('paid'),
            pendingInvoices: Invoice.countByStatusInList(['sent', 'draft']),
            overdueInvoices: Invoice.countByStatus('overdue'),
            totalRevenue: Invoice.findAllByStatus('paid')?.sum { it.totalAmount } ?: 0
        ]
        
        // Recent payslips
        def recentPayslips = Payslip.list(max: 5, sort: 'dateCreated', order: 'desc')
        
        // Recent invoices
        def recentInvoices = Invoice.list(max: 5, sort: 'dateCreated', order: 'desc')
        
        [stats: stats, recentPayslips: recentPayslips, recentInvoices: recentInvoices]
    }

    /**
     * Settings page - loads current settings from DB
     */
    def settings() {
        // Get all settings grouped by category
        def companySettings = Setting.getByCategory('company')
        def preferenceSettings = Setting.getByCategory('preferences')
        
        // Create defaults if they don't exist
        if (!companySettings) {
            Setting.setValue('company.name', 'FlowKraft Inc.', 'company', 'Your company name')
            Setting.setValue('company.email', 'admin@flowkraft.com', 'company', 'Contact email address')
            Setting.setValue('company.phone', '', 'company', 'Contact phone number')
            Setting.setValue('company.address', '', 'company', 'Business address')
            companySettings = Setting.getByCategory('company')
        }
        
        if (!preferenceSettings) {
            Setting.setValue('preferences.currency', 'USD', 'preferences', 'Default currency code')
            Setting.setValue('preferences.dateFormat', 'MM/dd/yyyy', 'preferences', 'Date display format')
            Setting.setValue('preferences.timezone', 'UTC', 'preferences', 'Default timezone')
            Setting.setValue('preferences.itemsPerPage', '10', 'preferences', 'Items per page in lists')
            preferenceSettings = Setting.getByCategory('preferences')
        }
        
        def paymentSettings = Setting.getByCategory('payment')
        if (!paymentSettings) {
            Setting.setValue('payment.processor', 'stripe', 'payment', 'Default payment processor')
            paymentSettings = Setting.getByCategory('payment')
        }

        [companySettings: companySettings, preferenceSettings: preferenceSettings, paymentSettings: paymentSettings]
    }

    /**
     * Save settings - persists key-value pairs to DB
     */
    @Transactional
    def saveSettings() {
        def category = params.category ?: 'general'
        def savedCount = 0
        
        // Iterate through all params that look like settings
        params.each { key, value ->
            if (key.startsWith('setting.')) {
                def settingKey = key.substring(8) // Remove 'setting.' prefix
                Setting.setValue(settingKey, value?.toString(), category)
                savedCount++
            }
        }
        
        if (savedCount > 0) {
            flash.message = "${savedCount} setting(s) saved successfully"
        } else {
            flash.message = "Settings saved successfully"
        }
        redirect action: 'settings'
    }
}
