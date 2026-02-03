package com.flowkraft

import grails.gorm.transactions.Transactional
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

/**
 * Stripe Payment Service
 * Handles Stripe payment intent creation and confirmation
 * 
 * Based on Next.js implementation in:
 * - app/api/payments/stripe/create-intent/route.ts
 * - app/api/payments/stripe/confirm/route.ts
 */
class StripeService {

    // Configuration - should be moved to application.yml in production
    String stripeSecretKey = System.getenv('STRIPE_SECRET_KEY') ?: 'sk_test_placeholder'
    String stripeApiBase = 'https://api.stripe.com/v1'

    /**
     * Create a Stripe PaymentIntent for an invoice
     * 
     * @param invoice The invoice to create payment intent for
     * @return Map containing clientSecret and paymentIntentId, or error
     */
    Map createPaymentIntent(Invoice invoice) {
        if (!invoice) {
            return [success: false, error: 'Invoice not found']
        }

        if (!invoice.isPayable()) {
            return [success: false, error: 'Invoice is not payable']
        }

        try {
            // Amount in cents (Stripe uses smallest currency unit)
            def amountInCents = (invoice.totalAmount * 100).intValue()
            
            def params = [
                'amount': amountInCents.toString(),
                'currency': invoice.currency.toLowerCase(),
                'automatic_payment_methods[enabled]': 'true',
                'metadata[invoice_id]': invoice.id.toString(),
                'metadata[invoice_number]': invoice.invoiceNumber,
                'metadata[customer_email]': invoice.customerEmail,
                'description': "Payment for Invoice ${invoice.invoiceNumber}"
            ]

            def response = makeStripeRequest('/payment_intents', params)

            if (response.error) {
                log.error("Stripe error creating payment intent: ${response.error}")
                return [success: false, error: response.error.message ?: 'Failed to create payment intent']
            }

            return [
                success: true,
                clientSecret: response.client_secret,
                paymentIntentId: response.id,
                amount: invoice.totalAmount,
                currency: invoice.currency
            ]
        } catch (Exception e) {
            log.error("Exception creating Stripe payment intent: ${e.message}", e)
            return [success: false, error: 'Failed to create payment intent: ' + e.message]
        }
    }

    /**
     * Confirm a Stripe payment and update invoice status
     * 
     * @param paymentIntentId The Stripe PaymentIntent ID
     * @return Map with success status and invoice details
     */
    @Transactional
    Map confirmPayment(String paymentIntentId) {
        if (!paymentIntentId) {
            return [success: false, error: 'Payment intent ID required']
        }

        try {
            def response = makeStripeRequest("/payment_intents/${paymentIntentId}", [:], 'GET')

            if (response.error) {
                log.error("Stripe error confirming payment: ${response.error}")
                return [success: false, error: response.error.message ?: 'Failed to confirm payment']
            }

            // Check payment status
            if (response.status != 'succeeded') {
                return [
                    success: false, 
                    error: "Payment not completed. Status: ${response.status}",
                    status: response.status
                ]
            }

            // Find and update the invoice
            def invoiceId = response.metadata?.invoice_id
            if (!invoiceId) {
                return [success: false, error: 'Invoice ID not found in payment metadata']
            }

            def invoice = Invoice.get(invoiceId as Long)
            if (!invoice) {
                return [success: false, error: 'Invoice not found']
            }

            // Mark invoice as paid
            invoice.markAsPaid('stripe', paymentIntentId)
            invoice.save(flush: true)

            return [
                success: true,
                invoice: [
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    status: invoice.status,
                    paidAt: invoice.paidAt,
                    paymentReference: invoice.paymentReference
                ]
            ]
        } catch (Exception e) {
            log.error("Exception confirming Stripe payment: ${e.message}", e)
            return [success: false, error: 'Failed to confirm payment: ' + e.message]
        }
    }

    /**
     * Retrieve a PaymentIntent status
     */
    Map getPaymentIntentStatus(String paymentIntentId) {
        try {
            def response = makeStripeRequest("/payment_intents/${paymentIntentId}", [:], 'GET')
            
            if (response.error) {
                return [success: false, error: response.error.message]
            }

            return [
                success: true,
                status: response.status,
                amount: response.amount / 100,
                currency: response.currency?.toUpperCase()
            ]
        } catch (Exception e) {
            return [success: false, error: e.message]
        }
    }

    // ===== Private Helper Methods =====

    /**
     * Make a request to Stripe API
     */
    private Map makeStripeRequest(String endpoint, Map params, String method = 'POST') {
        def url = new URL(stripeApiBase + endpoint)
        def connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = method
            connection.setRequestProperty('Authorization', "Bearer ${stripeSecretKey}")
            connection.setRequestProperty('Content-Type', 'application/x-www-form-urlencoded')
            connection.doOutput = (method == 'POST')
            
            if (method == 'POST' && params) {
                def postData = params.collect { k, v -> 
                    "${URLEncoder.encode(k, 'UTF-8')}=${URLEncoder.encode(v, 'UTF-8')}" 
                }.join('&')
                
                connection.outputStream.withWriter('UTF-8') { writer ->
                    writer.write(postData)
                }
            }

            def responseCode = connection.responseCode
            def responseStream = responseCode >= 400 ? connection.errorStream : connection.inputStream
            def responseText = responseStream?.text ?: '{}'
            
            return new JsonSlurper().parseText(responseText) as Map
        } finally {
            connection.disconnect()
        }
    }
}
