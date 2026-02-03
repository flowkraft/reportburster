package com.flowkraft

import grails.converters.JSON

/**
 * Payment Controller
 * Handles payment API endpoints for Stripe and PayPal
 * 
 * Replicates the Next.js API routes:
 * - /api/payments/stripe/create-intent
 * - /api/payments/stripe/confirm
 * - /api/payments/paypal/create-order
 * - /api/payments/paypal/capture-order
 */
class PaymentController {

    def stripeService
    def payPalService

    static allowedMethods = [
        createStripeIntent: 'POST',
        confirmStripePayment: 'POST',
        createPayPalOrder: 'POST',
        capturePayPalOrder: 'POST'
    ]

    // ===== STRIPE ENDPOINTS =====

    /**
     * POST /payment/stripe/create-intent
     * Create a Stripe PaymentIntent for an invoice
     * 
     * Request body: { invoiceId: Long }
     * Response: { success: true, clientSecret: "...", paymentIntentId: "..." }
     */
    def createStripeIntent() {
        def json = request.JSON
        def invoiceId = json?.invoiceId as Long

        if (!invoiceId) {
            render([success: false, error: 'Invoice ID required'] as JSON)
            return
        }

        def invoice = Invoice.get(invoiceId)
        if (!invoice) {
            response.status = 404
            render([success: false, error: 'Invoice not found'] as JSON)
            return
        }

        def result = stripeService.createPaymentIntent(invoice)
        
        if (!result.success) {
            response.status = 400
        }
        
        render(result as JSON)
    }

    /**
     * POST /payment/stripe/confirm
     * Confirm a Stripe payment and update invoice status
     * 
     * Request body: { paymentIntentId: String }
     * Response: { success: true, invoice: {...} }
     */
    def confirmStripePayment() {
        def json = request.JSON
        def paymentIntentId = json?.paymentIntentId

        if (!paymentIntentId) {
            render([success: false, error: 'Payment intent ID required'] as JSON)
            return
        }

        def result = stripeService.confirmPayment(paymentIntentId)
        
        if (!result.success) {
            response.status = 400
        }
        
        render(result as JSON)
    }

    /**
     * GET /payment/stripe/status/:paymentIntentId
     * Get status of a Stripe PaymentIntent
     */
    def stripeStatus(String id) {
        if (!id) {
            render([success: false, error: 'Payment intent ID required'] as JSON)
            return
        }

        def result = stripeService.getPaymentIntentStatus(id)
        render(result as JSON)
    }

    // ===== PAYPAL ENDPOINTS =====

    /**
     * POST /payment/paypal/create-order
     * Create a PayPal order for an invoice
     * 
     * Request body: { invoiceId: Long }
     * Response: { success: true, orderId: "...", approvalUrl: "..." }
     */
    def createPayPalOrder() {
        def json = request.JSON
        def invoiceId = json?.invoiceId as Long

        if (!invoiceId) {
            render([success: false, error: 'Invoice ID required'] as JSON)
            return
        }

        def invoice = Invoice.get(invoiceId)
        if (!invoice) {
            response.status = 404
            render([success: false, error: 'Invoice not found'] as JSON)
            return
        }

        def result = payPalService.createOrder(invoice)
        
        if (!result.success) {
            response.status = 400
        }
        
        render(result as JSON)
    }

    /**
     * POST /payment/paypal/capture-order
     * Capture a PayPal order and update invoice status
     * 
     * Request body: { orderId: String }
     * Response: { success: true, invoice: {...} }
     */
    def capturePayPalOrder() {
        def json = request.JSON
        def orderId = json?.orderId

        if (!orderId) {
            render([success: false, error: 'Order ID required'] as JSON)
            return
        }

        def result = payPalService.captureOrder(orderId)
        
        if (!result.success) {
            response.status = 400
        }
        
        render(result as JSON)
    }

    /**
     * GET /payment/paypal/success
     * PayPal return URL after successful approval
     */
    def paypalSuccess() {
        def invoiceId = params.invoiceId as Long
        def token = params.token // PayPal order token
        
        if (token) {
            // Automatically capture the order
            def result = payPalService.captureOrder(token)
            
            if (result.success) {
                flash.message = "Payment successful! Invoice ${result.invoice?.invoiceNumber} has been paid."
            } else {
                flash.error = "Payment capture failed: ${result.error}"
            }
        }
        
        if (invoiceId) {
            redirect controller: 'invoice', action: 'show', id: invoiceId
        } else {
            redirect controller: 'invoice', action: 'index'
        }
    }

    /**
     * GET /payment/paypal/cancel
     * PayPal return URL after cancelled payment
     */
    def paypalCancel() {
        def invoiceId = params.invoiceId as Long
        
        flash.error = "Payment was cancelled"
        
        if (invoiceId) {
            redirect controller: 'invoice', action: 'show', id: invoiceId
        } else {
            redirect controller: 'invoice', action: 'index'
        }
    }

    /**
     * GET /payment/paypal/status/:orderId
     * Get status of a PayPal order
     */
    def paypalStatus(String id) {
        if (!id) {
            render([success: false, error: 'Order ID required'] as JSON)
            return
        }

        def result = payPalService.getOrderDetails(id)
        render(result as JSON)
    }
}
