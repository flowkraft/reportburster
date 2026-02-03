package com.flowkraft

/**
 * Portal Payslip Controller
 * Customer-facing payslip viewing and download
 */
class PortalPayslipController {

    static layout = 'portal'

    /**
     * List payslips for the current customer/employee
     * In a real app, this would filter by logged-in user
     */
    def index() {
        // For demo purposes, show all payslips
        // In production, filter by employee ID from session
        def payslips = Payslip.list(sort: 'dateCreated', order: 'desc', max: 20)
        [payslipList: payslips]
    }

    /**
     * View a single payslip
     */
    def show(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        
        // Mark as viewed if it was sent
        if (payslip.status == 'sent') {
            payslip.status = 'viewed'
            payslip.save()
        }
        
        [payslip: payslip]
    }

    /**
     * Download payslip PDF
     */
    def download(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        
        // Mark as downloaded
        if (payslip.status in ['sent', 'viewed']) {
            payslip.status = 'downloaded'
            payslip.save()
        }
        
        // TODO: Generate and return PDF
        flash.message = "PDF download will be implemented"
        redirect action: 'show', id: payslip.id
    }
}
