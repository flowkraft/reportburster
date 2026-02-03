package com.flowkraft

import grails.gorm.transactions.Transactional
import grails.validation.ValidationException

/**
 * Payslip Controller (Admin)
 * CRUD operations for payslip management
 */
class PayslipController {

    static layout = 'admin'
    static allowedMethods = [save: "POST", update: "POST", delete: "DELETE"]

    /**
     * List all payslips with optional filtering
     */
    def index() {
        def params_max = Math.min(params.max ? params.int('max') : 25, 100)
        def offset = params.offset ? params.int('offset') : 0
def sortField = params.sort ?: 'dateCreated'
        def sortOrder = params.order ?: 'desc'

        def criteria = Payslip.createCriteria()
        def payslips = criteria.list(max: params_max, offset: offset) {
            if (params.status) {
                eq('status', params.status)
            }
            if (params.search) {
                or {
                    ilike('payslipNumber', "%${params.search}%")
                    ilike('employeeName', "%${params.search}%")
                    ilike('employeeEmail', "%${params.search}%")
                }
            }
            order(sortField, sortOrder)
        }
        
        def totalCount = payslips.totalCount
        
        [
            payslipList: payslips, 
            payslipCount: totalCount,
            statusCounts: getStatusCounts()
        ]
    }

    /**
     * Show single payslip details
     */
    def show(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        [payslip: payslip]
    }

    /**
     * Create form
     */
    def create() {
        [payslip: new Payslip(params)]
    }

    /**
     * Save new payslip
     */
    @Transactional
    def save() {
        def payslip = new Payslip(params)
        
        // Generate payslip number if not provided
        if (!payslip.payslipNumber) {
            payslip.payslipNumber = generatePayslipNumber()
        }
        
        try {
            payslip.save(failOnError: true)
            flash.message = "Payslip '${payslip.payslipNumber}' created successfully"
            redirect action: 'show', id: payslip.id
        } catch (ValidationException e) {
            flash.error = "Error creating payslip"
            render view: 'create', model: [payslip: payslip]
        }
    }

    /**
     * Edit form
     */
    def edit(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        [payslip: payslip]
    }

    /**
     * Update existing payslip
     */
    @Transactional
    def update(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        
        payslip.properties = params
        
        try {
            payslip.save(failOnError: true)
            flash.message = "Payslip '${payslip.payslipNumber}' updated successfully"
            redirect action: 'show', id: payslip.id
        } catch (ValidationException e) {
            flash.error = "Error updating payslip"
            render view: 'edit', model: [payslip: payslip]
        }
    }

    /**
     * Delete payslip
     */
    @Transactional
    def delete(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        
        def payslipNumber = payslip.payslipNumber
        payslip.delete()
        flash.message = "Payslip '${payslipNumber}' deleted successfully"
        redirect action: 'index'
    }

    /**
     * Send payslip to employee
     */
    @Transactional
    def send(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        
        payslip.status = 'sent'
        payslip.save()
        
        // TODO: Send email notification to employee
        
        flash.message = "Payslip '${payslip.payslipNumber}' sent to ${payslip.employeeEmail}"
        redirect action: 'show', id: payslip.id
    }

    /**
     * Download payslip as PDF
     */
    def download(Long id) {
        def payslip = Payslip.get(id)
        if (!payslip) {
            flash.error = "Payslip not found"
            redirect action: 'index'
            return
        }
        
        // Mark as downloaded
        payslip.status = 'downloaded'
        payslip.save()
        
        // TODO: Generate and return PDF
        flash.message = "PDF download will be implemented"
        redirect action: 'show', id: payslip.id
    }

    // ===== Private Helper Methods =====

    private String generatePayslipNumber() {
        def prefix = "PS"
        def year = new java.text.SimpleDateFormat('yyyy').format(new Date())
        def count = Payslip.count() + 1
        return "${prefix}-${year}-${String.format('%06d', count)}"
    }

    private Map getStatusCounts() {
        [
            all: Payslip.count(),
            draft: Payslip.countByStatus('draft'),
            sent: Payslip.countByStatus('sent'),
            viewed: Payslip.countByStatus('viewed'),
            downloaded: Payslip.countByStatus('downloaded')
        ]
    }
}
